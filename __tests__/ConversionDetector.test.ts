import { describe, expect, test } from 'vitest';
import { compactKana, ConversionDetector } from '../src/ConversionDetector';
import { extractKana } from '../src/KanaExtractor';

describe('ConversionDetector', () => {
  test('tracks normal input and returns the extracted pending kana', () => {
    const detector = new ConversionDetector();

    expect(detector.track('やまだ', '')).toEqual({ pendingKana: 'やまだ', commit: false });
    expect(detector.track('yamadaやまだ', '')).toEqual({ pendingKana: 'やまだ', commit: false });
  });

  test('keeps the longest pending kana during composition', () => {
    const detector = new ConversionDetector();
    detector.startComposition();

    expect(detector.track('やまだ', '')).toEqual({ pendingKana: 'やまだ', commit: false });
    expect(detector.track('やま', 'やまだ')).toEqual({ pendingKana: 'やまだ', commit: false });
  });

  test('blur() ends composition mode so normal tracking resumes', () => {
    const detector = new ConversionDetector();
    detector.startComposition();
    detector.track('やまだ', '');

    detector.blur();

    expect(detector.track('やま', 'やまだ')).toEqual({ pendingKana: 'やま', commit: false });
  });

  test('endComposition() resets the baseline so the final value is processed fresh', () => {
    // Without the baseline reset, the equal-length last input would suppress the commit.
    const detector = new ConversionDetector();
    detector.track('やまだ', '');
    detector.track('やまし', 'やまだ');

    detector.endComposition();

    expect(detector.track('山田', 'やまし')).toEqual({ pendingKana: '', commit: true });
  });

  test('resync() re-seeds the converted baseline from the live DOM', () => {
    const detector = new ConversionDetector();
    detector.resync('山田');

    expect(detector.track('山田たろう', '')).toEqual({ pendingKana: 'たろう', commit: false });
  });

  test('resync() clears the tracking baseline', () => {
    const detector = new ConversionDetector();
    detector.track('やまだ', '');

    detector.resync('');

    expect(detector.track('やまだ', 'やまだ')).toEqual({ pendingKana: 'やまだ', commit: false });
  });

  test('reset() clears all tracking state', () => {
    const detector = new ConversionDetector();
    detector.track('山田', '');
    detector.track('山田たろう', '');

    detector.reset();

    expect(detector.track('やまだ', '')).toEqual({ pendingKana: 'やまだ', commit: false });
  });

  test('subtracts the last converted input when it is contiguous', () => {
    const detector = new ConversionDetector();
    detector.resync('山田');

    expect(detector.track('たろう山田', '')).toEqual({ pendingKana: 'たろう', commit: false });
  });

  test('extractNewInput falls back to positional diff when the converted input is not contiguous', () => {
    // resync seeds the converted anchor to 'あいう'; the next value 'あいか' does not contain
    // 'あいう' as a substring, so extraction falls back to the positional charCode comparison
    // and keeps only the differing tail 'か'.
    const detector = new ConversionDetector();
    detector.resync('あいう');

    expect(detector.track('あいか', '')).toEqual({ pendingKana: 'か', commit: false });
  });

  test('a large length jump commits the prior reading as a conversion', () => {
    const detector = new ConversionDetector();
    detector.startComposition();
    detector.track('やまだ', '');
    detector.endComposition();

    expect(detector.track('山田', 'やまだ')).toEqual({ pendingKana: '', commit: true });
  });

  test('a large length jump that is only small kana does not falsely commit', () => {
    // 'しゃち' is 3 kana but compacts to 2 (small ゃ removed); the length jump from 'か' is
    // therefore not a real IME conversion, so the kana compacting check suppresses the commit.
    const detector = new ConversionDetector();
    detector.track('か', '');

    expect(detector.track('しゃち', 'か')).toEqual({ pendingKana: 'しゃち', commit: false });
  });

  test('non-kana replacing same-length kana commits the prior reading', () => {
    const detector = new ConversionDetector();
    detector.track('や', '');

    expect(detector.track('a', 'や')).toEqual({ pendingKana: '', commit: true });
  });

  test('same-length kana-only replacement does not commit', () => {
    // The same-length heuristic only treats non-kana content as a conversion: replacing
    // kana with kana (e.g. やまだ -> やまし) is plain editing, so nothing is committed
    // and the pending kana just updates.
    const detector = new ConversionDetector();
    detector.track('やまだ', '');

    expect(detector.track('やまし', 'やまだ')).toEqual({ pendingKana: 'やまし', commit: false });
  });

  test('repeating the same raw input preserves the current pending kana', () => {
    const detector = new ConversionDetector();
    detector.track('やまだ', '');

    expect(detector.track('やまだ', 'やまだ')).toEqual({ pendingKana: 'やまだ', commit: false });
  });

  test('consecutive conversions accumulate through the updated baseline', () => {
    const detector = new ConversionDetector();
    detector.startComposition();
    detector.track('やまだ', '');
    detector.endComposition();
    expect(detector.track('山田', 'やまだ')).toEqual({ pendingKana: '', commit: true });

    expect(detector.track('山田たろう', '')).toEqual({ pendingKana: 'たろう', commit: false });
  });

  test('deleting input replaces pending kana without triggering a commit', () => {
    const detector = new ConversionDetector();
    detector.track('やまだ', '');
    detector.track('山田', 'やまだ');
    detector.track('山田たろう', '');

    expect(detector.track('山田', 'たろう')).toEqual({ pendingKana: '', commit: false });
  });
});

describe('kana compacting and non-kana detection', () => {
  test('compact removes small katakana after extraction canonicalizes them', () => {
    expect(compactKana(extractKana('ャュョ'))).toBe('');
  });

  test('compact removes small kana', () => {
    expect(compactKana('ぁぃぅぇおっゃゅょ')).toBe('お');
    expect(compactKana('やまだ')).toBe('やまだ');
  });
});
