import type { Morpheme } from '../domain/model';

export interface EojeolMorphemes {
  readonly surface: string;
  readonly morphemes: readonly Morpheme[];
}

/**
 * Platform-provided morphological analyzer.
 *
 * The production implementation will be backed by mecab-ko compiled to
 * WebAssembly (Emscripten). A FakeMorphologicalAnalyzer is available in
 * tests/ for unit testing without the WASM module.
 *
 * Receives a single sentence (not a whole document) and returns morphemes
 * grouped by eojeol, preserving the original whitespace structure.
 */
export interface MorphologicalAnalyzer {
  analyze(sentence: string): Promise<EojeolMorphemes[]>;
}
