package com.kyleerin.koreanreader.dictionary

import com.kyleerin.koreanreader.domain.model.DictionaryEntry
import com.kyleerin.koreanreader.domain.model.PartOfSpeech

interface DictionaryRepository {
    /** Primary lookup: exact lemma + POS match. Returns null when not found. */
    suspend fun lookup(lemma: String, pos: PartOfSpeech): DictionaryEntry?

    /** Returns all entries for a lemma regardless of POS (for homograph display). */
    suspend fun lookupAll(lemma: String): List<DictionaryEntry>
}
