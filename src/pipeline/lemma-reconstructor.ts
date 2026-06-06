import type { PartOfSpeech } from '../domain/model';

const PREDICATE_POS = new Set<PartOfSpeech>([
  'VV', 'VA', 'VX', 'VCP', 'VCN', 'XSV', 'XSA',
]);

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
  if (PREDICATE_POS.has(pos)) return surface + '다';
  return surface;
}

/**
 * Lemma forms to try when looking up a predicate stem.
 * The analyzer sometimes emits an epenthetic 으 (e.g. 날으 for 날다); try the
 * primary form first, then a stem with trailing 으 removed.
 */
export function lemmaCandidates(surface: string, pos: PartOfSpeech): string[] {
  const primary = reconstructLemma(surface, pos);
  if (!PREDICATE_POS.has(pos)) return [primary];

  const candidates = [primary];
  if (surface.endsWith('으') && surface.length > 1) {
    const alternate = reconstructLemma(surface.slice(0, -1), pos);
    if (alternate !== primary) candidates.push(alternate);
  }
  return candidates;
}
