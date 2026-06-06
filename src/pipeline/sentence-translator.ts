import { contentMorphemes, type AnalyzedSentence } from '../domain/model';

const MAX_GLOSS_WORDS = 8;

/** First concise English gloss from one or more dictionary definition strings. */
export function primaryGloss(definitions: readonly string[]): string | undefined {
  if (definitions.length === 0) return undefined;

  const candidates = definitions
    .flatMap(d => d.split(/[,;]/).map(s => s.trim()))
    .map(d => (d.startsWith('to ') ? d.slice(3) : d))
    .filter(Boolean);

  if (candidates.length === 0) return undefined;

  let gloss = candidates.reduce((shortest, next) =>
    next.length < shortest.length ? next : shortest,
  );

  const words = gloss.split(/\s+/);
  if (words.length > MAX_GLOSS_WORDS) {
    gloss = words.slice(0, MAX_GLOSS_WORDS).join(' ') + '…';
  }

  return gloss;
}

function endsWithSentencePunctuation(surface: string): boolean {
  return /[.!?。？！]$/.test(surface.trim());
}

/**
 * Build a line-level English gloss from bundled dictionary definitions.
 * This is not machine translation — it concatenates primary word senses in
 * reading order so learners can follow each sentence offline.
 */
export function translateSentence(sentence: AnalyzedSentence): string {
  const parts: string[] = [];
  for (const eojeol of sentence.eojeols) {
    for (const m of contentMorphemes(eojeol)) {
      const gloss = primaryGloss(m.definitions);
      if (gloss) parts.push(gloss);
    }
  }
  if (parts.length === 0) return '';

  let line = parts.join(' ');
  line = line.charAt(0).toUpperCase() + line.slice(1);
  if (endsWithSentencePunctuation(sentence.surface) && !/[.!?]$/.test(line)) {
    line += '.';
  }
  return line;
}
