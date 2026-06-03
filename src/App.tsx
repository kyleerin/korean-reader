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
import { ImportScreen } from './components/ImportScreen';
import { Reader } from './components/Reader';
import { ReviewScreen } from './components/ReviewScreen';

type AppState =
  | { phase: 'loading'; message: string }
  | { phase: 'home'; dict: DictionaryRepository; analyzer: MorphologicalAnalyzer; knowledge: KnowledgeRepository; reviewRepo: ReviewRepository }
  | { phase: 'analyzing' }
  | { phase: 'reading'; text: AnalyzedText; dict: DictionaryRepository; analyzer: MorphologicalAnalyzer; knowledge: KnowledgeRepository; reviewRepo: ReviewRepository }
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

    const loadDict = NdjsonDictionaryRepository.load().catch((err: unknown) => {
      console.warn('Dictionary load failed:', err instanceof Error ? err.message : err);
      return FALLBACK_DICT;
    });

    Promise.all([loadDict, GaruKoAnalyzer.load()]).then(([dict, analyzer]) => {
      const s: Extract<AppState, { phase: 'home' }> = { phase: 'home', dict, analyzer, knowledge, reviewRepo };
      homeRef.current = s;
      setState(s);
      reviewRepo.countDue(new Date()).then(setDueCount);
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
    const { dict, analyzer, knowledge, reviewRepo } = state;
    setState({ phase: 'analyzing' });
    try {
      const analyzed = await new ReadingPipeline(analyzer, dict, knowledge).analyze(rawText);
      setState({ phase: 'reading', text: analyzed, dict, analyzer, knowledge, reviewRepo });
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
    return <ImportScreen onImport={handleImport} dueCount={dueCount} onReview={handleGoReview} />;
  }

  if (state.phase === 'review') {
    return <ReviewScreen reviewRepo={state.reviewRepo} onBack={goHome} />;
  }

  return (
    <Reader
      text={state.text}
      knowledge={state.knowledge}
      reviewRepo={state.reviewRepo}
      onBack={goHome}
    />
  );
}
