package com.kyleerin.koreanreader.srs

import kotlin.math.exp
import kotlin.math.pow
import kotlin.math.roundToInt

/**
 * FSRS-4.5 scheduler (17-parameter variant).
 *
 * Reference: https://github.com/open-spaced-repetition/fsrs4anki/wiki
 *
 * Key concepts:
 *  - Stability (S): days until retrievability drops to [requestRetention].
 *  - Difficulty (D): card difficulty, 1 (easy) to 10 (hard).
 *  - Retrievability R(t,S) = (1 + FACTOR·t/S)^DECAY — probability of recall after t days.
 *
 * The MVP omits intra-day learning steps (1 min / 10 min). New cards graduate
 * directly to REVIEW after the first answer, and RELEARNING cards graduate after
 * one GOOD/EASY answer.
 */
object FsrsScheduler {

    /** Default FSRS-4.5 weights (w[0..16]). */
    val DEFAULT_W = doubleArrayOf(
        0.4072, 1.1829, 3.1262, 15.4722,  // S_0 for Again/Hard/Good/Easy
        7.2102, 0.5316,                     // D_0 base & exponent
        1.0651,                             // difficulty update weight
        0.0589,                             // (short-term factor, unused in no-step mode)
        1.5330, 0.1544, 1.0071,            // recall stability: e-factor, S-power, R-factor
        1.9063, 0.1106, 0.2900, 2.2700,    // forget stability: base, D-power, S-power, R-factor
        0.2500, 2.9898                       // hard penalty, easy bonus
    )

    private const val DECAY = -0.5
    private const val FACTOR = 19.0 / 81.0  // keeps R(S, S) = 0.9
    const val REQUEST_RETENTION = 0.9
    private const val MILLIS_PER_DAY = 86_400_000L

    /**
     * Schedules the next review.
     *
     * @param card       The card's current state.
     * @param rating     The user's rating for this review.
     * @param nowMillis  Current epoch time in milliseconds.
     * @param w          FSRS weight array (defaults to [DEFAULT_W]).
     * @return           An updated [FsrsCard] with new stability, difficulty, due date, etc.
     */
    fun schedule(
        card: FsrsCard,
        rating: Rating,
        nowMillis: Long,
        w: DoubleArray = DEFAULT_W
    ): FsrsCard {
        val elapsedDays = card.lastReviewedAtMillis
            ?.let { ((nowMillis - it) / MILLIS_PER_DAY).toInt().coerceAtLeast(0) }
            ?: 0
        return when (card.state) {
            CardState.NEW -> scheduleNew(card, rating, nowMillis, w)
            CardState.LEARNING, CardState.RELEARNING -> scheduleLearning(card, rating, nowMillis, w)
            CardState.REVIEW -> scheduleReview(card, rating, elapsedDays, nowMillis, w)
        }
    }

    // ── State transitions ────────────────────────────────────────────────────

    private fun scheduleNew(card: FsrsCard, rating: Rating, nowMillis: Long, w: DoubleArray): FsrsCard {
        val s = initStability(rating, w)
        val d = initDifficulty(rating, w)
        return if (rating == Rating.AGAIN) {
            card.copy(
                stability = s, difficulty = d,
                reps = 1, lapses = card.lapses + 1, state = CardState.RELEARNING,
                intervalDays = 1,
                lastReviewedAtMillis = nowMillis,
                dueAtMillis = nowMillis + MILLIS_PER_DAY
            )
        } else {
            val interval = nextInterval(s).coerceAtLeast(1)
            card.copy(
                stability = s, difficulty = d,
                reps = 1, state = CardState.REVIEW,
                intervalDays = interval,
                lastReviewedAtMillis = nowMillis,
                dueAtMillis = nowMillis + interval * MILLIS_PER_DAY
            )
        }
    }

    private fun scheduleLearning(card: FsrsCard, rating: Rating, nowMillis: Long, w: DoubleArray): FsrsCard {
        return when (rating) {
            Rating.AGAIN -> {
                card.copy(
                    stability = initStability(rating, w),
                    difficulty = updateDifficulty(card.difficulty, rating, w),
                    lapses = card.lapses + 1, state = CardState.RELEARNING,
                    intervalDays = 1,
                    lastReviewedAtMillis = nowMillis,
                    dueAtMillis = nowMillis + MILLIS_PER_DAY
                )
            }
            Rating.HARD -> {
                card.copy(
                    difficulty = updateDifficulty(card.difficulty, rating, w),
                    state = CardState.REVIEW,
                    intervalDays = 1,
                    lastReviewedAtMillis = nowMillis,
                    dueAtMillis = nowMillis + MILLIS_PER_DAY
                )
            }
            Rating.GOOD, Rating.EASY -> {
                val s = if (rating == Rating.EASY) card.stability * w[16] else card.stability
                val interval = nextInterval(s).coerceAtLeast(1)
                card.copy(
                    stability = s,
                    difficulty = updateDifficulty(card.difficulty, rating, w),
                    state = CardState.REVIEW,
                    intervalDays = interval,
                    lastReviewedAtMillis = nowMillis,
                    dueAtMillis = nowMillis + interval * MILLIS_PER_DAY
                )
            }
        }
    }

    private fun scheduleReview(
        card: FsrsCard,
        rating: Rating,
        elapsedDays: Int,
        nowMillis: Long,
        w: DoubleArray
    ): FsrsCard {
        val r = retrievability(elapsedDays.toDouble(), card.stability)
        val d = updateDifficulty(card.difficulty, rating, w)
        return when (rating) {
            Rating.AGAIN -> {
                val s = forgetStability(d, card.stability, r, w)
                card.copy(
                    stability = s, difficulty = d,
                    lapses = card.lapses + 1, state = CardState.RELEARNING,
                    intervalDays = 1,
                    lastReviewedAtMillis = nowMillis,
                    dueAtMillis = nowMillis + MILLIS_PER_DAY
                )
            }
            else -> {
                val s = recallStability(d, card.stability, r, rating, w)
                val interval = nextInterval(s).coerceAtLeast(card.intervalDays + 1)
                card.copy(
                    stability = s, difficulty = d,
                    reps = card.reps + 1, state = CardState.REVIEW,
                    intervalDays = interval,
                    lastReviewedAtMillis = nowMillis,
                    dueAtMillis = nowMillis + interval * MILLIS_PER_DAY
                )
            }
        }
    }

    // ── Core FSRS formulas ───────────────────────────────────────────────────

    /** R(t, S) = (1 + FACTOR · t / S)^DECAY */
    fun retrievability(elapsedDays: Double, stability: Double): Double =
        (1.0 + FACTOR * elapsedDays / stability).pow(DECAY)

    /** I(r, S) = (S / FACTOR) · (r^(1/DECAY) − 1). At r=0.9 this equals S. */
    fun nextInterval(stability: Double, retention: Double = REQUEST_RETENTION): Int =
        ((stability / FACTOR) * (retention.pow(1.0 / DECAY) - 1.0))
            .roundToInt()
            .coerceAtLeast(1)

    private fun initStability(rating: Rating, w: DoubleArray): Double =
        w[rating.value - 1].coerceAtLeast(0.1)

    /** D_0(G) = w[4] − e^(w[5]·(G−1)) + 1, clamped to [1, 10]. */
    private fun initDifficulty(rating: Rating, w: DoubleArray): Double =
        (w[4] - exp(w[5] * (rating.value - 1)) + 1.0).coerceIn(1.0, 10.0)

    /** ΔD = −w[6]·(G−3); apply mean reversion toward midpoint then clamp. */
    private fun updateDifficulty(d: Double, rating: Rating, w: DoubleArray): Double {
        val delta = -w[6] * (rating.value - 3)
        return (d + delta * (10.0 - d) / 9.0).coerceIn(1.0, 10.0)
    }

    /** S'_r = S · (e^w[8] · (11−D) · S^(−w[9]) · (e^(w[10]·(1−R)) − 1) + 1) · penalty · bonus */
    private fun recallStability(d: Double, s: Double, r: Double, rating: Rating, w: DoubleArray): Double {
        val hardPenalty = if (rating == Rating.HARD) w[15] else 1.0
        val easyBonus = if (rating == Rating.EASY) w[16] else 1.0
        return s *
                (exp(w[8]) * (11.0 - d) * s.pow(-w[9]) * (exp(w[10] * (1.0 - r)) - 1.0) + 1.0) *
                hardPenalty * easyBonus
    }

    /** S'_f = w[11] · D^(−w[12]) · ((S+1)^w[13] − 1) · e^(w[14]·(1−R)) */
    private fun forgetStability(d: Double, s: Double, r: Double, w: DoubleArray): Double =
        (w[11] * d.pow(-w[12]) * ((s + 1.0).pow(w[13]) - 1.0) * exp(w[14] * (1.0 - r)))
            .coerceAtLeast(0.1)
}
