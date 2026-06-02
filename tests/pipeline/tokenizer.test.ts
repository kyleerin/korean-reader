import { describe, expect, it } from 'vitest';
import { segmentSentences, splitEojeols } from '../../src/pipeline/tokenizer';

describe('segmentSentences', () => {
  it('returns single sentence without punctuation', () => {
    expect(segmentSentences('저는 학생입니다')).toEqual(['저는 학생입니다']);
  });

  it('splits on period', () => {
    const result = segmentSentences('안녕하세요. 저는 학생입니다.');
    expect(result).toHaveLength(2);
    expect(result[0]).toBe('안녕하세요.');
    expect(result[1]).toBe('저는 학생입니다.');
  });

  it('splits on question mark', () => {
    const result = segmentSentences('어디 가세요? 저는 학교에 가요.');
    expect(result).toHaveLength(2);
    expect(result[0]).toBe('어디 가세요?');
    expect(result[1]).toBe('저는 학교에 가요.');
  });

  it('splits on exclamation mark', () => {
    const result = segmentSentences('와! 정말 맛있어요.');
    expect(result).toHaveLength(2);
    expect(result[0]).toBe('와!');
  });

  it('treats newline as sentence boundary', () => {
    const result = segmentSentences('첫 번째 문장\n두 번째 문장');
    expect(result).toHaveLength(2);
    expect(result[0]).toBe('첫 번째 문장');
    expect(result[1]).toBe('두 번째 문장');
  });

  it('returns empty for blank input', () => {
    expect(segmentSentences('')).toEqual([]);
    expect(segmentSentences('   ')).toEqual([]);
  });

  it('does not produce empty sentences from trailing ellipsis', () => {
    const result = segmentSentences('그래서... 모르겠어요.');
    expect(result.every(s => s.trim().length > 0)).toBe(true);
  });
});

describe('splitEojeols', () => {
  it('splits on whitespace', () => {
    expect(splitEojeols('나는 밥을 먹었어요')).toEqual(['나는', '밥을', '먹었어요']);
  });

  it('collapses multiple spaces', () => {
    expect(splitEojeols('나는  밥을   먹었어요')).toEqual(['나는', '밥을', '먹었어요']);
  });

  it('returns empty for blank input', () => {
    expect(splitEojeols('')).toEqual([]);
    expect(splitEojeols('   ')).toEqual([]);
  });
});
