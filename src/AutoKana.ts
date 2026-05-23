/** A CSS selector string or a DOM Element. */
type KanaElement = HTMLInputElement | HTMLTextAreaElement;
type Bindable = string | KanaElement;

type KatakanaOption = false | 'full' | 'half';

interface AutoKanaOption {
  /** Output format for furigana. `false` = hiragana, `'full'` = full-width katakana, `'half'` = half-width katakana. */
  katakana: KatakanaOption;
  /** When `true`, logs debug information to the console. */
  debug: boolean;
  /** Callback invoked with the current furigana string whenever it changes. */
  onChange?: (furigana: string) => void;
}

const HIRAGANA_START = 12353; // ぁ
const HIRAGANA_END = 12436; // ゔ
const HIRAGANA_ITERATION_MARK = 12445; // ゝ
const HIRAGANA_VOICED_ITERATION_MARK = 12446; // ゞ

function isHiragana(charCode: number): boolean {
  return (
    (charCode >= HIRAGANA_START && charCode <= HIRAGANA_END) ||
    charCode === HIRAGANA_ITERATION_MARK ||
    charCode === HIRAGANA_VOICED_ITERATION_MARK
  );
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

// eslint-disable-next-line no-irregular-whitespace
const kanaExtractionPattern = /[^ 　ぁあ-んゔー]/g;
const kanaCompactingPattern = /[ぁぃぅぇぉっゃゅょ]/g;

import { fullToHalfKatakanaMap } from './katakanaMap';

export type { AutoKanaOption, Bindable, KatakanaOption };

export default class AutoKana {
  isActive: boolean;
  option: AutoKanaOption;
  private elName: KanaElement;
  private elFurigana?: KanaElement;
  private baseKana: string;
  private furigana: string;
  private isComposing: boolean;
  private ignoreString: string;
  private input: string;
  private values: string[];

  private previousRawInput: string;

  private blurHandler = (): void => {
    this.debug('blur');
    this.isComposing = false;
  };

  private focusHandler = (): void => {
    this.debug('focus');
    if (this.elFurigana) {
      this.baseKana = this.elFurigana.value;
    }
    this.isComposing = false;
    this.values = [];
    this.input = '';
    this.previousRawInput = '';
    this.ignoreString = this.elName.value;
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
    // and runs the full non-composition path (checkConvert, etc.)
    // Do NOT reset this.values — they contain the kana accumulated during
    // composition that onConvert() needs to move into baseKana.
    this.input = '';
    this.previousRawInput = '';
    this.processValue();
  };

  private inputHandler = (event: InputEvent): void => {
    this.debug('input', event.isComposing);
    this.processValue();
  };

  constructor(name: Bindable, furigana: Bindable = '', option: Partial<AutoKanaOption> = {}) {
    this.isActive = true;
    this.baseKana = '';
    this.furigana = '';
    this.isComposing = false;
    this.ignoreString = '';
    this.input = '';
    this.values = [];
    this.previousRawInput = '';

    this.option = Object.assign(
      {
        katakana: false as KatakanaOption,
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
   * Reset all internal state (base kana, furigana, composing flag, etc.).
   */
  reset(): void {
    this.baseKana = '';
    this.furigana = '';
    this.isComposing = false;
    this.ignoreString = '';
    this.input = '';
    this.values = [];
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

  toKatakana(src: string): string {
    if (!this.option.katakana) {
      return src;
    }

    let c: number;
    let str = '';
    for (let i = 0; i < src.length; i += 1) {
      c = src.charCodeAt(i);
      if (isHiragana(c)) {
        str += String.fromCharCode(c + 96);
      } else {
        str += src.charAt(i);
      }
    }

    if (this.option.katakana === 'half') {
      // Characters not in fullToHalfKatakanaMap are left unchanged (fallback to the original character).
      return str.replace(/[ァ-ヴヺー。、]/g, (ch) => fullToHalfKatakanaMap[ch] ?? ch);
    }

    return str;
  }

  setFurigana(newValues?: string[], force = false): void {
    if (newValues) {
      this.values = newValues;
    }
    if (this.isActive) {
      const kana = this.toKatakana(this.baseKana + this.values.join(''));
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

  removeString(newInput: string): string {
    if (newInput.indexOf(this.ignoreString) !== -1) {
      return newInput.replace(this.ignoreString, '');
    }
    const ignoreArray = this.ignoreString.split('');
    const inputArray = newInput.split('');
    for (let i = 0; i < ignoreArray.length; i += 1) {
      if (ignoreArray[i] === inputArray[i]) {
        inputArray[i] = '';
      }
    }
    return inputArray.join('');
  }

  checkConvert(newValues: string[]): void {
    if (Math.abs(this.values.length - newValues.length) > 1) {
      // If the old values are a prefix of the new values, this is an addition
      // (not a conversion), so skip onConvert.
      const oldKana = this.values.join('');
      const newKana = newValues.join('');
      if (!newKana.startsWith(oldKana)) {
        const tmpValues = newKana.replace(kanaCompactingPattern, '').split('');
        if (Math.abs(this.values.length - tmpValues.length) > 1) {
          this.onConvert();
        }
      }
    } else if (this.values.length === this.input.length && this.values.join('') !== this.input) {
      if (this.input.match(kanaExtractionPattern)) {
        this.onConvert();
      }
    }
  }

  processValue(): void {
    const rawInput = this.elName.value;
    let newInput = rawInput;

    if (newInput === '') {
      this.reset();
      this.setFurigana(undefined, true);
      return;
    }

    newInput = this.removeString(newInput);

    if (this.isComposing) {
      // During IME composition, accumulate kana in values for real-time display.
      // However, do NOT overwrite values when characters are stripped by
      // kanaExtractionPattern (e.g. "病まだ" → "まだ" losing "や"),
      // as this happens during candidate browsing and would corrupt state.
      const newValues = newInput.replace(kanaExtractionPattern, '').split('');
      if (newValues.length >= this.values.length) {
        // More or equal kana — safe to update (normal typing or additions)
        this.values = newValues;
      }
      // If newValues.length < this.values.length, candidate browsing is
      // stripping kana. Keep existing values to preserve furigana.
      this.setFurigana();
      return;
    }

    if (this.input === newInput) return;

    // Detect deletion: if the raw input is shorter than before, the user
    // deleted characters. Skip onConvert to prevent incorrect accumulation.
    const isDeletion = rawInput.length < this.previousRawInput.length;

    this.input = newInput;
    this.previousRawInput = rawInput;

    const newValues = newInput.replace(kanaExtractionPattern, '').split('');

    if (!isDeletion) {
      const prevBaseKana = this.baseKana;
      this.checkConvert(newValues);
      // If onConvert() was called inside checkConvert(), values were already
      // moved to baseKana and cleared. Overwriting values with newValues would
      // re-add kana fragments (e.g. "まだ" from "病まだ"), causing duplication
      // like "やまだまだ". Update ignoreString so that subsequent processValue()
      // calls strip the already-converted text via removeString().
      if (this.baseKana !== prevBaseKana) {
        this.ignoreString = rawInput;
        this.setFurigana();
        return;
      }
    }
    this.values = newValues;

    this.setFurigana();
  }

  onConvert(): void {
    this.baseKana = this.baseKana + this.values.join('');
    this.values = [];
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

  debug(...args: unknown[]): void {
    if (this.option.debug) {
      // eslint-disable-next-line no-console
      console.log(...args);
    }
  }
}
