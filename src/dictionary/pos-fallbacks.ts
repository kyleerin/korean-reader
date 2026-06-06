import type { PartOfSpeech } from '../domain/model';

/**
 * Alternate POS tags to try when the dictionary has no entry for the
 * analyzer's tag. NIKL entries use VV/VA; garu-ko often tags auxiliaries as VX.
 */
export function dictionaryPosFallbacks(pos: PartOfSpeech): readonly PartOfSpeech[] {
  switch (pos) {
    case 'VX': return ['VV'];
    case 'XSV': return ['VV'];
    case 'XSA': return ['VA'];
    default: return [];
  }
}

export function dictionaryPosLookupOrder(pos: PartOfSpeech): readonly PartOfSpeech[] {
  return [pos, ...dictionaryPosFallbacks(pos)];
}
