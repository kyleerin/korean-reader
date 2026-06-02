package com.kyleerin.koreanreader.domain.model

data class DictionaryEntry(
    val lemma: String,
    val pos: PartOfSpeech,
    val definitions: List<String>,
    val examples: List<String> = emptyList(),
    val frequencyRank: Int? = null
)
