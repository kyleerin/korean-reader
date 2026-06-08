import { useEffect } from 'react';
import { buildEojeolBreakdown, explainBreakdown } from '../grammar/breakdown';
import type { TextSelection } from '../selection/resolve';
import { selectionVocabulary } from '../selection/resolve';
import { BreakdownChips } from './BreakdownChips';

interface Props {
  selection: TextSelection;
  onClose: () => void;
}

export function SelectionPanel({ selection, onClose }: Props) {
  const vocabulary = selectionVocabulary(selection);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

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
      zIndex: 11,
      maxHeight: 'min(70vh, 28rem)',
      overflowY: 'auto',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
            Selection
          </p>
          <p style={{ fontSize: '1.1rem', fontWeight: 600, lineHeight: 1.5 }}>{selection.selectedText}</p>
        </div>
        <button type="button" onClick={onClose} style={{ background: 'transparent', color: 'var(--color-text-muted)', fontSize: '1.2rem' }}>
          ✕
        </button>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
        <span style={{ opacity: 0.7 }}>Sentence: </span>
        {selection.sentence.surface}
      </p>

      <section>
        <h3 style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
          Grammar
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {selection.eojeols.map(({ eojeol }, i) => {
            const breakdown = buildEojeolBreakdown(eojeol);
            return (
              <div key={`${eojeol.surface}-${i}`}>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.35rem' }}>{eojeol.surface}</p>
                {breakdown ? (
                  <>
                    <BreakdownChips items={breakdown} />
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.35rem', lineHeight: 1.5 }}>
                      {explainBreakdown(breakdown)}
                    </p>
                  </>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    No conjugation breakdown for this word.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {vocabulary.length > 0 && (
        <section>
          <h3 style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Vocabulary &amp; examples
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {vocabulary.map(m => (
              <div key={`${m.lemma}-${m.pos}`} style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.65rem' }}>
                <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                  {m.lemma}
                  <span style={{ marginLeft: '0.4rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{m.pos}</span>
                </p>
                {m.definitions.length > 0 && (
                  <ol style={{ paddingLeft: '1.1rem', margin: '0 0 0.35rem', fontSize: '0.9rem' }}>
                    {m.definitions.slice(0, 2).map((def, di) => (
                      <li key={di}>{def}</li>
                    ))}
                  </ol>
                )}
                {m.examples && m.examples.length > 0 && (
                  <ul style={{ paddingLeft: '1.1rem', margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                    {m.examples.slice(0, 2).map((ex, ei) => (
                      <li key={ei}>{ex}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
