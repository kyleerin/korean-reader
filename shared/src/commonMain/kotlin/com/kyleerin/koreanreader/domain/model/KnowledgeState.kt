package com.kyleerin.koreanreader.domain.model

enum class KnowledgeState {
    /** Never encountered before — shown as unknown color. */
    NEW,
    /** User is actively studying this word. */
    LEARNING,
    /** User has marked this word as known. */
    KNOWN,
    /** User chose to skip tracking (e.g. proper nouns, irrelevant words). */
    IGNORED
}
