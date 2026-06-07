import { useEffect } from 'react';
import type { AnalyzedMorpheme, KnowledgeState, PartOfSpeech } from '../domain/model';

interface Props {
  morpheme: AnalyzedMorpheme;
  currentState: KnowledgeState;
  onMark: (state: KnowledgeState) => void;
  onClose: () => void;
}

const STATE_BUTTONS: { state: KnowledgeState; label: string; bg: string }[] = [
  { state: 'KNOWN',    label: 'Known',    bg: '#22c55e' },
  { state: 'LEARNING', label: 'Learning', bg: '#f59e0b' },
  { state: 'IGNORED',  label: 'Ignore',   bg: '#555'    },
  { state: 'NEW',      label: 'Reset',    bg: '#3b82f6' },
];

function posKind(pos: PartOfSpeech): 'content' | 'particle' | 'ending' | 'affix' | 'skip' {
  if (['JKS','JKC','JKG','JKO','JKB','JKV','JKQ','JX','JC','VCP','VCN'].includes(pos)) return 'particle';
  if (['EP','EF','EC','ETN','ETM'].includes(pos)) return 'ending';
  if (['XPN','XSN','XSV','XSA','XR'].includes(pos)) return 'affix';
  if (['SF','SP','SS','SE','SO','SW','SL','SH','SN','UNKNOWN'].includes(pos)) return 'skip';
  return 'content';
}

function morphemeLabel(surface: string, pos: PartOfSpeech): string {
  switch (pos) {
    case 'EP':
      if (surface === '었' || surface === '았') return 'past';
      if (surface === '시') return 'hon.';
      if (surface === '겠') return 'will';
      return 'ep';
    case 'EF':
      if (surface === '습니다' || surface === 'ㅂ니다') return 'formal';
      if (['어요','아요','여요'].includes(surface)) return 'polite';
      if (['어','아','여'].includes(surface)) return 'informal';
      if (surface === '다') return 'plain';
      if (['냐','니','나'].includes(surface)) return 'Q';
      if (surface === '자') return "let's";
      if (['라','아라','어라'].includes(surface)) return 'cmd';
      return 'ef';
    case 'EC':
      if (surface === '고') return 'and';
      if (['서','아서','어서'].includes(surface)) return 'so';
      if (['면','으면'].includes(surface)) return 'if';
      if (surface === '지만') return 'but';
      if (['니까','으니까'].includes(surface)) return 'because';
      if (surface === '거나') return 'or';
      if (['며','으며'].includes(surface)) return 'and';
      if (['러','으러'].includes(surface)) return 'to';
      if (['려','으려'].includes(surface)) return 'intend';
      if (surface === '게') return 'so that';
      if (surface === '도') return 'even if';
      if (surface === '지') return 'neg';
      return 'ec';
    case 'ETM':
      if (['ㄴ','은'].includes(surface)) return 'past-adj';
      if (surface === '는') return 'pres-adj';
      if (['ㄹ','을'].includes(surface)) return 'fut-adj';
      return 'etm';
    case 'ETN': return 'noun-form';
    case 'JKS': return 'subj';
    case 'JKO': return 'obj';
    case 'JKC': return 'compl';
    case 'JKG': return 'of';
    case 'JKV': return 'voc';
    case 'JKQ': return 'quot';
    case 'JKB':
      if (surface === '에') return 'at/to';
      if (surface === '에서') return 'at/from';
      if (['로','으로'].includes(surface)) return 'by/to';
      if (['와','과','랑','이랑'].includes(surface)) return 'with';
      if (['한테','에게'].includes(surface)) return 'to';
      if (['한테서','에게서'].includes(surface)) return 'from';
      return 'adv';
    case 'JX':
      if (['은','는'].includes(surface)) return 'topic';
      if (surface === '도') return 'also';
      if (surface === '만') return 'only';
      if (['조차','마저'].includes(surface)) return 'even';
      if (surface === '부터') return 'from';
      if (surface === '까지') return 'until';
      return 'jx';
    case 'JC': return 'and';
    case 'VCP': return 'be';
    case 'VCN': return 'not-be';
    case 'XSV': return '→verb';
    case 'XSA': return '→adj';
    case 'XSN': return '→noun';
    default: return pos.toLowerCase();
  }
}

interface BreakdownItem {
  display: string;
  label?: string;
}

function buildBreakdown(morpheme: AnalyzedMorpheme): BreakdownItem[] | null {
  // garu-ko sometimes mis-tags 이민 (immigration) inside 들이밀다 conjugations.
  if (morpheme.eojeolContext.some(m => m.surface === '이민' && m.pos === 'NN')) {
    return null;
  }

  const items: BreakdownItem[] = [];
  let usedSelf = false;
  let hasGrammatical = false;

  for (const m of morpheme.eojeolContext) {
    const kind = posKind(m.pos);
    if (kind === 'skip') continue;

    const isSelf = !usedSelf && m.surface === morpheme.surface && m.pos === morpheme.pos;
    if (isSelf) {
      usedSelf = true;
      items.push({ display: kind === 'content' ? morpheme.lemma : m.surface });
    } else if (kind === 'content') {
      items.push({ display: m.surface });
    } else {
      hasGrammatical = true;
      items.push({ display: m.surface, label: morphemeLabel(m.surface, m.pos) });
    }
  }

  return hasGrammatical && items.length > 1 ? items : null;
}

export function TapPanel({ morpheme, currentState, onMark, onClose }: Props) {
  const breakdown = buildBreakdown(morpheme);

  // Keyboard shortcuts: 1-4 mark the matching button, Escape closes the panel.
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if (e.key === 'Escape') {
        onClose();
        return;
      }
      const index = Number(e.key) - 1;
      const button = STATE_BUTTONS[index];
      if (!button) return;
      e.preventDefault();
      onMark(button.state);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onMark, onClose]);

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'var(--color-surface)',
      borderTop: '1px solid var(--color-border)',
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      maxWidth: '720px',
      margin: '0 auto',
      zIndex: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{morpheme.lemma}</span>
          <span style={{ marginLeft: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
            {morpheme.pos}
          </span>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', color: 'var(--color-text-muted)', fontSize: '1.2rem' }}>
          ✕
        </button>
      </div>

      {morpheme.definitions.length > 0 ? (
        <ol style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {morpheme.definitions.slice(0, 3).map((def, i) => (
            <li key={i} style={{ fontSize: '0.95rem' }}>{def}</li>
          ))}
        </ol>
      ) : (
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No definition found.</p>
      )}

      {breakdown && (
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.25rem', fontSize: '0.875rem' }}>
            {breakdown.flatMap((item, i) => {
              const chip = (
                <span key={`item-${i}`} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span>{item.display}</span>
                  {item.label && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{item.label}</span>
                  )}
                </span>
              );
              return i === 0
                ? [chip]
                : [
                    <span key={`sep-${i}`} style={{ color: 'var(--color-text-muted)', alignSelf: 'flex-start', paddingTop: '1px' }}>+</span>,
                    chip,
                  ];
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {STATE_BUTTONS.map(({ state, label, bg }, i) => (
          <button
            key={state}
            onClick={() => onMark(state)}
            style={{
              background: currentState === state ? bg : 'transparent',
              color: currentState === state ? '#fff' : 'var(--color-text-muted)',
              border: `1px solid ${bg}`,
              flex: 1,
              minWidth: '5rem',
            }}
          >
            <span style={{ opacity: 0.6, marginRight: '0.35rem' }}>{i + 1}</span>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
