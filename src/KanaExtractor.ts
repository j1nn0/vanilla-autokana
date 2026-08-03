import { canonicalizeKana } from './KanaConverter';

// Matches anything that is NOT kana to be kept: spaces, hiragana, full-width katakana,
// iteration marks, combining dakuten/handakuten, long-vowel marks, or half-width katakana.
// eslint-disable-next-line no-irregular-whitespace
const EXTRACTION_PATTERN = /[^ 　ぁ-ゖゝゞァ-ヺヽヾー゙゚ｦ-ﾟ]/g;

/**
 * かな抽出（Kana Extraction）: filter a raw input string to keep only supported kana characters
 * and spaces. The result is not canonicalized; use {@link canonicalizeKana} from
 * `KanaConverter` to normalize accepted kana to 正規かな（Canonical Kana）.
 */
export function extractRawKana(input: string): string {
  return input.replace(EXTRACTION_PATTERN, '');
}

/**
 * Extract supported kana from a raw input and canonicalize the result to 正規かな.
 * This is a convenience facade over {@link extractRawKana} + {@link canonicalizeKana}; the
 * canonicalization seam lives in `KanaConverter`.
 */
export function extractKana(input: string): string {
  return canonicalizeKana(extractRawKana(input));
}
