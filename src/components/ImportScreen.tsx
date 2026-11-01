import { useState } from 'react';
import { DeepLSettingsButton } from '../translation/DeepLSettings';
import type { KnowledgeRepository } from '../knowledge/repository';
import { WordDownloads } from './WordDownloads';

interface Props {
  knowledge: KnowledgeRepository;
  onImport: (text: string) => void;
  dueCount: number;
  onReview: () => void;
  dictWarning?: string;
}

export function ImportScreen({ knowledge, onImport, dueCount, onReview, dictWarning }: Props) {
  const [text, setText] = useState('');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 600, margin: 0 }}>Korean Reader</h1>
        {dueCount > 0 && (
          <button
            onClick={onReview}
            style={{ background: '#22c55e', color: '#fff', padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}
          >
            Review ({dueCount} due)
          </button>
        )}
        <DeepLSettingsButton />
      </div>
      {dictWarning && (
        <p role="alert" style={{ color: '#b45309', background: '#fffbeb', border: '1px solid #fcd34d', padding: '0.6rem 0.8rem', borderRadius: '6px', margin: 0, fontSize: '0.9rem' }}>
          {dictWarning}
        </p>
      )}
      <WordDownloads knowledge={knowledge} />

      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
        Paste Korean text to start reading. Words are colored by how well you know them.
      </p>

      <textarea
        rows={12}
        placeholder="여기에 한국어 텍스트를 붙여넣으세요…"
        value={text}
        onChange={e => setText(e.target.value)}
        autoFocus
      />

      <button
        onClick={() => { if (text.trim()) onImport(text.trim()); }}
        disabled={!text.trim()}
        style={{
          background: text.trim() ? 'var(--color-new)' : 'var(--color-border)',
          color: '#fff',
          alignSelf: 'flex-end',
          padding: '0.6rem 1.4rem',
          fontSize: '1rem',
        }}
      >
        Read →
      </button>
    </div>
  );
}
