package com.kyleerin.koreanreader.pipeline

/**
 * Android implementation of [MorphologicalAnalyzer] backed by MeCab-ko via JNI.
 *
 * Integration steps (to be spiked separately, per build sequence §11):
 *  1. Build mecab-ko and mecab-ko-dic as Android shared libraries (.so) for each ABI.
 *  2. Add the .so files under androidMain/jniLibs/.
 *  3. Declare `external fun nativeAnalyze(text: String): Array<String>` and load the library.
 *  4. Parse the tab-separated MeCab output into [EojeolMorphemes].
 *
 * Until the JNI binding is ready, this class throws [NotImplementedError].
 */
class MecabAnalyzer : MorphologicalAnalyzer {

    override suspend fun analyze(text: String): List<EojeolMorphemes> {
        TODO(
            "MeCab-ko JNI binding not yet implemented. " +
            "See build sequence step 1 in the project spec."
        )
    }

    override fun close() {}
}
