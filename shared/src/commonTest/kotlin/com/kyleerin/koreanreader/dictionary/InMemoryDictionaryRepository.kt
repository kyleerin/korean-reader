package com.kyleerin.koreanreader.dictionary

import com.kyleerin.koreanreader.domain.model.DictionaryEntry
import com.kyleerin.koreanreader.domain.model.PartOfSpeech

class InMemoryDictionaryRepository(
    private val entries: Map<Pair<String, PartOfSpeech>, DictionaryEntry> = emptyMap()
) : DictionaryRepository {
    override suspend fun lookup(lemma: String, pos: PartOfSpeech): DictionaryEntry? =
        entries[lemma to pos]

    override suspend fun lookupAll(lemma: String): List<DictionaryEntry> =
        entries.filterKeys { it.first == lemma }.values.toList()
}
