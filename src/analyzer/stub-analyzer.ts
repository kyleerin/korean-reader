import type { EojeolMorphemes, MorphologicalAnalyzer } from '../pipeline/analyzer';

/**
 * Whitespace tokenizer — splits on spaces, tags every token as NN.
 * Good enough to demo the reader UI until mecab-ko WASM is ready.
 */
export class StubAnalyzer implements MorphologicalAnalyzer {
  async analyze(sentence: string): Promise<EojeolMorphemes[]> {
    return sentence
      .split(/\s+/)
      .filter(Boolean)
      .map(token => ({
        surface: token,
        morphemes: [{ surface: token, pos: 'NN' as const }],
      }));
  }
}
