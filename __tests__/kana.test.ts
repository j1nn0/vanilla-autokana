import { describe, expect, test } from 'vitest';
import { compactKana, containsNonKana, extractKana } from '../src/KanaExtractor';
import { toKatakana } from '../src/KanaConverter';
import { fullToHalfKatakanaMap } from '../src/katakanaMap';

describe('kana extraction', () => {
  test('extract removes non-kana characters', () => {
    expect(extractKana('yamadaやまだ')).toBe('やまだ');
    expect(extractKana('山田やまだ')).toBe('やまだ');
    expect(extractKana('やまだ')).toBe('やまだ');
  });

  test('extract preserves full-width spaces', () => {
    expect(extractKana('やまだ　たろう')).toBe('やまだ　たろう');
  });

  test('compact removes small kana', () => {
    expect(compactKana('ぁぃぅぇぉっゃゅょ')).toBe('');
    expect(compactKana('やまだ')).toBe('やまだ');
  });

  test('containsNonKana detects non-kana characters', () => {
    expect(containsNonKana('yamada')).toBe(true);
    expect(containsNonKana('やまだ')).toBe(false);
    expect(containsNonKana('山田')).toBe(true);
  });

  test('containsNonKana works correctly on consecutive calls', () => {
    // Regression guard: the old /g regex with .test() mutated lastIndex.
    expect(containsNonKana('やまだ')).toBe(false);
    expect(containsNonKana('やまだ')).toBe(false);
    expect(containsNonKana('山田')).toBe(true);
    expect(containsNonKana('山田')).toBe(true);
  });
});

describe('kana conversion', () => {
  test('converts basic hiragana to half-width katakana', () => {
    expect(toKatakana('あいうえお', 'half')).toBe('ｱｲｳｴｵ');
    expect(toKatakana('かきくけこ', 'half')).toBe('ｶｷｸｹｺ');
    expect(toKatakana('がぎぐげご', 'half')).toBe('ｶﾞｷﾞｸﾞｹﾞｺﾞ');
    expect(toKatakana('ぱぴぷぺぽ', 'half')).toBe('ﾊﾟﾋﾟﾌﾟﾍﾟﾎﾟ');
    expect(toKatakana('っゃゅょ', 'half')).toBe('ｯｬｭｮ');
    expect(toKatakana('ん', 'half')).toBe('ﾝ');
    expect(toKatakana('ー', 'half')).toBe('ｰ');
    expect(toKatakana('ヰ', 'half')).toBe('ｲ');
    expect(toKatakana('ヱ', 'half')).toBe('ｴ');
    expect(toKatakana('ヺ', 'half')).toBe('ｦﾞ');
    expect(toKatakana('。', 'half')).toBe('｡');
    expect(toKatakana('、', 'half')).toBe('､');
  });

  test('converts hiragana to full-width katakana', () => {
    expect(toKatakana('あいうえお', 'full')).toBe('アイウエオ');
  });

  test('keeps hiragana as-is', () => {
    expect(toKatakana('あいうえお', 'hiragana')).toBe('あいうえお');
  });

  test('handles vu hiragana', () => {
    expect(toKatakana('ゔぁ', 'full')).toBe('ヴァ');
    expect(toKatakana('ゔぁ', 'half')).toBe('ｳﾞｧ');
  });
});

describe('fullToHalfKatakanaMap', () => {
  test('map entries are bijectively correct', () => {
    for (const [full, half] of Object.entries(fullToHalfKatakanaMap)) {
      const converted = toKatakana(full, 'half');
      expect(converted).toBe(half);
    }
  });

  test('special characters are correctly mapped', () => {
    expect(fullToHalfKatakanaMap['ヴ']).toBe('ｳﾞ');
    expect(fullToHalfKatakanaMap['ヺ']).toBe('ｦﾞ');
    expect(fullToHalfKatakanaMap['ヰ']).toBe('ｲ');
    expect(fullToHalfKatakanaMap['ヱ']).toBe('ｴ');
    expect(fullToHalfKatakanaMap['。']).toBe('｡');
    expect(fullToHalfKatakanaMap['、']).toBe('､');
  });

  test('map has 87 entries', () => {
    expect(Object.keys(fullToHalfKatakanaMap)).toHaveLength(87);
  });
});
