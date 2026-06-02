import type { DictionaryRepository } from '../dictionary/repository';
import type { AnalyzedEojeol, AnalyzedMorpheme, AnalyzedSentence, AnalyzedText, Morpheme } from '../domain/model';
import type { KnowledgeRepository } from '../knowledge/repository';
import type { EojeolMorphemes, MorphologicalAnalyzer } from './analyzer';
import { reconstructLemma } from './lemma-reconstructor';
import { classifyMorpheme } from './morpheme-classifier';
import { segmentSentences } from './tokenizer';

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
    const sentences = segmentSentences(text);
    const analyzed = await Promise.all(sentences.map(s => this.analyzeSentence(s)));
    return { sentences: analyzed };
  }

  private async analyzeSentence(sentence: string): Promise<AnalyzedSentence> {
    const eojeolMorphemesList = await this.analyzer.analyze(sentence);
    const eojeols = await Promise.all(eojeolMorphemesList.map(e => this.analyzeEojeol(e)));
    return { eojeols };
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
      const lemma = reconstructLemma(morpheme.surface, morpheme.pos);
      const [entry, state] = await Promise.all([
        this.dictionary.lookup(lemma, morpheme.pos),
        this.knowledge.getState(lemma, morpheme.pos),
      ]);
      return {
        surface: morpheme.surface,
        lemma,
        pos: morpheme.pos,
        type,
        definitions: entry?.definitions ?? [],
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
