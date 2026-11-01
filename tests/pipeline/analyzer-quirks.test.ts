import { describe, expect, it } from 'vitest';
import {
  contextHasAnalyzerArtifacts,
  isAnalyzerArtifactMorpheme,
  surfaceCompoundLemmasFor,
} from '../../src/pipeline/analyzer-quirks';

describe('analyzer-quirks', () => {
  it('recovers compound lemmas from eojeol surfaces', () => {
    expect(surfaceCompoundLemmasFor('들이민다')).toEqual(['들이밀다']);
    expect(surfaceCompoundLemmasFor('못한다기보단')).toEqual(['못하다']);
    expect(surfaceCompoundLemmasFor('먹었어요')).toEqual([]);
  });

  it('flags known artifact morphemes', () => {
    expect(isAnalyzerArtifactMorpheme('들이민다', { surface: '이민', pos: 'NN' })).toBe(true);
    expect(isAnalyzerArtifactMorpheme('못한다기보단', { surface: '기보', pos: 'NN' })).toBe(true);
    expect(isAnalyzerArtifactMorpheme('먹었어요', { surface: '먹', pos: 'VV' })).toBe(false);
  });

  it('detects artifacts from eojeol context when surface is approximate', () => {
    expect(contextHasAnalyzerArtifacts([
      { surface: '들', pos: 'VV' },
      { surface: '이민', pos: 'NN' },
      { surface: '다', pos: 'EF' },
    ], '들이민다')).toBe(true);
  });
});
