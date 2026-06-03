const SENTENCE_ENDERS = new Set(['.', '!', '?', '。', '？', '！']);
const WHITESPACE = /\s+/;

/**
 * Splits raw Korean text into sentences for the morphological analyzer.
 * Sentence segmentation is punctuation-based. The analyzer is then called
 * once per sentence so it can use intra-sentence context.
 */
export function segmentSentences(text: string): string[] {
  const normalized = text.trim();
  if (!normalized) return [];

  const result: string[] = [];
  let start = 0;
  let i = 0;

  while (i < normalized.length) {
    const ch = normalized[i]!;

    if (SENTENCE_ENDERS.has(ch)) {
      // Swallow trailing ellipsis dots so "..." doesn't produce empty sentences.
      let end = i + 1;
      while (end < normalized.length && normalized[end] === '.') end++;
      const sentence = normalized.slice(start, end).trim();
      if (sentence) result.push(sentence);
      // Skip whitespace between sentences.
      while (end < normalized.length && normalized[end] === ' ') end++;
      start = end;
      i = end;
    } else if (ch === '\n') {
      const sentence = normalized.slice(start, i).trim();
      if (sentence) result.push(sentence);
      start = i + 1;
      i = start;
    } else {
      i++;
    }
  }

  if (start < normalized.length) {
    const remaining = normalized.slice(start).trim();
    if (remaining) result.push(remaining);
  }

  return result;
}

/**
 * Splits raw text into paragraphs, each a list of sentences, so the reader can
 * preserve the original block structure instead of running everything together.
 *
 * Paragraphs are delimited by blank lines when present; if the text has no blank
 * lines but does use single newlines, each line becomes its own paragraph so the
 * pasted structure is still preserved. Empty paragraphs are dropped.
 */
export function segmentParagraphs(text: string): string[][] {
  const splitter = /\n[ \t]*\n/.test(text) ? /\n[ \t]*\n+/ : /\n+/;
  return text
    .split(splitter)
    .map(block => segmentSentences(block))
    .filter(sentences => sentences.length > 0);
}

export function splitEojeols(text: string): string[] {
  return text.split(WHITESPACE).filter(t => t.length > 0);
}
