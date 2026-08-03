import AutoKana from '../src/AutoKana';
import { InputTracker } from '../src/InputTracker';
import { ConversionDetector } from '../src/ConversionDetector';
import {
  startComposition,
  compositionInput,
  endComposition,
  typeInput,
} from './setup';

/**
 * Domain-level IME test DSL. A scenario describes what the user does in Japanese input terms
 * (type kana, convert to kanji, focus, blur) and can be replayed against multiple seams:
 *
 * - DOM driver: exercises AutoKana + the real event pipeline.
 * - InputTracker driver: exercises the kana state machine directly.
 * - ConversionDetector driver: exercises the input-tracking/conversion-detection seam directly.
 */

export type Step =
  | { kind: 'type'; raw: string }
  | { kind: 'convert'; reading: string; raw: string }
  | { kind: 'focus'; raw: string; seed?: string }
  | { kind: 'blur' }
  | { kind: 'startComposition' };

export interface ScenarioResult {
  /** Final furigana for DOM/InputTracker drivers. */
  furigana?: string;
  /** Final detector result for ConversionDetector driver. */
  track?: { pendingKana: string; commit: boolean };
}

export interface ScenarioDriver {
  /** Human-readable name for test descriptions. */
  readonly name: string;
  run(steps: Step[]): ScenarioResult;
}

class ScenarioBuilder {
  private steps: Step[] = [];

  type(raw: string): this {
    this.steps.push({ kind: 'type', raw });
    return this;
  }

  convert(reading: string, raw: string): this {
    this.steps.push(
      { kind: 'startComposition' },
      { kind: 'type', raw: reading },
      { kind: 'convert', reading, raw },
    );
    return this;
  }

  focus(raw: string, seed?: string): this {
    this.steps.push({ kind: 'focus', raw, seed });
    return this;
  }

  blur(): this {
    this.steps.push({ kind: 'blur' });
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
export function domDriver(option?: ConstructorParameters<typeof AutoKana>[2]): ScenarioDriver {
  return {
    name: 'AutoKana DOM adapter',
    run(steps) {
      document.body.innerHTML = '<input name="name" id="name"><input name="furigana" id="furigana">';
      const nameInput = document.getElementById('name') as HTMLInputElement;
      const furiganaInput = document.getElementById('furigana') as HTMLInputElement;
      const autokana = new AutoKana(nameInput, furiganaInput, option ?? {});

      for (const step of steps) {
        switch (step.kind) {
          case 'type':
            typeInput(nameInput, step.raw, { inputType: 'insertText' });
            break;
          case 'startComposition':
            startComposition(nameInput);
            break;
          case 'convert':
            compositionInput(nameInput, step.reading, 'insertText');
            endComposition(nameInput, step.raw);
            break;
          case 'focus':
            if (step.seed !== undefined) {
              furiganaInput.value = step.seed;
            }
            nameInput.value = step.raw;
            nameInput.dispatchEvent(new Event('focus'));
            break;
          case 'blur':
            nameInput.dispatchEvent(new Event('blur'));
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
export function trackerDriver(format: 'hiragana' | 'full' | 'half' = 'hiragana'): ScenarioDriver {
  return {
    name: 'InputTracker state machine',
    run(steps) {
      const tracker = new InputTracker(format);
      let furigana = '';
      for (const step of steps) {
        switch (step.kind) {
          case 'type':
            furigana = tracker.trackInput(step.raw).furigana;
            break;
          case 'startComposition':
            tracker.startComposition();
            break;
          case 'convert':
            furigana = tracker.endComposition(step.raw).furigana;
            break;
          case 'focus':
            furigana = tracker.resync(step.raw, step.seed).furigana;
            break;
          case 'blur':
            furigana = tracker.blur().furigana;
            break;
        }
      }

      return { furigana };
    },
  };
}

/**
 * ConversionDetector driver: exercises the input-tracking/conversion-detection seam.
 */
export function detectorDriver(): ScenarioDriver {
  return {
    name: 'ConversionDetector',
    run(steps) {
      const detector = new ConversionDetector();
      let pendingKana = '';
      let lastTrack: { pendingKana: string; commit: boolean } = { pendingKana: '', commit: false };
      let composing = false;

      for (const step of steps) {
        switch (step.kind) {
          case 'type':
            lastTrack = detector.track(step.raw, pendingKana);
            if (lastTrack.commit) {
              pendingKana = '';
            } else {
              pendingKana = lastTrack.pendingKana;
            }
            break;
          case 'startComposition':
            detector.startComposition();
            composing = true;
            break;
          case 'convert':
            if (composing) {
              detector.endComposition();
              composing = false;
            }
            lastTrack = detector.track(step.raw, pendingKana);
            if (lastTrack.commit) {
              pendingKana = '';
            } else {
              pendingKana = lastTrack.pendingKana;
            }
            break;
          case 'focus':
            detector.resync(step.raw);
            pendingKana = '';
            break;
          case 'blur':
            detector.blur();
            break;
        }
      }

      return { track: lastTrack };
    },
  };
}
