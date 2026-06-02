package com.kyleerin.koreanreader.knowledge

import com.kyleerin.koreanreader.domain.model.KnowledgeState
import com.kyleerin.koreanreader.domain.model.PartOfSpeech
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow

class InMemoryKnowledgeRepository : KnowledgeRepository {
    private val states = mutableMapOf<Pair<String, PartOfSpeech>, KnowledgeState>()
    private val flows = mutableMapOf<Pair<String, PartOfSpeech>, MutableStateFlow<KnowledgeState>>()

    override suspend fun getState(lemma: String, pos: PartOfSpeech): KnowledgeState =
        states[lemma to pos] ?: KnowledgeState.NEW

    override suspend fun setState(lemma: String, pos: PartOfSpeech, state: KnowledgeState) {
        val key = lemma to pos
        states[key] = state
        flows[key]?.value = state
    }

    override suspend fun recordSeen(lemma: String, pos: PartOfSpeech) {
        val key = lemma to pos
        if (!states.containsKey(key)) states[key] = KnowledgeState.NEW
    }

    override fun observeState(lemma: String, pos: PartOfSpeech): Flow<KnowledgeState> {
        val key = lemma to pos
        return flows.getOrPut(key) {
            MutableStateFlow(states[key] ?: KnowledgeState.NEW)
        }
    }
}
