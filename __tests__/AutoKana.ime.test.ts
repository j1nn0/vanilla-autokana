import { describe, expect, test } from 'vitest';

/* global test expect document */
import AutoKana from '../src/AutoKana';
import { setup } from './setup';

describe('IME composition events', () => {
  test('compositionstart routes subsequent input through composition tracking', () => {
    setup();
    new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;
    const furiganaInput = document.getElementById('furigana') as HTMLInputElement;

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

  test('compositionend processes the final value', () => {
    setup();
    new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;
    const furiganaInput = document.getElementById('furigana') as HTMLInputElement;
    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(new CompositionEvent('compositionstart'));
    nameInput.dispatchEvent(new CompositionEvent('compositionend', { data: 'やまだ' }));
    expect(furiganaInput.value).toBe('やまだ');
  });

  test('input event with isComposing=false processes kana extraction and updates furigana', () => {
    setup();
    new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;
    const furiganaInput = document.getElementById('furigana') as HTMLInputElement;
    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: false, inputType: 'insertText' }),
    );
    expect(furiganaInput.value).toBe('やまだ');
  });

  test('input event with isComposing=true updates furigana during composition', () => {
    setup();
    new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;
    const furiganaInput = document.getElementById('furigana') as HTMLInputElement;
    furiganaInput.value = 'やまだ';
    nameInput.value = 'やまだたろう';
    nameInput.dispatchEvent(new CompositionEvent('compositionstart'));
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: true, inputType: 'insertText' }),
    );
    expect(furiganaInput.value).toBe('やまだたろう');
  });

  test('compositionend triggers processing even without subsequent input event (Chrome quirk)', () => {
    setup();
    new AutoKana('name', 'furigana');
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
    expect(autokana.getFurigana()).toBe('やまだ');
  });

  test('blur ends composition tracking', () => {
    setup();
    new AutoKana('name', 'furigana');
    const nameInput = document.getElementById('name') as HTMLInputElement;
    const furiganaInput = document.getElementById('furigana') as HTMLInputElement;

    nameInput.dispatchEvent(new CompositionEvent('compositionstart'));
    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: true, inputType: 'insertText' }),
    );
    nameInput.dispatchEvent(new Event('blur'));
    nameInput.value = 'やま';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: true, inputType: 'insertText' }),
    );
    expect(furiganaInput.value).toBe('やま');
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
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: true, inputType: 'insertText' }),
    );
    nameInput.dispatchEvent(new CompositionEvent('compositionend', { data: '山田' }));
    expect(autokana.getFurigana()).toBe('やまだ');
  });

  test('bug: typing after conversion appends to furigana correctly', () => {
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
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: false, inputType: 'insertText' }),
    );
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
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: true, inputType: 'insertText' }),
    );
    expect(furiganaInput.value).toBe('やまだ');

    // Press space - IME shows candidate "山田"
    nameInput.value = '山田';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: true, inputType: 'insertCompositionText' }),
    );
    expect(furiganaInput.value).toBe('やまだ');

    // Press space again - IME shows another candidate "山谷"
    nameInput.value = '山谷';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: true, inputType: 'insertCompositionText' }),
    );
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
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: true, inputType: 'insertText' }),
    );
    expect(furiganaInput.value).toBe('やまだ');

    // Press space - IME shows candidate "山田"
    nameInput.value = '山田';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: true, inputType: 'insertCompositionText' }),
    );
    expect(furiganaInput.value).toBe('やまだ');

    // Press space again - IME temporarily shows kana "やまだ" before next candidate
    nameInput.value = 'やまだ';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: true, inputType: 'insertCompositionText' }),
    );
    expect(furiganaInput.value).toBe('やまだ');

    // Press space again - IME shows candidate "山谷"
    nameInput.value = '山谷';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: true, inputType: 'insertCompositionText' }),
    );
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
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: true, inputType: 'insertText' }),
    );
    expect(furiganaInput.value).toBe('やまだ');

    // Press space multiple times to browse candidates
    // Each press changes the input to a different candidate
    nameInput.value = '山田';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: true, inputType: 'insertCompositionText' }),
    );
    expect(furiganaInput.value).toBe('やまだ');

    nameInput.value = '山谷';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: true, inputType: 'insertCompositionText' }),
    );
    expect(furiganaInput.value).toBe('やまだ');

    nameInput.value = '山田';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: true, inputType: 'insertCompositionText' }),
    );
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
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: true, inputType: 'insertText' }),
    );
    expect(furiganaInput.value).toBe('やまだ');

    // Press space - IME converts to "病まだ" (first char changed, rest same)
    nameInput.value = '病まだ';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: true, inputType: 'insertCompositionText' }),
    );
    expect(furiganaInput.value).toBe('やまだ');

    // Press space again - back to "山田"
    nameInput.value = '山田';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: true, inputType: 'insertCompositionText' }),
    );
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
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: true, inputType: 'insertText' }),
    );
    expect(furiganaInput.value).toBe('やまだ');

    // Press space - IME converts to "病まだ" (first char changed to kanji, rest same)
    nameInput.value = '病まだ';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: true, inputType: 'insertCompositionText' }),
    );
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
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: true, inputType: 'insertText' }),
    );
    expect(furiganaInput.value).toBe('やまだ');

    // Press space - IME converts to "山だ"
    nameInput.value = '山だ';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: true, inputType: 'insertCompositionText' }),
    );
    expect(furiganaInput.value).toBe('やまだ');

    // Confirm selection
    nameInput.dispatchEvent(new CompositionEvent('compositionend', { data: '山だ' }));
    expect(furiganaInput.value).toBe('やまだ');

    // Type full-width space after conversion
    nameInput.value = '山だ\u3000';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: false, inputType: 'insertText' }),
    );
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
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: true, inputType: 'insertText' }),
    );
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
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: false, inputType: 'insertText' }),
    );
    nameInput.value = 'やｍ';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: false, inputType: 'insertText' }),
    );
    nameInput.value = 'やｍだ';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: false, inputType: 'insertText' }),
    );
    expect(furiganaInput.value).toBe('やだ');

    // Backspace to remove "だ" - input becomes "やｍ"
    nameInput.value = 'やｍ';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: false, inputType: 'deleteContentBackward' }),
    );
    expect(furiganaInput.value).toBe('や');

    // Backspace again - input becomes "や"
    nameInput.value = 'や';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: false, inputType: 'deleteContentBackward' }),
    );
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
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: true, inputType: 'insertText' }),
    );
    nameInput.value = '山田';
    nameInput.dispatchEvent(new CompositionEvent('compositionend', { data: '山田' }));
    expect(furiganaInput.value).toBe('やまだ');

    // Type full-width space after the kanji
    nameInput.value = '山田　';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: false, inputType: 'insertText' }),
    );
    expect(furiganaInput.value).toBe('やまだ　');

    // Type "たろう" (still hiragana, no conversion)
    nameInput.value = '山田　たろう';
    nameInput.dispatchEvent(
      new InputEvent('input', { isComposing: false, inputType: 'insertText' }),
    );
    expect(autokana.getFurigana()).toBe('やまだ　たろう');
  });

  test('composition state is not exposed on AutoKana', () => {
    setup();
    const autokana = new AutoKana('name', 'furigana');
    expect(autokana).not.toHaveProperty('isConverting');
    expect(autokana).not.toHaveProperty('isComposing');
  });

  test('checkInterval option is removed from AutoKanaOption', () => {
    setup();
    const autokana = new AutoKana('name', 'furigana');
    expect(autokana.option).not.toHaveProperty('checkInterval');
  });
});
