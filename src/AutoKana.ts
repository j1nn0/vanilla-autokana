/** A CSS selector string or a DOM Element. */
type Bindable = string | HTMLElement;

type KatakanaOption = false | 'full' | 'half';

interface AutoKanaOption {
  katakana: KatakanaOption;
  debug: boolean;
}

const HIRAGANA_START = 12353; // ぁ
const HIRAGANA_END = 12435; // ん
const HIRAGANA_ITERATION_MARK = 12445; // ゝ
const HIRAGANA_VOICED_ITERATION_MARK = 12446; // ゞ

function isHiragana(charCode: number): boolean {
  return (
    (charCode >= HIRAGANA_START && charCode <= HIRAGANA_END) ||
    charCode === HIRAGANA_ITERATION_MARK ||
    charCode === HIRAGANA_VOICED_ITERATION_MARK
  );
}

function ensureElement(selectorOrElement: Bindable): HTMLElement | null {
  if (typeof selectorOrElement === 'string') {
    // CSS selectors (starting with #, ., [, or :) are passed directly to querySelector.
    // Bare strings are treated as IDs for backward compatibility.
    const selector = /^[[.#:]/.test(selectorOrElement) ? selectorOrElement : `#${selectorOrElement}`;
    return document.querySelector(selector);
  }
  if (selectorOrElement instanceof HTMLElement) {
    return selectorOrElement;
  }
  return null;
}

function requireElement(selectorOrElement: Bindable): HTMLElement {
  const el = ensureElement(selectorOrElement);
  if (!el) throw new Error(`Element not found: ${selectorOrElement}`);
  return el;
}

// eslint-disable-next-line no-irregular-whitespace
const kanaExtractionPattern = /[^ 　ぁあ-んー]/g;
const kanaCompactingPattern = /[ぁぃぅぇぉっゃゅょ]/g;

import { fullToHalfKatakanaMap } from './katakanaMap';

export type { AutoKanaOption, Bindable, KatakanaOption };

export default class AutoKana {
  isActive: boolean;
  option: AutoKanaOption;
  private elName: HTMLInputElement;
  private elFurigana?: HTMLInputElement;
  private baseKana: string;
  private furigana: string;
  private isComposing: boolean;
  private ignoreString: string;
  private input: string;
  private values: string[];

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

    this.option = Object.assign(
      {
        katakana: false as KatakanaOption,
        debug: false,
      },
      option,
    );

    this.elName = requireElement(name) as HTMLInputElement;
    this.registerEvents(this.elName);

    const elFurigana = furigana ? ensureElement(furigana) : null;
    if (elFurigana) {
      this.elFurigana = elFurigana as HTMLInputElement;
    }
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
  initializeValues(): void {
    this.baseKana = '';
    this.furigana = '';
    this.isComposing = false;
    this.ignoreString = '';
    this.input = '';
    this.values = [];
  }

  private registerEvents(elName: HTMLInputElement): void {
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

  setFurigana(newValues?: string[]): void {
    if (newValues) {
      this.values = newValues;
    }
    if (this.isActive) {
      const kana = this.toKatakana(this.baseKana + this.values.join(''));
      this.furigana = this.option.katakana === 'half' ? kana.replace(/　/g, ' ') : kana;
      if (this.elFurigana) {
        this.elFurigana.value = this.furigana;
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
      const tmpValues = newValues.join('').replace(kanaCompactingPattern, '').split('');
      if (Math.abs(this.values.length - tmpValues.length) > 1) {
        this.onConvert();
      }
    } else if (this.values.length === this.input.length && this.values.join('') !== this.input) {
      if (this.input.match(kanaExtractionPattern)) {
        this.onConvert();
      }
    }
  }

  processValue(): void {
    let newInput = this.elName.value;

    if (newInput === '') {
      this.initializeValues();
      this.setFurigana();
      return;
    }

    newInput = this.removeString(newInput);

    if (this.input === newInput) return;

    this.input = newInput;

    const newValues = newInput.replace(kanaExtractionPattern, '').split('');
    this.checkConvert(newValues);
    this.setFurigana(newValues);

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
