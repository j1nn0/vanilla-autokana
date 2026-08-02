// Matches anything that is NOT kana to be kept: half-width space, full-width space (　),
// hiragana (ぁ..ゔ, U+3041..U+3094), or the long-vowel mark ー. Used to strip kanji,
// romaji, and symbols, leaving only the kana (and spaces) that form furigana.
// eslint-disable-next-line no-irregular-whitespace
const EXTRACTION_PATTERN = /[^ 　ぁあ-んゔー]/g;

// Same character class as EXTRACTION_PATTERN, non-global, used to test whether a string
// contains any non-kana character (a signal that an IME conversion produced kanji).
const CONTAINS_NON_KANA_PATTERN = /[^ 　ぁあ-んゔー]/;

// Small kana removed to normalize length before conversion detection. They are appended
// to a preceding kana during typing, so counting them would distort the length diff used
// by detectAndCommitConversion (小さなかな除去 / kana compacting).
const COMPACTING_PATTERN = /[ぁぃぅぇぉっゃゅょ]/g;

export function extractKana(input: string): string {
  return input.replace(EXTRACTION_PATTERN, '');
}

export function compactKana(input: string): string {
  return input.replace(COMPACTING_PATTERN, '');
}

export function containsNonKana(input: string): boolean {
  return input.search(CONTAINS_NON_KANA_PATTERN) !== -1;
}
