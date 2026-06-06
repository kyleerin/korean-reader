import { describe, expect, it } from 'vitest';
import { lemmaCandidates, reconstructLemma } from '../../src/pipeline/lemma-reconstructor';

describe('reconstructLemma', () => {
  it('appends 다 to verb stems', () => {
    expect(reconstructLemma('먹', 'VV')).toBe('먹다');
    expect(reconstructLemma('가', 'VV')).toBe('가다');
    expect(reconstructLemma('오', 'VV')).toBe('오다');
  });

  it('appends 다 to adjective stems', () => {
    expect(reconstructLemma('아름답', 'VA')).toBe('아름답다');
    expect(reconstructLemma('크', 'VA')).toBe('크다');
    expect(reconstructLemma('좋', 'VA')).toBe('좋다');
  });

  it('appends 다 to auxiliary predicates', () => {
    expect(reconstructLemma('싶', 'VX')).toBe('싶다');
    expect(reconstructLemma('있', 'VX')).toBe('있다');
  });

  it('appends 다 to copulas', () => {
    expect(reconstructLemma('이', 'VCP')).toBe('이다');
    expect(reconstructLemma('아니', 'VCN')).toBe('아니다');
  });

  it('appends 다 to verbal and adjectival derivational suffixes', () => {
    expect(reconstructLemma('하', 'XSV')).toBe('하다');
    expect(reconstructLemma('스럽', 'XSA')).toBe('스럽다');
  });

  it('returns nouns unchanged', () => {
    expect(reconstructLemma('학생', 'NN')).toBe('학생');
    expect(reconstructLemma('한국', 'NNP')).toBe('한국');
    expect(reconstructLemma('나', 'NP')).toBe('나');
  });

  it('returns adverbs unchanged', () => {
    expect(reconstructLemma('빨리', 'MAG')).toBe('빨리');
    expect(reconstructLemma('그리고', 'MAJ')).toBe('그리고');
  });
});

describe('lemmaCandidates', () => {
  it('includes an alternate when the stem ends with epenthetic 으', () => {
    expect(lemmaCandidates('날으', 'VV')).toEqual(['날으다', '날다']);
  });

  it('lists the primary lemma before the 으-stripped alternate', () => {
    expect(lemmaCandidates('모으', 'VV')).toEqual(['모으다', '모다']);
  });

  it('returns a single candidate for nouns', () => {
    expect(lemmaCandidates('학생', 'NN')).toEqual(['학생']);
  });
});
