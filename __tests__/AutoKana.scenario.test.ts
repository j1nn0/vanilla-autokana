import { describe, expect, test } from 'vitest';
import { scenario, domDriver, trackerDriver } from './ime-scenario';

describe('IME scenarios across seams', () => {
  test('typing plain kana produces the same furigana through DOM and state machine', () => {
    const steps = scenario().type('やまだ');

    expect(steps.run(domDriver())).toEqual({ furigana: 'やまだ' });
    expect(steps.run(trackerDriver())).toEqual({ furigana: 'やまだ' });
  });

  test('converting kana to kanji commits the reading', () => {
    const steps = scenario().convert('やまだ', '山田');

    expect(steps.run(domDriver())).toEqual({ furigana: 'やまだ' });
    expect(steps.run(trackerDriver())).toEqual({ furigana: 'やまだ' });
  });

  test('typing after conversion appends to committed kana', () => {
    const steps = scenario().convert('やまだ', '山田').type('山田たろう');

    expect(steps.run(domDriver())).toEqual({ furigana: 'やまだたろう' });
    expect(steps.run(trackerDriver())).toEqual({ furigana: 'やまだたろう' });
  });

  test('focus with an existing seed adopts it as committed kana', () => {
    const steps = scenario().focus('山田', 'やまだ');

    expect(steps.run(domDriver())).toEqual({ furigana: 'やまだ' });
    expect(steps.run(trackerDriver())).toEqual({ furigana: 'やまだ' });
  });

  test('converting twice in a row accumulates committed kana', () => {
    const steps = scenario().convert('やまだ', '山田').convert('山田たろう', '山田太郎');

    expect(steps.run(domDriver())).toEqual({ furigana: 'やまだたろう' });
    expect(steps.run(trackerDriver())).toEqual({ furigana: 'やまだたろう' });
  });
});
