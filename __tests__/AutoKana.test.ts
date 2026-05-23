import { describe, expect, test, vi } from 'vitest';

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
  const name = document.querySelector('[name=name]') as HTMLElement;
  const furigana = document.querySelector('[name=furigana]') as HTMLElement;
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
  // @ts-expect-error - accessing private property for test verification
  autokana.baseKana = 'やまだ　たろう';
  // @ts-expect-error - accessing private property for test verification
  autokana.values = [];
  autokana.setFurigana();
  expect(autokana.getFurigana()).toBe('やまだ　たろう');
});

test('full-width spaces are converted to half-width spaces when katakana is "half"', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana', { katakana: 'half' });
  // @ts-expect-error - accessing private property for test verification
  autokana.baseKana = 'やまだ　たろう';
  // @ts-expect-error - accessing private property for test verification
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
  const fakeUncheckedEvent = { target: { checked: false } };
  autokana.toggle(fakeUncheckedEvent);
  expect(autokana.isActive).toBe(false);
  const fakeCheckedEvent = { target: { checked: true } };
  autokana.toggle(fakeCheckedEvent);
  expect(autokana.isActive).toBe(true);
});

test('stop() then start() cycle preserves setFurigana behavior', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana');
  // @ts-expect-error - accessing private property for test verification
  autokana.baseKana = 'たろう';
  // @ts-expect-error - accessing private property for test verification
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
  expect(() => new AutoKana('nonexistent')).toThrow('AutoKana: Element not found for "nonexistent"');
});

test('bind with # prefix resolves element by id', () => {
  setup();
  const autokana = new AutoKana('#name', '#furigana');
  expect(autokana.isActive).toBe(true);
});

test('destroy() removes all event listeners', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana');
  const nameInput = document.getElementById('name') as HTMLInputElement;
  autokana.destroy();
  nameInput.dispatchEvent(new CompositionEvent('compositionstart'));
  // @ts-expect-error - accessing private property for test verification
  expect(autokana.isComposing).toBe(false);
  nameInput.dispatchEvent(new Event('focus'));
  // @ts-expect-error - accessing private property for test verification
  expect(autokana.baseKana).toBe('');
});

test('focus captures baseKana and blur resets isComposing', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana');
  const nameInput = document.getElementById('name') as HTMLInputElement;
  const furiganaInput = document.getElementById('furigana') as HTMLInputElement;

  furiganaInput.value = 'やまだ';
  nameInput.value = '山田';
  nameInput.dispatchEvent(new Event('focus'));
  // @ts-expect-error - accessing private property for test verification
  expect(autokana.baseKana).toBe('やまだ');
  // @ts-expect-error - accessing private property for test verification
  expect(autokana.isComposing).toBe(false);
  // @ts-expect-error - accessing private property for test verification
  expect(autokana.ignoreString).toBe('山田');

  // @ts-expect-error - accessing private property for test verification
  autokana.isComposing = true;
  nameInput.dispatchEvent(new Event('blur'));
  // @ts-expect-error - accessing private property for test verification
  expect(autokana.isComposing).toBe(false);
});

test('input during composition updates furigana', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana');
  const nameInput = document.getElementById('name') as HTMLInputElement;
  const furiganaInput = document.getElementById('furigana') as HTMLInputElement;

  nameInput.value = 'やまだたろう';
  nameInput.dispatchEvent(new CompositionEvent('compositionstart'));
  nameInput.dispatchEvent(new InputEvent('input', { isComposing: true, inputType: 'insertText' }));
  // @ts-expect-error - accessing private property for test verification
  expect(autokana.isComposing).toBe(true);
  expect(furiganaInput.value).toBe('やまだたろう');
});

test('initializeValues() resets all internal state', () => {
    setup();
    const autokana = new AutoKana('name', 'furigana');
    // @ts-expect-error - accessing private property for test verification
    autokana.baseKana = 'やまだ';
    // @ts-expect-error - accessing private property for test verification
    autokana.furigana = 'やまだ';
    // @ts-expect-error - accessing private property for test verification
    autokana.isComposing = true;
    // @ts-expect-error - accessing private property for test verification
    autokana.ignoreString = 'やまだ';
    // @ts-expect-error - accessing private property for test verification
    autokana.input = 'やまだ';
    // @ts-expect-error - accessing private property for test verification
    autokana.values = ['や', 'ま', 'だ'];
    autokana.initializeValues();
    // @ts-expect-error - accessing private property for test verification
    expect(autokana.baseKana).toBe('');
    // @ts-expect-error - accessing private property for test verification
    expect(autokana.furigana).toBe('');
    // @ts-expect-error - accessing private property for test verification
    expect(autokana.isComposing).toBe(false);
    // @ts-expect-error - accessing private property for test verification
    expect(autokana.ignoreString).toBe('');
    // @ts-expect-error - accessing private property for test verification
    expect(autokana.input).toBe('');
    // @ts-expect-error - accessing private property for test verification
    expect(autokana.values).toEqual([]);
  });

  test('reset() resets all internal state (alias for initializeValues)', () => {
    setup();
    const autokana = new AutoKana('name', 'furigana');
    // @ts-expect-error - accessing private property for test verification
    autokana.baseKana = 'やまだ';
    // @ts-expect-error - accessing private property for test verification
    autokana.furigana = 'やまだ';
    // @ts-expect-error - accessing private property for test verification
    autokana.isComposing = true;
    // @ts-expect-error - accessing private property for test verification
    autokana.ignoreString = 'やまだ';
    // @ts-expect-error - accessing private property for test verification
    autokana.input = 'やまだ';
    // @ts-expect-error - accessing private property for test verification
    autokana.values = ['や', 'ま', 'だ'];
    autokana.reset();
    // @ts-expect-error - accessing private property for test verification
    expect(autokana.baseKana).toBe('');
    // @ts-expect-error - accessing private property for test verification
    expect(autokana.furigana).toBe('');
    // @ts-expect-error - accessing private property for test verification
    expect(autokana.isComposing).toBe(false);
    // @ts-expect-error - accessing private property for test verification
    expect(autokana.ignoreString).toBe('');
    // @ts-expect-error - accessing private property for test verification
    expect(autokana.input).toBe('');
    // @ts-expect-error - accessing private property for test verification
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

test('processValue() extracts kana from input and updates furigana', () => {
  setup();
  const nameInput = document.getElementById('name') as HTMLInputElement;
  const furiganaInput = document.getElementById('furigana') as HTMLInputElement;
  nameInput.value = 'やまだ';
  const autokana = new AutoKana('name', 'furigana');
  autokana.processValue();
  expect(furiganaInput.value).toBe('やまだ');
});

test('processValue() without furigana element does not throw', () => {
  setup('<input name="name" id="name">');
  const nameInput = document.getElementById('name') as HTMLInputElement;
  nameInput.value = 'やまだ';
  const autokana = new AutoKana('name');
  // @ts-expect-error - accessing private property for test verification
  autokana.baseKana = 'previous';
  autokana.processValue();
  // @ts-expect-error - accessing private property for test verification
  expect(autokana.baseKana).toBe('previous');
});

test('onConvert() commits values to baseKana', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana');
  // @ts-expect-error - accessing private property for test verification
  autokana.baseKana = 'や';
  // @ts-expect-error - accessing private property for test verification
  autokana.values = ['ま', 'だ'];
  autokana.onConvert();
  // @ts-expect-error - accessing private property for test verification
  expect(autokana.baseKana).toBe('やまだ');
  // @ts-expect-error - accessing private property for test verification
  expect(autokana.values).toEqual([]);
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

test('bind with bare ID string resolves IDs containing CSS selector special characters', () => {
  setup('<input name="name" id="user:name"><input name="furigana" id="furigana:field">');
  const autokana = new AutoKana('user:name', 'furigana:field');
  expect(autokana.isActive).toBe(true);
});

test('bind with # prefix ID selector resolves element (backward compat)', () => {
  setup();
  const autokana = new AutoKana('#name', '#furigana');
  expect(autokana.isActive).toBe(true);
});

test('bind with invalid selector throws Error', () => {
  setup();
  expect(() => new AutoKana('.nonexistent')).toThrow('AutoKana: Element not found for ".nonexistent"');
});

test('error message includes guidance for SPA users', () => {
  setup();
  expect(() => new AutoKana('.nonexistent')).toThrow(/Ensure the DOM element exists before calling bind/);
});

test('paste input extracts kana from pasted text', () => {
  setup();
  const _autokana = new AutoKana('name', 'furigana');
  const nameInput = document.getElementById('name') as HTMLInputElement;
  const furiganaInput = document.getElementById('furigana') as HTMLInputElement;
  nameInput.value = 'やまだ';
  nameInput.dispatchEvent(new InputEvent('input', { isComposing: false, inputType: 'insertFromPaste' }));
  expect(furiganaInput.value).toBe('やまだ');
});

test('consecutive IME conversions accumulate furigana correctly', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana');
  const nameInput = document.getElementById('name') as HTMLInputElement;

  nameInput.value = 'やまだ';
  nameInput.dispatchEvent(new CompositionEvent('compositionstart'));
  nameInput.dispatchEvent(new InputEvent('input', { isComposing: true, inputType: 'insertText' }));
  nameInput.value = '山田';
  nameInput.dispatchEvent(new CompositionEvent('compositionend', { data: '山田' }));

  nameInput.value = '山田たろう';
  nameInput.dispatchEvent(new CompositionEvent('compositionstart'));
  nameInput.dispatchEvent(new InputEvent('input', { isComposing: true, inputType: 'insertText' }));
  nameInput.value = '山田太郎';
  nameInput.dispatchEvent(new CompositionEvent('compositionend', { data: '太郎' }));

  expect(autokana.getFurigana()).toBe('やまだたろう');
});

test('empty input after composition resets state', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana');
  const nameInput = document.getElementById('name') as HTMLInputElement;

  nameInput.value = 'やまだ';
  nameInput.dispatchEvent(new CompositionEvent('compositionstart'));
  nameInput.dispatchEvent(new CompositionEvent('compositionend', { data: 'やまだ' }));
  expect(autokana.getFurigana()).toBe('やまだ');

  nameInput.value = '';
  nameInput.dispatchEvent(new InputEvent('input', { isComposing: false, inputType: 'deleteContentBackward' }));
  expect(autokana.getFurigana()).toBe('');
  // @ts-expect-error - accessing private property for test verification
  expect(autokana.isComposing).toBe(false);
});

test('processValue() updates furigana even when isComposing is true', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana');
  const nameInput = document.getElementById('name') as HTMLInputElement;
  const furiganaInput = document.getElementById('furigana') as HTMLInputElement;

  nameInput.value = 'やまだ';
  // @ts-expect-error - accessing private property for test verification
  autokana.isComposing = true;
  autokana.processValue();
  expect(furiganaInput.value).toBe('やまだ');
});

test('processValue() with empty input resets state', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana');
  const nameInput = document.getElementById('name') as HTMLInputElement;

  // @ts-expect-error - accessing private property for test verification
  autokana.baseKana = 'やまだ';
  // @ts-expect-error - accessing private property for test verification
  autokana.furigana = 'やまだ';
  // @ts-expect-error - accessing private property for test verification
  autokana.values = ['た', 'ろ', 'う'];
  nameInput.value = '';
  autokana.processValue();
  // @ts-expect-error - accessing private property for test verification
  expect(autokana.baseKana).toBe('');
  // @ts-expect-error - accessing private property for test verification
  expect(autokana.furigana).toBe('');
  // @ts-expect-error - accessing private property for test verification
  expect(autokana.values).toEqual([]);
});

test('processValue() with mixed romaji and kana extracts only kana', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana');
  const nameInput = document.getElementById('name') as HTMLInputElement;
  const furiganaInput = document.getElementById('furigana') as HTMLInputElement;

  nameInput.value = 'yamadaやまだ';
  autokana.processValue();
  expect(furiganaInput.value).toBe('やまだ');
});

test('compositionstart fired twice keeps isComposing true', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana');
  const nameInput = document.getElementById('name') as HTMLInputElement;
  nameInput.dispatchEvent(new CompositionEvent('compositionstart'));
  // @ts-expect-error - accessing private property for test verification
  expect(autokana.isComposing).toBe(true);
  nameInput.dispatchEvent(new CompositionEvent('compositionstart'));
  // @ts-expect-error - accessing private property for test verification
  expect(autokana.isComposing).toBe(true);
});

test('initializeValues during composition resets all state including isComposing', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana');
  const nameInput = document.getElementById('name') as HTMLInputElement;
  nameInput.value = 'やまだ';
  nameInput.dispatchEvent(new CompositionEvent('compositionstart'));
  nameInput.dispatchEvent(new InputEvent('input', { isComposing: true, inputType: 'insertText' }));
  // @ts-expect-error - accessing private property for test verification
  expect(autokana.isComposing).toBe(true);
  autokana.initializeValues();
  // @ts-expect-error - accessing private property for test verification
  expect(autokana.isComposing).toBe(false);
  // @ts-expect-error - accessing private property for test verification
  expect(autokana.baseKana).toBe('');
  expect(autokana.getFurigana()).toBe('');
});

test('multiple onConvert calls accumulate baseKana correctly', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana');
  // @ts-expect-error - accessing private property for test verification
  autokana.baseKana = 'や';
  // @ts-expect-error - accessing private property for test verification
  autokana.values = ['ま'];
  autokana.onConvert();
  // @ts-expect-error - accessing private property for test verification
  expect(autokana.baseKana).toBe('やま');
  // @ts-expect-error - accessing private property for test verification
  autokana.values = ['だ'];
  autokana.onConvert();
  // @ts-expect-error - accessing private property for test verification
  expect(autokana.baseKana).toBe('やまだ');
  // @ts-expect-error - accessing private property for test verification
  expect(autokana.values).toEqual([]);
});

describe('IME composition events', () => {
  test('compositionstart sets isComposing to true', () => {
    setup();
    const autokana = new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;
    // @ts-expect-error - accessing private property for test verification
  expect(autokana.isComposing).toBe(false);
    nameInput.dispatchEvent(new CompositionEvent('compositionstart'));
    // @ts-expect-error - accessing private property for test verification
  expect(autokana.isComposing).toBe(true);
  });

  test('compositionend sets isComposing to false and processes final value', () => {
    setup();
    const autokana = new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;
    const furiganaInput = document.getElementById('furigana') as HTMLInputElement;
    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(new CompositionEvent('compositionstart'));
    nameInput.dispatchEvent(new CompositionEvent('compositionend', { data: 'やまだ' }));
    // @ts-expect-error - accessing private property for test verification
  expect(autokana.isComposing).toBe(false);
    expect(furiganaInput.value).toBe('やまだ');
  });

  test('input event with isComposing=false processes kana extraction and updates furigana', () => {
    setup();
    const _autokana = new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;
    const furiganaInput = document.getElementById('furigana') as HTMLInputElement;
    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: false, inputType: 'insertText' }));
    expect(furiganaInput.value).toBe('やまだ');
  });

  test('input event with isComposing=true updates furigana during composition', () => {
    setup();
    const autokana = new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;
    const furiganaInput = document.getElementById('furigana') as HTMLInputElement;
    furiganaInput.value = 'やまだ';
    nameInput.value = 'やまだたろう';
    nameInput.dispatchEvent(new CompositionEvent('compositionstart'));
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: true, inputType: 'insertText' }));
    // @ts-expect-error - accessing private property for test verification
  expect(autokana.isComposing).toBe(true);
    expect(furiganaInput.value).toBe('やまだたろう');
  });

  test('compositionend triggers processing even without subsequent input event (Chrome quirk)', () => {
    setup();
    const _autokana = new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;
    const furiganaInput = document.getElementById('furigana') as HTMLInputElement;
    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(new CompositionEvent('compositionstart'));
    nameInput.dispatchEvent(new CompositionEvent('compositionend', { data: 'やまだ' }));
    // In Chrome, compositionend may fire without a following input(isComposing=false)
    expect(furiganaInput.value).toBe('やまだ');
  });

  test('focus handler captures current state when refocusing', () => {
    setup();
    const autokana = new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;
    const furiganaInput = document.getElementById('furigana') as HTMLInputElement;
    furiganaInput.value = 'やまだ';
    nameInput.value = '山田';
    nameInput.dispatchEvent(new Event('focus'));
    // @ts-expect-error - accessing private property for test verification
  expect(autokana.baseKana).toBe('やまだ');
    // @ts-expect-error - accessing private property for test verification
  expect(autokana.isComposing).toBe(false);
  });

  test('blur handler resets isComposing if stuck at true', () => {
    setup();
    const autokana = new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;
    // @ts-expect-error - accessing private property for test verification
  autokana.isComposing = true;
    nameInput.dispatchEvent(new Event('blur'));
    // @ts-expect-error - accessing private property for test verification
  expect(autokana.isComposing).toBe(false);
  });

  test('getFurigana returns correct value after full composition sequence', () => {
    setup();
    const autokana = new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;
    const furiganaInput = document.getElementById('furigana') as HTMLInputElement;

    furiganaInput.value = 'やまだ';
    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(new Event('focus'));

    nameInput.value = '山田';
    nameInput.dispatchEvent(new CompositionEvent('compositionstart'));
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: true, inputType: 'insertText' }));
    nameInput.dispatchEvent(new CompositionEvent('compositionend', { data: '山田' }));
    expect(autokana.getFurigana()).toBe('やまだ');
  });

  test('bug: typing after conversion appends to furigana correctly', () => {
    setup();
    const autokana = new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;
    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(new CompositionEvent('compositionstart'));
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: true, inputType: 'insertText' }));
    nameInput.value = '山田';
    nameInput.dispatchEvent(new CompositionEvent('compositionend', { data: '山田' }));
    nameInput.value = '山田たろう';
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: false, inputType: 'insertText' }));
    expect(autokana.getFurigana()).toBe('やまだたろう');
  });

  test('browsing IME candidates with space does not accumulate furigana', () => {
    setup();
    new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;
    const furiganaInput = document.getElementById('furigana') as HTMLInputElement;

    // Type "やまだ" during composition
    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(new CompositionEvent('compositionstart'));
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: true, inputType: 'insertText' }));
    expect(furiganaInput.value).toBe('やまだ');

    // Press space - IME shows candidate "山田"
    nameInput.value = '山田';
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: true, inputType: 'insertCompositionText' }));
    expect(furiganaInput.value).toBe('やまだ');

    // Press space again - IME shows another candidate "山谷"
    nameInput.value = '山谷';
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: true, inputType: 'insertCompositionText' }));
    expect(furiganaInput.value).toBe('やまだ');

    // Select candidate - compositionend
    nameInput.value = '山田';
    nameInput.dispatchEvent(new CompositionEvent('compositionend', { data: '山田' }));
    expect(furiganaInput.value).toBe('やまだ');
  });

  test('IME temporarily showing kana during candidate browsing does not accumulate furigana', () => {
    setup();
    new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;
    const furiganaInput = document.getElementById('furigana') as HTMLInputElement;

    // Type "やまだ" during composition
    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(new CompositionEvent('compositionstart'));
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: true, inputType: 'insertText' }));
    expect(furiganaInput.value).toBe('やまだ');

    // Press space - IME shows candidate "山田"
    nameInput.value = '山田';
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: true, inputType: 'insertCompositionText' }));
    expect(furiganaInput.value).toBe('やまだ');

    // Press space again - IME temporarily shows kana "やまだ" before next candidate
    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: true, inputType: 'insertCompositionText' }));
    expect(furiganaInput.value).toBe('やまだ');

    // Press space again - IME shows candidate "山谷"
    nameInput.value = '山谷';
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: true, inputType: 'insertCompositionText' }));
    expect(furiganaInput.value).toBe('やまだ');

    // Select candidate
    nameInput.value = '山田';
    nameInput.dispatchEvent(new CompositionEvent('compositionend', { data: '山田' }));
    expect(furiganaInput.value).toBe('やまだ');
  });

  test('bug: space key during IME composition should not change furigana', () => {
    setup();
    new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;
    const furiganaInput = document.getElementById('furigana') as HTMLInputElement;

    // Type "やまだ" during composition
    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(new CompositionEvent('compositionstart'));
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: true, inputType: 'insertText' }));
    expect(furiganaInput.value).toBe('やまだ');

    // Press space multiple times to browse candidates
    // Each press changes the input to a different candidate
    nameInput.value = '山田';
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: true, inputType: 'insertCompositionText' }));
    expect(furiganaInput.value).toBe('やまだ');

    nameInput.value = '山谷';
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: true, inputType: 'insertCompositionText' }));
    expect(furiganaInput.value).toBe('やまだ');

    nameInput.value = '山田';
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: true, inputType: 'insertCompositionText' }));
    expect(furiganaInput.value).toBe('やまだ');

    // Confirm selection
    nameInput.dispatchEvent(new CompositionEvent('compositionend', { data: '山田' }));
    expect(furiganaInput.value).toBe('やまだ');
  });

  test('bug: IME conversion to different length candidate preserves furigana', () => {
    setup();
    new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;
    const furiganaInput = document.getElementById('furigana') as HTMLInputElement;

    // Type "やまだ" during composition
    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(new CompositionEvent('compositionstart'));
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: true, inputType: 'insertText' }));
    expect(furiganaInput.value).toBe('やまだ');

    // Press space - IME converts to "病まだ" (first char changed, rest same)
    nameInput.value = '病まだ';
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: true, inputType: 'insertCompositionText' }));
    expect(furiganaInput.value).toBe('やまだ');

    // Press space again - back to "山田"
    nameInput.value = '山田';
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: true, inputType: 'insertCompositionText' }));
    expect(furiganaInput.value).toBe('やまだ');

    // Confirm selection
    nameInput.dispatchEvent(new CompositionEvent('compositionend', { data: '山田' }));
    expect(furiganaInput.value).toBe('やまだ');
  });

  test('bug: IME conversion to "病まだ" should not duplicate furigana', () => {
    setup();
    new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;
    const furiganaInput = document.getElementById('furigana') as HTMLInputElement;

    // Type "やまだ" during composition
    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(new CompositionEvent('compositionstart'));
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: true, inputType: 'insertText' }));
    expect(furiganaInput.value).toBe('やまだ');

    // Press space - IME converts to "病まだ" (first char changed to kanji, rest same)
    nameInput.value = '病まだ';
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: true, inputType: 'insertCompositionText' }));
    expect(furiganaInput.value).toBe('やまだ');

    // Confirm selection at "病まだ"
    nameInput.dispatchEvent(new CompositionEvent('compositionend', { data: '病まだ' }));
    expect(furiganaInput.value).toBe('やまだ');
  });

  test('bug: full-width space after IME conversion should not duplicate furigana', () => {
    setup();
    new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;
    const furiganaInput = document.getElementById('furigana') as HTMLInputElement;

    // Type "やまだ" during composition
    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(new CompositionEvent('compositionstart'));
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: true, inputType: 'insertText' }));
    expect(furiganaInput.value).toBe('やまだ');

    // Press space - IME converts to "山だ"
    nameInput.value = '山だ';
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: true, inputType: 'insertCompositionText' }));
    expect(furiganaInput.value).toBe('やまだ');

    // Confirm selection
    nameInput.dispatchEvent(new CompositionEvent('compositionend', { data: '山だ' }));
    expect(furiganaInput.value).toBe('やまだ');

    // Type full-width space after conversion
    nameInput.value = '山だ\u3000';
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: false, inputType: 'insertText' }));
    expect(furiganaInput.value).toBe('やまだ\u3000');
  });

  test('bug: re-focusing name element after kana input should not duplicate furigana', () => {
    setup();
    new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;
    const furiganaInput = document.getElementById('furigana') as HTMLInputElement;

    // Type "やまだ" via composition
    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(new CompositionEvent('compositionstart'));
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: true, inputType: 'insertText' }));
    nameInput.dispatchEvent(new CompositionEvent('compositionend', { data: 'やまだ' }));
    expect(furiganaInput.value).toBe('やまだ');

    // Blur and re-focus the name element
    nameInput.dispatchEvent(new Event('blur'));
    nameInput.dispatchEvent(new Event('focus'));
    expect(furiganaInput.value).toBe('やまだ');
  });

  test('bug: backspace after partial kana input should not duplicate furigana', () => {
    setup();
    new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;
    const furiganaInput = document.getElementById('furigana') as HTMLInputElement;

    // Type "やｍだ" (mixed kana and romaji) - only "やだ" should appear as furigana
    nameInput.value = 'や';
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: false, inputType: 'insertText' }));
    nameInput.value = 'やｍ';
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: false, inputType: 'insertText' }));
    nameInput.value = 'やｍだ';
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: false, inputType: 'insertText' }));
    expect(furiganaInput.value).toBe('やだ');

    // Backspace to remove "だ" - input becomes "やｍ"
    nameInput.value = 'やｍ';
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: false, inputType: 'deleteContentBackward' }));
    expect(furiganaInput.value).toBe('や');

    // Backspace again - input becomes "や"
    nameInput.value = 'や';
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: false, inputType: 'deleteContentBackward' }));
    expect(furiganaInput.value).toBe('や');
  });

  test('full-width space in input is preserved in furigana', () => {
    setup();
    const autokana = new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;
    const furiganaInput = document.getElementById('furigana') as HTMLInputElement;

    // Type "やまだ" and convert to "山田"
    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(new CompositionEvent('compositionstart'));
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: true, inputType: 'insertText' }));
    nameInput.value = '山田';
    nameInput.dispatchEvent(new CompositionEvent('compositionend', { data: '山田' }));
    expect(furiganaInput.value).toBe('やまだ');

    // Type full-width space after the kanji
    nameInput.value = '山田　';
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: false, inputType: 'insertText' }));
    expect(furiganaInput.value).toBe('やまだ　');

    // Type "たろう" (still hiragana, no conversion)
    nameInput.value = '山田　たろう';
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: false, inputType: 'insertText' }));
    expect(autokana.getFurigana()).toBe('やまだ　たろう');
  });

  test('isConverting property no longer exists (renamed to isComposing)', () => {
    setup();
    const autokana = new AutoKana('name', 'furigana');
    expect(autokana).not.toHaveProperty('isConverting');
    expect(autokana).toHaveProperty('isComposing');
    // @ts-expect-error - accessing private property for test verification
  expect(autokana.isComposing).toBe(false);
  });

  test('checkInterval option is removed from AutoKanaOption', () => {
    setup();
    const autokana = new AutoKana('name', 'furigana');
    expect(autokana.option).not.toHaveProperty('checkInterval');
  });
});

describe('uncovered branches', () => {
  test('HTML要素以外のElementを渡すとエラーになる', () => {
    setup();
    const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    // @ts-expect-error - passing non-HTMLElement Element for test verification
    expect(() => new AutoKana(svgElement)).toThrow('AutoKana: Element not found');
  });

  test('valueを持たないHTML要素をnameに渡すとAutoKanaエラーになる', () => {
    setup('<div id="name"></div><input name="furigana" id="furigana">');
    expect(() => new AutoKana('name', 'furigana')).toThrow('AutoKana: Element must be an input or textarea');
  });

  test('ignoreStringと入力の前方一致文字がremoveStringで除去される', () => {
    setup();
    const autokana = new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;

    nameInput.value = 'あいう';
    autokana.processValue();

    // @ts-expect-error - accessing private property for test verification
  autokana.ignoreString = 'あいう';
    nameInput.value = 'あいか';
    autokana.processValue();

    // @ts-expect-error - accessing private property for test verification
  expect(autokana.input).toBe('か');
  });

  test('漢字混じり入力からかなのみが抽出され不要文字が除去される', () => {
    setup();
    const autokana = new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;

    nameInput.value = 'や';
    autokana.processValue();

    nameInput.value = 'a';
    autokana.processValue();

    // @ts-expect-error - accessing private property for test verification
  expect(autokana.baseKana).toBe('や');
  });
});

describe('onChange callback', () => {
  test('onChange is called with furigana when input changes', () => {
    setup();
    const onChange = vi.fn();
    new AutoKana('name', 'furigana', { onChange });
    const nameInput = document.getElementById('name') as HTMLInputElement;

    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: false, inputType: 'insertText' }));

    expect(onChange).toHaveBeenCalledWith('やまだ');
  });

  test('onChange is called each time furigana changes', () => {
    setup();
    const onChange = vi.fn();
    new AutoKana('name', 'furigana', { onChange });
    const nameInput = document.getElementById('name') as HTMLInputElement;

    // First input
    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: false, inputType: 'insertText' }));
    expect(onChange).toHaveBeenCalledWith('やまだ');

    // Clear and re-input
    nameInput.value = '';
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: false, inputType: 'deleteContentBackward' }));
    expect(onChange).toHaveBeenCalledWith('');

    nameInput.value = 'たろう';
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: false, inputType: 'insertText' }));
    expect(onChange).toHaveBeenCalledWith('たろう');
  });

  test('onChange is not called when isActive is false', () => {
    setup();
    const onChange = vi.fn();
    const autokana = new AutoKana('name', 'furigana', { onChange });
    const nameInput = document.getElementById('name') as HTMLInputElement;

    autokana.stop();
    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: false, inputType: 'insertText' }));

    expect(onChange).not.toHaveBeenCalled();
  });

  test('onChange receives katakana when katakana option is set', () => {
    setup();
    const onChange = vi.fn();
    new AutoKana('name', 'furigana', { onChange, katakana: 'full' });
    const nameInput = document.getElementById('name') as HTMLInputElement;

    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: false, inputType: 'insertText' }));

    expect(onChange).toHaveBeenCalledWith('ヤマダ');
  });

  test('onChange works without furigana element (getFurigana-only usage)', () => {
    setup('<input name="name" id="name">');
    const onChange = vi.fn();
    const autokana = new AutoKana('name', '', { onChange });
    const nameInput = document.getElementById('name') as HTMLInputElement;

    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: false, inputType: 'insertText' }));

    expect(onChange).toHaveBeenCalledWith('やまだ');
    expect(autokana.getFurigana()).toBe('やまだ');
  });
});

describe('input event dispatch on furigana element', () => {
  test('input event is dispatched on furigana element when value changes', () => {
    setup();
    const furiganaInput = document.getElementById('furigana') as HTMLInputElement;
    const inputListener = vi.fn();
    furiganaInput.addEventListener('input', inputListener);

    new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;

    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: false, inputType: 'insertText' }));

    expect(inputListener).toHaveBeenCalled();
  });

  test('input event bubbles so frameworks can detect it', () => {
    document.body.innerHTML = '';
    const container = document.createElement('div');
    document.body.appendChild(container);
    container.innerHTML = '<input name="name" id="name"><input name="furigana" id="furigana">';

    const bubbledListener = vi.fn();
    container.addEventListener('input', bubbledListener);

    new AutoKana('#name', '#furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;

    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: false, inputType: 'insertText' }));

    expect(bubbledListener).toHaveBeenCalled();
  });
});

describe('vu hiragana handling', () => {
  test('ゔ is extracted as kana during input', () => {
    setup();
    new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;
    const furiganaInput = document.getElementById('furigana') as HTMLInputElement;

    nameInput.value = 'ゔぁ';
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: false, inputType: 'insertText' }));

    expect(furiganaInput.value).toBe('ゔぁ');
  });

  test('ゔ is converted to katakana', () => {
    setup();
    const full = new AutoKana('name', 'furigana', { katakana: 'full' });
    expect(full.toKatakana('ゔぁ')).toBe('ヴァ');

    const half = new AutoKana('name', 'furigana', { katakana: 'half' });
    expect(half.toKatakana('ゔぁ')).toBe('ｳﾞｧ');
  });
});
