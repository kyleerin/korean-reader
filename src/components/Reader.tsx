import { useEffect, useState } from 'react';
import type { AnalyzedEojeol, AnalyzedMorpheme, AnalyzedText, KnowledgeState } from '../domain/model';
import type { KnowledgeRepository } from '../knowledge/repository';
import type { ReviewRepository } from '../review/repository';
import { hasNewWords, isFullyKnown } from '../domain/model';
import { TapPanel } from './TapPanel';

interface Props {
  text: AnalyzedText;
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

// Compatibility jamo (ㄱ-ㅣ, U+3131-U+3163) and leading/trailing jamo blocks.
// These can't form syllable blocks when split across HTML elements.
function hasBarejamo(s: string): boolean {
  return /[ㄱ-ㅣᄀ-ᇿ]/.test(s);
}

// True if ANY morpheme in this eojeol has a bare-jamo surface.
// In that case we must render the whole eojeol surface as one text node.
function needsFallback(eojeol: AnalyzedEojeol): boolean {
  return eojeol.morphemes.some(m => hasBarejamo(m.surface));
}

// ── Single content-morpheme span (tappable, live color) ──────────────────────
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

// ── Eojeol rendered morpheme-by-morpheme (safe: no bare jamo) ────────────────
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
        // PARTICLE / ENDING / AFFIX → grey
        return <span key={i} style={{ color: 'var(--color-text-muted)' }}>{m.surface}</span>;
      })}
    </>
  );
}

// ── Fallback: bare-jamo present, render full eojeol surface as one text node ──
// Color by the dominant content-morpheme state; still tappable.
function FallbackEojeol({
  eojeol,
  knowledge,
  onTap,
}: {
  eojeol: AnalyzedEojeol;
  knowledge: KnowledgeRepository;
  onTap: (m: AnalyzedMorpheme, s: KnowledgeState) => void;
}) {
  const contentMorphemes = eojeol.morphemes.filter(m => m.type === 'CONTENT');

  const [statesMap, setStatesMap] = useState<Map<string, KnowledgeState>>(
    () => new Map(contentMorphemes.map(m => [`${m.lemma}\x00${m.pos}`, m.state])),
  );

  useEffect(() => {
    setStatesMap(new Map(contentMorphemes.map(m => [`${m.lemma}\x00${m.pos}`, m.state])));
    const unsubs = contentMorphemes.map(m =>
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

  if (contentMorphemes.length === 0) {
    return <span style={{ color: 'var(--color-text-muted)' }}>{eojeol.surface}</span>;
  }

  function handleClick() {
    const primary = contentMorphemes[0]!;
    const state = statesMap.get(`${primary.lemma}\x00${primary.pos}`) ?? primary.state;
    onTap(primary, state);
  }

  return (
    <span onClick={handleClick} style={{ color, cursor: 'pointer' }}>
      {eojeol.surface}
    </span>
  );
}

// ── Top-level Reader ─────────────────────────────────────────────────────────
export function Reader({ text, knowledge, reviewRepo, onBack }: Props) {
  const [selected, setSelected] = useState<{ morpheme: AnalyzedMorpheme; state: KnowledgeState } | null>(null);

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={onBack}
          style={{ background: 'transparent', color: 'var(--color-text-muted)', padding: '0.25rem 0.5rem' }}
        >
          ← Back
        </button>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          {newCount} new · {knownCount} known eojeols
        </span>
      </div>

      <div style={{ fontSize: '1.1rem', lineHeight: 2, letterSpacing: '0.02em' }}>
        {text.sentences.map((sentence, si) => (
          <span key={si}>
            {sentence.eojeols.map((eojeol, ei) => (
              <span key={ei}>
                {needsFallback(eojeol)
                  ? <FallbackEojeol eojeol={eojeol} knowledge={knowledge} onTap={(m, s) => setSelected({ morpheme: m, state: s })} />
                  : <StandardEojeol eojeol={eojeol} knowledge={knowledge} onTap={(m, s) => setSelected({ morpheme: m, state: s })} />
                }
                {ei < sentence.eojeols.length - 1 ? ' ' : ''}
              </span>
            ))}
            {' '}
          </span>
        ))}
      </div>

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
