import { useEffect, useState } from 'react';
import { fetchAiTranslation } from '../translation/client';

interface Props {
  sourceText: string;
  apiKey: string;
  onHide?: () => void;
}

export function AiTranslation({ sourceText, apiKey, onHide }: Props) {
  const [translation, setTranslation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setTranslation(null);

    fetchAiTranslation(sourceText, apiKey)
      .then(result => {
        if (!cancelled) setTranslation(result);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Translation failed.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [sourceText, apiKey]);

  return (
    <section
      style={{
        marginTop: '2rem',
        paddingTop: '1.5rem',
        borderTop: '1px solid var(--color-border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.75rem' }}>
        <h2
          style={{
            fontSize: '0.85rem',
            color: 'var(--color-text-muted)',
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          Translation
        </h2>
        {onHide && (
          <button
            type="button"
            onClick={onHide}
            style={{
              background: 'transparent',
              color: 'var(--color-text-muted)',
              border: 'none',
              padding: '0.25rem 0.5rem',
              fontSize: '0.8rem',
            }}
          >
            Hide
          </button>
        )}
      </div>
      {loading && (
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>Translating…</p>
      )}
      {error && (
        <p style={{ color: '#ef4444', fontSize: '0.95rem', lineHeight: 1.6 }}>{error}</p>
      )}
      {translation && (
        <div
          style={{
            whiteSpace: 'pre-wrap',
            lineHeight: 1.7,
            fontSize: '1rem',
            color: 'var(--color-text-muted)',
          }}
        >
          {translation}
        </div>
      )}
    </section>
  );
}
