package com.kyleerin.koreanreader.domain.model

/** One space-delimited unit (eojeol) after pipeline enrichment. */
data class AnalyzedEojeol(
    val surface: String,
    val morphemes: List<AnalyzedMorpheme>
) {
    val contentMorphemes: List<AnalyzedMorpheme>
        get() = morphemes.filter { it.type == MorphemeType.CONTENT }

    val hasNewWords: Boolean
        get() = contentMorphemes.any { it.state == KnowledgeState.NEW }

    val isFullyKnown: Boolean
        get() = contentMorphemes.isEmpty() ||
                contentMorphemes.all { it.state == KnowledgeState.KNOWN || it.state == KnowledgeState.IGNORED }
}
