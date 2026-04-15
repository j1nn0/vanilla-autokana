/* global test expect document */
import AutoKana from '../src/AutoKana';

test('init', () => {
  document.body.innerHTML = `
<input name="name" id="name">
<input name="furigana" id="furigana">
`;
  const autokana = new AutoKana('name', 'furigana');
  autokana.start();
  expect(autokana.isActive).toBe(true);
});

test('init with pass elements', () => {
  document.body.innerHTML = `
<input name="name">
<input name="furigana">
`;
  const name = document.querySelector('[name=name]')
  const furigana = document.querySelector('[name=furigana]')
  const autokana = new AutoKana(name, furigana);
  autokana.start();
  expect(autokana.isActive).toBe(true);
});

/**
 * Simulate typing each character one at a time into the name field.
 * @param {AutoKana} autokana
 * @param {HTMLInputElement} el
 * @param {string} text
 */
function typeInto(autokana, el, text) {
  for (let i = 1; i <= text.length; i += 1) {
    // eslint-disable-next-line no-param-reassign
    el.value = text.slice(0, i);
    autokana.checkValue();
  }
}

test('half-width katakana is converted to hiragana furigana', () => {
  document.body.innerHTML = `
<input name="name" id="name">
<input name="furigana" id="furigana">
`;
  const autokana = new AutoKana('name', 'furigana');
  autokana.start();

  const nameEl = document.getElementById('name');
  typeInto(autokana, nameEl, 'ﾀﾅｶ');
  expect(autokana.getFurigana()).toBe('たなか');
});

test('half-width katakana is converted to katakana furigana when katakana option is set', () => {
  document.body.innerHTML = `
<input name="name" id="name">
<input name="furigana" id="furigana">
`;
  const autokana = new AutoKana('name', 'furigana', { katakana: true });
  autokana.start();

  const nameEl = document.getElementById('name');
  typeInto(autokana, nameEl, 'ﾀﾅｶ');
  expect(autokana.getFurigana()).toBe('タナカ');
});

test('half-width katakana voiced combinations are handled correctly', () => {
  document.body.innerHTML = `
<input name="name" id="name">
<input name="furigana" id="furigana">
`;
  const autokana = new AutoKana('name', 'furigana');
  autokana.start();

  const nameEl = document.getElementById('name');
  // ｶﾞ→が, ｻﾞ→ざ, ﾀﾞ→だ, ﾊﾞ→ば, ﾊﾟ→ぱ
  typeInto(autokana, nameEl, 'ｶﾞｻﾞﾀﾞﾊﾞﾊﾟ');
  expect(autokana.getFurigana()).toBe('がざだばぱ');
});

test('half-width katakana small characters are handled correctly', () => {
  document.body.innerHTML = `
<input name="name" id="name">
<input name="furigana" id="furigana">
`;
  const autokana = new AutoKana('name', 'furigana');
  autokana.start();

  const nameEl = document.getElementById('name');
  // ｷｬ→きゃ, ｼｮ→しょ, ﾁｭ→ちゅ
  typeInto(autokana, nameEl, 'ｷｬｼｮﾁｭ');
  expect(autokana.getFurigana()).toBe('きゃしょちゅ');
});

