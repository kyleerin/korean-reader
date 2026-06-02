package com.kyleerin.koreanreader.pipeline

/**
 * Platform-provided morphological analyzer.
 *
 * Implementations live in androidMain (MeCab-ko via JNI) and iosMain (MeCab-ko via C interop).
 * A [FakeMorphologicalAnalyzer] is available in commonTest for unit testing.
 *
 * The analyzer receives a single sentence (not a whole document) and returns the morpheme
 * breakdown grouped by eojeol, preserving the original whitespace structure.
 */
interface MorphologicalAnalyzer {
    suspend fun analyze(text: String): List<EojeolMorphemes>
    fun close() {}
}
