import { useState } from 'react';
import type { KnowledgeRepository } from '../knowledge/repository';
import { downloadWords, type WordExportGroup } from '../knowledge/export';

export function WordDownloads({ knowledge }: { knowledge: KnowledgeRepository }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleDownload(group: WordExportGroup) {
    setBusy(true);
    setError('');
    try {
      await downloadWords(knowledge, group);
    } catch {
      setError('Could not download words. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <details>
      <summary style={{ cursor: 'pointer', fontSize: '0.85rem' }}>Download words</summary>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
        <button disabled={busy} onClick={() => handleDownload('known')}>Download known (.txt)</button>
        <button disabled={busy} onClick={() => handleDownload('unknown')}>Download unknown (.txt)</button>
      </div>
      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
        All saved vocabulary, not just this text. Unknown includes new and learning words.
        Ignored words are excluded. Plain text with comma-separated words, each listed once.
      </p>
      {error && <p role="alert">{error}</p>}
    </details>
  );
}
