package com.kyleerin.koreanreader.pipeline

import com.kyleerin.koreanreader.domain.model.Morpheme
import com.kyleerin.koreanreader.domain.model.PartOfSpeech
import kotlin.test.Test
import kotlin.test.assertEquals

class MorphemeAnalysisSerializerTest {

    private val sentence = listOf(
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

    @Test
    fun roundTripPreservesEojeolCount() {
        val result = MorphemeAnalysisSerializer.deserialize(MorphemeAnalysisSerializer.serialize(sentence))
        assertEquals(sentence.size, result.size)
    }

    @Test
    fun roundTripPreservesEojeolSurfaces() {
        val result = MorphemeAnalysisSerializer.deserialize(MorphemeAnalysisSerializer.serialize(sentence))
        assertEquals(sentence.map { it.surface }, result.map { it.surface })
    }

    @Test
    fun roundTripPreservesMorphemeCount() {
        val result = MorphemeAnalysisSerializer.deserialize(MorphemeAnalysisSerializer.serialize(sentence))
        sentence.indices.forEach { i ->
            assertEquals(sentence[i].morphemes.size, result[i].morphemes.size, "eojeol $i")
        }
    }

    @Test
    fun roundTripPreservesMorphemeSurfaces() {
        val result = MorphemeAnalysisSerializer.deserialize(MorphemeAnalysisSerializer.serialize(sentence))
        sentence.indices.forEach { i ->
            assertEquals(
                sentence[i].morphemes.map { it.surface },
                result[i].morphemes.map { it.surface },
                "eojeol $i"
            )
        }
    }

    @Test
    fun roundTripPreservesPosTag() {
        val result = MorphemeAnalysisSerializer.deserialize(MorphemeAnalysisSerializer.serialize(sentence))
        assertEquals(PartOfSpeech.NP, result[0].morphemes[0].pos)
        assertEquals(PartOfSpeech.VV, result[2].morphemes[0].pos)
        assertEquals(PartOfSpeech.SF, result[2].morphemes[3].pos)
    }

    @Test
    fun emptyListRoundTrips() {
        val result = MorphemeAnalysisSerializer.deserialize(MorphemeAnalysisSerializer.serialize(emptyList()))
        assertEquals(emptyList(), result)
    }

    @Test
    fun singleEojeolRoundTrips() {
        val single = listOf(EojeolMorphemes("학생", listOf(Morpheme("학생", PartOfSpeech.NN))))
        val result = MorphemeAnalysisSerializer.deserialize(MorphemeAnalysisSerializer.serialize(single))
        assertEquals(1, result.size)
        assertEquals("학생", result[0].surface)
        assertEquals(PartOfSpeech.NN, result[0].morphemes[0].pos)
    }
}
