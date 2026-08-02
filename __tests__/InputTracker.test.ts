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
  test('transition results expose furigana and notification intent only', () => {
    const tracker = new InputTracker('hiragana');

    expect(tracker.trackInput('やまだ')).toEqual({ furigana: 'やまだ', notify: false });
  });

  test('startComposition() keeps the longest pending kana during composition', () => {
    const tracker = new InputTracker('hiragana');

    expect(tracker.startComposition()).toEqual({ furigana: '', notify: false });
    expect(tracker.trackInput('やまだ')).toEqual({
      furigana: 'やまだ',
      notify: false,
    });
    expect(tracker.trackInput('やま')).toEqual({ furigana: 'やまだ', notify: false });
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

  test('reset() returns an empty furigana and reports reset', () => {
    const tracker = new InputTracker('hiragana');

    tracker.trackInput('やまだ');
    expect(tracker.reset()).toEqual({ furigana: '', notify: true });
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

  test('resync() adopts the seeded furigana as committed kana', () => {
    const tracker = new InputTracker('hiragana');
    expect(tracker.resync('山田', 'やまだ')).toEqual({
      furigana: 'やまだ',
      notify: false,
    });
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

  test('a large length jump that is only small kana does not falsely commit', () => {
    // 'しゃち' is 3 kana but compacts to 2 (small ゃ removed); the length jump from 'か' is
    // therefore not a real IME conversion, so the kana compacting check suppresses the commit.
    const tracker = new InputTracker('hiragana');
    tracker.trackInput('か');
    expect(tracker.trackInput('しゃち')).toEqual({
      furigana: 'しゃち',
      notify: false,
    });
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

  test('extractNewInput falls back to positional diff when the converted input is not contiguous', () => {
    // resync seeds the converted anchor to 'あいう'; the next value 'あいか' does not contain
    // 'あいう' as a substring, so extraction falls back to the positional charCode comparison
    // and keeps only the differing tail 'か'.
    const tracker = new InputTracker('hiragana');
    tracker.resync('あいう', '');
    expect(tracker.trackInput('あいか')).toEqual({ furigana: 'か', notify: false });
  });

  test('non-kana replacing same-length kana commits the prior reading', () => {
    const tracker = new InputTracker('hiragana');
    tracker.trackInput('や');
    expect(tracker.trackInput('a')).toEqual({ furigana: 'や', notify: false });
  });

  test('same-length kana-only replacement does not commit', () => {
    // The same-length heuristic only treats non-kana content as a conversion: replacing
    // kana with kana (e.g. やまだ -> やまし) is plain editing, so nothing is committed
    // and the pending kana just updates.
    const tracker = new InputTracker('hiragana');
    tracker.trackInput('やまだ');
    expect(tracker.trackInput('やまし')).toEqual({
      furigana: 'やまし',
      notify: false,
    });
  });

  test('a confirmed IME conversion commits pending kana into the furigana', () => {
    const tracker = new InputTracker('hiragana');
    tracker.startComposition();
    expect(tracker.trackInput('やまだ')).toEqual({
      furigana: 'やまだ',
      notify: false,
    });
    expect(tracker.endComposition('山田')).toEqual({
      furigana: 'やまだ',
      notify: false,
    });
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
  test('repeating the same raw input preserves the current furigana', () => {
    const tracker = new InputTracker('hiragana');
    tracker.trackInput('やまだ');

    expect(tracker.trackInput('やまだ')).toEqual({
      furigana: 'やまだ',
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
});
