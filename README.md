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

- `AutoKana.bind()` メソッドの第1引数にふりがな入力元の input 要素を指定します。第2引数にはふりがな出力先の input 要素を指定できますが、省略も可能です
- 要素の指定には `#` / `.` / `[` / `:` で始まるセレクタ文字列、または DOM Element を渡せます。IDのみを渡した場合も従来どおり動作します
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

`AutoKana.bind(name, furigana?, option)` の第3引数には以下を指定できます。

- `name`: `#` / `.` / `[` / `:` で始まるセレクタ文字列、または DOM Element
- `furigana`: `#` / `.` / `[` / `:` で始まるセレクタ文字列、DOM Element、または省略

- `katakana`: `false | 'full' | 'half'`
- `debug`: `boolean`
- `onChange`: `(furigana: string) => void` — ふりがなが変更されるたびに呼ばれるコールバック

`katakana` の値ごとの挙動:

- `false`: ひらがなで出力（デフォルト）
- `'full'`: 全角カタカナで出力
- `'half'`: 半角カタカナで出力（全角空白は半角空白に正規化）

### メソッド

- `getFurigana()`: 現在のふりがな文字列を返す
- `start()`: ふりがなの自動追跡を再開する
- `stop()`: ふりがなの自動追跡を一時停止する
- `toggle(event?)`: ふりがなの自動追跡を切り替える。チェックボックスの変更イベントを渡すと、その `checked` 状態を使う
- `reset()`: 内部状態（ふりがな、変換フラグなど）をすべてリセットする
- `destroy()`: イベントリスナーをすべて削除する

> **注意**: `initializeValues()` は非推奨です。代わりに `reset()` を使用してください。

### Vue.jsと組み合わせる

`onChange` コールバックを使うと、`getFurigana()` のポーリングなしでふりがなの変更を検知できます。
また、出力先の input 要素を指定している場合は、その要素に `bubbles: true` の `input` イベントも発火します。

```
<template>
  <div id="app">
    <div>
      <label for="name">名前</label>
      <input name="name" id="name" v-model="name">
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
  import { bind } from '@j1nn0/vanilla-autokana';

  export default {
    name: 'App',
    data() {
      return {
        name: '',
        furigana: '',
      }
    },
    mounted() {
      bind('#name', '#furigana', {
        onChange: (furigana) => { this.furigana = furigana; }
      });
    },
  }
</script>
```

`v-model`を使用している場合でも、出力先 input には `input` イベントが発火します。ただし、状態同期には `onChange` コールバックの利用を推奨します。
`onChange` コールバックを使わずに `getFurigana` メソッドでふりがなを取り出すこともできますが、`onChange` の使用を推奨します。

```
<!-- 非推奨: getFurigana() のポーリング -->
<input name="name" id="name" v-model="name" @input="handleNameInput">
```

### React.jsと組み合わせる

Vue.jsと同様に `onChange` コールバックが使えます。

```jsx
import React, { Component } from 'react';
import { bind } from '@j1nn0/vanilla-autokana';

class App extends Component {
  constructor() {
    super();
    this.state = {
      name: '',
      furigana: '',
    };
  }
  componentDidMount() {
    bind('#name', '#furigana', {
      onChange: (furigana) => { this.setState({ furigana }); }
    });
  }
  render() {
    return (
      <div className="App">
        <div>
          <label htmlFor="name">名前</label>
          <input name="name" id="name" value={this.state.name} onInput={(e) => this.setState({ name: e.target.value })} />
        </div>
        <div>
          <label htmlFor="furigana">ふりがな</label>
          <input name="furigana" id="furigana" value={this.state.furigana} readOnly />
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
