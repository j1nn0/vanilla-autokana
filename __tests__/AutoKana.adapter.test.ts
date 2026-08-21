/* global test expect document */

import { describe, expect, test, vi } from 'vitest';
import {
  blurName,
  compositionInput,
  endComposition,
  focusName,
  mountAutoKana,
  mountNameOnly,
  startComposition,
  typeInput,
} from './setup';

describe('AutoKanaInputAdapter through AutoKana', () => {
  test('mountAutoKana attaches the name input event listeners', () => {
    const { autokana, nameInput, furiganaInput } = mountAutoKana();

    focusName(nameInput, '山田', furiganaInput, 'やまだ');
    expect(autokana.getFurigana()).toBe('やまだ');

    startComposition(nameInput);
    endComposition(nameInput, '山田たろう');
    expect(autokana.getFurigana()).toBe('やまだたろう');

    typeInput(nameInput, '山田たろうたかし');
    expect(autokana.getFurigana()).toBe('やまだたろうたかし');

    startComposition(nameInput);
    compositionInput(nameInput, '山田たろうたかしく');
    expect(autokana.getFurigana()).toBe('やまだたろうたかしく');

    blurName(nameInput);
    typeInput(nameInput, '山田たろうたかし');
    expect(autokana.getFurigana()).toBe('やまだたろうたかし');
  });

  test('destroy detaches listeners and makes later state changes no-ops', () => {
    const onChange = vi.fn();
    const { autokana, nameInput } = mountNameOnly({ onChange });

    typeInput(nameInput, 'やまだ');
    const furiganaBeforeDestroy = autokana.getFurigana();
    const katakanaBeforeDestroy = autokana.option.katakana;
    const changesBeforeDestroy = onChange.mock.calls.length;

    autokana.destroy();
    expect(() => autokana.destroy()).not.toThrow();

    startComposition(nameInput);
    compositionInput(nameInput, 'やまだたろう');
    endComposition(nameInput, '山田太郎');
    focusName(nameInput, '山田太郎');
    blurName(nameInput);
    typeInput(nameInput, 'たろう');

    autokana.setKatakana('full');
    autokana.reset();
    autokana.start();
    autokana.stop();
    autokana.toggle();

    expect(autokana.getFurigana()).toBe(furiganaBeforeDestroy);
    expect(autokana.option.katakana).toBe(katakanaBeforeDestroy);
    expect(autokana.isActive).toBe(false);
    expect(onChange).toHaveBeenCalledTimes(changesBeforeDestroy);
  });

  test('debug logs compositionstart from the attached adapter', () => {
    const { nameInput } = mountAutoKana({ debug: true });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    try {
      startComposition(nameInput);
      expect(logSpy).toHaveBeenCalledWith('compositionstart');
    } finally {
      logSpy.mockRestore();
    }
  });
});
