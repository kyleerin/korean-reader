import { describe, expect, it } from 'vitest';
import type { AnalyzedEojeol, AnalyzedMorpheme, AnalyzedText, KnowledgeState, PartOfSpeech } from '../../src/domain/model';
import { hasNewWords, isBoundAuxiliary, isFullyKnown, newVocabularyMorphemes, vocabularyMorphemes } from '../../src/domain/model';

function eojeol(surface: string, morphemes: AnalyzedEojeol['morphemes']): AnalyzedEojeol {
  return { surface, morphemes };
}

function content(surface: string, lemma: string, pos: PartOfSpeech, state: KnowledgeState): AnalyzedMorpheme {
  return { surface, lemma, pos, type: 'CONTENT', definitions: [], state, eojeolContext: [] };
}

function text(eojeols: AnalyzedEojeol[]): AnalyzedText {
  const sentence = { surface: eojeols.map(e => e.surface).join(' '), eojeols };
  return { paragraphs: [{ sentences: [sentence] }], sentences: [sentence] };
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

  it('excludes analyzer suffix artifacts in 어딘가가', () => {
    const eo = eojeol('어딘가가', [
      { surface: '어디', lemma: '어디', pos: 'NP', type: 'CONTENT', definitions: [], state: 'KNOWN', eojeolContext: [] },
      { surface: 'ㄴ', lemma: 'ㄴ', pos: 'JX', type: 'PARTICLE', definitions: [], state: 'NEW', eojeolContext: [] },
      { surface: '가가', lemma: '가가', pos: 'NNP', type: 'CONTENT', definitions: [], state: 'NEW', eojeolContext: [] },
    ]);
    expect(vocabularyMorphemes(eo).map(m => m.lemma)).toEqual(['어디']);
    expect(hasNewWords(eo)).toBe(false);
  });
});

describe('newVocabularyMorphemes', () => {
  it('returns unique NEW vocabulary from the text', () => {
    const result = newVocabularyMorphemes(text([
      eojeol('나는', [
        content('나', '나', 'NP', 'NEW'),
        { surface: '는', lemma: '는', pos: 'JX', type: 'PARTICLE', definitions: [], state: 'NEW', eojeolContext: [] },
      ]),
      eojeol('나도', [
        content('나', '나', 'NP', 'NEW'),
        { surface: '도', lemma: '도', pos: 'JX', type: 'PARTICLE', definitions: [], state: 'NEW', eojeolContext: [] },
      ]),
      eojeol('먹어요', [
        content('먹', '먹다', 'VV', 'NEW'),
        { surface: '어요', lemma: '어요', pos: 'EF', type: 'ENDING', definitions: [], state: 'NEW', eojeolContext: [] },
      ]),
    ]));

    expect(result.map(m => [m.lemma, m.pos])).toEqual([
      ['나', 'NP'],
      ['먹다', 'VV'],
    ]);
  });

  it('excludes vocabulary that is not blue/new', () => {
    const result = newVocabularyMorphemes(text([
      eojeol('밥을', [
        content('밥', '밥', 'NN', 'KNOWN'),
        { surface: '을', lemma: '을', pos: 'JKO', type: 'PARTICLE', definitions: [], state: 'NEW', eojeolContext: [] },
      ]),
      eojeol('공부합니다', [
        content('공부', '공부', 'NN', 'LEARNING'),
        content('하', '하다', 'VV', 'IGNORED'),
      ]),
    ]));

    expect(result).toEqual([]);
  });
});

describe('eojeol knowledge state helpers', () => {
  it('can use live knowledge state instead of stale analyzed state', () => {
    const eo = eojeol('한국어를', [
      content('한국어', '한국어', 'NN', 'NEW'),
      { surface: '를', lemma: '를', pos: 'JKO', type: 'PARTICLE', definitions: [], state: 'NEW', eojeolContext: [] },
    ]);
    const liveState = (morpheme: AnalyzedMorpheme) =>
      morpheme.lemma === '한국어' && morpheme.pos === 'NN' ? 'KNOWN' : morpheme.state;

    expect(hasNewWords(eo)).toBe(true);
    expect(hasNewWords(eo, liveState)).toBe(false);
    expect(isFullyKnown(eo, liveState)).toBe(true);
  });
});
