package com.kyleerin.koreanreader.pipeline

class FakeMorphologicalAnalyzer(
    private val responses: Map<String, List<EojeolMorphemes>> = emptyMap()
) : MorphologicalAnalyzer {
    override suspend fun analyze(text: String): List<EojeolMorphemes> =
        responses[text] ?: emptyList()
}
