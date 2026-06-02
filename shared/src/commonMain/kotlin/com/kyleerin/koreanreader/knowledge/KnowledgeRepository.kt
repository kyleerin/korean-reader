package com.kyleerin.koreanreader.knowledge

import com.kyleerin.koreanreader.domain.model.KnowledgeState
import com.kyleerin.koreanreader.domain.model.PartOfSpeech
import kotlinx.coroutines.flow.Flow

interface KnowledgeRepository {
    /** Returns the current state, defaulting to [KnowledgeState.NEW] for unseen words. */
    suspend fun getState(lemma: String, pos: PartOfSpeech): KnowledgeState

    /** Persists a state change and triggers a recolor of open texts. */
    suspend fun setState(lemma: String, pos: PartOfSpeech, state: KnowledgeState)

    /** Records a sighting without changing the state (increments times_seen). */
    suspend fun recordSeen(lemma: String, pos: PartOfSpeech)

    /** Hot flow for live recoloring when the user updates a word's state mid-reading. */
    fun observeState(lemma: String, pos: PartOfSpeech): Flow<KnowledgeState>
}
