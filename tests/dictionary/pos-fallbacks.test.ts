import { describe, expect, it } from 'vitest';
import { dictionaryPosFallbacks, dictionaryPosLookupOrder } from '../../src/dictionary/pos-fallbacks';

describe('dictionaryPosFallbacks', () => {
  it('maps auxiliary verbs to VV', () => {
    expect(dictionaryPosFallbacks('VX')).toEqual(['VV']);
  });

  it('returns empty for nouns', () => {
    expect(dictionaryPosFallbacks('NN')).toEqual([]);
  });
});

describe('dictionaryPosLookupOrder', () => {
  it('tries the analyzer POS before fallbacks', () => {
    expect(dictionaryPosLookupOrder('VX')).toEqual(['VX', 'VV']);
  });
});
