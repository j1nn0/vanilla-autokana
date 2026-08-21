import { describe, expect, test } from 'vitest';
import { resolveOptionalKanaElement } from '../src/ElementResolver';

describe('resolveOptionalKanaElement', () => {
  test('returns undefined when the selector is undefined', () => {
    document.body.innerHTML = '';

    expect(resolveOptionalKanaElement(undefined)).toBeUndefined();
  });

  test('returns undefined when the selector is an empty string', () => {
    document.body.innerHTML = '';

    expect(resolveOptionalKanaElement('')).toBeUndefined();
  });

  test('returns undefined when the ID does not resolve to an element', () => {
    document.body.innerHTML = '<input id="name">';

    expect(resolveOptionalKanaElement('missing')).toBeUndefined();
  });

  test('returns undefined when the CSS selector does not resolve to an element', () => {
    document.body.innerHTML = '<input id="name">';

    expect(resolveOptionalKanaElement('.nonexistent')).toBeUndefined();
  });

  test('returns a KanaElement when the ID resolves to an input', () => {
    document.body.innerHTML = '<input id="furigana">';
    const input = document.querySelector<HTMLInputElement>('#furigana')!;

    expect(resolveOptionalKanaElement('furigana')).toBe(input);
  });

  test('returns the same HTMLInputElement when passed directly', () => {
    document.body.innerHTML = '<input id="furigana">';
    const input = document.querySelector<HTMLInputElement>('#furigana')!;

    expect(resolveOptionalKanaElement(input)).toBe(input);
  });

  test('returns the same HTMLTextAreaElement when passed directly', () => {
    document.body.innerHTML = '<textarea id="furigana"></textarea>';
    const textarea = document.querySelector<HTMLTextAreaElement>('#furigana')!;

    expect(resolveOptionalKanaElement(textarea)).toBe(textarea);
  });

  test('throws when passed a non-input or textarea element', () => {
    document.body.innerHTML = '<div id="not-kana"></div>';
    const div = document.querySelector<HTMLDivElement>('#not-kana')!;

    // @ts-expect-error - a non-Kana element is intentionally passed for runtime verification
    expect(() => resolveOptionalKanaElement(div)).toThrow(
      'AutoKana: Element must be an input or textarea',
    );
  });
});
