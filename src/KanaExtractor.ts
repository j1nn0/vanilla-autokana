import { canonicalizeKana } from './KanaConverter';

// Matches anything that is NOT kana to be kept: spaces, hiragana, full-width katakana,
// iteration marks, combining dakuten/handakuten, long-vowel marks, or half-width katakana.
// eslint-disable-next-line no-irregular-whitespace
const EXTRACTION_PATTERN = /[^ 　ぁ-ゖゝゞァ-ヺヽヾー゙゚ｦ-ﾟ]/g;

// Same character class as EXTRACTION_PATTERN, non-global, used to test whether a string
// contains any non-kana character (a signal that an IME conversion produced kanji).
const CONTAINS_NON_KANA_PATTERN = /[^ 　ぁ-ゖゝゞァ-ヺヽヾー゙゚ｦ-ﾟ]/;

// Small kana removed from 正規かな to compare lengths during conversion detection. The input
// has already passed through かな抽出 (Kana Extraction), so canonicalization is not repeated.
// They are appended to a preceding kana during typing, so counting them would distort the
// length diff used by detectAndCommitConversion (小さなかな除去 / Kana Compacting).
const COMPACTING_PATTERN = /[ぁぃぅぇぉっゃゅょ]/g;

export function extractKana(input: string): string {
  return canonicalizeKana(input.replace(EXTRACTION_PATTERN, ''));
}

export function compactKana(input: string): string {
  return input.replace(COMPACTING_PATTERN, '');
}

export function containsNonKana(input: string): boolean {
  return input.search(CONTAINS_NON_KANA_PATTERN) !== -1;
}
