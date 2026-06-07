import { fullToHalfKatakanaMap } from './katakanaMap';
import type { KatakanaOption } from './AutoKana';

const HIRAGANA_START = 12353; // ぁ
const HIRAGANA_END = 12436; // ゔ
const HIRAGANA_ITERATION_MARK = 12445; // ゝ
const HIRAGANA_VOICED_ITERATION_MARK = 12446; // ゞ

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
      const char = isHiragana(charCode) ? String.fromCharCode(charCode + 96) : src.charAt(i);
      str += option === 'half' ? (fullToHalfKatakanaMap[char] ?? char) : char;
    }

    return str;
  }
}
