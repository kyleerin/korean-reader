package com.kyleerin.koreanreader.pipeline

import com.kyleerin.koreanreader.domain.model.Morpheme
import com.kyleerin.koreanreader.domain.model.PartOfSpeech

/**
 * Serializes and deserializes a sentence's morphological analysis for the token cache.
 *
 * Format (one eojeol per line):
 *   <eojeol_surface>\t<surface>:<pos_tag> <surface>:<pos_tag> …
 *
 * The separator characters (tab, space, colon) never appear in Korean morpheme
 * surfaces, so no escaping is needed.
 */
object MorphemeAnalysisSerializer {

    fun serialize(eojeols: List<EojeolMorphemes>): String = buildString {
        eojeols.forEachIndexed { i, eojeol ->
            if (i > 0) append('\n')
            append(eojeol.surface)
            append('\t')
            append(eojeol.morphemes.joinToString(" ") { "${it.surface}:${it.pos.tag}" })
        }
    }

    fun deserialize(text: String): List<EojeolMorphemes> {
        if (text.isBlank()) return emptyList()
        return text.lines().mapNotNull { line ->
            val tabIdx = line.indexOf('\t')
            if (tabIdx < 0) return@mapNotNull null
            val surface = line.substring(0, tabIdx)
            val morphemePart = line.substring(tabIdx + 1)
            val morphemes = if (morphemePart.isBlank()) emptyList() else {
                morphemePart.split(' ').mapNotNull { token ->
                    val colonIdx = token.lastIndexOf(':')
                    if (colonIdx < 0) return@mapNotNull null
                    Morpheme(
                        surface = token.substring(0, colonIdx),
                        pos = PartOfSpeech.fromTag(token.substring(colonIdx + 1))
                    )
                }
            }
            EojeolMorphemes(surface, morphemes)
        }
    }
}
