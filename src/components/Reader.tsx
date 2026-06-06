import { useEffect, useState } from 'react';
import type { AnalyzedEojeol, AnalyzedMorpheme, AnalyzedSentence, AnalyzedText, KnowledgeState } from '../domain/model';
import type { KnowledgeRepository } from '../knowledge/repository';
import type { ReviewRepository } from '../review/repository';
import { hasNewWords, isFullyKnown, vocabularyMorphemes } from '../domain/model';
import { useDeepLSettings, DeepLSettingsButton } from '../translation/DeepLSettings';
import { AiTranslation } from './AiTranslation';
import { TapPanel } from './TapPanel';

interface Props {
  text: AnalyzedText;
  sourceText: string;
  knowledge: KnowledgeRepository;
  reviewRepo: ReviewRepository;
  onBack: () => void;
}

const STATE_COLOR: Record<KnowledgeState, string | undefined> = {
  NEW:      'var(--color-new)',
  LEARNING: 'var(--color-learning)',
  KNOWN:    undefined,
  IGNORED:  'var(--color-ignored)',
};

function hasBarejamo(s: string): boolean {
  return /[ㄱ-ㅣᄀ-ᇿ]/.test(s);
}

function needsFallback(eojeol: AnalyzedEojeol): boolean {
  if (eojeol.morphemes.some(m => hasBarejamo(m.surface))) return true;
  return eojeol.morphemes.map(m => m.surface).join('') !== eojeol.surface;
}

function ContentSpan({
  morpheme,
  knowledge,
  onTap,
}: {
  morpheme: AnalyzedMorpheme;
  knowledge: KnowledgeRepository;
  onTap: (m: AnalyzedMorpheme, s: KnowledgeState) => void;
}) {
  const [state, setState] = useState<KnowledgeState>(morpheme.state);

  useEffect(() => {
    setState(morpheme.state);
    return knowledge.observeState(morpheme.lemma, morpheme.pos, setState);
  }, [morpheme.lemma, morpheme.pos, morpheme.state, knowledge]);

  return (
    <span
      onClick={() => onTap(morpheme, state)}
      style={{ color: STATE_COLOR[state], cursor: 'pointer', borderRadius: '3px', padding: '0 1px' }}
    >
      {morpheme.surface}
    </span>
  );
}

function StandardEojeol({
  eojeol,
  knowledge,
  onTap,
}: {
  eojeol: AnalyzedEojeol;
  knowledge: KnowledgeRepository;
  onTap: (m: AnalyzedMorpheme, s: KnowledgeState) => void;
}) {
  return (
    <>
      {eojeol.morphemes.map((m, i) => {
        if (m.type === 'CONTENT') {
          return <ContentSpan key={i} morpheme={m} knowledge={knowledge} onTap={onTap} />;
        }
        if (m.type === 'PUNCTUATION' || m.type === 'FOREIGN' || m.type === 'UNKNOWN') {
          return <span key={i}>{m.surface}</span>;
        }
        return <span key={i} style={{ color: 'var(--color-text-muted)' }}>{m.surface}</span>;
      })}
    </>
  );
}

interface Segment { text: string; color?: string }

function fallbackSegments(eojeol: AnalyzedEojeol, headColor: string | undefined): Segment[] {
  const tail: Segment[] = [];
  let head = eojeol.surface;
  for (let i = eojeol.morphemes.length - 1; i >= 0; i--) {
    const m = eojeol.morphemes[i]!;
    let segColor: string | undefined;
    if (m.type === 'PARTICLE' || m.type === 'ENDING') segColor = 'var(--color-text-muted)';
    else if (m.type === 'PUNCTUATION' || m.type === 'FOREIGN' || m.type === 'UNKNOWN') segColor = undefined;
    else break;
    if (!head.endsWith(m.surface) || head.length === m.surface.length) break;
    head = head.slice(0, head.length - m.surface.length);
    tail.unshift({ text: m.surface, color: segColor });
  }
  return [{ text: head, color: headColor }, ...tail];
}

function FallbackEojeol({
  eojeol,
  knowledge,
  onTap,
}: {
  eojeol: AnalyzedEojeol;
  knowledge: KnowledgeRepository;
  onTap: (m: AnalyzedMorpheme, s: KnowledgeState) => void;
}) {
  const vocabMorphemes = vocabularyMorphemes(eojeol);

  const [statesMap, setStatesMap] = useState<Map<string, KnowledgeState>>(
    () => new Map(vocabMorphemes.map(m => [`${m.lemma}\x00${m.pos}`, m.state])),
  );

  useEffect(() => {
    setStatesMap(new Map(vocabMorphemes.map(m => [`${m.lemma}\x00${m.pos}`, m.state])));
    const unsubs = vocabMorphemes.map(m =>
      knowledge.observeState(m.lemma, m.pos, s =>
        setStatesMap(prev => new Map(prev).set(`${m.lemma}\x00${m.pos}`, s)),
      ),
    );
    return () => unsubs.forEach(u => u());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eojeol, knowledge]);

  const states = [...statesMap.values()];
  let color: string | undefined;
  if (states.includes('NEW'))           color = STATE_COLOR.NEW;
  else if (states.includes('LEARNING')) color = STATE_COLOR.LEARNING;
  else if (states.every(s => s === 'IGNORED')) color = STATE_COLOR.IGNORED;

  if (vocabMorphemes.length === 0) {
    return <span style={{ color: 'var(--color-text-muted)' }}>{eojeol.surface}</span>;
  }

  function handleClick() {
    const primary = vocabMorphemes[0]!;
    const state = statesMap.get(`${primary.lemma}\x00${primary.pos}`) ?? primary.state;
    onTap(primary, state);
  }

  const segments = fallbackSegments(eojeol, color);

  return (
    <span onClick={handleClick} style={{ cursor: 'pointer' }}>
      {segments.map((seg, i) => (
        <span key={i} style={{ color: seg.color }}>{seg.text}</span>
      ))}
    </span>
  );
}

function KoreanSentence({
  sentence,
  knowledge,
  onTap,
}: {
  sentence: AnalyzedSentence;
  knowledge: KnowledgeRepository;
  onTap: (m: AnalyzedMorpheme, s: KnowledgeState) => void;
}) {
  return (
    <>
      {sentence.eojeols.map((eojeol, ei) => (
        <span key={ei}>
          {needsFallback(eojeol)
            ? <FallbackEojeol eojeol={eojeol} knowledge={knowledge} onTap={onTap} />
            : <StandardEojeol eojeol={eojeol} knowledge={knowledge} onTap={onTap} />
          }
          {ei < sentence.eojeols.length - 1 ? ' ' : ''}
        </span>
      ))}
    </>
  );
}

export function Reader({ text, sourceText, knowledge, reviewRepo, onBack }: Props) {
  const [selected, setSelected] = useState<{ morpheme: AnalyzedMorpheme; state: KnowledgeState } | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const { apiKey, hasApiKey } = useDeepLSettings();

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

  const allEojeols = text.sentences.flatMap(s => s.eojeols);
  const newCount = allEojeols.filter(hasNewWords).length;
  const knownCount = allEojeols.filter(isFullyKnown).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '8rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          onClick={onBack}
          style={{ background: 'transparent', color: 'var(--color-text-muted)', padding: '0.25rem 0.5rem' }}
        >
          ← Back
        </button>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          {newCount} new · {knownCount} known eojeols
        </span>
        <DeepLSettingsButton />
      </div>

      <div style={{ fontSize: '1.1rem', lineHeight: 2, letterSpacing: '0.02em', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {text.paragraphs.map((paragraph, pi) => (
          <p key={pi} style={{ margin: 0 }}>
            {paragraph.sentences.map((sentence, si) => (
              <span key={si}>
                <KoreanSentence
                  sentence={sentence}
                  knowledge={knowledge}
                  onTap={(m, s) => setSelected({ morpheme: m, state: s })}
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

      {selected && (
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
