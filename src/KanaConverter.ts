import { fullToHalfKatakanaMap } from './katakanaMap';

/** Output format for furigana. `'hiragana'` = hiragana, `'full'` = full-width katakana, `'half'` = half-width katakana. */
export type KatakanaOption = 'hiragana' | 'full' | 'half';

const KATAKANA_START = 0x30a1; // ァ U+30A1
const KATAKANA_END = 0x30f6; // ヶ U+30F6
const KATAKANA_TO_HIRAGANA_OFFSET = 0x60;
const KATAKANA_TO_HIRAGANA_EXCEPTIONS: Record<string, string> = {
  ヽ: 'ゝ',
  ヾ: 'ゞ',
  ヷ: 'わ゙',
  ヸ: 'ゐ゙',
  ヹ: 'ゑ゙',
  ヺ: 'を゙',
};
const HALF_WIDTH_KATAKANA_PATTERN = /[\uFF66-\uFF9F]+/g;

// Hiragana block boundaries used to decide which characters get shifted to katakana.
const HIRAGANA_START = 12353; // ぁ U+3041
const HIRAGANA_END = 12438; // ゖ U+3096 (last canonical hiragana, small ke)
const HIRAGANA_ITERATION_MARK = 12445; // ゝ U+309D
const HIRAGANA_VOICED_ITERATION_MARK = 12446; // ゞ U+309E

// Distance from a hiragana code point to its katakana counterpart (U+30A1 − U+3041 = 96).
const HIRAGANA_TO_KATAKANA_OFFSET = 96;

function isHiragana(charCode: number): boolean {
  return (
    (charCode >= HIRAGANA_START && charCode <= HIRAGANA_END) ||
    charCode === HIRAGANA_ITERATION_MARK ||
    charCode === HIRAGANA_VOICED_ITERATION_MARK
  );
}

function canonicalizeHalfWidthKatakana(src: string): string {
  return src.replace(HALF_WIDTH_KATAKANA_PATTERN, (segment) => segment.normalize('NFKC'));
}

/** Canonicalize accepted kana forms to the canonical hiragana representation. */
export function canonicalizeKana(src: string): string {
  const fullWidth = canonicalizeHalfWidthKatakana(src);
  let canonical = '';

  for (const char of fullWidth) {
    const charCode = char.charCodeAt(0);
    if (charCode >= KATAKANA_START && charCode <= KATAKANA_END) {
      canonical += String.fromCharCode(charCode - KATAKANA_TO_HIRAGANA_OFFSET);
      continue;
    }
    canonical += KATAKANA_TO_HIRAGANA_EXCEPTIONS[char] ?? char;
  }

  return canonical;
}

/** Convert hiragana and full-width katakana into the requested output format. */
export function toKatakana(src: string, option: KatakanaOption): string {
  if (option === 'hiragana') {
    return src;
  }

  let str = '';
  for (let i = 0; i < src.length; i += 1) {
    const charCode = src.charCodeAt(i);
    const char = isHiragana(charCode)
      ? String.fromCharCode(charCode + HIRAGANA_TO_KATAKANA_OFFSET)
      : src.charAt(i);
    str += option === 'half' ? (fullToHalfKatakanaMap[char] ?? char) : char;
  }

  // Half-width katakana output converts the full-width space (U+3000) to a half-width space,
  // matching the ASCII spacing convention of half-width katakana fields.
  return option === 'half' && str.indexOf('\u3000') !== -1 ? str.replace(/\u3000/g, ' ') : str;
}
