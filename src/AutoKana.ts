type Bindable = string | Element;

type KatakanaOption = false | 'full' | 'half';

interface AutoKanaOption {
  katakana: KatakanaOption;
  debug: boolean;
  checkInterval: number;
}

function ltrim(str: string, chars?: string): string {
  const escaped = !chars ? ' \\s\u00A0' : chars.replace(/([[\]().?/*{}+$^:])/g, '$1');
  const re = new RegExp(`^[${escaped}]+`, 'g');
  return str.replace(re, '');
}

function isHiragana(charCode: number): boolean {
  return (charCode >= 12353 && charCode <= 12435) || charCode === 12445 || charCode === 12446;
}

function ensureElement(idOrElement: Bindable): HTMLElement | null {
  if (typeof idOrElement === 'string') {
    return document.getElementById(ltrim(idOrElement, '#'));
  }
  if (idOrElement instanceof HTMLElement) {
    return idOrElement;
  }
  return null;
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
  timer: number | null;
  option: AutoKanaOption;
  elName!: HTMLInputElement;
  elFurigana?: HTMLInputElement;
  baseKana: string;
  furigana: string;
  isConverting: boolean;
  ignoreString: string;
  input: string;
  values: string[];

  constructor(name: Bindable, furigana: Bindable = '', option: Partial<AutoKanaOption> = {}) {
    this.isActive = true;
    this.timer = null;
    this.baseKana = '';
    this.furigana = '';
    this.isConverting = false;
    this.ignoreString = '';
    this.input = '';
    this.values = [];

    this.option = Object.assign(
      {
        katakana: false as KatakanaOption,
        debug: false,
        checkInterval: 30,
      },
      option,
    );

    const elName = ensureElement(name);
    const elFurigana = furigana ? ensureElement(furigana) : null;

    if (!elName) throw new Error(`Element not found: ${name}`);

    this.elName = elName as HTMLInputElement;
    this.registerEvents(this.elName);

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
    this.isConverting = false;
    this.ignoreString = '';
    this.input = '';
    this.values = [];
  }

  registerEvents(elName: HTMLInputElement): void {
    elName.addEventListener('blur', () => {
      this.debug('blur');
      this.clearInterval();
    });
    elName.addEventListener('focus', () => {
      this.debug('focus');
      this.onInput();
      this.setInterval();
    });
    elName.addEventListener('keydown', () => {
      this.debug('keydown');
      if (this.isConverting) {
        this.onInput();
      }
    });
  }

  clearInterval(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  toKatakana(src: string): string {
    if (this.option.katakana === false || !this.option.katakana) {
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
      return str.replace(/[ァ-ヴヺー。、]/g, (ch) => fullToHalfKatakanaMap[ch] ?? ch);
    }

    return str;
  }

  setFurigana(newValues?: string[]): void {
    if (this.isConverting) return;

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
      return String(newInput).replace(this.ignoreString, '');
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
    if (this.isConverting) return;

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

  checkValue(): void {
    let newInput: string;
    newInput = this.elName.value;

    if (newInput === '') {
      this.initializeValues();
      this.setFurigana();
    } else {
      newInput = this.removeString(newInput);

      if (this.input === newInput) return;

      this.input = newInput;

      if (this.isConverting) return;

      const newValues = newInput.replace(kanaExtractionPattern, '').split('');
      this.checkConvert(newValues);
      this.setFurigana(newValues);
    }

    this.debug(this.input);
  }

  setInterval(): void {
    this.timer = setInterval(
      this.checkValue.bind(this),
      this.option.checkInterval,
    ) as unknown as number;
  }

  onInput(): void {
    if (this.elFurigana) {
      this.baseKana = this.elFurigana.value;
    }
    this.isConverting = false;
    this.ignoreString = this.elName.value;
  }

  onConvert(): void {
    this.baseKana = this.baseKana + this.values.join('');
    this.isConverting = true;
    this.values = [];
  }

  debug(...args: unknown[]): void {
    if (this.option.debug) {
      // eslint-disable-next-line no-console
      console.log(...args);
    }
  }
}
