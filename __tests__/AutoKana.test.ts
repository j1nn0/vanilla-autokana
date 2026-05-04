import { expect, test, vi } from 'vitest';

/* global test expect document */
import AutoKana from '../src/AutoKana';

function setup(html = '<input name="name" id="name"><input name="furigana" id="furigana">') {
  document.body.innerHTML = html;
}

test('init', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana');
  autokana.start();
  expect(autokana.isActive).toBe(true);
});

test('init with pass elements', () => {
  setup('<input name="name"><input name="furigana">');
  const name = document.querySelector('[name=name]') as Element;
  const furigana = document.querySelector('[name=furigana]') as Element;
  const autokana = new AutoKana(name, furigana);
  autokana.start();
  expect(autokana.isActive).toBe(true);
});

test('katakana: "half" converts basic hiragana to half-width katakana', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana', { katakana: 'half' });
  expect(autokana.option.katakana).toBe('half');
  // toKatakana の変換結果を確認
  expect(autokana.toKatakana('あいうえお')).toBe('ｱｲｳｴｵ');
  expect(autokana.toKatakana('かきくけこ')).toBe('ｶｷｸｹｺ');
  expect(autokana.toKatakana('がぎぐげご')).toBe('ｶﾞｷﾞｸﾞｹﾞｺﾞ');
  expect(autokana.toKatakana('ぱぴぷぺぽ')).toBe('ﾊﾟﾋﾟﾌﾟﾍﾟﾎﾟ');
  expect(autokana.toKatakana('っゃゅょ')).toBe('ｯｬｭｮ');
  expect(autokana.toKatakana('ん')).toBe('ﾝ');
  expect(autokana.toKatakana('ー')).toBe('ｰ');
  expect(autokana.toKatakana('ヰ')).toBe('ｲ');
  expect(autokana.toKatakana('ヱ')).toBe('ｴ');
  expect(autokana.toKatakana('ヺ')).toBe('ｦﾞ');
  expect(autokana.toKatakana('。')).toBe('｡');
  expect(autokana.toKatakana('、')).toBe('､');
});

test('katakana: "full" converts hiragana to full-width katakana', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana', { katakana: 'full' });
  expect(autokana.toKatakana('あいうえお')).toBe('アイウエオ');
});

test('katakana: false keeps hiragana as-is', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana', { katakana: false });
  expect(autokana.toKatakana('あいうえお')).toBe('あいうえお');
});

test('no option keeps hiragana as-is', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana');
  expect(autokana.toKatakana('あいうえお')).toBe('あいうえお');
});

test('full-width spaces are kept as-is in furigana by default', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana');
  autokana.baseKana = 'やまだ　たろう';
  autokana.values = [];
  autokana.setFurigana();
  expect(autokana.getFurigana()).toBe('やまだ　たろう');
});

test('full-width spaces are converted to half-width spaces when katakana is "half"', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana', { katakana: 'half' });
  autokana.baseKana = 'やまだ　たろう';
  autokana.values = [];
  autokana.setFurigana();
  expect(autokana.getFurigana()).toBe('ﾔﾏﾀﾞ ﾀﾛｳ');
});

test('toggle() without event flips isActive', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana');
  expect(autokana.isActive).toBe(true);
  autokana.toggle();
  expect(autokana.isActive).toBe(false);
  autokana.toggle();
  expect(autokana.isActive).toBe(true);
});

test('toggle(event) sets isActive from checkbox checked state', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana');
  const fakeUncheckedEvent = { target: { checked: false } } as unknown as Event;
  autokana.toggle(fakeUncheckedEvent);
  expect(autokana.isActive).toBe(false);
  const fakeCheckedEvent = { target: { checked: true } } as unknown as Event;
  autokana.toggle(fakeCheckedEvent);
  expect(autokana.isActive).toBe(true);
});

test('stop() then start() cycle preserves setFurigana behavior', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana');
  autokana.baseKana = 'たろう';
  autokana.values = [];
  autokana.stop();
  autokana.setFurigana();
  expect(autokana.getFurigana()).toBe(''); // inactive: furigana unchanged
  autokana.start();
  autokana.setFurigana();
  expect(autokana.getFurigana()).toBe('たろう');
});

test('bind with missing element throws Error', () => {
  setup();
  expect(() => new AutoKana('nonexistent')).toThrow('Element not found: nonexistent');
});

test('bind with # prefix resolves element by id', () => {
  setup();
  const autokana = new AutoKana('#name', '#furigana');
  expect(autokana.isActive).toBe(true);
});

test('clearInterval resets timer to null', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana');
  autokana.setInterval();
  expect(autokana.timer).not.toBeNull();
  autokana.clearInterval();
  expect(autokana.timer).toBeNull();
  // calling clearInterval again should not throw
  autokana.clearInterval();
  expect(autokana.timer).toBeNull();
});

test('setInterval clears existing timer before creating a new one', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana');
  autokana.setInterval();
  const firstTimer = autokana.timer;
  autokana.setInterval();
  const secondTimer = autokana.timer;
  expect(secondTimer).not.toBeNull();
  expect(secondTimer).not.toBe(firstTimer);
  autokana.clearInterval();
});

test('destroy() clears the timer', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana');
  autokana.setInterval();
  expect(autokana.timer).not.toBeNull();
  autokana.destroy();
  expect(autokana.timer).toBeNull();
});

test('focus starts interval and blur clears interval', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana');
  const nameInput = document.getElementById('name') as HTMLInputElement;

  expect(autokana.timer).toBeNull();
  nameInput.dispatchEvent(new Event('focus'));
  expect(autokana.timer).not.toBeNull();

  nameInput.dispatchEvent(new Event('blur'));
  expect(autokana.timer).toBeNull();
});

test('keydown while converting triggers onInput state reset', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana');
  const nameInput = document.getElementById('name') as HTMLInputElement;

  nameInput.value = 'やまだ';
  autokana.isConverting = true;
  autokana.ignoreString = '';

  nameInput.dispatchEvent(new Event('keydown'));

  expect(autokana.isConverting).toBe(false);
  expect(autokana.ignoreString).toBe('やまだ');
});

test('checkConvert() triggers onConvert when values differ significantly', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana');
  autokana.isConverting = false;
  autokana.values = ['あ', 'い', 'う'];
  // newValues is very different in length (> 1 difference after compacting)
  autokana.checkConvert(['a', 'b', 'c', 'd', 'e', 'f']);
  expect(autokana.isConverting).toBe(true);
});

test('removeString() removes ignoreString prefix from input', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana');
  autokana.ignoreString = 'やまだ';
  expect(autokana.removeString('やまだたろう')).toBe('たろう');
});

test('removeString() handles partial character mismatch', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana');
  autokana.ignoreString = 'やXう';
  // 'やXう' not found as substring in 'やまだ', falls back to char-by-char
  const result = autokana.removeString('やまだ');
  // First char 'や' matches ignoreString[0]='や', so removed; others kept
  expect(result).toBe('まだ');
});

test('initializeValues() resets all internal state', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana');
  autokana.baseKana = 'やまだ';
  autokana.furigana = 'やまだ';
  autokana.isConverting = true;
  autokana.ignoreString = 'やまだ';
  autokana.input = 'やまだ';
  autokana.values = ['や', 'ま', 'だ'];
  autokana.initializeValues();
  expect(autokana.baseKana).toBe('');
  expect(autokana.furigana).toBe('');
  expect(autokana.isConverting).toBe(false);
  expect(autokana.ignoreString).toBe('');
  expect(autokana.input).toBe('');
  expect(autokana.values).toEqual([]);
});

test('debug() logs when debug option is true', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana', { debug: true });
  const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  autokana.debug('test', 123);
  expect(logSpy).toHaveBeenCalledWith('test', 123);
  logSpy.mockRestore();
});

test('debug() does not log when debug option is false', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana', { debug: false });
  const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  autokana.debug('test');
  expect(logSpy).not.toHaveBeenCalled();
  logSpy.mockRestore();
});

test('onInput() resets isConverting and captures current values', () => {
  setup();
  const nameInput = document.getElementById('name') as HTMLInputElement;
  const furiganaInput = document.getElementById('furigana') as HTMLInputElement;
  nameInput.value = 'やまだ';
  furiganaInput.value = 'やまだ';
  const autokana = new AutoKana('name', 'furigana');
  autokana.isConverting = true;
  autokana.onInput();
  expect(autokana.isConverting).toBe(false);
  expect(autokana.ignoreString).toBe('やまだ');
  expect(autokana.baseKana).toBe('やまだ');
});

test('onInput() without furigana element does not update baseKana', () => {
  setup('<input name="name" id="name">');
  const nameInput = document.getElementById('name') as HTMLInputElement;
  nameInput.value = 'やまだ';
  const autokana = new AutoKana('name');
  autokana.baseKana = 'previous';
  autokana.onInput();
  expect(autokana.baseKana).toBe('previous');
});

test('onConvert() commits values to baseKana and sets isConverting', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana');
  autokana.baseKana = 'や';
  autokana.values = ['ま', 'だ'];
  autokana.onConvert();
  expect(autokana.baseKana).toBe('やまだ');
  expect(autokana.isConverting).toBe(true);
  expect(autokana.values).toEqual([]);
});

test('checkValue() resets state when input is empty', () => {
  setup();
  const nameInput = document.getElementById('name') as HTMLInputElement;
  const autokana = new AutoKana('name', 'furigana');
  autokana.baseKana = 'やまだ';
  autokana.furigana = 'やまだ';
  nameInput.value = '';
  autokana.checkValue();
  expect(autokana.baseKana).toBe('');
  expect(autokana.furigana).toBe('');
});

test('checkValue() skips processing when input has not changed', () => {
  setup();
  const nameInput = document.getElementById('name') as HTMLInputElement;
  const autokana = new AutoKana('name', 'furigana');
  nameInput.value = 'やまだ';
  autokana.ignoreString = 'やまだ';
  autokana.input = '';
  // First call processes the input
  autokana.checkValue();
  const furiganaAfterFirst = autokana.getFurigana();
  // Second call with same input should not change state
  autokana.checkValue();
  expect(autokana.getFurigana()).toBe(furiganaAfterFirst);
});

test('checkValue() skips processing when isConverting is true', () => {
  setup();
  const nameInput = document.getElementById('name') as HTMLInputElement;
  const autokana = new AutoKana('name', 'furigana');
  nameInput.value = 'やまだ';
  autokana.isConverting = true;
  autokana.ignoreString = '';
  autokana.checkValue();
  // setFurigana should be skipped when isConverting
  expect(autokana.furigana).toBe('');
});

test('destroy() removes event listeners', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana');
  const nameInput = document.getElementById('name') as HTMLInputElement;
  autokana.destroy();
  // After destroy, focus should not start the interval
  nameInput.dispatchEvent(new Event('focus'));
  expect(autokana.timer).toBeNull();
});

test('bind with class selector resolves element by class', () => {
  document.body.innerHTML = '<input class="name-input" id="name"><input class="furi-input" id="furigana">';
  const autokana = new AutoKana('.name-input', '.furi-input');
  expect(autokana.isActive).toBe(true);
});

test('bind with attribute selector resolves element by attribute', () => {
  document.body.innerHTML = '<input name="name" id="name"><input name="furigana" id="furigana">';
  const autokana = new AutoKana('[name="name"]', '[name="furigana"]');
  expect(autokana.isActive).toBe(true);
});

test('bind with bare ID string resolves element (backward compat)', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana');
  expect(autokana.isActive).toBe(true);
});

test('bind with # prefix ID selector resolves element (backward compat)', () => {
  setup();
  const autokana = new AutoKana('#name', '#furigana');
  expect(autokana.isActive).toBe(true);
});

test('bind with invalid selector throws Error', () => {
  setup();
  expect(() => new AutoKana('.nonexistent')).toThrow('Element not found: .nonexistent');
});