import { describe, expect, test } from 'vitest';
import { KanaExtractor } from '../src/KanaExtractor';
import { KanaConverter } from '../src/KanaConverter';
import { fullToHalfKatakanaMap } from '../src/katakanaMap';

describe('KanaExtractor', () => {
  test('extract removes non-kana characters', () => {
    expect(KanaExtractor.extract('yamadaやまだ')).toBe('やまだ');
    expect(KanaExtractor.extract('山田やまだ')).toBe('やまだ');
    expect(KanaExtractor.extract('やまだ')).toBe('やまだ');
  });

  test('extract preserves full-width spaces', () => {
    expect(KanaExtractor.extract('やまだ　たろう')).toBe('やまだ　たろう');
  });

  test('compact removes small kana', () => {
    expect(KanaExtractor.compact('ぁぃぅぇぉっゃゅょ')).toBe('');
    expect(KanaExtractor.compact('やまだ')).toBe('やまだ');
  });

  test('containsNonKana detects non-kana characters', () => {
    expect(KanaExtractor.containsNonKana('yamada')).toBe(true);
    expect(KanaExtractor.containsNonKana('やまだ')).toBe(false);
    expect(KanaExtractor.containsNonKana('山田')).toBe(true);
  });

  test('containsNonKana works correctly on consecutive calls', () => {
    // Regression guard: the old /g regex with .test() mutated lastIndex.
    expect(KanaExtractor.containsNonKana('やまだ')).toBe(false);
    expect(KanaExtractor.containsNonKana('やまだ')).toBe(false);
    expect(KanaExtractor.containsNonKana('山田')).toBe(true);
    expect(KanaExtractor.containsNonKana('山田')).toBe(true);
  });
});

describe('KanaConverter', () => {
  test('toKatakana converts basic hiragana to half-width katakana', () => {
    expect(KanaConverter.toKatakana('あいうえお', 'half')).toBe('ｱｲｳｴｵ');
    expect(KanaConverter.toKatakana('かきくけこ', 'half')).toBe('ｶｷｸｹｺ');
    expect(KanaConverter.toKatakana('がぎぐげご', 'half')).toBe('ｶﾞｷﾞｸﾞｹﾞｺﾞ');
    expect(KanaConverter.toKatakana('ぱぴぷぺぽ', 'half')).toBe('ﾊﾟﾋﾟﾌﾟﾍﾟﾎﾟ');
    expect(KanaConverter.toKatakana('っゃゅょ', 'half')).toBe('ｯｬｭｮ');
    expect(KanaConverter.toKatakana('ん', 'half')).toBe('ﾝ');
    expect(KanaConverter.toKatakana('ー', 'half')).toBe('ｰ');
    expect(KanaConverter.toKatakana('ヰ', 'half')).toBe('ｲ');
    expect(KanaConverter.toKatakana('ヱ', 'half')).toBe('ｴ');
    expect(KanaConverter.toKatakana('ヺ', 'half')).toBe('ｦﾞ');
    expect(KanaConverter.toKatakana('。', 'half')).toBe('｡');
    expect(KanaConverter.toKatakana('、', 'half')).toBe('､');
  });

  test('toKatakana converts hiragana to full-width katakana', () => {
    expect(KanaConverter.toKatakana('あいうえお', 'full')).toBe('アイウエオ');
  });

  test('toKatakana keeps hiragana as-is', () => {
    expect(KanaConverter.toKatakana('あいうえお', 'hiragana')).toBe('あいうえお');
  });

  test('toKatakana handles vu hiragana', () => {
    expect(KanaConverter.toKatakana('ゔぁ', 'full')).toBe('ヴァ');
    expect(KanaConverter.toKatakana('ゔぁ', 'half')).toBe('ｳﾞｧ');
  });
});

describe('fullToHalfKatakanaMap', () => {
  test('map entries are bijectively correct', () => {
    for (const [full, half] of Object.entries(fullToHalfKatakanaMap)) {
      const converted = KanaConverter.toKatakana(full, 'half');
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
