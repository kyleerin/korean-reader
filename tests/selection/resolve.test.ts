import { describe, expect, it } from 'vitest';
import type { AnalyzedSentence, AnalyzedText } from '../../src/domain/model';
import { resolveTextSelection, selectionVocabulary } from '../../src/selection/resolve';

function sentence(surface: string, eojeols: AnalyzedSentence['eojeols']): AnalyzedSentence {
  return { surface, eojeols };
}

const analyzed: AnalyzedText = {
  paragraphs: [],
  sentences: [
    sentence('천천히 숨을 들이쉬며 봉투 안으로 코를 들이민다.', [
      {
        surface: '천천히',
        morphemes: [{ surface: '천천히', lemma: '천천히', pos: 'MAG', type: 'CONTENT', definitions: ['slowly'], examples: ['천천히 걷다.'], state: 'NEW', eojeolContext: [] }],
      },
      {
        surface: '숨을',
        morphemes: [
          { surface: '숨', lemma: '숨', pos: 'NN', type: 'CONTENT', definitions: ['breath'], examples: ['숨을 쉬다.'], state: 'NEW', eojeolContext: [] },
          { surface: '을', lemma: '을', pos: 'JKO', type: 'PARTICLE', definitions: [], state: 'NEW', eojeolContext: [] },
        ],
      },
      {
        surface: '들이쉬며',
        morphemes: [
          { surface: '들이쉬', lemma: '들이쉬다', pos: 'VV', type: 'CONTENT', definitions: ['to inhale'], examples: ['숨을 들이쉬다.'], state: 'NEW', eojeolContext: [] },
          { surface: '며', lemma: '며', pos: 'EC', type: 'ENDING', definitions: [], state: 'NEW', eojeolContext: [] },
        ],
      },
    ]),
  ],
};

describe('resolveTextSelection', () => {
  it('resolves a multi-word selection to overlapping eojeols', () => {
    const result = resolveTextSelection(analyzed, '숨을 들이쉬며');
    expect(result?.eojeols.map(e => e.eojeol.surface)).toEqual(['숨을', '들이쉬며']);
  });

  it('collects vocabulary with examples', () => {
    const result = resolveTextSelection(analyzed, '들이쉬며');
    expect(result).not.toBeNull();
    const vocab = selectionVocabulary(result!);
    expect(vocab[0]?.lemma).toBe('들이쉬다');
    expect(vocab[0]?.examples?.[0]).toContain('들이쉬');
  });
});
