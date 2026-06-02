package com.kyleerin.koreanreader.srs

enum class Rating(val value: Int) {
    AGAIN(1),  // complete blackout / incorrect
    HARD(2),   // correct but very difficult
    GOOD(3),   // correct with some hesitation
    EASY(4)    // perfect recall
}
