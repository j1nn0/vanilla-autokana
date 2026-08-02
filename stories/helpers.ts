import type { KatakanaOption } from '../src/index';

/** Label for the furigana output field per output format (出力形式). Undefined means the hiragana default. */
export function getModeLabel(katakana: KatakanaOption | undefined): string {
  if (katakana === 'full') return 'カタカナ（全角）';
  if (katakana === 'half') return 'カタカナ（半角）';
  return 'ふりがな';
}

export const CONTAINER_STYLE =
  'max-width:360px;padding:24px;font-family:system-ui,sans-serif;background:#fafafa;border:1px solid #eee;border-radius:8px;';
export const FIELD_STYLE =
  'box-sizing:border-box;width:100%;padding:8px 12px;font-size:16px;border:1px solid #ccc;border-radius:4px;outline:none;';
export const LABEL_STYLE = 'display:block;margin-bottom:4px;font-size:13px;color:#555;';
export const FIELD_WRAP_STYLE = 'margin-bottom:12px;';
