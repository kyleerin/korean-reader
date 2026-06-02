import type { PartOfSpeech } from '../domain/model';

/**
 * Converts a morpheme surface form to its dictionary (lemma) form.
 *
 * MeCab-ko returns verb and adjective stems — we append "다" to produce the
 * infinitive form used as the dictionary key.
 *
 * Nouns, adverbs, and other uninflected forms are returned unchanged because
 * their surface form already matches the dictionary headword.
 */
export function reconstructLemma(surface: string, pos: PartOfSpeech): string {
  switch (pos) {
    case 'VV': case 'VA': case 'VX': case 'VCP': case 'VCN':
    case 'XSV': case 'XSA':
      return surface + '다';
    default:
      return surface;
  }
}
