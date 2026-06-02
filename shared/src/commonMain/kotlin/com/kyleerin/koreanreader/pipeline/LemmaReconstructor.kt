package com.kyleerin.koreanreader.pipeline

import com.kyleerin.koreanreader.domain.model.PartOfSpeech
import com.kyleerin.koreanreader.domain.model.PartOfSpeech.*

/**
 * Converts a morpheme surface form to its dictionary (lemma) form.
 *
 * MeCab-ko returns the stem of conjugated verbs/adjectives — we append "다" to
 * produce the infinitive form used as the dictionary key.
 *
 * Nouns, adverbs, and other uninflected forms are returned unchanged because their
 * surface form already matches the dictionary headword.
 */
object LemmaReconstructor {

    fun reconstruct(surface: String, pos: PartOfSpeech): String = when (pos) {
        VV, VA, VX, VCP, VCN -> "${surface}다"
        XSV -> "${surface}다"  // verbal derivational suffix (e.g. 하 → 하다)
        XSA -> "${surface}다"  // adjectival derivational suffix
        else -> surface
    }
}
