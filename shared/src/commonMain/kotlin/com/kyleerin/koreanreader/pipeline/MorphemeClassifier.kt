package com.kyleerin.koreanreader.pipeline

import com.kyleerin.koreanreader.domain.model.MorphemeType
import com.kyleerin.koreanreader.domain.model.PartOfSpeech
import com.kyleerin.koreanreader.domain.model.PartOfSpeech.*

/** Maps a MeCab-ko POS tag to the pipeline's morpheme type classification. */
object MorphemeClassifier {

    fun classify(pos: PartOfSpeech): MorphemeType = when (pos) {
        NN, NNP, NNB, NP, NR,
        VV, VA, VX, VCP, VCN,
        MM, MAG, MAJ, IC, XR -> MorphemeType.CONTENT

        JKS, JKC, JKG, JKO, JKB, JKV, JKQ, JX, JC -> MorphemeType.PARTICLE

        EP, EF, EC, ETN, ETM -> MorphemeType.ENDING

        XPN, XSN, XSV, XSA -> MorphemeType.AFFIX

        SF, SP, SS, SE, SO, SW -> MorphemeType.PUNCTUATION

        SL, SH, SN -> MorphemeType.FOREIGN

        UNKNOWN -> MorphemeType.UNKNOWN
    }
}
