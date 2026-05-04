/** A CSS selector string or a DOM Element. */
type Bindable = string | Element;

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

const fullToHalfKatakanaMap: Record<string, string> = {
  ァ: 'ｧ',
  ア: 'ｱ',
  ィ: 'ｨ',
  イ: 'ｲ',
  ゥ: 'ｩ',
  ウ: 'ｳ',
  ェ: 'ｪ',
  エ: 'ｴ',
  ォ: 'ｫ',
  オ: 'ｵ',
  カ: 'ｶ',
  ガ: 'ｶﾞ',
  キ: 'ｷ',
  ギ: 'ｷﾞ',
  ク: 'ｸ',
  グ: 'ｸﾞ',
  ケ: 'ｹ',
  ゲ: 'ｹﾞ',
  コ: 'ｺ',
  ゴ: 'ｺﾞ',
  サ: 'ｻ',
  ザ: 'ｻﾞ',
  シ: 'ｼ',
  ジ: 'ｼﾞ',
  ス: 'ｽ',
  ズ: 'ｽﾞ',
  セ: 'ｾ',
  ゼ: 'ｾﾞ',
  ソ: 'ｿ',
  ゾ: 'ｿﾞ',
  タ: 'ﾀ',
  ダ: 'ﾀﾞ',
  チ: 'ﾁ',
  ヂ: 'ﾁﾞ',
  ッ: 'ｯ',
  ツ: 'ﾂ',
  ヅ: 'ﾂﾞ',
  テ: 'ﾃ',
  デ: 'ﾃﾞ',
  ト: 'ﾄ',
  ド: 'ﾄﾞ',
  ナ: 'ﾅ',
  ニ: 'ﾆ',
  ヌ: 'ﾇ',
  ネ: 'ﾈ',
  ノ: 'ﾉ',
  ハ: 'ﾊ',
  バ: 'ﾊﾞ',
  パ: 'ﾊﾟ',
  ヒ: 'ﾋ',
  ビ: 'ﾋﾞ',
  ピ: 'ﾋﾟ',
  フ: 'ﾌ',
  ブ: 'ﾌﾞ',
  プ: 'ﾌﾟ',
  ヘ: 'ﾍ',
  ベ: 'ﾍﾞ',
  ペ: 'ﾍﾟ',
  ホ: 'ﾎ',
  ボ: 'ﾎﾞ',
  ポ: 'ﾎﾟ',
  マ: 'ﾏ',
  ミ: 'ﾐ',
  ム: 'ﾑ',
  メ: 'ﾒ',
  モ: 'ﾓ',
  ャ: 'ｬ',
  ヤ: 'ﾔ',
  ュ: 'ｭ',
  ユ: 'ﾕ',
  ョ: 'ｮ',
  ヨ: 'ﾖ',
  ラ: 'ﾗ',
  リ: 'ﾘ',
  ル: 'ﾙ',
  レ: 'ﾚ',
  ロ: 'ﾛ',
  ワ: 'ﾜ',
  ヰ: 'ｲ',
  ヱ: 'ｴ',
  ヲ: 'ｦ',
  ヺ: 'ｦﾞ',
  ン: 'ﾝ',
  ヴ: 'ｳﾞ',
  ー: 'ｰ',
  '。': '｡',
  '、': '､',
};

export type { AutoKanaOption };

export default class AutoKana {
  isActive: boolean;
  option: AutoKanaOption;
  elName: HTMLInputElement;
  elFurigana?: HTMLInputElement;
  baseKana: string;
  furigana: string;
  isComposing: boolean;
  ignoreString: string;
  input: string;
  values: string[];

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

  getFurigana(): string {
    return this.furigana;
  }

  start(): void {
    this.isActive = true;
  }

  stop(): void {
    this.isActive = false;
  }

  toggle(event?: Event): void {
    if (event) {
      const el = event.target as HTMLInputElement;
      if (el) {
        this.isActive = el.checked;
      }
    } else {
      this.isActive = !this.isActive;
    }
  }

  initializeValues(): void {
    this.baseKana = '';
    this.furigana = '';
    this.isComposing = false;
    this.ignoreString = '';
    this.input = '';
    this.values = [];
  }

  registerEvents(elName: HTMLInputElement): void {
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
    if (this.isComposing) return;
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
