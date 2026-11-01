import type { Morpheme } from '../domain/model';

export interface EojeolMorphemes {
  readonly surface: string;
  readonly morphemes: readonly Morpheme[];
}

/**
 * Platform-provided morphological analyzer.
 *
 * Production uses garu-ko WASM (`GaruKoAnalyzer`). A stub/fake analyzer is
 * available in tests/ for unit testing without the WASM module.
 *
 * Receives a single sentence (not a whole document) and returns morphemes
 * grouped by eojeol, preserving the original whitespace structure.
 */
export interface MorphologicalAnalyzer {
  analyze(sentence: string): Promise<EojeolMorphemes[]>;
}
