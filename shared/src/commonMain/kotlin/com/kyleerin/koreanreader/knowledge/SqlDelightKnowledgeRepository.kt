package com.kyleerin.koreanreader.knowledge

import app.cash.sqldelight.coroutines.asFlow
import app.cash.sqldelight.coroutines.mapToOneOrNull
import com.kyleerin.koreanreader.db.KoreanReaderDb
import com.kyleerin.koreanreader.domain.model.KnowledgeState
import com.kyleerin.koreanreader.domain.model.PartOfSpeech
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.map

class SqlDelightKnowledgeRepository(
    private val db: KoreanReaderDb,
    private val nowMillis: () -> Long
) : KnowledgeRepository {

    override suspend fun getState(lemma: String, pos: PartOfSpeech): KnowledgeState =
        db.userWordStateQueries
            .getStatus(lemma, pos.tag)
            .executeAsOneOrNull()
            ?.toKnowledgeState()
            ?: KnowledgeState.NEW

    override suspend fun setState(lemma: String, pos: PartOfSpeech, state: KnowledgeState) {
        val now = nowMillis()
        db.userWordStateQueries.upsertWithStatus(
            lemma = lemma,
            pos = pos.tag,
            status = state.name,
            first_seen = now,
            last_seen = now
        )
    }

    override suspend fun recordSeen(lemma: String, pos: PartOfSpeech) {
        val now = nowMillis()
        db.userWordStateQueries.upsertOnSeen(
            lemma = lemma,
            pos = pos.tag,
            first_seen = now,
            last_seen = now
        )
    }

    override fun observeState(lemma: String, pos: PartOfSpeech): Flow<KnowledgeState> =
        db.userWordStateQueries
            .getStatus(lemma, pos.tag)
            .asFlow()
            .mapToOneOrNull(Dispatchers.Default)
            .map { it?.toKnowledgeState() ?: KnowledgeState.NEW }
            .distinctUntilChanged()

    private fun String.toKnowledgeState(): KnowledgeState =
        try { KnowledgeState.valueOf(this) } catch (_: IllegalArgumentException) { KnowledgeState.NEW }
}
