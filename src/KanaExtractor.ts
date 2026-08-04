import { canonicalizeKana } from './KanaConverter';

// Supported kana: spaces, hiragana, full-width katakana, iteration marks, combining dakuten/
// handakuten, long-vowel marks, and half-width katakana.
// eslint-disable-next-line no-irregular-whitespace
const UNSUPPORTED_KANA_PATTERN = /[^ 　ぁ-ゖゝゞァ-ヺヽヾー゙゚ｦ-ﾟ]/g;

/** Whether the string contains any character that かな抽出 would discard. */
export function containsUnsupportedKana(input: string): boolean {
  UNSUPPORTED_KANA_PATTERN.lastIndex = 0;
  return UNSUPPORTED_KANA_PATTERN.test(input);
}

/** かな抽出（Kana Extraction）: retain supported kana and normalize it to 正規かな. */
export function extractKana(input: string): string {
  return canonicalizeKana(input.replace(UNSUPPORTED_KANA_PATTERN, ''));
}
