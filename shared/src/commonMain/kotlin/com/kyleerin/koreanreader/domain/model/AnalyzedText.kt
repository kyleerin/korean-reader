package com.kyleerin.koreanreader.domain.model

data class AnalyzedText(
    val sentences: List<AnalyzedSentence>
) {
    val totalEojeols: Int
        get() = sentences.sumOf { it.eojeols.size }

    val uniqueContentWords: Int
        get() = sentences
            .flatMap { it.eojeols }
            .flatMap { it.contentMorphemes }
            .distinctBy { it.lemma to it.pos }
            .size
}

data class AnalyzedSentence(
    val eojeols: List<AnalyzedEojeol>
) {
    val contentMorphemes: List<AnalyzedMorpheme>
        get() = eojeols.flatMap { it.contentMorphemes }
}
