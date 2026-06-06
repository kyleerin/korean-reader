export type KnowledgeState = 'NEW' | 'LEARNING' | 'KNOWN' | 'IGNORED';

export type PartOfSpeech =
  // Nouns
  | 'NN' | 'NNP' | 'NNB' | 'NP' | 'NR'
  // Predicates
  | 'VV' | 'VA' | 'VX' | 'VCP' | 'VCN'
  // Modifiers & interjection
  | 'MM' | 'MAG' | 'MAJ' | 'IC'
  // Particles (조사)
  | 'JKS' | 'JKC' | 'JKG' | 'JKO' | 'JKB' | 'JKV' | 'JKQ' | 'JX' | 'JC'
  // Endings (어미)
  | 'EP' | 'EF' | 'EC' | 'ETN' | 'ETM'
  // Affixes (접사)
  | 'XPN' | 'XSN' | 'XSV' | 'XSA' | 'XR'
  // Symbols & foreign
  | 'SF' | 'SP' | 'SS' | 'SE' | 'SO' | 'SW' | 'SL' | 'SH' | 'SN'
  | 'UNKNOWN';

export type MorphemeType =
  | 'CONTENT'     // noun / verb stem / adjective / adverb — tracked as vocab
  | 'PARTICLE'    // 조사 — grammatical particle
  | 'ENDING'      // 어미 — verb ending (tense / mood / politeness)
  | 'AFFIX'       // 접사 — derivational affix
  | 'PUNCTUATION'
  | 'FOREIGN'     // SL (foreign word), SH (Chinese char), SN (number)
  | 'UNKNOWN';

export interface Morpheme {
  readonly surface: string;
  readonly pos: PartOfSpeech;
}

export interface DictionaryEntry {
  readonly lemma: string;
  readonly pos: PartOfSpeech;
  readonly definitions: readonly string[];
  readonly examples?: readonly string[];
  readonly frequencyRank?: number;
}

export interface AnalyzedMorpheme {
  readonly surface: string;
  readonly lemma: string;
  readonly pos: PartOfSpeech;
  readonly type: MorphemeType;
  readonly definitions: readonly string[];
  readonly state: KnowledgeState;
  /** All morphemes in the parent eojeol — used for the tap-time conjugation explainer. */
  readonly eojeolContext: readonly Morpheme[];
}

export interface AnalyzedEojeol {
  readonly surface: string;
  readonly morphemes: readonly AnalyzedMorpheme[];
}

export interface AnalyzedSentence {
  /** Original sentence string before analysis. */
  readonly surface: string;
  readonly eojeols: readonly AnalyzedEojeol[];
}

export interface AnalyzedParagraph {
  readonly sentences: readonly AnalyzedSentence[];
}

export interface AnalyzedText {
  readonly paragraphs: readonly AnalyzedParagraph[];
  /** Flattened view across all paragraphs — convenience for stats and lookups. */
  readonly sentences: readonly AnalyzedSentence[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const KNOWN_TAGS = new Set<string>([
  'NN','NNP','NNB','NP','NR',
  'VV','VA','VX','VCP','VCN',
  'MM','MAG','MAJ','IC',
  'JKS','JKC','JKG','JKO','JKB','JKV','JKQ','JX','JC',
  'EP','EF','EC','ETN','ETM',
  'XPN','XSN','XSV','XSA','XR',
  'SF','SP','SS','SE','SO','SW','SL','SH','SN',
]);

export function posFromTag(tag: string): PartOfSpeech {
  return KNOWN_TAGS.has(tag) ? (tag as PartOfSpeech) : 'UNKNOWN';
}

export function contentMorphemes(eojeol: AnalyzedEojeol): AnalyzedMorpheme[] {
  return eojeol.morphemes.filter(m => m.type === 'CONTENT');
}

/** Bound VX auxiliaries (지, 되, …) fused into a verb — not separate vocabulary. */
const BOUND_AUXILIARY_VX = new Set(['지', '되', '주', '시', '겠', '못', '안', '않']);

export function isBoundAuxiliary(m: { surface: string; pos: PartOfSpeech }): boolean {
  return m.pos === 'VX' && BOUND_AUXILIARY_VX.has(m.surface);
}

/** Content morphemes that represent trackable vocabulary (excludes bound auxiliaries). */
export function vocabularyMorphemes(eojeol: AnalyzedEojeol): AnalyzedMorpheme[] {
  return eojeol.morphemes.filter(m => m.type === 'CONTENT' && !isBoundAuxiliary(m));
}

export function hasNewWords(eojeol: AnalyzedEojeol): boolean {
  return vocabularyMorphemes(eojeol).some(m => m.state === 'NEW');
}

export function isFullyKnown(eojeol: AnalyzedEojeol): boolean {
  const vocab = vocabularyMorphemes(eojeol);
  return vocab.length === 0 || vocab.every(m => m.state === 'KNOWN' || m.state === 'IGNORED');
}

export function totalEojeols(text: AnalyzedText): number {
  return text.sentences.reduce((sum, s) => sum + s.eojeols.length, 0);
}

export function uniqueContentWords(text: AnalyzedText): number {
  const seen = new Set<string>();
  for (const sentence of text.sentences) {
    for (const eojeol of sentence.eojeols) {
      for (const m of eojeol.morphemes) {
        if (m.type === 'CONTENT') seen.add(`${m.lemma}\x00${m.pos}`);
      }
    }
  }
  return seen.size;
}
