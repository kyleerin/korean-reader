import { useEffect, useState } from 'react';
import { fetchAiTranslation, TranslationClientError } from '../translation/client';

interface Props {
  sourceText: string;
}

export function AiTranslation({ sourceText }: Props) {
  const [translation, setTranslation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setTranslation(null);

    fetchAiTranslation(sourceText)
      .then(result => {
        if (!cancelled) setTranslation(result);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof TranslationClientError && err.status === 503) {
          setError('Translation server is not configured. Start it with npm run dev:api and set OPENAI_API_KEY.');
        } else {
          setError(err instanceof Error ? err.message : 'Translation failed.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [sourceText]);

  return (
    <section
      style={{
        marginTop: '2rem',
        paddingTop: '1.5rem',
        borderTop: '1px solid var(--color-border)',
      }}
    >
      <h2
        style={{
          fontSize: '0.85rem',
          color: 'var(--color-text-muted)',
          marginBottom: '0.75rem',
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        Translation
      </h2>
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
