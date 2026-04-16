# vanilla-autokana

[English README is here](./README_en.md)

このプロジェクトは [ryo-utsunomiya/vanilla-autokana](https://github.com/ryo-utsunomiya/vanilla-autokana) からフォークした実装です。

フォームのフィールドに文字を入力すると、別のフィールドにかなを自動入力するライブラリです。

## 特徴

- jQueryに依存していません
- scriptタグからの読み込みとESModulesのimportに対応しています

## インストール方法

### npm

```
npm i @j1nn0/vanilla-autokana # or yarn add @j1nn0/vanilla-autokana
```

### npmを使わない方法

このリポジトリの `dist/autokana.umd.js` をダウンロードし、scriptタグで読み込んでください。

## 使用方法

- `AutoKana.bind()` メソッドの第1引数にふりがな入力元のinput要素、第2引数にふりがな出力先のinput要素のidを指定します
- input要素が見つけられない場合は正常に動作できないため、DOMContentLoadedイベント内での実行を推奨します
- ライブラリ本体はDOMのライフサイクルイベントに依存しないため、ライブラリの読み込みには`defer`属性の追加を推奨します

```
<input name="name" id="name">
<input name="furigana" id="furigana">
<script src="autokana.umd.js" defer></script>
<script>
  document.addEventListener("DOMContentLoaded", function() {
    // ひらがなで出力（デフォルト）
    AutoKana.bind("#name", "#furigana");
    // 全角カタカナで出力したい場合
    // AutoKana.bind("#name", "#furigana", { katakana: 'full' });
    // 半角カタカナで出力したい場合
    // AutoKana.bind("#name", "#furigana", { katakana: 'half' });
  });
</script>
```

### モジュールとしてimportする

ESModulesとしてimportすることができます。

```
import * as AutoKana from '@j1nn0/vanilla-autokana';

AutoKana.bind('#name', '#furigana');
```

### オプション

`AutoKana.bind(name, furigana, option)` の第3引数には以下を指定できます。

- `katakana`: `false | 'full' | 'half'`
- `debug`: `boolean`
- `checkInterval`: `number`（既定値 `30`、単位 ms）

`katakana` の値ごとの挙動:

- `false`: ひらがなで出力（デフォルト）
- `'full'`: 全角カタカナで出力
- `'half'`: 半角カタカナで出力（全角空白は半角空白に正規化）

`checkInterval` は入力変化を監視するポーリング間隔です。値を大きくすると監視頻度は下がり、値を小さくすると追従性が上がります。

```js
AutoKana.bind('#name', '#furigana', { checkInterval: 50 });
```

### Vue.jsと組み合わせる

`v-model`を使用している場合、input要素のvalue属性への値のセットは動作しません。
↓のように、 `getFurigana` メソッドを使ってふりがなを取り出し、リアクティブプロパティにセットしてください。

```
<template>
  <div id="app">
    <div>
      <label for="name">名前</label>
      <input name="name" id="name" v-model="name" @input="handleNameInput">
    </div>
    <div>
      <label for="furigana">ふりがな</label>
      <input name="furigana" id="furigana" v-model="furigana">
    </div>
    <h2>入力内容の確認</h2>
    <p>名前: {{ name }}</p>
    <p>ふりがな: {{ furigana }}</p>
  </div>
</template>

<script>
  import * as AutoKana from '@j1nn0/vanilla-autokana';

  let autokana;

  export default {
    name: 'App',
    data() {
      return {
        name: '',
        furigana: '',
      }
    },
    mounted() {
      autokana = AutoKana.bind('#name', '#furigana');
    },
    methods: {
      handleNameInput() {
        this.furigana = autokana.getFurigana();
      }
    }
  }
</script>
```

### React.jsと組み合わせる

Vue.jsと同様の対応が必要です。

```
import React, { Component } from 'react';
import * as AutoKana from '@j1nn0/vanilla-autokana';

let autokana;

class App extends Component {
  constructor() {
    super();
    this.state = {
      name: '',
      furigana: '',
    };
    this.handleNameInput = this.handleNameInput.bind(this);
  }
  componentDidMount() {
    autokana = AutoKana.bind('#name', '#furigana');
  }
  handleNameInput(ev) {
    this.setState({
      name: ev.target.value,
      furigana: autokana.getFurigana(),
    });
  }
  render() {
    return (
      <div className="App">
        <div>
          <label htmlFor="name">名前</label>
          <input name="name" id="name" value={this.state.name} onInput={this.handleNameInput} />
        </div>
        <div>
          <label htmlFor="furigana">ふりがな</label>
          <input name="furigana" id="furigana" value={this.state.furigana} />
        </div>
        <h2>入力内容の確認</h2>
        <p>名前: { this.state.name }</p>
        <p>ふりがな: { this.state.furigana }</p>
      </div>
    );
  }
}

export default App;
```

## ライセンス

MIT

## 謝辞

このプロジェクトは [ryo-utsunomiya/vanilla-autokana](https://github.com/ryo-utsunomiya/vanilla-autokana) をベースにしています。

このライブラリの設計・実装は jquery-autokana(https://github.com/harisenbon/autokana) に大きく影響を受けています。
