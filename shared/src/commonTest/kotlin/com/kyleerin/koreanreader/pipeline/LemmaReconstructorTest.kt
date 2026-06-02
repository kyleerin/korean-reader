package com.kyleerin.koreanreader.pipeline

import com.kyleerin.koreanreader.domain.model.PartOfSpeech
import kotlin.test.Test
import kotlin.test.assertEquals

class LemmaReconstructorTest {

    @Test
    fun verbStemGetsDaSuffix() {
        assertEquals("먹다", LemmaReconstructor.reconstruct("먹", PartOfSpeech.VV))
        assertEquals("가다", LemmaReconstructor.reconstruct("가", PartOfSpeech.VV))
        assertEquals("오다", LemmaReconstructor.reconstruct("오", PartOfSpeech.VV))
    }

    @Test
    fun adjectiveStemGetsDaSuffix() {
        assertEquals("아름답다", LemmaReconstructor.reconstruct("아름답", PartOfSpeech.VA))
        assertEquals("크다", LemmaReconstructor.reconstruct("크", PartOfSpeech.VA))
        assertEquals("좋다", LemmaReconstructor.reconstruct("좋", PartOfSpeech.VA))
    }

    @Test
    fun auxiliaryPredicateGetsDaSuffix() {
        assertEquals("싶다", LemmaReconstructor.reconstruct("싶", PartOfSpeech.VX))
        assertEquals("있다", LemmaReconstructor.reconstruct("있", PartOfSpeech.VX))
    }

    @Test
    fun copulaGetsDaSuffix() {
        assertEquals("이다", LemmaReconstructor.reconstruct("이", PartOfSpeech.VCP))
        assertEquals("아니다", LemmaReconstructor.reconstruct("아니", PartOfSpeech.VCN))
    }

    @Test
    fun verbalDerivationalSuffixGetsDaSuffix() {
        assertEquals("하다", LemmaReconstructor.reconstruct("하", PartOfSpeech.XSV))
    }

    @Test
    fun adjectivalDerivationalSuffixGetsDaSuffix() {
        assertEquals("스럽다", LemmaReconstructor.reconstruct("스럽", PartOfSpeech.XSA))
    }

    @Test
    fun nounReturnedUnchanged() {
        assertEquals("학생", LemmaReconstructor.reconstruct("학생", PartOfSpeech.NN))
        assertEquals("한국", LemmaReconstructor.reconstruct("한국", PartOfSpeech.NNP))
        assertEquals("나", LemmaReconstructor.reconstruct("나", PartOfSpeech.NP))
    }

    @Test
    fun adverbReturnedUnchanged() {
        assertEquals("빨리", LemmaReconstructor.reconstruct("빨리", PartOfSpeech.MAG))
        assertEquals("그리고", LemmaReconstructor.reconstruct("그리고", PartOfSpeech.MAJ))
    }
}
