import type { ReactNode, RefObject } from 'react';
import type { AnalyzedEojeol, AnalyzedMorpheme, AnalyzedSentence, KnowledgeState } from '../../domain/model';
import { vocabularyMorphemes } from '../../domain/model';
import { hasActiveTextSelection } from '../../hooks/useReadingTextSelection';
import { useLongPress } from '../../hooks/useLongPress';

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
  state,
  readingRef,
  onTap,
}: {
  morpheme: AnalyzedMorpheme;
  state: KnowledgeState;
  readingRef: RefObject<HTMLElement | null>;
  onTap: (m: AnalyzedMorpheme, s: KnowledgeState) => void;
}) {
  return (
    <span
      onClick={() => {
        if (hasActiveTextSelection(readingRef.current)) return;
        onTap(morpheme, state);
      }}
      style={{ color: STATE_COLOR[state], cursor: 'pointer', borderRadius: '3px', padding: '0 1px' }}
    >
      {morpheme.surface}
    </span>
  );
}

function StandardEojeol({
  eojeol,
  stateFor,
  readingRef,
  onTap,
}: {
  eojeol: AnalyzedEojeol;
  stateFor: (morpheme: AnalyzedMorpheme) => KnowledgeState;
  readingRef: RefObject<HTMLElement | null>;
  onTap: (m: AnalyzedMorpheme, s: KnowledgeState) => void;
}) {
  return (
    <>
      {eojeol.morphemes.map((m, i) => {
        if (m.type === 'CONTENT') {
          return <ContentSpan key={i} morpheme={m} state={stateFor(m)} readingRef={readingRef} onTap={onTap} />;
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
  stateFor,
  readingRef,
  onTap,
}: {
  eojeol: AnalyzedEojeol;
  stateFor: (morpheme: AnalyzedMorpheme) => KnowledgeState;
  readingRef: RefObject<HTMLElement | null>;
  onTap: (m: AnalyzedMorpheme, s: KnowledgeState) => void;
}) {
  const vocabMorphemes = vocabularyMorphemes(eojeol);
  const states = vocabMorphemes.map(stateFor);
  let color: string | undefined;
  if (states.includes('NEW'))           color = STATE_COLOR.NEW;
  else if (states.includes('LEARNING')) color = STATE_COLOR.LEARNING;
  else if (states.every(s => s === 'IGNORED')) color = STATE_COLOR.IGNORED;

  if (vocabMorphemes.length === 0) {
    return <span style={{ color: 'var(--color-text-muted)' }}>{eojeol.surface}</span>;
  }

  function handleClick() {
    if (hasActiveTextSelection(readingRef.current)) return;
    const primary = vocabMorphemes[0]!;
    onTap(primary, stateFor(primary));
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

function EojeolShell({
  eojeol,
  onExplain,
  children,
}: {
  eojeol: AnalyzedEojeol;
  onExplain: (e: AnalyzedEojeol) => void;
  children: ReactNode;
}) {
  const longPress = useLongPress(() => onExplain(eojeol), 450);

  return (
    <span
      className="eojeol"
      onTouchStart={longPress.onTouchStart}
      onTouchEnd={longPress.onTouchEnd}
      onTouchMove={longPress.onTouchMove}
      onClickCapture={longPress.onClickCapture}
    >
      {children}
    </span>
  );
}

export function KoreanSentence({
  sentence,
  stateFor,
  readingRef,
  onTap,
  onExplainEojeol,
}: {
  sentence: AnalyzedSentence;
  stateFor: (morpheme: AnalyzedMorpheme) => KnowledgeState;
  readingRef: RefObject<HTMLElement | null>;
  onTap: (m: AnalyzedMorpheme, s: KnowledgeState) => void;
  onExplainEojeol: (e: AnalyzedEojeol) => void;
}) {
  return (
    <>
      {sentence.eojeols.map((eojeol, ei) => (
        <EojeolShell key={ei} eojeol={eojeol} onExplain={onExplainEojeol}>
          {needsFallback(eojeol)
            ? <FallbackEojeol eojeol={eojeol} stateFor={stateFor} readingRef={readingRef} onTap={onTap} />
            : <StandardEojeol eojeol={eojeol} stateFor={stateFor} readingRef={readingRef} onTap={onTap} />
          }
          {ei < sentence.eojeols.length - 1 ? ' ' : ''}
        </EojeolShell>
      ))}
    </>
  );
}
