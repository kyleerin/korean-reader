package com.kyleerin.koreanreader.pipeline

import com.kyleerin.koreanreader.dictionary.InMemoryDictionaryRepository
import com.kyleerin.koreanreader.domain.model.*
import com.kyleerin.koreanreader.knowledge.InMemoryKnowledgeRepository
import kotlinx.coroutines.test.runTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlin.test.assertTrue

/**
 * Integration test for [ReadingPipeline] using a [FakeMorphologicalAnalyzer].
 *
 * The sentence under test — "나는 밥을 먹었어요." — breaks down as:
 *   나는   → 나(NP) + 는(JX)
 *   밥을   → 밥(NN) + 을(JKO)
 *   먹었어요. → 먹(VV) + 었(EP) + 어요(EF) + .(SF)
 */
class ReadingPipelineTest {

    private val sentence = "나는 밥을 먹었어요."

    // Canned analyzer response matching the sentence above.
    private val fakeAnalysis = mapOf(
        sentence to listOf(
            EojeolMorphemes("나는", listOf(
                Morpheme("나", PartOfSpeech.NP),
                Morpheme("는", PartOfSpeech.JX)
            )),
            EojeolMorphemes("밥을", listOf(
                Morpheme("밥", PartOfSpeech.NN),
                Morpheme("을", PartOfSpeech.JKO)
            )),
            EojeolMorphemes("먹었어요.", listOf(
                Morpheme("먹", PartOfSpeech.VV),
                Morpheme("었", PartOfSpeech.EP),
                Morpheme("어요", PartOfSpeech.EF),
                Morpheme(".", PartOfSpeech.SF)
            ))
        )
    )

    private val dictionary = InMemoryDictionaryRepository(
        mapOf(
            ("나" to PartOfSpeech.NP)  to DictionaryEntry("나",  PartOfSpeech.NP,  listOf("I, me")),
            ("밥" to PartOfSpeech.NN)  to DictionaryEntry("밥",  PartOfSpeech.NN,  listOf("cooked rice, meal")),
            ("먹다" to PartOfSpeech.VV) to DictionaryEntry("먹다", PartOfSpeech.VV, listOf("to eat"))
        )
    )

    private val knowledge = InMemoryKnowledgeRepository()

    private val pipeline = ReadingPipeline(
        analyzer = FakeMorphologicalAnalyzer(fakeAnalysis),
        dictionary = dictionary,
        knowledge = knowledge
    )

    // ── Structure ─────────────────────────────────────────────────────────────

    @Test
    fun producesOneSentence() = runTest {
        val result = pipeline.analyze(sentence)
        assertEquals(1, result.sentences.size)
    }

    @Test
    fun producesThreeEojeols() = runTest {
        val eojeols = pipeline.analyze(sentence).sentences.first().eojeols
        assertEquals(3, eojeols.size)
    }

    // ── Lemma reconstruction ──────────────────────────────────────────────────

    @Test
    fun nounLemmaIsUnchanged() = runTest {
        val eojeols = pipeline.analyze(sentence).sentences.first().eojeols
        val na = eojeols[0].contentMorphemes.first()  // 나(NP)
        assertEquals("나", na.lemma)
    }

    @Test
    fun verbLemmaHasDaSuffix() = runTest {
        val eojeols = pipeline.analyze(sentence).sentences.first().eojeols
        val eat = eojeols[2].contentMorphemes.first()  // 먹(VV)
        assertEquals("먹다", eat.lemma)
    }

    // ── MorphemeType classification ───────────────────────────────────────────

    @Test
    fun pronounIsContent() = runTest {
        val m = pipeline.analyze(sentence).sentences.first().eojeols[0].morphemes[0]
        assertEquals(MorphemeType.CONTENT, m.type)
    }

    @Test
    fun auxiliaryParticleIsParticle() = runTest {
        val m = pipeline.analyze(sentence).sentences.first().eojeols[0].morphemes[1]  // 는(JX)
        assertEquals(MorphemeType.PARTICLE, m.type)
    }

    @Test
    fun objectParticleIsParticle() = runTest {
        val m = pipeline.analyze(sentence).sentences.first().eojeols[1].morphemes[1]  // 을(JKO)
        assertEquals(MorphemeType.PARTICLE, m.type)
    }

    @Test
    fun preFinalEndingIsEnding() = runTest {
        val m = pipeline.analyze(sentence).sentences.first().eojeols[2].morphemes[1]  // 었(EP)
        assertEquals(MorphemeType.ENDING, m.type)
    }

    @Test
    fun finalEndingIsEnding() = runTest {
        val m = pipeline.analyze(sentence).sentences.first().eojeols[2].morphemes[2]  // 어요(EF)
        assertEquals(MorphemeType.ENDING, m.type)
    }

    @Test
    fun punctuationIsPunctuation() = runTest {
        val m = pipeline.analyze(sentence).sentences.first().eojeols[2].morphemes[3]  // .(SF)
        assertEquals(MorphemeType.PUNCTUATION, m.type)
    }

    // ── Dictionary lookup ─────────────────────────────────────────────────────

    @Test
    fun definitionAttachedToNoun() = runTest {
        val rice = pipeline.analyze(sentence).sentences.first().eojeols[1].contentMorphemes.first()
        assertEquals(listOf("cooked rice, meal"), rice.definitions)
    }

    @Test
    fun definitionAttachedToVerb() = runTest {
        val eat = pipeline.analyze(sentence).sentences.first().eojeols[2].contentMorphemes.first()
        assertEquals(listOf("to eat"), eat.definitions)
    }

    @Test
    fun particleHasNoDefinition() = runTest {
        val particle = pipeline.analyze(sentence).sentences.first().eojeols[0].morphemes[1]
        assertTrue(particle.definitions.isEmpty())
    }

    // ── Knowledge state ───────────────────────────────────────────────────────

    @Test
    fun allWordsAreNewByDefault() = runTest {
        val content = pipeline.analyze(sentence)
            .sentences.flatMap { it.eojeols }.flatMap { it.contentMorphemes }
        assertTrue(content.all { it.state == KnowledgeState.NEW })
    }

    @Test
    fun knownStateReflectedInOutput() = runTest {
        knowledge.setState("밥", PartOfSpeech.NN, KnowledgeState.KNOWN)
        val rice = pipeline.analyze(sentence).sentences.first().eojeols[1].contentMorphemes.first()
        assertEquals(KnowledgeState.KNOWN, rice.state)
    }

    @Test
    fun learningStateReflectedInOutput() = runTest {
        knowledge.setState("먹다", PartOfSpeech.VV, KnowledgeState.LEARNING)
        val eat = pipeline.analyze(sentence).sentences.first().eojeols[2].contentMorphemes.first()
        assertEquals(KnowledgeState.LEARNING, eat.state)
    }

    // ── Eojeol helpers ────────────────────────────────────────────────────────

    @Test
    fun eojeolWithAllNewWordsReportsNotFullyKnown() = runTest {
        val first = pipeline.analyze(sentence).sentences.first().eojeols[0]
        assertTrue(first.hasNewWords)
    }

    @Test
    fun eojeolWithKnownContentIsFullyKnown() = runTest {
        knowledge.setState("나", PartOfSpeech.NP, KnowledgeState.KNOWN)
        val first = pipeline.analyze(sentence).sentences.first().eojeols[0]
        assertTrue(first.isFullyKnown)
    }

    // ── Conjugation context ───────────────────────────────────────────────────

    @Test
    fun contentMorphemeCarriesFullEojeolContext() = runTest {
        val eat = pipeline.analyze(sentence).sentences.first().eojeols[2].contentMorphemes.first()
        // eojeolContext = [먹(VV), 었(EP), 어요(EF), .(SF)]
        assertEquals(4, eat.eojeolContext.size)
        assertEquals(PartOfSpeech.VV, eat.eojeolContext[0].pos)
        assertEquals(PartOfSpeech.EP, eat.eojeolContext[1].pos)
        assertEquals(PartOfSpeech.EF, eat.eojeolContext[2].pos)
    }

    // ── Aggregate helpers ─────────────────────────────────────────────────────

    @Test
    fun totalEojeolCount() = runTest {
        val result = pipeline.analyze(sentence)
        assertEquals(3, result.totalEojeols)
    }

    @Test
    fun uniqueContentWordCount() = runTest {
        // 나(NP), 밥(NN), 먹다(VV) → 3 distinct lemma+pos pairs
        val result = pipeline.analyze(sentence)
        assertEquals(3, result.uniqueContentWords)
    }
}
