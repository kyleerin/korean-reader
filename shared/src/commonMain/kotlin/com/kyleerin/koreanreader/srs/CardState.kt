package com.kyleerin.koreanreader.srs

enum class CardState {
    NEW,         // never reviewed
    LEARNING,    // within first-pass learning steps
    REVIEW,      // in the main spaced-repetition queue
    RELEARNING   // failed a review; being relearned
}
