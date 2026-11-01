import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadWords, wordsToText } from '../../src/knowledge/export';
import type { KnowledgeWord } from '../../src/knowledge/repository';
import { InMemoryKnowledgeRepository } from '../fakes/in-memory-knowledge';

const words: KnowledgeWord[] = [
  { lemma: '밥', pos: 'NN', state: 'KNOWN' },
  { lemma: '먹다', pos: 'VV', state: 'LEARNING' },
  { lemma: '나', pos: 'NP', state: 'NEW' },
  { lemma: '가다', pos: 'VV', state: 'KNOWN' },
  { lemma: '제외', pos: 'NN', state: 'IGNORED' },
];

describe('Vocabulary text export', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('exports only known words sorted by Korean dictionary form', () => {
    expect(wordsToText(words, 'known')).toBe('가다, 밥');
  });

  it('includes new and learning words as unknown, excluding ignored words', () => {
    expect(wordsToText(words, 'unknown')).toBe('나, 먹다');
  });

  it('exports empty text for an empty list or a group with no matching words', () => {
    expect(wordsToText([], 'known')).toBe('');
    expect(wordsToText([{ lemma: '밥', pos: 'NN', state: 'KNOWN' }], 'unknown')).toBe('');
  });

  it('preserves word text without CSV escaping or spreadsheet prefixes', () => {
    expect(wordsToText([
      { lemma: '=단어', pos: 'NN', state: 'NEW' },
    ], 'unknown')).toBe('=단어');
  });

  it('lists each word once even when saved under different parts of speech', () => {
    expect(wordsToText([
      { lemma: '눈', pos: 'NNP', state: 'KNOWN' },
      { lemma: '눈', pos: 'NN', state: 'KNOWN' },
    ], 'known')).toBe('눈');
  });

  it('downloads UTF-8 plain text with current states and releases browser resources', async () => {
    vi.useFakeTimers();
    const repo = new InMemoryKnowledgeRepository();
    await repo.setState('밥', 'NN', 'NEW');
    await repo.setState('밥', 'NN', 'KNOWN');
    const link = { href: '', download: '', click: vi.fn(), remove: vi.fn() };
    const appendChild = vi.fn();
    const createObjectURL = vi.fn((_blob: Blob) => 'blob:words');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('document', { createElement: vi.fn(() => link), body: { appendChild } });
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });

    await downloadWords(repo, 'known');

    const blob = createObjectURL.mock.calls[0]![0] as Blob;
    expect(blob.type).toBe('text/plain;charset=utf-8');
    expect(await blob.text()).toBe('밥');
    expect(link.download).toBe('korean-reader-known-words.txt');
    expect(link.href).toBe('blob:words');
    expect(appendChild).toHaveBeenCalledWith(link);
    expect(link.click).toHaveBeenCalledOnce();
    expect(link.remove).toHaveBeenCalledOnce();
    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:words');
  });

  it('propagates repository failures without starting a download', async () => {
    const repo = new InMemoryKnowledgeRepository();
    vi.spyOn(repo, 'listWords').mockRejectedValue(new Error('Storage unavailable'));
    await expect(downloadWords(repo, 'unknown')).rejects.toThrow('Storage unavailable');
  });
});
