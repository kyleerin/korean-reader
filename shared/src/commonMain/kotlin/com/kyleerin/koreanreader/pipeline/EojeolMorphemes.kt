package com.kyleerin.koreanreader.pipeline

import com.kyleerin.koreanreader.domain.model.Morpheme

/** Raw output from the morphological analyzer for one eojeol. */
data class EojeolMorphemes(
    val surface: String,
    val morphemes: List<Morpheme>
)
