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
  const name = document.querySelector('[name=name]') as Element;
  const furigana = document.querySelector('[name=furigana]') as Element;
  const autokana = new AutoKana(name, furigana);
  autokana.start();
  expect(autokana.isActive).toBe(true);
});

test('katakana: "half" converts basic hiragana to half-width katakana', () => {
  document.body.innerHTML = `
<input name="name" id="name">
<input name="furigana" id="furigana">
`;
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
  document.body.innerHTML = `
<input name="name" id="name">
<input name="furigana" id="furigana">
`;
  const autokana = new AutoKana('name', 'furigana', { katakana: 'full' });
  expect(autokana.toKatakana('あいうえお')).toBe('アイウエオ');
});

test('katakana: false keeps hiragana as-is', () => {
  document.body.innerHTML = `
<input name="name" id="name">
<input name="furigana" id="furigana">
`;
  const autokana = new AutoKana('name', 'furigana', { katakana: false });
  expect(autokana.toKatakana('あいうえお')).toBe('あいうえお');
});

test('no option keeps hiragana as-is', () => {
  document.body.innerHTML = `
<input name="name" id="name">
<input name="furigana" id="furigana">
`;
  const autokana = new AutoKana('name', 'furigana');
  expect(autokana.toKatakana('あいうえお')).toBe('あいうえお');
});

test('full-width spaces are kept as-is in furigana by default', () => {
  document.body.innerHTML = `
<input name="name" id="name">
<input name="furigana" id="furigana">
`;
  const autokana = new AutoKana('name', 'furigana');
  autokana.baseKana = 'やまだ　たろう';
  autokana.values = [];
  autokana.setFurigana();
  expect(autokana.getFurigana()).toBe('やまだ　たろう');
});

test('full-width spaces are converted to half-width spaces when katakana is "half"', () => {
  document.body.innerHTML = `
<input name="name" id="name">
<input name="furigana" id="furigana">
`;
  const autokana = new AutoKana('name', 'furigana', { katakana: 'half' });
  autokana.baseKana = 'やまだ　たろう';
  autokana.values = [];
  autokana.setFurigana();
  expect(autokana.getFurigana()).toBe('ﾔﾏﾀﾞ ﾀﾛｳ');
});
