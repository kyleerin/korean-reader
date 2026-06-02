package com.kyleerin.koreanreader.srs

import com.kyleerin.koreanreader.domain.model.PartOfSpeech
import kotlin.math.roundToInt
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class FsrsSchedulerTest {

    private val now = 1_700_000_000_000L  // fixed epoch millis for deterministic tests
    private val day = 86_400_000L

    private fun newCard() = FsrsCard(
        lemma = "먹다",
        pos = PartOfSpeech.VV,
        dueAtMillis = now
    )

    // ── New card ──────────────────────────────────────────────────────────────

    @Test
    fun newCardGoodGraduatesToReview() {
        val card = FsrsScheduler.schedule(newCard(), Rating.GOOD, now)
        assertEquals(CardState.REVIEW, card.state)
        assertEquals(1, card.reps)
        assertTrue(card.intervalDays >= 1)
    }

    @Test
    fun newCardEasyGetsLongerIntervalThanGood() {
        val good = FsrsScheduler.schedule(newCard(), Rating.GOOD, now)
        val easy = FsrsScheduler.schedule(newCard(), Rating.EASY, now)
        assertTrue(easy.intervalDays >= good.intervalDays)
    }

    @Test
    fun newCardAgainGoesToRelearning() {
        val card = FsrsScheduler.schedule(newCard(), Rating.AGAIN, now)
        assertEquals(CardState.RELEARNING, card.state)
        assertEquals(1, card.lapses)
        assertEquals(1, card.intervalDays)
    }

    @Test
    fun newCardGoodUsesW2AsInitialStability() {
        val card = FsrsScheduler.schedule(newCard(), Rating.GOOD, now)
        // w[2] = 3.1262; nextInterval(3.1262) should be ≈ 3
        assertEquals(3, card.intervalDays)
    }

    @Test
    fun newCardEasyUsesW3AsInitialStability() {
        val card = FsrsScheduler.schedule(newCard(), Rating.EASY, now)
        // w[3] = 15.4722; nextInterval(15.4722) should be ≈ 15
        assertEquals(15, card.intervalDays)
    }

    @Test
    fun dueAtMillisIsNowPlusIntervalDays() {
        val card = FsrsScheduler.schedule(newCard(), Rating.GOOD, now)
        assertEquals(now + card.intervalDays * day, card.dueAtMillis)
    }

    // ── Review card ───────────────────────────────────────────────────────────

    private fun reviewCard(s: Double = 10.0, d: Double = 5.0) = FsrsCard(
        lemma = "먹다",
        pos = PartOfSpeech.VV,
        stability = s,
        difficulty = d,
        intervalDays = 10,
        reps = 3,
        state = CardState.REVIEW,
        lastReviewedAtMillis = now - 10 * day,
        dueAtMillis = now
    )

    @Test
    fun reviewGoodIncreasesStability() {
        val before = reviewCard()
        val after = FsrsScheduler.schedule(before, Rating.GOOD, now)
        assertTrue(after.stability > before.stability)
    }

    @Test
    fun reviewAgainDecreaseStabilityAndLapses() {
        val before = reviewCard()
        val after = FsrsScheduler.schedule(before, Rating.AGAIN, now)
        assertTrue(after.stability < before.stability)
        assertEquals(before.lapses + 1, after.lapses)
        assertEquals(CardState.RELEARNING, after.state)
    }

    @Test
    fun reviewHardGivesLongerIntervalThanAgainButShorterThanGood() {
        val card = reviewCard()
        val again = FsrsScheduler.schedule(card, Rating.AGAIN, now)
        val hard = FsrsScheduler.schedule(card, Rating.HARD, now)
        val good = FsrsScheduler.schedule(card, Rating.GOOD, now)
        assertTrue(again.intervalDays <= hard.intervalDays)
        assertTrue(hard.intervalDays <= good.intervalDays)
    }

    @Test
    fun reviewEasyGivesLongestInterval() {
        val card = reviewCard()
        val good = FsrsScheduler.schedule(card, Rating.GOOD, now)
        val easy = FsrsScheduler.schedule(card, Rating.EASY, now)
        assertTrue(easy.intervalDays > good.intervalDays)
    }

    @Test
    fun reviewGoodIntervalAtLeastOneDayMoreThanCurrent() {
        val card = reviewCard(s = 10.0)
        val after = FsrsScheduler.schedule(card, Rating.GOOD, now)
        assertTrue(after.intervalDays > card.intervalDays)
    }

    // ── Retrievability ────────────────────────────────────────────────────────

    @Test
    fun retrievabilityEqualsRequestRetentionAtStabilityInterval() {
        val s = 10.0
        val r = FsrsScheduler.retrievability(s, s)
        // Should be ≈ 0.9
        assertTrue(r > 0.89 && r < 0.91, "Expected R ≈ 0.9, got $r")
    }

    @Test
    fun retrievabilityDecreasesOverTime() {
        val s = 10.0
        val r10 = FsrsScheduler.retrievability(10.0, s)
        val r20 = FsrsScheduler.retrievability(20.0, s)
        assertTrue(r20 < r10)
    }

    // ── nextInterval ──────────────────────────────────────────────────────────

    @Test
    fun nextIntervalEqualsStabilityAtDefaultRetention() {
        // At r=0.9 the interval should equal the stability (rounded)
        val s = 7.0
        assertEquals(s.roundToInt(), FsrsScheduler.nextInterval(s))
    }
}
