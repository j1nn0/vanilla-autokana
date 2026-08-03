import { describe, expect, test } from 'vitest';
import { scenario, domDriver, trackerDriver, detectorDriver } from './ime-scenario';

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
    expect(steps.run(detectorDriver()).track?.commit).toBe(true);
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

  test('browsing IME candidates does not accumulate furigana', () => {
    const steps = scenario()
      .type('やまだ') // composition starts implicitly in DOM via typeInput
      .convert('やまだ', '山田');

    expect(steps.run(domDriver())).toEqual({ furigana: 'やまだ' });
    expect(steps.run(trackerDriver())).toEqual({ furigana: 'やまだ' });
  });

  test('converting twice in a row accumulates committed kana', () => {
    const steps = scenario().convert('やまだ', '山田').convert('山田たろう', '山田太郎');

    expect(steps.run(domDriver())).toEqual({ furigana: 'やまだたろう' });
    expect(steps.run(trackerDriver())).toEqual({ furigana: 'やまだたろう' });
  });

  test('katakana option produces the same output format across DOM and tracker', () => {
    const steps = scenario().type('やまだ　たろう');

    expect(steps.run(domDriver({ katakana: 'full' }))).toEqual({ furigana: 'ヤマダ　タロウ' });
    expect(steps.run(trackerDriver('full'))).toEqual({ furigana: 'ヤマダ　タロウ' });

    expect(steps.run(domDriver({ katakana: 'half' }))).toEqual({ furigana: 'ﾔﾏﾀﾞ ﾀﾛｳ' });
    expect(steps.run(trackerDriver('half'))).toEqual({ furigana: 'ﾔﾏﾀﾞ ﾀﾛｳ' });
  });
});
