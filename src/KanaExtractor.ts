import { canonicalizeKana } from './KanaConverter';

// Matches anything that is NOT kana to be kept: spaces, hiragana, full-width katakana,
// iteration marks, combining dakuten/handakuten, long-vowel marks, or half-width katakana.
// eslint-disable-next-line no-irregular-whitespace
const EXTRACTION_PATTERN = /[^ 　ぁ-ゖゝゞァ-ヺヽヾー゙゚ｦ-ﾟ]/g;

export function extractKana(input: string): string {
  return canonicalizeKana(input.replace(EXTRACTION_PATTERN, ''));
}
