import AutoKana from '../src/AutoKana';
import { InputTracker } from '../src/InputTracker';
import { compositionInput, endComposition, focusName, startComposition, typeInput } from './setup';

/**
 * Domain-level IME test DSL. A scenario describes what the user does in Japanese input terms
 * (type kana, convert to kanji, focus) and can be replayed against the DOM and
 * state-machine seams.
 */

export type Step =
  | { kind: 'type'; raw: string }
  | { kind: 'convert'; reading: string; raw: string }
  | { kind: 'focus'; raw: string; seed?: string };

export interface ScenarioResult {
  furigana: string;
}

export interface ScenarioDriver {
  run(steps: Step[]): ScenarioResult;
}

class ScenarioBuilder {
  private steps: Step[] = [];

  type(raw: string): this {
    this.steps.push({ kind: 'type', raw });
    return this;
  }

  convert(reading: string, raw: string): this {
    this.steps.push({ kind: 'type', raw: reading }, { kind: 'convert', reading, raw });
    return this;
  }

  focus(raw: string, seed?: string): this {
    this.steps.push({ kind: 'focus', raw, seed });
    return this;
  }

  run(driver: ScenarioDriver): ScenarioResult {
    return driver.run(this.steps);
  }
}

export function scenario(): ScenarioBuilder {
  return new ScenarioBuilder();
}

/**
 * DOM driver: mounts AutoKana on the standard name/furigana inputs and replays events.
 */
export function domDriver(): ScenarioDriver {
  return {
    run(steps) {
      document.body.innerHTML =
        '<input name="name" id="name"><input name="furigana" id="furigana">';
      const nameInput = document.getElementById('name') as HTMLInputElement;
      const furiganaInput = document.getElementById('furigana') as HTMLInputElement;
      const autokana = new AutoKana(nameInput, furiganaInput);

      for (const step of steps) {
        switch (step.kind) {
          case 'type':
            typeInput(nameInput, step.raw);
            break;
          case 'convert':
            startComposition(nameInput);
            compositionInput(nameInput, step.reading);
            endComposition(nameInput, step.raw);
            break;
          case 'focus':
            focusName(nameInput, step.raw, furiganaInput, step.seed);
            break;
        }
      }

      return { furigana: autokana.getFurigana() };
    },
  };
}

/**
 * InputTracker driver: exercises the state-machine transitions directly with string inputs.
 */
export function trackerDriver(): ScenarioDriver {
  return {
    run(steps) {
      const tracker = new InputTracker('hiragana');
      let furigana = '';

      for (const step of steps) {
        switch (step.kind) {
          case 'type':
            furigana = tracker.apply({ type: 'input', raw: step.raw }).furigana;
            break;
          case 'convert':
            tracker.apply({ type: 'compositionstart' });
            furigana = tracker.apply({ type: 'compositionend', raw: step.raw }).furigana;
            break;
          case 'focus':
            furigana = tracker.apply({
              type: 'focus',
              raw: step.raw,
              committedSeed: step.seed,
            }).furigana;
            break;
        }
      }

      return { furigana };
    },
  };
}
