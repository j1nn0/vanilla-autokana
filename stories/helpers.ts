import type { CSSProperties } from 'react';
import type { KatakanaOption } from '../src/index';

/** Label for the furigana output field per output format (出力形式). Undefined means the hiragana default. */
export function getModeLabel(katakana: KatakanaOption | undefined): string {
  if (katakana === 'full') return 'カタカナ（全角）';
  if (katakana === 'half') return 'カタカナ（半角）';
  return 'ふりがな';
}

// Style values shared by the example stories. The objects are the single source of
// truth; the cssText strings are derived from them (React uses the objects, HTML/Vue
// use the strings).
export const CONTAINER_STYLE_OBJECT = {
  maxWidth: '360px',
  padding: '24px',
  fontFamily: 'system-ui, sans-serif',
  background: '#fafafa',
  border: '1px solid #eee',
  borderRadius: '8px',
} satisfies CSSProperties;

export const FIELD_STYLE_OBJECT = {
  boxSizing: 'border-box',
  width: '100%',
  padding: '8px 12px',
  fontSize: '16px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  outline: 'none',
} satisfies CSSProperties;

export const LABEL_STYLE_OBJECT = {
  display: 'block',
  marginBottom: '4px',
  fontSize: '13px',
  color: '#555',
} satisfies CSSProperties;

export const FIELD_WRAP_STYLE_OBJECT = {
  marginBottom: '12px',
} satisfies CSSProperties;

function toCssText(style: Record<string, string | number>): string {
  return (
    Object.entries(style)
      .map(([key, value]) => `${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}:${value}`)
      .join(';') + ';'
  );
}

export const CONTAINER_STYLE = toCssText(CONTAINER_STYLE_OBJECT);
export const FIELD_STYLE = toCssText(FIELD_STYLE_OBJECT);
export const LABEL_STYLE = toCssText(LABEL_STYLE_OBJECT);
export const FIELD_WRAP_STYLE = toCssText(FIELD_WRAP_STYLE_OBJECT);
