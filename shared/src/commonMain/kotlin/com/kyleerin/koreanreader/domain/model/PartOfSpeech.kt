package com.kyleerin.koreanreader.domain.model

enum class PartOfSpeech(val tag: String, val descriptionKo: String, val descriptionEn: String) {
    // Nouns
    NN("NN", "일반명사", "common noun"),
    NNP("NNP", "고유명사", "proper noun"),
    NNB("NNB", "의존명사", "bound noun"),
    NP("NP", "대명사", "pronoun"),
    NR("NR", "수사", "numeral"),

    // Predicates
    VV("VV", "동사", "verb"),
    VA("VA", "형용사", "adjective"),
    VX("VX", "보조용언", "auxiliary predicate"),
    VCP("VCP", "긍정지정사", "positive copula"),
    VCN("VCN", "부정지정사", "negative copula"),

    // Modifiers
    MM("MM", "관형사", "determiner"),
    MAG("MAG", "일반부사", "general adverb"),
    MAJ("MAJ", "접속부사", "conjunctive adverb"),

    // Interjection
    IC("IC", "감탄사", "interjection"),

    // Particles (조사)
    JKS("JKS", "주격조사", "subject particle"),
    JKC("JKC", "보격조사", "complement particle"),
    JKG("JKG", "관형격조사", "genitive particle"),
    JKO("JKO", "목적격조사", "object particle"),
    JKB("JKB", "부사격조사", "adverbial particle"),
    JKV("JKV", "호격조사", "vocative particle"),
    JKQ("JKQ", "인용격조사", "quotative particle"),
    JX("JX", "보조사", "auxiliary particle"),
    JC("JC", "접속조사", "conjunctive particle"),

    // Endings (어미)
    EP("EP", "선어말어미", "pre-final ending"),
    EF("EF", "종결어미", "final ending"),
    EC("EC", "연결어미", "connective ending"),
    ETN("ETN", "명사형전성어미", "nominal ending"),
    ETM("ETM", "관형형전성어미", "adnominal ending"),

    // Affixes
    XPN("XPN", "체언접두사", "nominal prefix"),
    XSN("XSN", "명사파생접미사", "nominal derivational suffix"),
    XSV("XSV", "동사파생접미사", "verbal derivational suffix"),
    XSA("XSA", "형용사파생접미사", "adjectival derivational suffix"),
    XR("XR", "어근", "root morpheme"),

    // Symbols & foreign
    SF("SF", "마침표", "sentence-final punctuation"),
    SP("SP", "쉼표", "comma"),
    SS("SS", "따옴표/괄호", "quotation mark / bracket"),
    SE("SE", "줄임표", "ellipsis"),
    SO("SO", "붙임표", "dash"),
    SW("SW", "기타기호", "other symbol"),
    SL("SL", "외국어", "foreign word"),
    SH("SH", "한자", "Chinese character"),
    SN("SN", "숫자", "number"),

    UNKNOWN("UNKNOWN", "미분류", "unknown");

    companion object {
        private val byTag = entries.associateBy { it.tag }
        fun fromTag(tag: String): PartOfSpeech = byTag[tag] ?: UNKNOWN
    }
}
