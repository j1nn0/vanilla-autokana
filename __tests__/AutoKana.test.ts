import { describe, expect, test, vi } from 'vitest';

/* global test expect document */
import AutoKana from '../src/AutoKana';
import { bind } from '../src/index';
import { setup } from './setup';

describe('binding', () => {
  test('init', () => {
    setup();
    const autokana = new AutoKana('name', 'furigana');
    autokana.start();
    expect(autokana.isActive).toBe(true);
  });

  test('init with pass elements', () => {
    setup('<input name="name"><input name="furigana">');
    const name = document.querySelector('[name=name]') as HTMLInputElement;
    const furigana = document.querySelector('[name=furigana]') as HTMLInputElement;
    const autokana = new AutoKana(name, furigana);
    autokana.start();
    expect(autokana.isActive).toBe(true);
  });

  test('bind with missing element throws Error', () => {
    setup();
    expect(() => new AutoKana('nonexistent')).toThrow(
      'AutoKana: Element not found for "nonexistent"',
    );
  });

  test('bind with # prefix resolves element by id', () => {
    setup();
    const autokana = new AutoKana('#name', '#furigana');
    expect(autokana.isActive).toBe(true);
  });

  test('bind with class selector resolves element by class', () => {
    document.body.innerHTML =
      '<input class="name-input" id="name"><input class="furi-input" id="furigana">';
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
    expect(() => new AutoKana('.nonexistent')).toThrow(
      'AutoKana: Element not found for ".nonexistent"',
    );
  });

  test('bind with malformed selector throws AutoKana Error', () => {
    setup();
    expect(() => new AutoKana('#')).toThrow('AutoKana: Invalid selector for "#"');
  });

  test('bind with missing furigana selector continues without output element', () => {
    setup('<input name="name" id="name">');
    const onChange = vi.fn();
    const autokana = new AutoKana('name', 'missing-furigana', { onChange });
    const nameInput = document.getElementById('name') as HTMLInputElement;

    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(new InputEvent('input', { isComposing: false, inputType: 'insertText' }));

    expect(autokana.getFurigana()).toBe('やまだ');
    expect(onChange).toHaveBeenCalledWith('やまだ');
  });

  test('error message includes guidance for SPA users', () => {
    setup();
    expect(() => new AutoKana('.nonexistent')).toThrow(
      /Ensure the DOM element exists before calling bind/,
    );
    expect(() => new AutoKana('.nonexistent')).toThrow(/Vue\/React/);
  });
});

describe('options', () => {
  test('katakana: "half" option is set correctly', () => {
    setup();
    const autokana = new AutoKana('name', 'furigana', { katakana: 'half' });
    expect(autokana.option.katakana).toBe('half');
  });

  test('katakana: "full" option is set correctly', () => {
    setup();
    const autokana = new AutoKana('name', 'furigana', { katakana: 'full' });
    expect(autokana.option.katakana).toBe('full');
  });

  test('katakana: "hiragana" option is set correctly', () => {
    setup();
    const autokana = new AutoKana('name', 'furigana', { katakana: 'hiragana' });
    expect(autokana.option.katakana).toBe('hiragana');
  });

  test('no option defaults to hiragana', () => {
    setup();
    const autokana = new AutoKana('name', 'furigana');
    expect(autokana.option.katakana).toBe('hiragana');
  });

  test('full-width spaces are kept as-is in furigana by default', () => {
    setup();
    const autokana = new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;
    nameInput.value = 'やまだ　たろう';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: false, inputType: 'insertText' }),
    );
    expect(autokana.getFurigana()).toBe('やまだ　たろう');
  });

  test('full-width spaces are converted to half-width spaces when katakana is "half"', () => {
    setup();
    const autokana = new AutoKana('name', 'furigana', { katakana: 'half' });
    const nameInput = document.getElementById('name') as HTMLInputElement;
    nameInput.value = 'やまだ　たろう';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: false, inputType: 'insertText' }),
    );
    expect(autokana.getFurigana()).toBe('ﾔﾏﾀﾞ ﾀﾛｳ');
  });

  test('debug() logs when debug option is true', () => {
    setup();
    const autokana = new AutoKana('name', 'furigana', { debug: true });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    // @ts-expect-error - accessing private method for test verification
    autokana.debug('test', 123);
    expect(logSpy).toHaveBeenCalledWith('test', 123);
    // @ts-expect-error - accessing private method for test verification
    autokana.debug('test');
    expect(logSpy).toHaveBeenCalledWith('test');
    logSpy.mockRestore();
  });

  test('debug() does not log when debug option is false', () => {
    setup();
    const autokana = new AutoKana('name', 'furigana', { debug: false });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    // @ts-expect-error - accessing private method for test verification
    autokana.debug('test');
    expect(logSpy).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });
});

describe('methods', () => {
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

  test('stop() then start() cycle preserves output behavior', () => {
    setup();
    const autokana = new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;

    autokana.stop();
    nameInput.value = 'たろう';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: false, inputType: 'insertText' }),
    );
    expect(autokana.getFurigana()).toBe(''); // inactive: furigana unchanged

    autokana.start();
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: false, inputType: 'insertText' }),
    );
    expect(autokana.getFurigana()).toBe('たろう');
  });

  test('reset() resets all tracking state', () => {
    setup();
    const autokana = new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;
    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: false, inputType: 'insertText' }),
    );
    expect(autokana.getFurigana()).toBe('やまだ');

    autokana.reset();
    expect(autokana.getFurigana()).toBe('');

    // After reset the tracker starts fresh: re-typing does not accumulate the old kana.
    nameInput.value = 'たろう';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: false, inputType: 'insertText' }),
    );
    expect(autokana.getFurigana()).toBe('たろう');
  });

  test('destroy() removes all event listeners', () => {
    setup();
    const autokana = new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;
    autokana.destroy();
    nameInput.dispatchEvent(new CompositionEvent('compositionstart'));
    nameInput.dispatchEvent(new Event('focus'));
    expect(autokana.getFurigana()).toBe('');
  });
});

describe('input handling', () => {
  test('focus captures committed kana and blur ends composition tracking', () => {
    setup();
    const autokana = new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;
    const furiganaInput = document.getElementById('furigana') as HTMLInputElement;

    furiganaInput.value = 'やまだ';
    nameInput.value = '山田';
    nameInput.dispatchEvent(new Event('focus'));
    // focus adopts the existing furigana as committed kana and treats '山田' as already
    // converted, so the furigana is preserved (not duplicated) on the next keystroke.
    expect(autokana.getFurigana()).toBe('やまだ');

    nameInput.dispatchEvent(new CompositionEvent('compositionstart'));
    nameInput.value = '山田たろう';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: true, inputType: 'insertText' }),
    );
    expect(autokana.getFurigana()).toBe('やまだたろう');

    nameInput.dispatchEvent(new Event('blur'));
    nameInput.value = '山田たろ';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: true, inputType: 'insertText' }),
    );
    expect(autokana.getFurigana()).toBe('やまだたろ');
  });

  test('input during composition updates furigana', () => {
    setup();
    new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;
    const furiganaInput = document.getElementById('furigana') as HTMLInputElement;

    nameInput.value = 'やまだたろう';
    nameInput.dispatchEvent(new CompositionEvent('compositionstart'));
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: true, inputType: 'insertText' }),
    );
    expect(furiganaInput.value).toBe('やまだたろう');
  });

  test('paste input extracts kana from pasted text', () => {
    setup();
    new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;
    const furiganaInput = document.getElementById('furigana') as HTMLInputElement;
    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: false, inputType: 'insertFromPaste' }),
    );
    expect(furiganaInput.value).toBe('やまだ');
  });

  test('consecutive IME conversions accumulate furigana correctly', () => {
    setup();
    const autokana = new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;

    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(new CompositionEvent('compositionstart'));
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: true, inputType: 'insertText' }),
    );
    nameInput.value = '山田';
    nameInput.dispatchEvent(new CompositionEvent('compositionend', { data: '山田' }));

    nameInput.value = '山田たろう';
    nameInput.dispatchEvent(new CompositionEvent('compositionstart'));
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: true, inputType: 'insertText' }),
    );
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
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: false, inputType: 'deleteContentBackward' }),
    );
    expect(autokana.getFurigana()).toBe('');
  });

  test('input event updates furigana during composition', () => {
    setup();
    new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;
    const furiganaInput = document.getElementById('furigana') as HTMLInputElement;

    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(new CompositionEvent('compositionstart'));
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: true, inputType: 'insertText' }),
    );
    expect(furiganaInput.value).toBe('やまだ');
  });

  test('input event with empty input resets state', () => {
    setup();
    const autokana = new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;

    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: false, inputType: 'insertText' }),
    );
    expect(autokana.getFurigana()).toBe('やまだ');

    nameInput.value = '';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: false, inputType: 'deleteContentBackward' }),
    );
    expect(autokana.getFurigana()).toBe('');
  });

  test('input event with mixed romaji and kana extracts only kana', () => {
    setup();
    new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;
    const furiganaInput = document.getElementById('furigana') as HTMLInputElement;

    nameInput.value = 'yamadaやまだ';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: false, inputType: 'insertText' }),
    );
    expect(furiganaInput.value).toBe('やまだ');
  });

  test('input event extracts kana from input and updates furigana', () => {
    setup();
    const nameInput = document.getElementById('name') as HTMLInputElement;
    const furiganaInput = document.getElementById('furigana') as HTMLInputElement;
    nameInput.value = 'やまだ';
    new AutoKana('name', 'furigana');
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: false, inputType: 'insertText' }),
    );
    expect(furiganaInput.value).toBe('やまだ');
  });

  test('input event without furigana element does not throw', () => {
    setup('<input name="name" id="name">');
    const nameInput = document.getElementById('name') as HTMLInputElement;
    nameInput.value = 'やまだ';
    const autokana = new AutoKana('name');
    expect(() =>
      nameInput.dispatchEvent(
        new InputEvent('input', { isComposing: false, inputType: 'insertText' }),
      ),
    ).not.toThrow();
    expect(autokana.getFurigana()).toBe('やまだ');
  });

  test('compositionstart fired twice keeps composition tracking active', () => {
    setup();
    new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;
    const furiganaInput = document.getElementById('furigana') as HTMLInputElement;

    nameInput.dispatchEvent(new CompositionEvent('compositionstart'));
    nameInput.dispatchEvent(new CompositionEvent('compositionstart'));
    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: true, inputType: 'insertText' }),
    );
    nameInput.value = 'やま';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: true, inputType: 'insertCompositionText' }),
    );
    expect(furiganaInput.value).toBe('やまだ');
  });

  test('reset during composition resets all tracking state', () => {
    setup();
    const autokana = new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;
    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(new CompositionEvent('compositionstart'));
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: true, inputType: 'insertText' }),
    );
    autokana.reset();
    expect(autokana.getFurigana()).toBe('');

    nameInput.value = 'たろう';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: false, inputType: 'insertText' }),
    );
    expect(autokana.getFurigana()).toBe('たろう');
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
    expect(() => new AutoKana('name', 'furigana')).toThrow(
      'AutoKana: Element must be an input or textarea',
    );
  });

  test('furigana検証で失敗した場合はnameにイベントリスナーを登録しない', () => {
    setup('<input name="name" id="name"><div id="furigana"></div>');
    const nameInput = document.getElementById('name') as HTMLInputElement;
    const addEventListenerSpy = vi.spyOn(nameInput, 'addEventListener');

    expect(() => new AutoKana('name', 'furigana')).toThrow(
      'AutoKana: Element must be an input or textarea',
    );
    expect(addEventListenerSpy).not.toHaveBeenCalled();

    addEventListenerSpy.mockRestore();
  });
});

describe('onChange callback', () => {
  test('onChange is called with furigana when input changes', () => {
    setup();
    const onChange = vi.fn();
    new AutoKana('name', 'furigana', { onChange });
    const nameInput = document.getElementById('name') as HTMLInputElement;

    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: false, inputType: 'insertText' }),
    );

    expect(onChange).toHaveBeenCalledWith('やまだ');
  });

  test('onChange is called each time furigana changes', () => {
    setup();
    const onChange = vi.fn();
    new AutoKana('name', 'furigana', { onChange });
    const nameInput = document.getElementById('name') as HTMLInputElement;

    // First input
    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: false, inputType: 'insertText' }),
    );
    expect(onChange).toHaveBeenCalledWith('やまだ');

    // Clear and re-input
    nameInput.value = '';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: false, inputType: 'deleteContentBackward' }),
    );
    expect(onChange).toHaveBeenCalledWith('');

    nameInput.value = 'たろう';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: false, inputType: 'insertText' }),
    );
    expect(onChange).toHaveBeenCalledWith('たろう');
  });

  test('onChange is not called when isActive is false', () => {
    setup();
    const onChange = vi.fn();
    const autokana = new AutoKana('name', 'furigana', { onChange });
    const nameInput = document.getElementById('name') as HTMLInputElement;

    autokana.stop();
    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: false, inputType: 'insertText' }),
    );

    expect(onChange).not.toHaveBeenCalled();
  });

  test('onChange receives katakana when katakana option is set', () => {
    setup();
    const onChange = vi.fn();
    new AutoKana('name', 'furigana', { onChange, katakana: 'full' });
    const nameInput = document.getElementById('name') as HTMLInputElement;

    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: false, inputType: 'insertText' }),
    );

    expect(onChange).toHaveBeenCalledWith('ヤマダ');
  });

  test('onChange works without furigana element (getFurigana-only usage)', () => {
    setup('<input name="name" id="name">');
    const onChange = vi.fn();
    const autokana = new AutoKana('name', '', { onChange });
    const nameInput = document.getElementById('name') as HTMLInputElement;

    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: false, inputType: 'insertText' }),
    );

    expect(onChange).toHaveBeenCalledWith('やまだ');
    expect(autokana.getFurigana()).toBe('やまだ');
  });

  test('onChange is not called when furigana value is unchanged', () => {
    setup();
    const onChange = vi.fn();
    new AutoKana('name', 'furigana', { onChange });
    const nameInput = document.getElementById('name') as HTMLInputElement;

    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(new CompositionEvent('compositionstart'));
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: true, inputType: 'insertText' }),
    );
    nameInput.value = '山田';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: true, inputType: 'insertCompositionText' }),
    );
    nameInput.value = '山谷';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: true, inputType: 'insertCompositionText' }),
    );
    nameInput.value = '山田';
    nameInput.dispatchEvent(new CompositionEvent('compositionend', { data: '山田' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('やまだ');
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
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: false, inputType: 'insertText' }),
    );

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
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: false, inputType: 'insertText' }),
    );

    expect(bubbledListener).toHaveBeenCalled();
  });

  test('input event is not dispatched when furigana value is unchanged', () => {
    setup();
    const furiganaInput = document.getElementById('furigana') as HTMLInputElement;
    const inputListener = vi.fn();
    furiganaInput.addEventListener('input', inputListener);

    new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;

    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(new CompositionEvent('compositionstart'));
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: true, inputType: 'insertText' }),
    );
    nameInput.value = '山田';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: true, inputType: 'insertCompositionText' }),
    );

    expect(inputListener).toHaveBeenCalledTimes(1);
  });
});

describe('vu hiragana handling', () => {
  test('ゔ is extracted as kana during input', () => {
    setup();
    new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;
    const furiganaInput = document.getElementById('furigana') as HTMLInputElement;

    nameInput.value = 'ゔぁ';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: false, inputType: 'insertText' }),
    );

    expect(furiganaInput.value).toBe('ゔぁ');
  });
});

describe('public types', () => {
  test('Bindable accepts only form value elements at compile time', () => {
    const typeCheckOnly = () => {
      const div = document.createElement('div');
      // @ts-expect-error - AutoKana only binds input or textarea elements
      new AutoKana(div);

      const textarea = document.createElement('textarea');
      new AutoKana(textarea);
    };

    expect(typeof typeCheckOnly).toBe('function');
  });

  test('option is read-only at compile time', () => {
    const typeCheckOnly = () => {
      const autokana = new AutoKana('name');
      // @ts-expect-error - option is read-only; use setKatakana() to change the format
      autokana.option.katakana = 'half';
      // @ts-expect-error - option is read-only
      autokana.option = { katakana: 'half' };
    };

    expect(typeof typeCheckOnly).toBe('function');
  });
});

describe('setKatakana()', () => {
  test('re-renders the current furigana in the new format', () => {
    setup();
    const autokana = new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;
    const furiganaInput = document.getElementById('furigana') as HTMLInputElement;

    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: false, inputType: 'insertText' }),
    );
    expect(autokana.getFurigana()).toBe('やまだ');

    autokana.setKatakana('full');
    expect(autokana.getFurigana()).toBe('ヤマダ');
    expect(furiganaInput.value).toBe('ヤマダ');

    nameInput.value = 'やまだたろう';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: false, inputType: 'insertText' }),
    );
    expect(autokana.getFurigana()).toBe('ヤマダタロウ');
  });

  test('updates the public option value', () => {
    setup();
    const autokana = new AutoKana('name', 'furigana');
    autokana.setKatakana('half');
    expect(autokana.option.katakana).toBe('half');
  });

  test('fires onChange when the format change alters the output', () => {
    setup();
    const onChange = vi.fn();
    const autokana = new AutoKana('name', 'furigana', { onChange });
    const nameInput = document.getElementById('name') as HTMLInputElement;
    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: false, inputType: 'insertText' }),
    );
    onChange.mockClear();

    autokana.setKatakana('full');
    expect(onChange).toHaveBeenLastCalledWith('ヤマダ');
  });

  test('reset() clears the furigana output element and fires onChange', () => {
    setup();
    const onChange = vi.fn();
    const autokana = new AutoKana('name', 'furigana', { onChange });
    const nameInput = document.getElementById('name') as HTMLInputElement;
    const furiganaInput = document.getElementById('furigana') as HTMLInputElement;

    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: false, inputType: 'insertText' }),
    );
    expect(furiganaInput.value).toBe('やまだ');

    autokana.reset();
    expect(autokana.getFurigana()).toBe('');
    expect(furiganaInput.value).toBe('');
    expect(onChange).toHaveBeenLastCalledWith('');
  });
});

describe('destroy()', () => {
  test('destroy removes event listeners and nullifies element references', () => {
    setup();
    const autokana = new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;

    // @ts-expect-error - accessing private property for test verification
    expect(autokana.elName).toBe(nameInput);

    autokana.destroy();

    // After destroy, elName should be null to prevent memory leaks
    // @ts-expect-error - accessing private property for test verification
    expect(autokana.elName).toBeNull();
    // @ts-expect-error - accessing private property for test verification
    expect(autokana.elFurigana).toBeUndefined();
  });
});

describe('bind() exported function', () => {
  test('bind(name) returns an active AutoKana instance', () => {
    setup();
    const autokana = bind('name');
    expect(autokana).toBeInstanceOf(AutoKana);
    expect(autokana.isActive).toBe(true);
  });

  test('bind(name, furigana) wires the furigana output element', () => {
    setup();
    const autokana = bind('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;
    const furiganaInput = document.getElementById('furigana') as HTMLInputElement;
    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: false, inputType: 'insertText' }),
    );
    expect(autokana.getFurigana()).toBe('やまだ');
    expect(furiganaInput.value).toBe('やまだ');
  });

  test('bind(name, furigana, option) applies the katakana option', () => {
    setup();
    const autokana = bind('name', 'furigana', { katakana: 'full' });
    expect(autokana.option.katakana).toBe('full');
    const nameInput = document.getElementById('name') as HTMLInputElement;
    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: false, inputType: 'insertText' }),
    );
    expect(autokana.getFurigana()).toBe('ヤマダ');
  });
});

describe('textarea elements', () => {
  test('binds a textarea name element and updates a textarea furigana element', () => {
    setup(
      '<textarea name="name" id="name"></textarea><textarea name="furigana" id="furigana"></textarea>',
    );
    const autokana = new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLTextAreaElement;
    const furiganaInput = document.getElementById('furigana') as HTMLTextAreaElement;
    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: false, inputType: 'insertText' }),
    );
    expect(autokana.getFurigana()).toBe('やまだ');
    expect(furiganaInput.value).toBe('やまだ');
  });

  test('accepts a passed textarea element directly', () => {
    setup('<textarea name="name"></textarea><textarea name="furigana"></textarea>');
    const name = document.querySelector('[name=name]') as HTMLTextAreaElement;
    const furigana = document.querySelector('[name=furigana]') as HTMLTextAreaElement;
    const autokana = new AutoKana(name, furigana);
    expect(autokana.isActive).toBe(true);
  });
});

describe('katakana option main input flow', () => {
  test.each([
    ['full', 'ヤマダ　タロウ'],
    ['half', 'ﾔﾏﾀﾞ ﾀﾛｳ'],
  ] as const)('katakana "%s" converts kana input to the expected format', (katakana, expected) => {
    setup();
    const autokana = new AutoKana('name', 'furigana', { katakana });
    const nameInput = document.getElementById('name') as HTMLInputElement;
    const furiganaInput = document.getElementById('furigana') as HTMLInputElement;
    nameInput.value = 'やまだ　たろう';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: false, inputType: 'insertText' }),
    );
    expect(autokana.getFurigana()).toBe(expected);
    expect(furiganaInput.value).toBe(expected);
  });
});
