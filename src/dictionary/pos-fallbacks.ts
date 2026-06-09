import type { PartOfSpeech } from '../domain/model';

/**
 * Alternate POS tags to try when the dictionary has no entry for the
 * analyzer's tag. NIKL entries often collapse analyzer distinctions such as
 * NNP→NN and VX→VV.
 */
export function dictionaryPosFallbacks(pos: PartOfSpeech): readonly PartOfSpeech[] {
  switch (pos) {
    case 'NNP': return ['NN'];
    case 'VX': return ['VV'];
    case 'XSV': return ['VV'];
    case 'XSA': return ['VA'];
    default: return [];
  }
}

export function dictionaryPosLookupOrder(pos: PartOfSpeech): readonly PartOfSpeech[] {
  return [pos, ...dictionaryPosFallbacks(pos)];
}
