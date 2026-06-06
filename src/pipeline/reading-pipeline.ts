import type { DictionaryRepository } from '../dictionary/repository';
import type { AnalyzedEojeol, AnalyzedMorpheme, AnalyzedParagraph, AnalyzedSentence, AnalyzedText, Morpheme } from '../domain/model';
import type { KnowledgeRepository } from '../knowledge/repository';
import type { EojeolMorphemes, MorphologicalAnalyzer } from './analyzer';
import { lemmaCandidates } from './lemma-reconstructor';
import { classifyMorpheme } from './morpheme-classifier';
import { segmentParagraphs } from './tokenizer';
import { translateSentence } from './sentence-translator';

/**
 * Orchestrates the full reading pipeline:
 *   raw text → sentence segmentation → morphological analysis → lemma lookup
 *   → dictionary enrichment → knowledge-state annotation → AnalyzedText
 *
 * Call analyze() once per page/screen; cache the result in the local DB via
 * token_cache so re-opening a text is instant.
 */
export class ReadingPipeline {
  constructor(
    private readonly analyzer: MorphologicalAnalyzer,
    private readonly dictionary: DictionaryRepository,
    private readonly knowledge: KnowledgeRepository,
  ) {}

  async analyze(text: string): Promise<AnalyzedText> {
    const paragraphs = await Promise.all(
      segmentParagraphs(text).map(s => this.analyzeParagraph(s)),
    );
    const sentences = paragraphs.flatMap(p => p.sentences);
    return { paragraphs, sentences };
  }

  private async analyzeParagraph(sentences: string[]): Promise<AnalyzedParagraph> {
    const analyzed = await Promise.all(sentences.map(s => this.analyzeSentence(s)));
    return { sentences: analyzed };
  }

  private async analyzeSentence(sentence: string): Promise<AnalyzedSentence> {
    const eojeolMorphemesList = await this.analyzer.analyze(sentence);
    const eojeols = await Promise.all(eojeolMorphemesList.map(e => this.analyzeEojeol(e)));
    const analyzed: AnalyzedSentence = { surface: sentence, eojeols, translation: '' };
    return { ...analyzed, translation: translateSentence(analyzed) };
  }

  private async analyzeEojeol(raw: EojeolMorphemes): Promise<AnalyzedEojeol> {
    const morphemes = await Promise.all(
      raw.morphemes.map(m => this.analyzeMorpheme(m, raw.morphemes as Morpheme[]))
    );
    return { surface: raw.surface, morphemes };
  }

  private async analyzeMorpheme(morpheme: Morpheme, context: Morpheme[]): Promise<AnalyzedMorpheme> {
    const type = classifyMorpheme(morpheme.pos);

    if (type === 'CONTENT') {
      const candidates = lemmaCandidates(morpheme.surface, morpheme.pos);
      let lemma = candidates[0]!;
      let definitions: readonly string[] = [];

      for (const candidate of candidates) {
        const posEntries = (await this.dictionary.lookupAll(candidate))
          .filter(e => e.pos === morpheme.pos);
        if (posEntries.length > 0) {
          lemma = candidate;
          definitions = posEntries.flatMap(e => e.definitions);
          break;
        }
      }

      const state = await this.knowledge.getState(lemma, morpheme.pos);
      return {
        surface: morpheme.surface,
        lemma,
        pos: morpheme.pos,
        type,
        definitions,
        state,
        eojeolContext: context,
      };
    }

    return {
      surface: morpheme.surface,
      lemma: morpheme.surface,
      pos: morpheme.pos,
      type,
      definitions: [],
      state: 'NEW',
      eojeolContext: [],
    };
  }
}
