import type { KnowledgeRepository, KnowledgeWord } from './repository';

export type WordExportGroup = 'known' | 'unknown';

export function wordsToText(words: readonly KnowledgeWord[], group: WordExportGroup): string {
  const selected = words
    .filter(word => group === 'known'
      ? word.state === 'KNOWN'
      : word.state === 'NEW' || word.state === 'LEARNING')
    .map(word => word.lemma);
  return [...new Set(selected)].sort((a, b) => a.localeCompare(b, 'ko')).join(', ');
}

export async function downloadWords(knowledge: KnowledgeRepository, group: WordExportGroup): Promise<void> {
  const text = wordsToText(await knowledge.listWords(), group);
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `korean-reader-${group}-words.txt`;
  document.body.appendChild(link);
  try {
    link.click();
  } finally {
    link.remove();
    // Give the browser time to start the download before releasing the URL.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
