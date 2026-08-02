import { describe, expect, test } from 'vitest';

/* global test expect document */
import {
  compositionInput,
  endComposition,
  imeConvert,
  mountAutoKana,
  startComposition,
  typeInput,
} from './setup';

describe('IME composition events', () => {
  test('compositionstart routes subsequent input through composition tracking', () => {
    const { nameInput, furiganaInput } = mountAutoKana();

    startComposition(nameInput);
    compositionInput(nameInput, 'やまだ', 'insertText');
    compositionInput(nameInput, 'やま');

    expect(furiganaInput?.value).toBe('やまだ');
  });

  test('compositionend processes the final value even without a follow-up input (Chrome quirk)', () => {
    const { nameInput, furiganaInput } = mountAutoKana();

    startComposition(nameInput);
    endComposition(nameInput, 'やまだ');

    // In Chrome, compositionend may fire without a following input(isComposing=false).
    expect(furiganaInput?.value).toBe('やまだ');
  });

  test('normal input extracts kana and updates furigana', () => {
    const { nameInput, furiganaInput } = mountAutoKana();

    typeInput(nameInput, 'やまだ');

    expect(furiganaInput?.value).toBe('やまだ');
  });

  test('composing input updates furigana during composition', () => {
    const { nameInput, furiganaInput } = mountAutoKana();
    furiganaInput!.value = 'やまだ';

    startComposition(nameInput);
    compositionInput(nameInput, 'やまだたろう', 'insertText');

    expect(furiganaInput?.value).toBe('やまだたろう');
  });

  test('focus handler captures the current output state when refocusing', () => {
    const { autokana, nameInput, furiganaInput } = mountAutoKana();
    furiganaInput!.value = 'やまだ';
    nameInput.value = '山田';

    nameInput.dispatchEvent(new Event('focus'));

    expect(autokana.getFurigana()).toBe('やまだ');
  });

  test('blur ends composition tracking', () => {
    const { nameInput, furiganaInput } = mountAutoKana();

    startComposition(nameInput);
    compositionInput(nameInput, 'やまだ', 'insertText');
    nameInput.dispatchEvent(new Event('blur'));
    compositionInput(nameInput, 'やま', 'insertText');

    expect(furiganaInput?.value).toBe('やま');
  });

  test('getFurigana returns the correct value after a complete conversion sequence', () => {
    const { autokana, nameInput, furiganaInput } = mountAutoKana();
    furiganaInput!.value = 'やまだ';
    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(new Event('focus'));

    imeConvert(nameInput, '山田', '山田');

    expect(autokana.getFurigana()).toBe('やまだ');
  });

  test('typing after conversion appends to furigana correctly', () => {
    const { autokana, nameInput } = mountAutoKana();

    imeConvert(nameInput, 'やまだ', '山田');
    typeInput(nameInput, '山田たろう');

    expect(autokana.getFurigana()).toBe('やまだたろう');
  });

  test('browsing IME candidates does not accumulate furigana', () => {
    const { nameInput, furiganaInput } = mountAutoKana();

    startComposition(nameInput);
    compositionInput(nameInput, 'やまだ', 'insertText');
    compositionInput(nameInput, '山田');
    compositionInput(nameInput, '山谷');
    compositionInput(nameInput, '山田');
    endComposition(nameInput, '山田');

    expect(furiganaInput?.value).toBe('やまだ');
  });

  test('kana temporarily shown while browsing candidates does not accumulate furigana', () => {
    const { nameInput, furiganaInput } = mountAutoKana();

    startComposition(nameInput);
    compositionInput(nameInput, 'やまだ', 'insertText');
    compositionInput(nameInput, '山田');
    compositionInput(nameInput, 'やまだ');
    compositionInput(nameInput, '山谷');
    endComposition(nameInput, '山田');

    expect(furiganaInput?.value).toBe('やまだ');
  });

  test('conversion to a different-length candidate preserves furigana', () => {
    const { nameInput, furiganaInput } = mountAutoKana();

    startComposition(nameInput);
    compositionInput(nameInput, 'やまだ', 'insertText');
    compositionInput(nameInput, '病まだ');
    compositionInput(nameInput, '山田');
    endComposition(nameInput, '山田');

    expect(furiganaInput?.value).toBe('やまだ');
  });

  test('conversion ending at a kanji candidate does not duplicate furigana', () => {
    const { nameInput, furiganaInput } = mountAutoKana();

    startComposition(nameInput);
    compositionInput(nameInput, 'やまだ', 'insertText');
    compositionInput(nameInput, '病まだ');
    endComposition(nameInput, '病まだ');

    expect(furiganaInput?.value).toBe('やまだ');
  });

  test('refocusing after kana input does not duplicate furigana', () => {
    const { nameInput, furiganaInput } = mountAutoKana();

    imeConvert(nameInput, 'やまだ', 'やまだ');
    nameInput.dispatchEvent(new Event('blur'));
    nameInput.dispatchEvent(new Event('focus'));

    expect(furiganaInput?.value).toBe('やまだ');
  });

  test('backspace after partial kana input does not duplicate furigana', () => {
    const { nameInput, furiganaInput } = mountAutoKana();

    typeInput(nameInput, 'や');
    typeInput(nameInput, 'やｍ');
    typeInput(nameInput, 'やｍだ');
    expect(furiganaInput?.value).toBe('やだ');

    typeInput(nameInput, 'やｍ', { inputType: 'deleteContentBackward' });
    expect(furiganaInput?.value).toBe('や');

    typeInput(nameInput, 'や', { inputType: 'deleteContentBackward' });
    expect(furiganaInput?.value).toBe('や');
  });

  test('full-width space after conversion is preserved in furigana', () => {
    const { autokana, nameInput, furiganaInput } = mountAutoKana();

    imeConvert(nameInput, 'やまだ', '山田');
    typeInput(nameInput, '山田　');
    expect(furiganaInput?.value).toBe('やまだ　');

    typeInput(nameInput, '山田　たろう');

    expect(autokana.getFurigana()).toBe('やまだ　たろう');
  });

  test('composition state is not exposed on AutoKana', () => {
    const { autokana } = mountAutoKana();

    expect(autokana).not.toHaveProperty('isConverting');
    expect(autokana).not.toHaveProperty('isComposing');
  });
});
