package com.kyleerin.koreanreader.pipeline

/**
 * Splits raw Korean text into sentences and eojeols (space-delimited units).
 *
 * Sentence segmentation is punctuation-based. The analyzer is then called once per
 * sentence so it can use intra-sentence context without loading the whole document.
 */
object Tokenizer {

    private val SENTENCE_ENDERS = setOf('.', '!', '?', '。', '？', '！')
    private val WHITESPACE = Regex("\\s+")

    fun segmentSentences(text: String): List<String> {
        val normalized = text.trim()
        if (normalized.isEmpty()) return emptyList()

        val result = mutableListOf<String>()
        var start = 0
        var i = 0

        while (i < normalized.length) {
            val ch = normalized[i]
            when {
                ch in SENTENCE_ENDERS -> {
                    // Swallow trailing ellipsis dots so "…" doesn't produce empty sentences.
                    var end = i + 1
                    while (end < normalized.length && normalized[end] == '.') end++
                    val sentence = normalized.substring(start, end).trim()
                    if (sentence.isNotBlank()) result.add(sentence)
                    // Skip whitespace between sentences
                    while (end < normalized.length && normalized[end] == ' ') end++
                    start = end
                    i = end
                }
                ch == '\n' -> {
                    val sentence = normalized.substring(start, i).trim()
                    if (sentence.isNotBlank()) result.add(sentence)
                    start = i + 1
                    i = start
                }
                else -> i++
            }
        }

        if (start < normalized.length) {
            val remaining = normalized.substring(start).trim()
            if (remaining.isNotBlank()) result.add(remaining)
        }

        return result
    }

    fun splitEojeols(text: String): List<String> =
        text.split(WHITESPACE).filter { it.isNotBlank() }
}
