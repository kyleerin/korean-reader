package com.kyleerin.koreanreader.pipeline

import com.kyleerin.koreanreader.dictionary.DictionaryRepository
import com.kyleerin.koreanreader.domain.model.*
import com.kyleerin.koreanreader.knowledge.KnowledgeRepository

/**
 * Orchestrates the full reading pipeline:
 *   raw text → sentence segmentation → morphological analysis → lemma lookup
 *   → dictionary enrichment → knowledge-state annotation → [AnalyzedText]
 *
 * Call [analyze] once per page/screen; cache the result in the local DB via
 * token_cache so re-opening a text is instant.
 */
class ReadingPipeline(
    private val analyzer: MorphologicalAnalyzer,
    private val dictionary: DictionaryRepository,
    private val knowledge: KnowledgeRepository
) {
    suspend fun analyze(text: String): AnalyzedText {
        val sentences = Tokenizer.segmentSentences(text)
        val analyzed = sentences.map { sentence ->
            val eojeolMorphemesList = analyzer.analyze(sentence)
            AnalyzedSentence(eojeolMorphemesList.map { analyzeEojeol(it) })
        }
        return AnalyzedText(analyzed)
    }

    private suspend fun analyzeEojeol(raw: EojeolMorphemes): AnalyzedEojeol {
        val morphemes = raw.morphemes.map { morpheme ->
            analyzeMorpheme(morpheme, raw.morphemes)
        }
        return AnalyzedEojeol(raw.surface, morphemes)
    }

    private suspend fun analyzeMorpheme(
        morpheme: com.kyleerin.koreanreader.domain.model.Morpheme,
        eojeolContext: List<com.kyleerin.koreanreader.domain.model.Morpheme>
    ): AnalyzedMorpheme {
        val type = MorphemeClassifier.classify(morpheme.pos)
        return if (type == MorphemeType.CONTENT) {
            val lemma = LemmaReconstructor.reconstruct(morpheme.surface, morpheme.pos)
            val entry = dictionary.lookup(lemma, morpheme.pos)
            val state = knowledge.getState(lemma, morpheme.pos)
            AnalyzedMorpheme(
                surface = morpheme.surface,
                lemma = lemma,
                pos = morpheme.pos,
                type = type,
                definitions = entry?.definitions ?: emptyList(),
                state = state,
                eojeolContext = eojeolContext
            )
        } else {
            AnalyzedMorpheme(
                surface = morpheme.surface,
                lemma = morpheme.surface,
                pos = morpheme.pos,
                type = type
            )
        }
    }
}
