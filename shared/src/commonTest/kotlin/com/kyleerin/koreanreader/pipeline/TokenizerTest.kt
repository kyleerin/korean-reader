package com.kyleerin.koreanreader.pipeline

import kotlin.test.Test
import kotlin.test.assertEquals

class TokenizerTest {

    @Test
    fun singleSentenceWithoutPunctuation() {
        assertEquals(
            listOf("저는 학생입니다"),
            Tokenizer.segmentSentences("저는 학생입니다")
        )
    }

    @Test
    fun twoSentencesSeparatedByPeriod() {
        val result = Tokenizer.segmentSentences("안녕하세요. 저는 학생입니다.")
        assertEquals(2, result.size)
        assertEquals("안녕하세요.", result[0])
        assertEquals("저는 학생입니다.", result[1])
    }

    @Test
    fun questionMark() {
        val result = Tokenizer.segmentSentences("어디 가세요? 저는 학교에 가요.")
        assertEquals(2, result.size)
        assertEquals("어디 가세요?", result[0])
        assertEquals("저는 학교에 가요.", result[1])
    }

    @Test
    fun exclamationMark() {
        val result = Tokenizer.segmentSentences("와! 정말 맛있어요.")
        assertEquals(2, result.size)
        assertEquals("와!", result[0])
    }

    @Test
    fun newlineIsSentenceBoundary() {
        val result = Tokenizer.segmentSentences("첫 번째 문장\n두 번째 문장")
        assertEquals(2, result.size)
        assertEquals("첫 번째 문장", result[0])
        assertEquals("두 번째 문장", result[1])
    }

    @Test
    fun emptyTextReturnsEmptyList() {
        assertEquals(emptyList(), Tokenizer.segmentSentences(""))
        assertEquals(emptyList(), Tokenizer.segmentSentences("   "))
    }

    @Test
    fun splitEojeolsOnWhitespace() {
        assertEquals(
            listOf("나는", "밥을", "먹었어요"),
            Tokenizer.splitEojeols("나는 밥을 먹었어요")
        )
    }

    @Test
    fun splitEojeolsIgnoresExtraWhitespace() {
        assertEquals(
            listOf("나는", "밥을", "먹었어요"),
            Tokenizer.splitEojeols("나는  밥을   먹었어요")
        )
    }

    @Test
    fun splitEojeolsEmptyReturnsEmpty() {
        assertEquals(emptyList(), Tokenizer.splitEojeols(""))
        assertEquals(emptyList(), Tokenizer.splitEojeols("   "))
    }
}
