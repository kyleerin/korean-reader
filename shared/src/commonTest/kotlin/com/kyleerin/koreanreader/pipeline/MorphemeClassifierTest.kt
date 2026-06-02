package com.kyleerin.koreanreader.pipeline

import com.kyleerin.koreanreader.domain.model.MorphemeType
import com.kyleerin.koreanreader.domain.model.PartOfSpeech
import kotlin.test.Test
import kotlin.test.assertEquals

class MorphemeClassifierTest {

    @Test
    fun nounsAreContent() {
        assertEquals(MorphemeType.CONTENT, MorphemeClassifier.classify(PartOfSpeech.NN))
        assertEquals(MorphemeType.CONTENT, MorphemeClassifier.classify(PartOfSpeech.NNP))
        assertEquals(MorphemeType.CONTENT, MorphemeClassifier.classify(PartOfSpeech.NNB))
        assertEquals(MorphemeType.CONTENT, MorphemeClassifier.classify(PartOfSpeech.NP))
        assertEquals(MorphemeType.CONTENT, MorphemeClassifier.classify(PartOfSpeech.NR))
    }

    @Test
    fun predicatesAreContent() {
        assertEquals(MorphemeType.CONTENT, MorphemeClassifier.classify(PartOfSpeech.VV))
        assertEquals(MorphemeType.CONTENT, MorphemeClassifier.classify(PartOfSpeech.VA))
        assertEquals(MorphemeType.CONTENT, MorphemeClassifier.classify(PartOfSpeech.VX))
        assertEquals(MorphemeType.CONTENT, MorphemeClassifier.classify(PartOfSpeech.VCP))
        assertEquals(MorphemeType.CONTENT, MorphemeClassifier.classify(PartOfSpeech.VCN))
    }

    @Test
    fun adverbsAndDeterminerAreContent() {
        assertEquals(MorphemeType.CONTENT, MorphemeClassifier.classify(PartOfSpeech.MAG))
        assertEquals(MorphemeType.CONTENT, MorphemeClassifier.classify(PartOfSpeech.MAJ))
        assertEquals(MorphemeType.CONTENT, MorphemeClassifier.classify(PartOfSpeech.MM))
    }

    @Test
    fun particlesAreParticle() {
        assertEquals(MorphemeType.PARTICLE, MorphemeClassifier.classify(PartOfSpeech.JKS))
        assertEquals(MorphemeType.PARTICLE, MorphemeClassifier.classify(PartOfSpeech.JKO))
        assertEquals(MorphemeType.PARTICLE, MorphemeClassifier.classify(PartOfSpeech.JX))
        assertEquals(MorphemeType.PARTICLE, MorphemeClassifier.classify(PartOfSpeech.JC))
    }

    @Test
    fun verbEndingsAreEnding() {
        assertEquals(MorphemeType.ENDING, MorphemeClassifier.classify(PartOfSpeech.EF))
        assertEquals(MorphemeType.ENDING, MorphemeClassifier.classify(PartOfSpeech.EP))
        assertEquals(MorphemeType.ENDING, MorphemeClassifier.classify(PartOfSpeech.EC))
        assertEquals(MorphemeType.ENDING, MorphemeClassifier.classify(PartOfSpeech.ETN))
        assertEquals(MorphemeType.ENDING, MorphemeClassifier.classify(PartOfSpeech.ETM))
    }

    @Test
    fun derivationalSuffixesAreAffix() {
        assertEquals(MorphemeType.AFFIX, MorphemeClassifier.classify(PartOfSpeech.XSV))
        assertEquals(MorphemeType.AFFIX, MorphemeClassifier.classify(PartOfSpeech.XSA))
        assertEquals(MorphemeType.AFFIX, MorphemeClassifier.classify(PartOfSpeech.XSN))
        assertEquals(MorphemeType.AFFIX, MorphemeClassifier.classify(PartOfSpeech.XPN))
    }

    @Test
    fun punctuationIsPunctuation() {
        assertEquals(MorphemeType.PUNCTUATION, MorphemeClassifier.classify(PartOfSpeech.SF))
        assertEquals(MorphemeType.PUNCTUATION, MorphemeClassifier.classify(PartOfSpeech.SP))
        assertEquals(MorphemeType.PUNCTUATION, MorphemeClassifier.classify(PartOfSpeech.SS))
    }

    @Test
    fun foreignSymbolsAreForeign() {
        assertEquals(MorphemeType.FOREIGN, MorphemeClassifier.classify(PartOfSpeech.SL))
        assertEquals(MorphemeType.FOREIGN, MorphemeClassifier.classify(PartOfSpeech.SH))
        assertEquals(MorphemeType.FOREIGN, MorphemeClassifier.classify(PartOfSpeech.SN))
    }
}
