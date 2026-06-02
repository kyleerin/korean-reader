import { describe, expect, it } from 'vitest';
import { classifyMorpheme } from '../../src/pipeline/morpheme-classifier';

describe('classifyMorpheme', () => {
  it('classifies nouns as CONTENT', () => {
    expect(classifyMorpheme('NN')).toBe('CONTENT');
    expect(classifyMorpheme('NNP')).toBe('CONTENT');
    expect(classifyMorpheme('NNB')).toBe('CONTENT');
    expect(classifyMorpheme('NP')).toBe('CONTENT');
    expect(classifyMorpheme('NR')).toBe('CONTENT');
  });

  it('classifies predicates as CONTENT', () => {
    expect(classifyMorpheme('VV')).toBe('CONTENT');
    expect(classifyMorpheme('VA')).toBe('CONTENT');
    expect(classifyMorpheme('VX')).toBe('CONTENT');
    expect(classifyMorpheme('VCP')).toBe('CONTENT');
    expect(classifyMorpheme('VCN')).toBe('CONTENT');
  });

  it('classifies adverbs and determiners as CONTENT', () => {
    expect(classifyMorpheme('MAG')).toBe('CONTENT');
    expect(classifyMorpheme('MAJ')).toBe('CONTENT');
    expect(classifyMorpheme('MM')).toBe('CONTENT');
  });

  it('classifies particles as PARTICLE', () => {
    expect(classifyMorpheme('JKS')).toBe('PARTICLE');
    expect(classifyMorpheme('JKO')).toBe('PARTICLE');
    expect(classifyMorpheme('JX')).toBe('PARTICLE');
    expect(classifyMorpheme('JC')).toBe('PARTICLE');
  });

  it('classifies verb endings as ENDING', () => {
    expect(classifyMorpheme('EF')).toBe('ENDING');
    expect(classifyMorpheme('EP')).toBe('ENDING');
    expect(classifyMorpheme('EC')).toBe('ENDING');
    expect(classifyMorpheme('ETN')).toBe('ENDING');
    expect(classifyMorpheme('ETM')).toBe('ENDING');
  });

  it('classifies derivational affixes as AFFIX', () => {
    expect(classifyMorpheme('XSV')).toBe('AFFIX');
    expect(classifyMorpheme('XSA')).toBe('AFFIX');
    expect(classifyMorpheme('XSN')).toBe('AFFIX');
    expect(classifyMorpheme('XPN')).toBe('AFFIX');
  });

  it('classifies punctuation as PUNCTUATION', () => {
    expect(classifyMorpheme('SF')).toBe('PUNCTUATION');
    expect(classifyMorpheme('SP')).toBe('PUNCTUATION');
    expect(classifyMorpheme('SS')).toBe('PUNCTUATION');
  });

  it('classifies foreign symbols as FOREIGN', () => {
    expect(classifyMorpheme('SL')).toBe('FOREIGN');
    expect(classifyMorpheme('SH')).toBe('FOREIGN');
    expect(classifyMorpheme('SN')).toBe('FOREIGN');
  });
});
