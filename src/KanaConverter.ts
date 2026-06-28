import { fullToHalfKatakanaMap } from './katakanaMap';
import type { KatakanaOption } from './AutoKana';

// Hiragana block boundaries used to decide which characters get shifted to katakana.
const HIRAGANA_START = 12353; // ぁ U+3041
const HIRAGANA_END = 12436; // ゔ U+3094 (last regular hiragana, vu)
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

export class KanaConverter {
  static toKatakana(src: string, option: KatakanaOption): string {
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

    // Half-width katakana output normalizes the full-width space (　) to a half-width space,
    // matching the ASCII spacing convention of half-width katakana fields.
    // eslint-disable-next-line no-irregular-whitespace
    return option === 'half' && str.indexOf('　') !== -1 ? str.replace(/　/g, ' ') : str;
  }
}
