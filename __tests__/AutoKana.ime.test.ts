import { describe, expect, test } from 'vitest';

/* global test expect document */
import {
  blurName,
  compositionInput,
  endComposition,
  focusName,
  imeConvert,
  mountAutoKana,
  startComposition,
  typeInput,
} from './setup';

describe('IME composition events', () => {
  test('compositionstart routes subsequent input through composition tracking', () => {
    const { nameInput, furiganaInput } = mountAutoKana();

    startComposition(nameInput);
    compositionInput(nameInput, 'やまだ');
    compositionInput(nameInput, 'やま');

    expect(furiganaInput.value).toBe('やまだ');
  });

  test('compositionend processes the final value even without a follow-up input (Chrome quirk)', () => {
    const { nameInput, furiganaInput } = mountAutoKana();

    startComposition(nameInput);
    endComposition(nameInput, 'やまだ');

    // In Chrome, compositionend may fire without a following input(isComposing=false).
    expect(furiganaInput.value).toBe('やまだ');
  });

  test('normal input extracts kana and updates furigana', () => {
    const { nameInput, furiganaInput } = mountAutoKana();

    typeInput(nameInput, 'やまだ');

    expect(furiganaInput.value).toBe('やまだ');
  });

  test('composing input updates furigana during composition', () => {
    const { nameInput, furiganaInput } = mountAutoKana();
    furiganaInput.value = 'やまだ';

    startComposition(nameInput);
    compositionInput(nameInput, 'やまだたろう');

    expect(furiganaInput.value).toBe('やまだたろう');
  });

  test('getFurigana returns the correct value after a complete conversion sequence', () => {
    const { autokana, nameInput, furiganaInput } = mountAutoKana();
    focusName(nameInput, 'やまだ', furiganaInput, 'やまだ');

    imeConvert(nameInput, '山田', '山田');

    expect(autokana.getFurigana()).toBe('やまだ');
  });

  test('browsing IME candidates does not accumulate furigana', () => {
    const { nameInput, furiganaInput } = mountAutoKana();

    startComposition(nameInput);
    compositionInput(nameInput, 'やまだ');
    compositionInput(nameInput, '山田');
    compositionInput(nameInput, '山谷');
    compositionInput(nameInput, '山田');
    endComposition(nameInput, '山田');

    expect(furiganaInput.value).toBe('やまだ');
  });

  test('restarting composition without compositionend preserves pending kana while browsing candidates', () => {
    const { nameInput, furiganaInput } = mountAutoKana();

    startComposition(nameInput);
    compositionInput(nameInput, 'やまだ');
    compositionInput(nameInput, '山田');
    startComposition(nameInput);
    compositionInput(nameInput, '山谷');
    compositionInput(nameInput, 'やま');
    compositionInput(nameInput, '山田');
    endComposition(nameInput, '山田');

    expect(furiganaInput.value).toBe('やまだ');
  });

  test('keeps the longest pending kana when candidate values repeatedly shrink and grow', () => {
    const { nameInput, furiganaInput } = mountAutoKana();

    startComposition(nameInput);
    compositionInput(nameInput, 'やまだ');
    compositionInput(nameInput, 'やま');
    compositionInput(nameInput, 'やまだたろう');
    compositionInput(nameInput, 'やまだ');
    compositionInput(nameInput, 'やま');
    endComposition(nameInput, '山田太郎');

    expect(furiganaInput.value).toBe('やまだたろう');
  });

  test('moves pending kana to committed kana at compositionend before starting new pending kana', () => {
    const { nameInput, furiganaInput } = mountAutoKana();

    startComposition(nameInput);
    compositionInput(nameInput, 'やまだ');
    compositionInput(nameInput, '山田');
    endComposition(nameInput, '山田');
    expect(furiganaInput.value).toBe('やまだ');

    startComposition(nameInput);
    compositionInput(nameInput, '山田たろう');
    expect(furiganaInput.value).toBe('やまだたろう');
    compositionInput(nameInput, '山田太郎');
    endComposition(nameInput, '山田太郎');

    expect(furiganaInput.value).toBe('やまだたろう');
  });

  test('preserves committed kana and replaces pending kana after a confirmed conversion', () => {
    const { nameInput, furiganaInput } = mountAutoKana();

    imeConvert(nameInput, 'やまだ', '山田');
    expect(furiganaInput.value).toBe('やまだ');

    startComposition(nameInput);
    compositionInput(nameInput, '山田たろう');
    compositionInput(nameInput, '山田じろう');
    endComposition(nameInput, '山田次郎');

    expect(furiganaInput.value).toBe('やまだじろう');
  });

  test('refocusing after kana input does not duplicate furigana', () => {
    const { nameInput, furiganaInput } = mountAutoKana();

    imeConvert(nameInput, 'やまだ', 'やまだ');
    blurName(nameInput);
    focusName(nameInput, nameInput.value);

    expect(furiganaInput.value).toBe('やまだ');
  });

  test('backspace after partial kana input does not duplicate furigana', () => {
    const { nameInput, furiganaInput } = mountAutoKana();

    typeInput(nameInput, 'や');
    typeInput(nameInput, 'やｍ');
    typeInput(nameInput, 'やｍだ');
    expect(furiganaInput.value).toBe('やだ');

    typeInput(nameInput, 'やｍ');
    expect(furiganaInput.value).toBe('や');

    typeInput(nameInput, 'や');
    expect(furiganaInput.value).toBe('や');
  });

  test('full-width space after conversion is preserved in furigana', () => {
    const { autokana, nameInput, furiganaInput } = mountAutoKana();

    imeConvert(nameInput, 'やまだ', '山田');
    typeInput(nameInput, '山田　');
    expect(furiganaInput.value).toBe('やまだ　');

    typeInput(nameInput, '山田　たろう');

    expect(autokana.getFurigana()).toBe('やまだ　たろう');
  });

  test('composition state is not exposed on AutoKana', () => {
    const { autokana } = mountAutoKana();

    expect(autokana).not.toHaveProperty('isConverting');
    expect(autokana).not.toHaveProperty('isComposing');
  });
});
