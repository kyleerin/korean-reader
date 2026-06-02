package com.kyleerin.koreanreader.domain.model

enum class MorphemeType {
    /** Vocabulary word: noun, verb stem, adjective, adverb. Tracked and colored by knowledge state. */
    CONTENT,
    /** 조사 — grammatical particle. Styled distinctly; explains case/topic/subject role. */
    PARTICLE,
    /** 어미 — verb ending. Styled distinctly; explains tense/mood/politeness. */
    ENDING,
    /** 접사 — derivational prefix or suffix. Not tracked as vocabulary. */
    AFFIX,
    PUNCTUATION,
    /** Foreign words (SL), Chinese characters (SH), numbers (SN). */
    FOREIGN,
    UNKNOWN
}
