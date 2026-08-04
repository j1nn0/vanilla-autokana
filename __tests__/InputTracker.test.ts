import { describe, expect, test } from 'vitest';
import { InputTracker } from '../src/InputTracker';

describe('InputTracker', () => {
  test('apply() returns the current furigana and clears state for empty input', () => {
    const tracker = new InputTracker('hiragana');

    expect(tracker.apply({ type: 'input', raw: 'やまだ' })).toEqual({
      furigana: 'やまだ',
      notify: false,
    });
    expect(tracker.apply({ type: 'input', raw: '' })).toEqual({ furigana: '', notify: false });
  });

  test('extracts kana from mixed input', () => {
    const tracker = new InputTracker('hiragana');
    expect(tracker.apply({ type: 'input', raw: 'yamadaやまだ' })).toEqual({
      furigana: 'やまだ',
      notify: false,
    });
  });

  test('input transition canonicalizes full-width and half-width katakana', () => {
    const tracker = new InputTracker('hiragana');

    expect(tracker.apply({ type: 'input', raw: 'ヤマダ' })).toEqual({
      furigana: 'やまだ',
      notify: false,
    });
    expect(tracker.apply({ type: 'input', raw: 'ﾀﾛｳ' })).toEqual({
      furigana: 'たろう',
      notify: false,
    });
  });

  test('emits the configured katakana format', () => {
    const tracker = new InputTracker('full');
    expect(tracker.apply({ type: 'input', raw: 'やまだ' })).toEqual({
      furigana: 'ヤマダ',
      notify: false,
    });
  });

  test('compositionend transition processes the current raw input atomically', () => {
    const tracker = new InputTracker('hiragana');

    tracker.apply({ type: 'compositionstart' });
    tracker.apply({ type: 'input', raw: 'やまだ' });
    expect(tracker.apply({ type: 'compositionend', raw: '山田' })).toEqual({
      furigana: 'やまだ',
      notify: false,
    });
    expect(tracker.apply({ type: 'input', raw: '山田たろう' })).toEqual({
      furigana: 'やまだたろう',
      notify: false,
    });
  });

  test('blur transition leaves pending kana untouched and ends composition mode', () => {
    const tracker = new InputTracker('hiragana');

    tracker.apply({ type: 'compositionstart' });
    tracker.apply({ type: 'input', raw: 'やまだ' });
    expect(tracker.apply({ type: 'blur' })).toEqual({ furigana: 'やまだ', notify: false });
    expect(tracker.apply({ type: 'input', raw: 'やま' })).toEqual({
      furigana: 'やま',
      notify: false,
    });
  });

  test('focus transition returns the adopted furigana without a follow-up input', () => {
    const tracker = new InputTracker('hiragana');

    expect(tracker.apply({ type: 'focus', raw: '山田', committedSeed: 'やまだ' })).toEqual({
      furigana: 'やまだ',
      notify: false,
    });
  });

  test('focus transition clears all state when the raw input is empty', () => {
    const tracker = new InputTracker('hiragana');

    expect(tracker.apply({ type: 'focus', raw: '', committedSeed: 'やまだ' })).toEqual({
      furigana: '',
      notify: false,
    });
  });

  test('focus transition canonicalizes full-width and half-width output seeds', () => {
    const tracker = new InputTracker('hiragana');

    expect(tracker.apply({ type: 'focus', raw: '山田', committedSeed: 'ヤマダ' })).toEqual({
      furigana: 'やまだ',
      notify: false,
    });
    expect(tracker.apply({ type: 'focus', raw: '太郎', committedSeed: 'ﾀﾛｳ' })).toEqual({
      furigana: 'たろう',
      notify: false,
    });
  });

  test('focus transition without a seed leaves committed kana untouched', () => {
    const tracker = new InputTracker('hiragana');
    tracker.apply({ type: 'compositionstart' });
    tracker.apply({ type: 'input', raw: 'やまだ' });
    tracker.apply({ type: 'compositionend', raw: '山田' });
    expect(tracker.apply({ type: 'focus', raw: '山田', committedSeed: undefined })).toEqual({
      furigana: 'やまだ',
      notify: false,
    });
  });

  test('reset() returns an empty furigana and reports reset', () => {
    const tracker = new InputTracker('hiragana');

    tracker.apply({ type: 'input', raw: 'やまだ' });
    expect(tracker.reset()).toEqual({ furigana: '', notify: true });
  });

  test('reset() clears committed and pending kana', () => {
    const tracker = new InputTracker('hiragana');
    tracker.apply({ type: 'compositionstart' });
    tracker.apply({ type: 'input', raw: 'やまだ' });
    tracker.apply({ type: 'compositionend', raw: '山田' });
    expect(tracker.apply({ type: 'input', raw: '山田たろう' })).toEqual({
      furigana: 'やまだたろう',
      notify: false,
    });

    expect(tracker.reset()).toEqual({ furigana: '', notify: true });
  });

  test('consecutive IME conversions accumulate committed kana correctly', () => {
    const tracker = new InputTracker('hiragana');
    tracker.apply({ type: 'compositionstart' });
    tracker.apply({ type: 'input', raw: 'やまだ' });
    expect(tracker.apply({ type: 'compositionend', raw: '山田' })).toEqual({
      furigana: 'やまだ',
      notify: false,
    });

    tracker.apply({ type: 'compositionstart' });
    tracker.apply({ type: 'input', raw: '山田たろう' });
    expect(tracker.apply({ type: 'compositionend', raw: '山田太郎' })).toEqual({
      furigana: 'やまだたろう',
      notify: false,
    });
  });

  test('deleting pending kana after conversion does not commit it', () => {
    const tracker = new InputTracker('hiragana');
    tracker.apply({ type: 'compositionstart' });
    tracker.apply({ type: 'input', raw: 'やまだ' });
    tracker.apply({ type: 'compositionend', raw: '山田' });
    tracker.apply({ type: 'input', raw: '山田たろう' });

    expect(tracker.apply({ type: 'input', raw: '山田' })).toEqual({
      furigana: 'やまだ',
      notify: false,
    });
  });

  test('setKatakana() changes the output format and returns the re-formatted furigana', () => {
    const tracker = new InputTracker('hiragana');
    tracker.apply({ type: 'input', raw: 'やまだ' });
    expect(tracker.setKatakana('full')).toEqual({
      furigana: 'ヤマダ',
      notify: false,
    });
    expect(tracker.apply({ type: 'input', raw: 'やまだたろう' })).toEqual({
      furigana: 'ヤマダタロウ',
      notify: false,
    });
  });

  test('getKatakana() returns the tracker-owned output format', () => {
    const tracker = new InputTracker('hiragana');
    expect(tracker.getKatakana()).toBe('hiragana');

    tracker.setKatakana('half');
    expect(tracker.getKatakana()).toBe('half');
  });
});
