import { describe, expect, it } from 'vitest';
import { dictionaryPosFallbacks, dictionaryPosLookupOrder } from '../../src/dictionary/pos-fallbacks';

describe('dictionaryPosFallbacks', () => {
  it('maps auxiliary verbs to VV', () => {
    expect(dictionaryPosFallbacks('VX')).toEqual(['VV']);
  });

  it('maps proper nouns to common noun entries', () => {
    expect(dictionaryPosFallbacks('NNP')).toEqual(['NN']);
  });

  it('returns empty for nouns', () => {
    expect(dictionaryPosFallbacks('NN')).toEqual([]);
  });
});

describe('dictionaryPosLookupOrder', () => {
  it('tries the analyzer POS before fallbacks', () => {
    expect(dictionaryPosLookupOrder('VX')).toEqual(['VX', 'VV']);
  });

  it('tries proper noun tags before common noun fallback', () => {
    expect(dictionaryPosLookupOrder('NNP')).toEqual(['NNP', 'NN']);
  });
});
