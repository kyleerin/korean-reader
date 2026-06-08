import type { AnalyzedEojeol, AnalyzedSentence, AnalyzedText, AnalyzedMorpheme } from '../domain/model';
import { vocabularyMorphemes } from '../domain/model';

export interface SelectionEojeol {
  eojeol: AnalyzedEojeol;
  vocabulary: AnalyzedMorpheme[];
}

export interface TextSelection {
  selectedText: string;
  sentence: AnalyzedSentence;
  eojeols: SelectionEojeol[];
}

function compact(s: string): string {
  return s.replace(/\s+/g, '').replace(/[.!?。！？…]+$/u, '');
}

function normalizeSelection(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}

function sentenceContains(sentence: string, selection: string): boolean {
  if (sentence.includes(selection)) return true;
  return compact(sentence).includes(compact(selection));
}

function eojeolOverlaps(eojeolSurface: string, selection: string): boolean {
  const bare = eojeolSurface.replace(/[.!?。！？…]+$/u, '');
  const sel = compact(selection);
  const eo = compact(bare);
  if (!eo) return false;
  if (sel.includes(eo) || eo.includes(sel)) return true;
  if (selection.includes(bare) || bare.includes(selection.trim())) return true;
  return false;
}

export function resolveTextSelection(
  analyzed: AnalyzedText,
  rawSelection: string,
): TextSelection | null {
  const selectedText = normalizeSelection(rawSelection);
  if (!selectedText) return null;

  for (const sentence of analyzed.sentences) {
    if (!sentenceContains(sentence.surface, selectedText)) continue;

    let eojeols = sentence.eojeols
      .filter(e => eojeolOverlaps(e.surface, selectedText))
      .map(eojeol => ({ eojeol, vocabulary: [...vocabularyMorphemes(eojeol)] }));

    if (eojeols.length === 0 && compact(sentence.surface) === compact(selectedText)) {
      eojeols = sentence.eojeols.map(eojeol => ({
        eojeol,
        vocabulary: [...vocabularyMorphemes(eojeol)],
      }));
    }

    if (eojeols.length > 0) {
      return { selectedText, sentence, eojeols };
    }
  }

  return null;
}

/** Unique vocabulary entries across the selection, preserving order. */
export function selectionVocabulary(selection: TextSelection): AnalyzedMorpheme[] {
  const seen = new Set<string>();
  const result: AnalyzedMorpheme[] = [];
  for (const { vocabulary } of selection.eojeols) {
    for (const m of vocabulary) {
      const key = `${m.lemma}\x00${m.pos}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(m);
    }
  }
  return result;
}
