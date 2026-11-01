import type { PartOfSpeech } from '../domain/model';

/**
 * Shared recovery rules for known garu-ko mis-parses.
 * Keep lemma candidates and vocabulary filters in sync from this module.
 */

export function bareEojeol(surface: string): string {
  return surface.replace(/[.!?。！？…,，]+$/u, '');
}

/** Eojeol-surface patterns where the analyzer often splits compound verbs incorrectly. */
export const SURFACE_COMPOUND_LEMMAS: readonly { pattern: RegExp; lemma: string }[] = [
  { pattern: /^들이밀/, lemma: '들이밀다' },
  { pattern: /^들이민/, lemma: '들이밀다' },
  { pattern: /^못(?:하|한|해|했|할|함|합)/, lemma: '못하다' },
];

export function surfaceCompoundLemmasFor(eojeolSurface: string): string[] {
  const bare = bareEojeol(eojeolSurface);
  return SURFACE_COMPOUND_LEMMAS
    .filter(({ pattern }) => pattern.test(bare))
    .map(({ lemma }) => lemma);
}

/** Nouns etc. that garu-ko invents inside mis-parsed compounds — not real vocabulary. */
export function isAnalyzerArtifactMorpheme(
  eojeolSurface: string,
  morpheme: { surface: string; pos: PartOfSpeech },
): boolean {
  const bare = bareEojeol(eojeolSurface);
  // 못한다기보단 → 못 + 하 + ㄴ다 + 기보 + 단; only 못하다 is vocabulary.
  if (/^못(?:하|한|해|했|할|함|합)/.test(bare) && morpheme.surface === '못' && morpheme.pos === 'MAG') {
    return true;
  }
  if (bare.endsWith('기보단') && (morpheme.pos === 'NN' || morpheme.pos === 'NNP')) {
    return morpheme.surface === '기보' || morpheme.surface === '단';
  }
  // 들이민다 → 들 + 이민(immigration); only the verb is vocabulary.
  if (morpheme.surface === '이민' && morpheme.pos === 'NN' && /^들이민|^들이밀/.test(bare)) {
    return true;
  }
  // 어딘가가 → 어디 + ㄴ + 가가; the fused suffix chunk is not a separate vocab item.
  if ((morpheme.pos === 'NN' || morpheme.pos === 'NNP') && /^어딘가/.test(bare)) {
    const suffix = bare.slice('어딘'.length);
    return morpheme.surface.startsWith('가') && suffix.startsWith(morpheme.surface);
  }
  return false;
}

/** Approximate eojeol surface from analyzer tokens when the parent surface is unavailable. */
export function approximateEojeolSurface(
  context: readonly { surface: string }[],
): string {
  return context.map(m => m.surface).join('');
}

export function contextHasAnalyzerArtifacts(
  context: readonly { surface: string; pos: PartOfSpeech }[],
  eojeolSurface?: string,
): boolean {
  if (context.length === 0) return false;
  const surface = eojeolSurface ?? approximateEojeolSurface(context);
  return context.some(m => isAnalyzerArtifactMorpheme(surface, m));
}
