package com.kyleerin.koreanreader.pipeline

/**
 * iOS implementation of [MorphologicalAnalyzer] backed by MeCab-ko via Kotlin/Native C interop.
 *
 * Integration steps (to be spiked separately, per build sequence §11):
 *  1. Build mecab-ko and mecab-ko-dic as a static XCFramework.
 *  2. Write a thin Obj-C wrapper that exposes `analyzeText:` returning an NSArray of strings.
 *  3. Generate Kotlin/Native bindings with a .def file pointing at the wrapper header.
 *  4. Parse the output into [EojeolMorphemes].
 *
 * Until the C interop binding is ready, this class throws [NotImplementedError].
 */
class MecabAnalyzer : MorphologicalAnalyzer {

    override suspend fun analyze(text: String): List<EojeolMorphemes> {
        TODO(
            "MeCab-ko iOS C interop binding not yet implemented. " +
            "See build sequence step 1 in the project spec."
        )
    }

    override fun close() {}
}
