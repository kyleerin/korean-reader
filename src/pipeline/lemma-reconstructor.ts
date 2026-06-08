import type { PartOfSpeech } from '../domain/model';

/** Native-Korean numeral determiners (MM) whose count-noun form (NR) is in the dictionary. */
const NATIVE_NUMERAL_NR_LEMMA: Readonly<Record<string, string>> = {
  '두': '둘',
};

const PREDICATE_POS = new Set<PartOfSpeech>([
  'VV', 'VA', 'VX', 'VCP', 'VCN', 'XSV', 'XSA',
]);

/** Eojeol-surface patterns where the analyzer often splits compound verbs incorrectly. */
const SURFACE_COMPOUND_LEMMAS: { pattern: RegExp; lemma: string }[] = [
  { pattern: /^들이밀/, lemma: '들이밀다' },
  { pattern: /^들이민/, lemma: '들이밀다' },
];

function bareEojeol(surface: string): string {
  return surface.replace(/[.!?…]+$/u, '');
}

export function isHeadPredicate(surface: string, pos: PartOfSpeech, context: { surface: string; pos: PartOfSpeech }[]): boolean {
  if (!PREDICATE_POS.has(pos)) return false;
  const first = context.find(m => PREDICATE_POS.has(m.pos));
  return first?.surface === surface && first.pos === pos;
}

/**
 * Recover dictionary lemmas from the full eojeol when MeCab/garu-ko splits compound
 * predicates wrongly (e.g. 들이민다 → 들 + 이민).
 */
export function surfaceLemmaCandidates(
  eojeolSurface: string,
  morphemeSurface: string,
  pos: PartOfSpeech,
  context: { surface: string; pos: PartOfSpeech }[],
): string[] {
  if (!isHeadPredicate(morphemeSurface, pos, context)) return [];

  const bare = bareEojeol(eojeolSurface);
  const candidates: string[] = [];
  for (const { pattern, lemma } of SURFACE_COMPOUND_LEMMAS) {
    if (pattern.test(bare)) candidates.push(lemma);
  }
  return candidates;
}

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
  const candidates = [primary];

  const nrLemma = nativeNumeralNrLemma(surface, pos);
  if (nrLemma && nrLemma !== primary) candidates.push(nrLemma);

  if (!PREDICATE_POS.has(pos)) return candidates;

  if (surface.endsWith('으') && surface.length > 1) {
    const alternate = reconstructLemma(surface.slice(0, -1), pos);
    if (alternate !== primary) candidates.push(alternate);
  }
  return candidates;
}

export function nativeNumeralNrLemma(surface: string, pos: PartOfSpeech): string | undefined {
  if (pos !== 'MM') return undefined;
  return NATIVE_NUMERAL_NR_LEMMA[surface];
}
