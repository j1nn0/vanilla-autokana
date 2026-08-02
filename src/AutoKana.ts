import { InputTracker } from './InputTracker';
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

export default class AutoKana {
  isActive: boolean;
  option: AutoKanaOption & { katakana: KatakanaOption; debug: boolean };
  private elName!: KanaElement;
  private elFurigana?: KanaElement;
  private furigana: string;
  private readonly tracker: InputTracker;

  private blurHandler = (): void => {
    this.debug('blur');
    this.tracker.blur();
  };

  private focusHandler = (): void => {
    this.debug('focus');
    const rawInput = this.elName.value;
    const result = this.tracker.resync(rawInput, this.elFurigana?.value);
    this.setFurigana(result.reset, result.furigana);
  };

  private compositionStartHandler = (): void => {
    this.debug('compositionstart');
    this.tracker.startComposition();
  };

  private compositionEndHandler = (): void => {
    this.debug('compositionend');
    const rawInput = this.elName.value;
    const result = this.tracker.endComposition(rawInput);
    this.setFurigana(result.reset, result.furigana);
  };

  private inputHandler = (event: InputEvent): void => {
    this.debug('input', event.isComposing);
    this.processValue();
  };

  constructor(name: Bindable, furigana: Bindable = '', option: Partial<AutoKanaOption> = {}) {
    this.isActive = true;
    this.furigana = '';

    this.option = {
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
    this.isActive = true;
  }

  /**
   * Pause auto-kana tracking.
   */
  stop(): void {
    this.isActive = false;
  }

  /**
   * Toggle auto-kana tracking on or off.
   *
   * @param event Optional checkbox change event. When provided, uses the checked state of the target.
   */
  toggle(event?: ToggleEventLike): void {
    if (event) {
      this.isActive = event.target.checked;
    } else {
      this.isActive = !this.isActive;
    }
  }

  /**
   * Reset all internal state (committed kana, furigana, composing flag, etc.).
   */
  reset(): void {
    this.furigana = '';
    this.tracker.reset();
  }

  /**
   * @deprecated Use reset() instead.
   */
  initializeValues(): void {
    this.reset();
  }

  private registerEvents(elName: KanaElement): void {
    elName.addEventListener('blur', this.blurHandler);
    elName.addEventListener('focus', this.focusHandler);
    elName.addEventListener('compositionstart', this.compositionStartHandler);
    elName.addEventListener('compositionend', this.compositionEndHandler);
    elName.addEventListener('input', this.inputHandler as EventListener);
  }

  /** @internal Internal mechanics; not part of the supported public API. */
  setFurigana(force = false, nextFurigana: string = this.furigana): void {
    if (!this.isActive) {
      return;
    }
    if (!force && nextFurigana === this.furigana) {
      return;
    }
    this.furigana = nextFurigana;
    if (this.elFurigana) {
      this.elFurigana.value = this.furigana;
      this.elFurigana.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (this.option.onChange) {
      this.option.onChange(this.furigana);
    }
  }

  /** @internal Internal mechanics; not part of the supported public API. */
  processValue(): void {
    const rawInput = this.elName.value;
    const result = this.tracker.trackInput(rawInput);
    this.setFurigana(result.reset, result.furigana);
  }

  /**
   * Remove all event listeners (blur, focus, compositionstart, compositionend, input) from the name element.
   */
  destroy(): void {
    this.elName.removeEventListener('blur', this.blurHandler);
    this.elName.removeEventListener('focus', this.focusHandler);
    this.elName.removeEventListener('compositionstart', this.compositionStartHandler);
    this.elName.removeEventListener('compositionend', this.compositionEndHandler);
    this.elName.removeEventListener('input', this.inputHandler as EventListener);
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
