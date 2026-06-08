import { dictionaryPosLookupOrder } from '../dictionary/pos-fallbacks';
import type { DictionaryRepository } from '../dictionary/repository';
import type { AnalyzedEojeol, AnalyzedMorpheme, AnalyzedParagraph, AnalyzedSentence, AnalyzedText, Morpheme } from '../domain/model';
import type { KnowledgeRepository } from '../knowledge/repository';
import type { EojeolMorphemes, MorphologicalAnalyzer } from './analyzer';
import { lemmaCandidates, nativeNumeralNrLemma, surfaceLemmaCandidates } from './lemma-reconstructor';
import { classifyMorpheme } from './morpheme-classifier';
import { segmentParagraphs } from './tokenizer';

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
    return { surface: sentence, eojeols };
  }

  private async analyzeEojeol(raw: EojeolMorphemes): Promise<AnalyzedEojeol> {
    const morphemes = await Promise.all(
      raw.morphemes.map(m => this.analyzeMorpheme(m, raw.morphemes as Morpheme[], raw.surface))
    );
    return { surface: raw.surface, morphemes };
  }

  private async analyzeMorpheme(morpheme: Morpheme, context: Morpheme[], eojeolSurface: string): Promise<AnalyzedMorpheme> {
    const type = classifyMorpheme(morpheme.pos);

    if (type === 'CONTENT') {
      const candidates = [
        ...surfaceLemmaCandidates(eojeolSurface, morpheme.surface, morpheme.pos, context),
        ...lemmaCandidates(morpheme.surface, morpheme.pos),
      ].filter((lemma, index, all) => all.indexOf(lemma) === index);
      let lemma = candidates[0]!;
      let definitions: readonly string[] = [];
      let examples: readonly string[] = [];

      lookup:
      for (const candidate of candidates) {
        const nrLemma = nativeNumeralNrLemma(morpheme.surface, morpheme.pos);
        const posOrder = nrLemma && candidate === nrLemma
          ? (['NR', morpheme.pos] as const)
          : dictionaryPosLookupOrder(morpheme.pos);

        for (const pos of posOrder) {
          const posEntries = (await this.dictionary.lookupAll(candidate))
            .filter(e => e.pos === pos);
          if (posEntries.length > 0) {
            lemma = candidate === nrLemma ? morpheme.surface : candidate;
            definitions = posEntries.flatMap(e => e.definitions);
            examples = posEntries.flatMap(e => e.examples ?? []);
            break lookup;
          }
        }
      }

      const state = await this.knowledge.getState(lemma, morpheme.pos);
      return {
        surface: morpheme.surface,
        lemma,
        pos: morpheme.pos,
        type,
        definitions,
        examples: examples.length > 0 ? examples : undefined,
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
