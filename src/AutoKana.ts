/** A CSS selector string or a DOM Element. */
type KanaElement = HTMLInputElement | HTMLTextAreaElement;
type Bindable = string | KanaElement;

type KatakanaOption = 'hiragana' | 'full' | 'half';

export interface AutoKanaOption {
  /** Output format for furigana. `'hiragana'` = hiragana, `'full'` = full-width katakana, `'half'` = half-width katakana. */
  katakana?: KatakanaOption;
  /** When `true`, logs debug information to the console. */
  debug?: boolean;
  /** Callback invoked with the current furigana string whenever it changes. */
  onChange?: (furigana: string) => void;
}

function getElementLabel(selectorOrElement: Bindable): string {
  return typeof selectorOrElement === 'string'
    ? `"${selectorOrElement}"`
    : 'the provided element';
}

function ensureElement(selectorOrElement: Bindable): HTMLElement | null {
  if (typeof selectorOrElement === 'string') {
    // CSS selectors (starting with #, ., [, or :) are passed directly to querySelector.
    // Bare strings are treated as IDs for backward compatibility.
    if (!/^[[.#:]/.test(selectorOrElement)) {
      return document.getElementById(selectorOrElement);
    }
    try {
      return document.querySelector(selectorOrElement);
    } catch {
      throw new Error(`AutoKana: Invalid selector for ${getElementLabel(selectorOrElement)}.`);
    }
  }
  if (selectorOrElement instanceof HTMLElement) {
    return selectorOrElement;
  }
  return null;
}

function isKanaElement(el: HTMLElement): el is KanaElement {
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
}

function requireElement(selectorOrElement: Bindable): KanaElement {
  const el = ensureElement(selectorOrElement);
  if (!el) {
    const label = getElementLabel(selectorOrElement);
    throw new Error(
      `AutoKana: Element not found for ${label}. ` +
      `Ensure the DOM element exists before calling bind(). ` +
      `For SPAs, call bind() after the component is mounted.`,
    );
  }
  if (!isKanaElement(el)) {
    const label = getElementLabel(selectorOrElement);
    throw new Error(`AutoKana: Element must be an input or textarea for ${label}.`);
  }
  return el;
}

import { KanaExtractor } from './KanaExtractor';
import { KanaConverter } from './KanaConverter';

export type { Bindable, KatakanaOption };

export default class AutoKana {
  isActive: boolean;
  option: AutoKanaOption & { katakana: KatakanaOption; debug: boolean };
  private elName: KanaElement;
  private elFurigana?: KanaElement;
  private committedKana: string;
  private furigana: string;
  private isComposing: boolean;
  private lastConvertedInput: string;
  private lastNewInput: string;
  private pendingKana: string[];

  private previousRawInput: string;

  private blurHandler = (): void => {
    this.debug('blur');
    this.isComposing = false;
  };

  private focusHandler = (): void => {
    this.debug('focus');
    if (this.elFurigana) {
      this.committedKana = this.elFurigana.value;
    }
    this.isComposing = false;
    this.pendingKana = [];
    this.lastNewInput = '';
    this.previousRawInput = '';
    this.lastConvertedInput = this.elName.value;
    this.processValue();
  };

  private compositionStartHandler = (): void => {
    this.debug('compositionstart');
    this.isComposing = true;
  };

  private compositionEndHandler = (): void => {
    this.debug('compositionend');
    this.isComposing = false;
    // Reset input tracking so processValue() treats this as a new input
    // and runs the full non-composition path (detectAndCommitConversion, etc.)
    // Do NOT reset this.pendingKana — they contain the kana accumulated during
    // composition that commitPendingKana() needs to move into committedKana.
    this.lastNewInput = '';
    this.previousRawInput = '';
    this.processValue();
  };

  private inputHandler = (event: InputEvent): void => {
    this.debug('input', event.isComposing);
    this.processValue();
  };

  constructor(name: Bindable, furigana: Bindable = '', option: Partial<AutoKanaOption> = {}) {
    this.isActive = true;
    this.committedKana = '';
    this.furigana = '';
    this.isComposing = false;
    this.lastConvertedInput = '';
    this.lastNewInput = '';
    this.pendingKana = [];
    this.previousRawInput = '';

    this.option = Object.assign(
      {
        katakana: 'hiragana' as KatakanaOption,
        debug: false,
      },
      option,
    );

    const elName = requireElement(name);
    const elFurigana = furigana === undefined || furigana === ''
      ? undefined
      : requireElement(furigana);

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
  toggle(event?: { target: { checked: boolean } }): void {
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
    this.committedKana = '';
    this.furigana = '';
    this.isComposing = false;
    this.lastConvertedInput = '';
    this.lastNewInput = '';
    this.pendingKana = [];
    this.previousRawInput = '';
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

  setFurigana(force = false): void {
    if (this.isActive) {
      const kana = KanaConverter.toKatakana(this.committedKana + this.pendingKana.join(''), this.option.katakana);
      const furigana = this.option.katakana === 'half' ? kana.replace(/　/g, ' ') : kana;
      if (!force && furigana === this.furigana) {
        return;
      }
      this.furigana = furigana;
      if (this.elFurigana) {
        this.elFurigana.value = this.furigana;
        this.elFurigana.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (this.option.onChange) {
        this.option.onChange(this.furigana);
      }
    }
  }

  private extractNewInput(newInput: string): string {
    if (newInput.indexOf(this.lastConvertedInput) !== -1) {
      return newInput.replace(this.lastConvertedInput, '');
    }
    const ignoreArray = this.lastConvertedInput.split('');
    const inputArray = newInput.split('');
    for (let i = 0; i < ignoreArray.length; i += 1) {
      if (ignoreArray[i] === inputArray[i]) {
        inputArray[i] = '';
      }
    }
    return inputArray.join('');
  }

  detectAndCommitConversion(newPendingKana: string[]): void {
    if (Math.abs(this.pendingKana.length - newPendingKana.length) > 1) {
      const oldKana = this.pendingKana.join('');
      const newKana = newPendingKana.join('');
      if (!newKana.startsWith(oldKana)) {
        const compacted = KanaExtractor.compact(newKana).split('');
        if (Math.abs(this.pendingKana.length - compacted.length) > 1) {
          this.commitPendingKana();
        }
      }
    } else if (this.pendingKana.length === this.lastNewInput.length && this.pendingKana.join('') !== this.lastNewInput) {
      if (KanaExtractor.containsNonKana(this.lastNewInput)) {
        this.commitPendingKana();
      }
    }
  }

  private handleCompositionInput(newInput: string): void {
    const newPendingKana = KanaExtractor.extract(newInput);
    if (newPendingKana.length >= this.pendingKana.length) {
      this.pendingKana = newPendingKana;
    }
    this.setFurigana();
  }

  private handleNormalInput(newInput: string, rawInput: string): void {
    if (this.lastNewInput === newInput) return;

    const isDeletion = rawInput.length < this.previousRawInput.length;
    this.lastNewInput = newInput;
    this.previousRawInput = rawInput;

    const newPendingKana = KanaExtractor.extract(newInput);

    if (!isDeletion) {
      const prevCommittedKana = this.committedKana;
      this.detectAndCommitConversion(newPendingKana);
      if (this.committedKana !== prevCommittedKana) {
        this.lastConvertedInput = rawInput;
        this.setFurigana();
        return;
      }
    }

    this.pendingKana = newPendingKana;
    this.setFurigana();
  }

  processValue(): void {
    const rawInput = this.elName.value;

    if (rawInput === '') {
      this.reset();
      this.setFurigana(true);
      return;
    }

    const newInput = this.extractNewInput(rawInput);

    if (this.isComposing) {
      this.handleCompositionInput(newInput);
      return;
    }

    this.handleNormalInput(newInput, rawInput);
  }

  commitPendingKana(): void {
    this.committedKana = this.committedKana + this.pendingKana.join('');
    this.pendingKana = [];
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
  }

  private debug(...args: unknown[]): void {
    if (this.option.debug) {
      // eslint-disable-next-line no-console
      console.log(...args);
    }
  }
}
