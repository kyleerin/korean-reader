import { useEffect, useRef, useState } from 'react';
import type { AnalyzedText } from './domain/model';
import type { DictionaryRepository } from './dictionary/repository';
import type { KnowledgeRepository } from './knowledge/repository';
import type { MorphologicalAnalyzer } from './pipeline/analyzer';
import type { ReviewRepository } from './review/repository';
import { NdjsonDictionaryRepository } from './dictionary/ndjson-repository';
import { LocalStorageKnowledgeRepository } from './knowledge/local-storage-repository';
import { LocalStorageReviewRepository } from './review/local-storage-repository';
import { GaruKoAnalyzer } from './analyzer/garu-ko-analyzer';
import { ReadingPipeline } from './pipeline/reading-pipeline';
import { getReadingSession, saveReadingSession } from './session/storage';
import { ImportScreen } from './components/ImportScreen';
import { Reader } from './components/Reader';
import { ReviewScreen } from './components/ReviewScreen';

type HomeDeps = {
  dict: DictionaryRepository;
  analyzer: MorphologicalAnalyzer;
  knowledge: KnowledgeRepository;
  reviewRepo: ReviewRepository;
  dictWarning?: string;
};

type AppState =
  | { phase: 'loading'; message: string }
  | ({ phase: 'home' } & HomeDeps)
  | { phase: 'analyzing' }
  | ({ phase: 'reading'; text: AnalyzedText; sourceText: string } & HomeDeps)
  | { phase: 'review'; knowledge: KnowledgeRepository; reviewRepo: ReviewRepository }
  | { phase: 'error'; message: string };

const FALLBACK_DICT: DictionaryRepository = {
  lookup: async () => undefined,
  lookupAll: async () => [],
};

export function App() {
  const [state, setState] = useState<AppState>({ phase: 'loading', message: 'Loading analyzer…' });
  const [dueCount, setDueCount] = useState(0);
  const homeRef = useRef<Extract<AppState, { phase: 'home' }> | null>(null);

  useEffect(() => {
    const knowledge = new LocalStorageKnowledgeRepository();
    const reviewRepo = new LocalStorageReviewRepository();

    let dictWarning: string | undefined;
    const loadDict = NdjsonDictionaryRepository.load().catch((err: unknown) => {
      console.warn('Dictionary load failed:', err instanceof Error ? err.message : err);
      dictWarning = 'Dictionary failed to load — definitions will be unavailable until you reload.';
      return FALLBACK_DICT;
    });

    Promise.all([loadDict, GaruKoAnalyzer.load()]).then(async ([dict, analyzer]) => {
      const s: Extract<AppState, { phase: 'home' }> = {
        phase: 'home',
        dict,
        analyzer,
        knowledge,
        reviewRepo,
        dictWarning,
      };
      homeRef.current = s;
      reviewRepo.countDue(new Date()).then(setDueCount);

      const savedText = getReadingSession();
      if (!savedText) {
        setState(s);
        return;
      }

      setState({ phase: 'analyzing' });
      try {
        const analyzed = await new ReadingPipeline(analyzer, dict, knowledge).analyze(savedText);
        setState({
          phase: 'reading',
          text: analyzed,
          sourceText: savedText,
          dict,
          analyzer,
          knowledge,
          reviewRepo,
          dictWarning,
        });
      } catch (err) {
        setState({ phase: 'error', message: err instanceof Error ? err.message : String(err) });
      }
    }).catch((err: unknown) => {
      setState({ phase: 'error', message: err instanceof Error ? err.message : String(err) });
    });
  }, []);

  function goHome() {
    if (homeRef.current) {
      setState(homeRef.current);
      homeRef.current.reviewRepo.countDue(new Date()).then(setDueCount);
    }
  }

  async function handleImport(rawText: string) {
    if (state.phase !== 'home') return;
    const { dict, analyzer, knowledge, reviewRepo, dictWarning } = state;
    setState({ phase: 'analyzing' });
    try {
      const analyzed = await new ReadingPipeline(analyzer, dict, knowledge).analyze(rawText);
      saveReadingSession(rawText);
      setState({
        phase: 'reading',
        text: analyzed,
        sourceText: rawText,
        dict,
        analyzer,
        knowledge,
        reviewRepo,
        dictWarning,
      });
    } catch (err) {
      setState({ phase: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }

  function handleGoReview() {
    if (state.phase !== 'home') return;
    setState({ phase: 'review', knowledge: state.knowledge, reviewRepo: state.reviewRepo });
  }

  if (state.phase === 'loading' || state.phase === 'analyzing') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <span style={{ color: 'var(--color-text-muted)' }}>
          {state.phase === 'loading' ? state.message : 'Analyzing…'}
        </span>
      </div>
    );
  }

  if (state.phase === 'error') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, justifyContent: 'center' }}>
        <p style={{ color: '#ef4444' }}>Error: {state.message}</p>
        <button onClick={goHome} style={{ background: 'var(--color-new)', color: '#fff', alignSelf: 'flex-start' }}>
          Try again
        </button>
      </div>
    );
  }

  if (state.phase === 'home') {
    return (
      <ImportScreen
        knowledge={state.knowledge}
        onImport={handleImport}
        dueCount={dueCount}
        onReview={handleGoReview}
        dictWarning={state.dictWarning}
      />
    );
  }

  if (state.phase === 'review') {
    return <ReviewScreen reviewRepo={state.reviewRepo} onBack={goHome} />;
  }

  return (
    <Reader
      text={state.text}
      sourceText={state.sourceText}
      knowledge={state.knowledge}
      reviewRepo={state.reviewRepo}
      onBack={goHome}
    />
  );
}
