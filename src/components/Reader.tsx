import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AnalyzedEojeol, AnalyzedMorpheme, AnalyzedText, KnowledgeState } from '../domain/model';
import type { KnowledgeRepository } from '../knowledge/repository';
import type { ReviewRepository } from '../review/repository';
import { hasNewWords, isFullyKnown, uniqueVocabularyMorphemes } from '../domain/model';
import { useReadingTextSelection } from '../hooks/useReadingTextSelection';
import { clearReadingSession } from '../session/storage';
import { useDeepLSettings, DeepLSettingsButton } from '../translation/DeepLSettings';
import { resolveTextSelection, type TextSelection } from '../selection/resolve';
import { AiTranslation } from './AiTranslation';
import { KoreanSentence } from './reader/EojeolView';
import { SelectionPanel } from './SelectionPanel';
import { TapPanel } from './TapPanel';
import { WordDownloads } from './WordDownloads';

interface Props {
  text: AnalyzedText;
  sourceText: string;
  knowledge: KnowledgeRepository;
  reviewRepo: ReviewRepository;
  onBack: () => void;
}

function morphemeKey(morpheme: AnalyzedMorpheme): string {
  return `${morpheme.lemma}\x00${morpheme.pos}`;
}

export function Reader({ text, sourceText, knowledge, reviewRepo, onBack }: Props) {
  const [selected, setSelected] = useState<{ morpheme: AnalyzedMorpheme; state: KnowledgeState } | null>(null);
  const [textSelection, setTextSelection] = useState<TextSelection | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const { apiKey, hasApiKey } = useDeepLSettings();
  const readingRef = useRef<HTMLDivElement>(null);
  const vocabulary = useMemo(() => uniqueVocabularyMorphemes(text), [text]);
  const [knowledgeStates, setKnowledgeStates] = useState<Map<string, KnowledgeState>>(
    () => new Map(vocabulary.map(m => [morphemeKey(m), m.state])),
  );

  useEffect(() => {
    let cancelled = false;
    setKnowledgeStates(new Map(vocabulary.map(m => [morphemeKey(m), m.state])));

    Promise.all(vocabulary.map(async (morpheme) => {
      const state = await knowledge.getState(morpheme.lemma, morpheme.pos);
      return [morphemeKey(morpheme), state] as const;
    })).then((entries) => {
      if (cancelled) return;
      setKnowledgeStates(prev => {
        const next = new Map(prev);
        entries.forEach(([key, state]) => next.set(key, state));
        return next;
      });
    });

    const unsubs = vocabulary.map(morpheme =>
      knowledge.observeState(morpheme.lemma, morpheme.pos, state =>
        setKnowledgeStates(prev => new Map(prev).set(morphemeKey(morpheme), state)),
      ),
    );

    return () => {
      cancelled = true;
      unsubs.forEach(unsub => unsub());
    };
  }, [knowledge, vocabulary]);

  const stateFor = useCallback(
    (morpheme: AnalyzedMorpheme) => knowledgeStates.get(morphemeKey(morpheme)) ?? morpheme.state,
    [knowledgeStates],
  );

  const handleExplainEojeol = useCallback((eojeol: AnalyzedEojeol) => {
    const resolved = resolveTextSelection(text, eojeol.surface);
    if (!resolved) return;
    window.getSelection()?.removeAllRanges();
    setSelected(null);
    setTextSelection(resolved);
  }, [text]);

  useReadingTextSelection(readingRef, text, (resolved) => {
    if (resolved.selectedText.length < 2) return;
    setSelected(null);
    setTextSelection(resolved);
  });

  async function handleMark(newState: KnowledgeState) {
    if (!selected) return;
    const { morpheme } = selected;
    await knowledge.setState(morpheme.lemma, morpheme.pos, newState);

    if (newState === 'LEARNING') {
      await reviewRepo.ensureCard(morpheme.lemma, morpheme.pos, morpheme.definitions);
    } else {
      await reviewRepo.deleteCard(morpheme.lemma, morpheme.pos);
    }

    setSelected(prev => prev ? { ...prev, state: newState } : null);
  }

  async function handleDone() {
    if (isFinishing) return;
    setIsFinishing(true);

    try {
      const currentNewWords = vocabulary.filter(morpheme => stateFor(morpheme) === 'NEW');

      await Promise.all(currentNewWords.map(async (morpheme) => {
        await knowledge.setState(morpheme.lemma, morpheme.pos, 'KNOWN');
        await reviewRepo.deleteCard(morpheme.lemma, morpheme.pos);
      }));
      clearReadingSession();
      onBack();
    } catch (err) {
      console.error('Failed to mark new words as known:', err);
      setIsFinishing(false);
    }
  }

  const allEojeols = text.sentences.flatMap(s => s.eojeols);
  const newCount = allEojeols.filter(eojeol => hasNewWords(eojeol, stateFor)).length;
  const knownCount = allEojeols.filter(eojeol => isFullyKnown(eojeol, stateFor)).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: textSelection || selected ? '14rem' : '8rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          onClick={onBack}
          style={{ background: 'transparent', color: 'var(--color-text-muted)', padding: '0.25rem 0.5rem' }}
        >
          ← Back
        </button>
        <button
          onClick={handleDone}
          disabled={isFinishing}
          style={{ background: 'var(--color-new)', color: '#fff', padding: '0.35rem 0.75rem' }}
        >
          {isFinishing ? 'Saving…' : 'Done'}
        </button>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          {newCount} new · {knownCount} known eojeols
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          Long-press or select text for grammar
        </span>
        <DeepLSettingsButton />
      </div>
      <WordDownloads knowledge={knowledge} />

      <div
        ref={readingRef}
        className="reader-text"
        style={{ fontSize: '1.1rem', lineHeight: 2, letterSpacing: '0.02em', display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        {text.paragraphs.map((paragraph, pi) => (
          <p key={pi} style={{ margin: 0 }}>
            {paragraph.sentences.map((sentence, si) => (
              <span key={si}>
                <KoreanSentence
                  sentence={sentence}
                  stateFor={stateFor}
                  readingRef={readingRef}
                  onExplainEojeol={handleExplainEojeol}
                  onTap={(m, s) => {
                    setTextSelection(null);
                    setSelected({ morpheme: m, state: s });
                  }}
                />
                {' '}
              </span>
            ))}
          </p>
        ))}
      </div>

      {hasApiKey && apiKey && !showTranslation && (
        <button
          type="button"
          onClick={() => setShowTranslation(true)}
          style={{
            alignSelf: 'flex-start',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
            padding: '0.5rem 0.9rem',
            fontSize: '0.9rem',
          }}
        >
          Show translation
        </button>
      )}

      {hasApiKey && apiKey && showTranslation && (
        <AiTranslation
          sourceText={sourceText}
          apiKey={apiKey}
          onHide={() => setShowTranslation(false)}
        />
      )}

      {textSelection && (
        <SelectionPanel
          selection={textSelection}
          onClose={() => setTextSelection(null)}
        />
      )}

      {selected && !textSelection && (
        <TapPanel
          morpheme={selected.morpheme}
          currentState={selected.state}
          onMark={handleMark}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
