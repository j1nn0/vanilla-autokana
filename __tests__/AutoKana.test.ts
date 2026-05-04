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

test('destroy() removes all event listeners', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana');
  const nameInput = document.getElementById('name') as HTMLInputElement;
  autokana.destroy();
  nameInput.dispatchEvent(new CompositionEvent('compositionstart'));
  expect(autokana.isComposing).toBe(false);
  nameInput.dispatchEvent(new Event('focus'));
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
  expect(autokana.baseKana).toBe('やまだ');
  expect(autokana.isComposing).toBe(false);
  expect(autokana.ignoreString).toBe('山田');

  autokana.isComposing = true;
  nameInput.dispatchEvent(new Event('blur'));
  expect(autokana.isComposing).toBe(false);
});

test('input during composition does not update furigana', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana');
  const nameInput = document.getElementById('name') as HTMLInputElement;
  const furiganaInput = document.getElementById('furigana') as HTMLInputElement;

  nameInput.value = 'やまだたろう';
  nameInput.dispatchEvent(new CompositionEvent('compositionstart'));
  nameInput.dispatchEvent(new InputEvent('input', { isComposing: true, inputType: 'insertText' }));
  expect(autokana.isComposing).toBe(true);
  expect(furiganaInput.value).toBe('');
});

test('initializeValues() resets all internal state', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana');
  autokana.baseKana = 'やまだ';
  autokana.furigana = 'やまだ';
  autokana.isComposing = true;
  autokana.ignoreString = 'やまだ';
  autokana.input = 'やまだ';
  autokana.values = ['や', 'ま', 'だ'];
  autokana.initializeValues();
  expect(autokana.baseKana).toBe('');
  expect(autokana.furigana).toBe('');
  expect(autokana.isComposing).toBe(false);
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
  autokana.baseKana = 'previous';
  autokana.processValue();
  expect(autokana.baseKana).toBe('previous');
});

test('onConvert() commits values to baseKana', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana');
  autokana.baseKana = 'や';
  autokana.values = ['ま', 'だ'];
  autokana.onConvert();
  expect(autokana.baseKana).toBe('やまだ');
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

test('bind with # prefix ID selector resolves element (backward compat)', () => {
  setup();
  const autokana = new AutoKana('#name', '#furigana');
  expect(autokana.isActive).toBe(true);
});

test('bind with invalid selector throws Error', () => {
  setup();
  expect(() => new AutoKana('.nonexistent')).toThrow('Element not found: .nonexistent');
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
  expect(autokana.isComposing).toBe(false);
});

test('processValue() does not update furigana when isComposing is true', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana');
  const nameInput = document.getElementById('name') as HTMLInputElement;
  const furiganaInput = document.getElementById('furigana') as HTMLInputElement;

  nameInput.value = 'やまだ';
  autokana.isComposing = true;
  autokana.processValue();
  expect(furiganaInput.value).toBe('');
});

test('processValue() with empty input resets state', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana');
  const nameInput = document.getElementById('name') as HTMLInputElement;

  autokana.baseKana = 'やまだ';
  autokana.furigana = 'やまだ';
  autokana.values = ['た', 'ろ', 'う'];
  nameInput.value = '';
  autokana.processValue();
  expect(autokana.baseKana).toBe('');
  expect(autokana.furigana).toBe('');
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
  expect(autokana.isComposing).toBe(true);
  nameInput.dispatchEvent(new CompositionEvent('compositionstart'));
  expect(autokana.isComposing).toBe(true);
});

test('initializeValues during composition resets all state including isComposing', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana');
  const nameInput = document.getElementById('name') as HTMLInputElement;
  nameInput.value = 'やまだ';
  nameInput.dispatchEvent(new CompositionEvent('compositionstart'));
  nameInput.dispatchEvent(new InputEvent('input', { isComposing: true, inputType: 'insertText' }));
  expect(autokana.isComposing).toBe(true);
  autokana.initializeValues();
  expect(autokana.isComposing).toBe(false);
  expect(autokana.baseKana).toBe('');
  expect(autokana.getFurigana()).toBe('');
});

test('multiple onConvert calls accumulate baseKana correctly', () => {
  setup();
  const autokana = new AutoKana('name', 'furigana');
  autokana.baseKana = 'や';
  autokana.values = ['ま'];
  autokana.onConvert();
  expect(autokana.baseKana).toBe('やま');
  autokana.values = ['だ'];
  autokana.onConvert();
  expect(autokana.baseKana).toBe('やまだ');
  expect(autokana.values).toEqual([]);
});

describe('IME composition events', () => {
  test('compositionstart sets isComposing to true', () => {
    setup();
    const autokana = new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;
    expect(autokana.isComposing).toBe(false);
    nameInput.dispatchEvent(new CompositionEvent('compositionstart'));
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

  test('input event with isComposing=true is skipped during composition', () => {
    setup();
    const autokana = new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;
    const furiganaInput = document.getElementById('furigana') as HTMLInputElement;
    furiganaInput.value = 'やまだ';
    nameInput.value = 'やまだたろう';
    nameInput.dispatchEvent(new CompositionEvent('compositionstart'));
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: true, inputType: 'insertText' }));
    expect(autokana.isComposing).toBe(true);
    expect(furiganaInput.value).toBe('やまだ');
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
    expect(autokana.baseKana).toBe('やまだ');
    expect(autokana.isComposing).toBe(false);
  });

  test('blur handler resets isComposing if stuck at true', () => {
    setup();
    const autokana = new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;
    autokana.isComposing = true;
    nameInput.dispatchEvent(new Event('blur'));
    expect(autokana.isComposing).toBe(false);
  });

  test('getFurigana returns correct value after full composition sequence', () => {
    setup();
    const autokana = new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;
    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(new CompositionEvent('compositionstart'));
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: true, inputType: 'insertText' }));
    nameInput.value = '山田';
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

  test('isConverting property no longer exists (renamed to isComposing)', () => {
    setup();
    const autokana = new AutoKana('name', 'furigana');
    expect(autokana).not.toHaveProperty('isConverting');
    expect(autokana).toHaveProperty('isComposing');
    expect(autokana.isComposing).toBe(false);
  });

  test('checkInterval option is removed from AutoKanaOption', () => {
    setup();
    const autokana = new AutoKana('name', 'furigana');
    expect(autokana.option).not.toHaveProperty('checkInterval');
  });
});
