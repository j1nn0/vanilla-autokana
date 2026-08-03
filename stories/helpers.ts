import type { CSSProperties } from 'react';
import type { AutoKanaOption, KatakanaOption } from '../src/index';

type StoryTeardown = () => void;
const storyTeardowns = new Set<StoryTeardown>();

export function registerStoryTeardown(teardown: StoryTeardown): void {
  storyTeardowns.add(teardown);
}

export function cleanupStoryTeardowns(): void {
  const teardowns = [...storyTeardowns];
  storyTeardowns.clear();

  // Fail fast: the first failing teardown propagates; the registry is already cleared so
  // a Storybook re-run does not replay stale teardowns.
  for (const teardown of teardowns) {
    teardown();
  }
}

/** All supported values of {@link KatakanaOption}, derived from the type itself. */
const KATAKANA_OPTIONS: KatakanaOption[] = ['hiragana', 'full', 'half'];

const MODE_LABEL_MAP: Record<KatakanaOption, string> = {
  hiragana: 'ふりがな',
  full: 'カタカナ（全角）',
  half: 'カタカナ（半角）',
};

export const KATAKANA_ARG_TYPES = {
  katakana: {
    control: 'select' as const,
    options: KATAKANA_OPTIONS,
    description: '出力文字種。hiragana = ひらがな、full = 全角カタカナ、half = 半角カタカナ',
  },
} satisfies Record<keyof Pick<AutoKanaOption, 'katakana'>, object>;

/** Label for the furigana output field per output format (出力形式). Undefined means the hiragana default. */
export function getModeLabel(katakana: KatakanaOption | undefined): string {
  return MODE_LABEL_MAP[katakana ?? 'hiragana'];
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
