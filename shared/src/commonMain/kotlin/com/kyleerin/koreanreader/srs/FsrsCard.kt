package com.kyleerin.koreanreader.srs

import com.kyleerin.koreanreader.domain.model.PartOfSpeech

/**
 * Per-word FSRS scheduling state.
 *
 * [stability] — how long (in days) it takes for retrievability to drop to 90 %.
 * [difficulty] — how hard the item is, on a [1, 10] scale; higher = harder.
 * [intervalDays] — the interval (in days) that was scheduled at the last review.
 * [dueAtMillis] — epoch-millisecond timestamp when the next review is due.
 */
data class FsrsCard(
    val lemma: String,
    val pos: PartOfSpeech,
    val exampleSentence: String = "",
    val stability: Double = 0.0,
    val difficulty: Double = 5.0,
    val intervalDays: Int = 0,
    val reps: Int = 0,
    val lapses: Int = 0,
    val state: CardState = CardState.NEW,
    val lastReviewedAtMillis: Long? = null,
    val dueAtMillis: Long = 0L
)
