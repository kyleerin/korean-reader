import { describe, expect, it } from 'vitest';
import type { AnalyzedEojeol } from '../../src/domain/model';
import { hasNewWords, isBoundAuxiliary, vocabularyMorphemes } from '../../src/domain/model';

function eojeol(surface: string, morphemes: AnalyzedEojeol['morphemes']): AnalyzedEojeol {
  return { surface, morphemes };
}

describe('isBoundAuxiliary', () => {
  it('treats passive 지 as a bound auxiliary', () => {
    expect(isBoundAuxiliary({ surface: '지', pos: 'VX' })).toBe(true);
  });

  it('does not treat main verbs as bound auxiliaries', () => {
    expect(isBoundAuxiliary({ surface: '보', pos: 'VX' })).toBe(false);
  });
});

describe('vocabularyMorphemes', () => {
  it('excludes bound VX from 만져지는', () => {
    const eo = eojeol('만져지는', [
      { surface: '만지', lemma: '만지다', pos: 'VV', type: 'CONTENT', definitions: [], state: 'LEARNING', eojeolContext: [] },
      { surface: '어', lemma: '어', pos: 'EC', type: 'ENDING', definitions: [], state: 'NEW', eojeolContext: [] },
      { surface: '지', lemma: '지다', pos: 'VX', type: 'CONTENT', definitions: [], state: 'NEW', eojeolContext: [] },
      { surface: '는', lemma: '는', pos: 'ETM', type: 'ENDING', definitions: [], state: 'NEW', eojeolContext: [] },
    ]);
    expect(vocabularyMorphemes(eo).map(m => m.surface)).toEqual(['만지']);
    expect(hasNewWords(eo)).toBe(false);
  });

  it('excludes mis-parsed 이민 inside 들이민다', () => {
    const eo = eojeol('들이민다.', [
      { surface: '들', lemma: '들이밀다', pos: 'VV', type: 'CONTENT', definitions: [], state: 'LEARNING', eojeolContext: [] },
      { surface: 'ㄹ', lemma: 'ㄹ', pos: 'ETM', type: 'ENDING', definitions: [], state: 'NEW', eojeolContext: [] },
      { surface: '이민', lemma: '이민', pos: 'NN', type: 'CONTENT', definitions: [], state: 'NEW', eojeolContext: [] },
      { surface: '이', lemma: '이', pos: 'VCP', type: 'PARTICLE', definitions: [], state: 'NEW', eojeolContext: [] },
      { surface: '다', lemma: '다', pos: 'EF', type: 'ENDING', definitions: [], state: 'NEW', eojeolContext: [] },
    ]);
    expect(vocabularyMorphemes(eo).map(m => m.lemma)).toEqual(['들이밀다']);
    expect(hasNewWords(eo)).toBe(false);
  });
});
