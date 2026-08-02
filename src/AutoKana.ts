import { InputTracker } from './InputTracker';
import type { FuriganaResult } from './InputTracker';
import type { KanaElement, Bindable } from './ElementResolver';
import { requireElement, resolveOptionalKanaElement } from './ElementResolver';
import type { KatakanaOption } from './KanaConverter';

export type { Bindable };
export type { KatakanaOption };

/** Minimal shape of a checkbox change event accepted by {@link AutoKana.toggle}. */
type ToggleEventLike = { target: { checked: boolean } };

export interface AutoKanaOption {
  /** Output format for furigana. `'hiragana'` = hiragana, `'full'` = full-width katakana, `'half'` = half-width katakana. */
  katakana?: KatakanaOption;
  /** When `true`, logs debug information to the console. */
  debug?: boolean;
  /** Callback invoked with the current furigana string whenever it changes. */
  onChange?: (furigana: string) => void;
}

type ResolvedOption = Readonly<AutoKanaOption & { katakana: KatakanaOption; debug: boolean }>;

export default class AutoKana {
  private active = true;
  private resolvedOption: ResolvedOption;
  private elName!: KanaElement;
  private elFurigana?: KanaElement;
  private furigana: string;
  private readonly tracker: InputTracker;

  /** Whether auto-kana tracking is active. Read-only; use {@link start} / {@link stop} / {@link toggle} to change it. */
  get isActive(): boolean {
    return this.active;
  }

  /** Current option values. Read-only; change the output format at runtime with {@link setKatakana}. */
  get option(): ResolvedOption {
    return this.resolvedOption;
  }

  private blurHandler = (): void => {
    this.debug('blur');
    this.setFurigana(this.tracker.blur());
  };

  private focusHandler = (): void => {
    this.debug('focus');
    this.setFurigana(this.tracker.resync(this.elName.value, this.elFurigana?.value));
  };

  private compositionStartHandler = (): void => {
    this.debug('compositionstart');
    this.setFurigana(this.tracker.startComposition());
  };

  private compositionEndHandler = (): void => {
    this.debug('compositionend');
    this.setFurigana(this.tracker.endComposition(this.elName.value));
  };

  private inputHandler = (event: InputEvent): void => {
    this.debug('input', event.isComposing);
    this.setFurigana(this.tracker.trackInput(this.elName.value));
  };

  private readonly eventPairs: Array<[string, EventListener]> = [
    ['blur', this.blurHandler],
    ['focus', this.focusHandler],
    ['compositionstart', this.compositionStartHandler],
    ['compositionend', this.compositionEndHandler],
    ['input', this.inputHandler as EventListener],
  ];

  constructor(name: Bindable, furigana: Bindable = '', option: Partial<AutoKanaOption> = {}) {
    this.furigana = '';

    this.resolvedOption = {
      ...option,
      katakana: option.katakana ?? 'hiragana',
      debug: option.debug ?? false,
    };

    this.tracker = new InputTracker(this.option.katakana);

    const elName = requireElement(name);
    const elFurigana = resolveOptionalKanaElement(furigana);

    this.elName = elName;
    if (elFurigana) {
      this.elFurigana = elFurigana;
    }
    this.registerEvents(this.elName);
  }

  /**
   * Get the current furigana string.
   *
   * @returns The current furigana string.
   */
  getFurigana(): string {
    return this.furigana;
  }

  /**
   * Resume auto-kana tracking.
   */
  start(): void {
    this.active = true;
  }

  /**
   * Pause auto-kana tracking.
   */
  stop(): void {
    this.active = false;
  }

  /**
   * Toggle auto-kana tracking on or off.
   *
   * @param event Optional checkbox change event. When provided, uses the checked state of the target.
   */
  toggle(event?: ToggleEventLike): void {
    if (event) {
      this.active = event.target.checked;
    } else {
      this.active = !this.active;
    }
  }

  /**
   * Change the furigana output format at runtime. Re-renders the current furigana immediately.
   *
   * @param katakana The new output format: `'hiragana'` | `'full'` | `'half'`.
   */
  setKatakana(katakana: KatakanaOption): void {
    this.resolvedOption = { ...this.resolvedOption, katakana };
    this.setFurigana(this.tracker.setKatakana(katakana));
  }

  /**
   * Reset all tracking state and clear the furigana output (DOM element and onChange).
   */
  reset(): void {
    this.setFurigana(this.tracker.reset());
  }

  private registerEvents(elName: KanaElement): void {
    for (const [event, handler] of this.eventPairs) {
      elName.addEventListener(event, handler);
    }
  }

  private setFurigana(result: FuriganaResult): void {
    if (!this.isActive) {
      return;
    }
    if (!result.reset && result.furigana === this.furigana) {
      return;
    }
    this.furigana = result.furigana;
    if (this.elFurigana) {
      this.elFurigana.value = this.furigana;
      this.elFurigana.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (this.option.onChange) {
      this.option.onChange(this.furigana);
    }
  }

  /**
   * Remove all event listeners from the name element.
   */
  destroy(): void {
    for (const [event, handler] of this.eventPairs) {
      this.elName.removeEventListener(event, handler);
    }
    // Intentionally drop the element references after teardown so the instance no longer
    // pins the DOM nodes. `elName` is declared non-nullable for the active lifetime, so the
    // cast is a deliberate teardown-only escape hatch; methods must not run after destroy().
    this.elName = null as unknown as KanaElement;
    this.elFurigana = undefined;
  }

  private debug(message: unknown, detail?: unknown): void {
    if (!this.option.debug) {
      return;
    }
    if (detail === undefined) {
      // eslint-disable-next-line no-console
      console.log(message);
      return;
    }
    // eslint-disable-next-line no-console
    console.log(message, detail);
  }
}
