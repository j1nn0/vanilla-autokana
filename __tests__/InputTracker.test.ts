import { describe, expect, test } from 'vitest';
import { InputTracker } from '../src/InputTracker';

describe('InputTracker', () => {
  test('trackInput() returns the current furigana and clears state for empty input', () => {
    const tracker = new InputTracker('hiragana');

    expect(tracker.trackInput('やまだ')).toEqual({
      furigana: 'やまだ',
      notify: false,
    });
    expect(tracker.trackInput('')).toEqual({ furigana: '', notify: false });
  });

  test('extracts kana from mixed input', () => {
    const tracker = new InputTracker('hiragana');
    expect(tracker.trackInput('yamadaやまだ')).toEqual({
      furigana: 'やまだ',
      notify: false,
    });
  });

  test('trackInput() canonicalizes full-width and half-width katakana input', () => {
    const tracker = new InputTracker('hiragana');

    expect(tracker.trackInput('ヤマダ')).toEqual({
      furigana: 'やまだ',
      notify: false,
    });
    expect(tracker.trackInput('ﾀﾛｳ')).toEqual({ furigana: 'たろう', notify: false });
  });

  test('emits the configured katakana format', () => {
    const tracker = new InputTracker('full');
    expect(tracker.trackInput('やまだ')).toEqual({
      furigana: 'ヤマダ',
      notify: false,
    });
  });

  test('endComposition() processes the current raw input atomically', () => {
    const tracker = new InputTracker('hiragana');

    tracker.startComposition();
    tracker.trackInput('やまだ');
    expect(tracker.endComposition('山田')).toEqual({
      furigana: 'やまだ',
      notify: false,
    });
    expect(tracker.trackInput('山田たろう')).toEqual({
      furigana: 'やまだたろう',
      notify: false,
    });
  });

  test('blur() leaves pending kana untouched and ends composition mode', () => {
    const tracker = new InputTracker('hiragana');

    tracker.startComposition();
    tracker.trackInput('やまだ');
    expect(tracker.blur()).toEqual({ furigana: 'やまだ', notify: false });
    expect(tracker.trackInput('やま')).toEqual({ furigana: 'やま', notify: false });
  });

  test('resync() returns the adopted furigana without a follow-up input', () => {
    const tracker = new InputTracker('hiragana');

    expect(tracker.resync('山田', 'やまだ')).toEqual({
      furigana: 'やまだ',
      notify: false,
    });
  });

  test('resync() clears all state when the raw input is empty', () => {
    const tracker = new InputTracker('hiragana');

    expect(tracker.resync('', 'やまだ')).toEqual({ furigana: '', notify: false });
  });

  test('resync() canonicalizes full-width and half-width output seeds', () => {
    const tracker = new InputTracker('hiragana');

    expect(tracker.resync('山田', 'ヤマダ')).toEqual({
      furigana: 'やまだ',
      notify: false,
    });
    expect(tracker.resync('太郎', 'ﾀﾛｳ')).toEqual({
      furigana: 'たろう',
      notify: false,
    });
  });

  test('resync() without a seed leaves committed kana untouched', () => {
    const tracker = new InputTracker('hiragana');
    tracker.startComposition();
    tracker.trackInput('やまだ');
    tracker.endComposition('山田');
    expect(tracker.resync('山田', undefined)).toEqual({
      furigana: 'やまだ',
      notify: false,
    });
  });

  test('reset() returns an empty furigana and reports reset', () => {
    const tracker = new InputTracker('hiragana');

    tracker.trackInput('やまだ');
    expect(tracker.reset()).toEqual({ furigana: '', notify: true });
  });

  test('reset() clears committed and pending kana', () => {
    const tracker = new InputTracker('hiragana');
    tracker.startComposition();
    tracker.trackInput('やまだ');
    tracker.endComposition('山田');
    expect(tracker.trackInput('山田たろう')).toEqual({
      furigana: 'やまだたろう',
      notify: false,
    });

    expect(tracker.reset()).toEqual({ furigana: '', notify: true });
  });

  test('consecutive IME conversions accumulate committed kana correctly', () => {
    const tracker = new InputTracker('hiragana');
    tracker.startComposition();
    tracker.trackInput('やまだ');
    expect(tracker.endComposition('山田')).toEqual({
      furigana: 'やまだ',
      notify: false,
    });

    tracker.startComposition();
    tracker.trackInput('山田たろう');
    expect(tracker.endComposition('山田太郎')).toEqual({
      furigana: 'やまだたろう',
      notify: false,
    });
  });

  test('deleting pending kana after conversion does not commit it', () => {
    const tracker = new InputTracker('hiragana');
    tracker.startComposition();
    tracker.trackInput('やまだ');
    tracker.endComposition('山田');
    tracker.trackInput('山田たろう');

    expect(tracker.trackInput('山田')).toEqual({ furigana: 'やまだ', notify: false });
  });

  test('setKatakana() changes the output format and returns the re-formatted furigana', () => {
    const tracker = new InputTracker('hiragana');
    tracker.trackInput('やまだ');
    expect(tracker.setKatakana('full')).toEqual({
      furigana: 'ヤマダ',
      notify: false,
    });
    expect(tracker.trackInput('やまだたろう')).toEqual({
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
