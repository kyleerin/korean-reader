import { describe, expect, it } from 'vitest';
import type { AnalyzedSentence } from '../../src/domain/model';
import { primaryGloss, translateSentence } from '../../src/pipeline/sentence-translator';

function sentence(
  surface: string,
  eojeols: AnalyzedSentence['eojeols'],
): AnalyzedSentence {
  return { surface, eojeols, translation: '' };
}

describe('primaryGloss', () => {
  it('takes the first sense before a comma', () => {
    expect(primaryGloss(['I, me'])).toBe('I');
  });

  it('strips the "to " prefix from verbs', () => {
    expect(primaryGloss(['to eat'])).toBe('eat');
  });

  it('prefers the shortest definition candidate', () => {
    expect(primaryGloss([
      'A very long explanatory definition that goes on and on',
      'hello',
    ])).toBe('hello');
  });

  it('truncates very long glosses', () => {
    const long = 'one two three four five six seven eight nine ten';
    expect(primaryGloss([long])).toBe('one two three four five six seven eight…');
  });

  it('returns undefined when there are no definitions', () => {
    expect(primaryGloss([])).toBeUndefined();
  });
});

describe('translateSentence', () => {
  it('joins content-word glosses in reading order', () => {
    const result = translateSentence(sentence('나는 밥을 먹었어요.', [
      {
        surface: '나는',
        morphemes: [{
          surface: '나', lemma: '나', pos: 'NP', type: 'CONTENT',
          definitions: ['I, me'], state: 'NEW', eojeolContext: [],
        }],
      },
      {
        surface: '밥을',
        morphemes: [{
          surface: '밥', lemma: '밥', pos: 'NN', type: 'CONTENT',
          definitions: ['cooked rice, meal'], state: 'NEW', eojeolContext: [],
        }],
      },
      {
        surface: '먹었어요.',
        morphemes: [{
          surface: '먹', lemma: '먹다', pos: 'VV', type: 'CONTENT',
          definitions: ['to eat'], state: 'NEW', eojeolContext: [],
        }],
      },
    ]));
    expect(result).toBe('I meal eat.');
  });

  it('returns an empty string when no glosses are available', () => {
    const result = translateSentence(sentence('안녕', [
      {
        surface: '안녕',
        morphemes: [{
          surface: '안녕', lemma: '안녕', pos: 'IC', type: 'CONTENT',
          definitions: [], state: 'NEW', eojeolContext: [],
        }],
      },
    ]));
    expect(result).toBe('');
  });
});
