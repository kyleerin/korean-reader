package com.kyleerin.koreanreader.domain.model

/**
 * A single morpheme after pipeline enrichment.
 *
 * For CONTENT morphemes, [lemma] is the dictionary form (e.g. 먹다 for the stem 먹),
 * [definitions] are populated from the bundled dictionary, and [state] reflects the
 * user's knowledge of this word.
 *
 * [eojeolContext] holds every morpheme in the parent eojeol so the UI can display the
 * full conjugation/particle breakdown when the user taps a word.
 */
data class AnalyzedMorpheme(
    val surface: String,
    val lemma: String,
    val pos: PartOfSpeech,
    val type: MorphemeType,
    val definitions: List<String> = emptyList(),
    val state: KnowledgeState = KnowledgeState.NEW,
    val eojeolContext: List<Morpheme> = emptyList()
)
