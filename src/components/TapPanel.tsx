import type { AnalyzedMorpheme, KnowledgeState } from '../domain/model';

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

export function TapPanel({ morpheme, currentState, onMark, onClose }: Props) {
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

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {STATE_BUTTONS.map(({ state, label, bg }) => (
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
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
