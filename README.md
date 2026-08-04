# vanilla-autokana

[English README is here](./README_en.md)

このプロジェクトは [ryo-utsunomiya/vanilla-autokana](https://github.com/ryo-utsunomiya/vanilla-autokana) からフォークした実装です。

フォームのフィールドに文字を入力すると、別のフィールドにかなを自動入力するライブラリです。

## 特徴

- jQueryに依存していません
- scriptタグからの読み込み、ES Modules の import、CommonJS の require に対応しています

## インストール方法

> **Note:** 開発には [pnpm](https://pnpm.io/) 10 以上が必要です。利用側のプロジェクトでは任意のパッケージマネージャでインストールできます。

### npm

```sh
npm i @j1nn0/vanilla-autokana
# or
pnpm add @j1nn0/vanilla-autokana
# or
yarn add @j1nn0/vanilla-autokana
```

### npmを使わない方法

npm パッケージに含まれる `dist/autokana.umd.js` を scriptタグで読み込んでください。
CDN を使う場合は、バージョンを固定した URL の利用を推奨します。

```html
<script src="https://cdn.jsdelivr.net/npm/@j1nn0/vanilla-autokana@2.3.3/dist/autokana.umd.js" defer></script>
```

## 使用方法

- `AutoKana.bind()` メソッドの第1引数にふりがな入力元の input / textarea 要素を指定します。第2引数にはふりがな出力先の input / textarea 要素を指定できますが、省略も可能です
- 要素の指定には `#` / `.` / `[` / `:` で始まるセレクタ文字列、または input / textarea 要素を渡せます。IDのみを渡した場合も従来どおり動作します
- input / textarea 要素が見つけられない場合は正常に動作できないため、DOMContentLoadedイベント内での実行を推奨します
- ライブラリ本体はDOMのライフサイクルイベントに依存しないため、ライブラリの読み込みには`defer`属性の追加を推奨します

```html
<input name="name" id="name" />
<input name="furigana" id="furigana" />
<script src="autokana.umd.js" defer></script>
<script>
  document.addEventListener('DOMContentLoaded', function () {
    // ひらがなで出力（デフォルト）
    AutoKana.bind('#name', '#furigana');
    // 全角カタカナで出力したい場合
    // AutoKana.bind("#name", "#furigana", { katakana: 'full' });
    // 半角カタカナで出力したい場合
    // AutoKana.bind("#name", "#furigana", { katakana: 'half' });
  });
</script>
```

### モジュールとして import する

ES Modules では named import と namespace import のどちらも使用できます。

```js
import { bind } from '@j1nn0/vanilla-autokana';

bind('#name', '#furigana');
```

```js
import * as AutoKana from '@j1nn0/vanilla-autokana';

AutoKana.bind('#name', '#furigana');
```

CommonJS では `require()` で読み込めます。

```js
const { bind } = require('@j1nn0/vanilla-autokana');

bind('#name', '#furigana');
```

### 引数とオプション

`AutoKana.bind(name, furigana?, option)` の引数は以下のとおりです。

- `name`: `#` / `.` / `[` / `:` で始まるセレクタ文字列、または input / textarea 要素
- `furigana`: `#` / `.` / `[` / `:` で始まるセレクタ文字列、input / textarea 要素、または省略

第3引数の `option` には以下を指定できます。

- `katakana`: `'hiragana' | 'full' | 'half'`
- `debug`: `boolean`
- `onChange`: `(furigana: string) => void` — ふりがなが変更されるたびに呼ばれるコールバック

`katakana` の値ごとの挙動:

- `'hiragana'`: ひらがなで出力（デフォルト）
- `'full'`: 全角カタカナで出力
- `'half'`: 半角カタカナで出力（全角空白は半角空白に正規化）

### メソッド

- `getFurigana()`: 現在のふりがな文字列を返す
- `setKatakana(katakana)`: 出力形式（`'hiragana' | 'full' | 'half'`）を実行時に変更する。現在のふりがなも即座に再変換される（追跡停止中も実行される）
- `start()`: ふりがなの自動追跡を再開する
- `stop()`: DOM の入力・IME イベントによる自動追跡を一時停止する。`reset()` と `setKatakana()` は停止中も実行される
- `toggle()`: ふりがなの自動追跡を切り替える
- `reset()`: 内部状態をリセットし、ふりがな出力（DOM 要素・onChange）もクリアする（追跡停止中も実行される）
- `destroy()`: イベントリスナーをすべて削除する。複数回呼び出しても安全で、破棄後の状態変更メソッドは no-op になる
 
`destroy()` 後も `getFurigana()` と `option` は最後の値を返します。破棄後に再び追跡を開始することはできません。

> **注意**: `option` と `isActive` プロパティは読み取り専用です。出力形式は `setKatakana()`、追跡の on/off は `start()` / `stop()` / `toggle()` を使用してください。

### Vue.jsと組み合わせる

`onChange` コールバックを使うと、`getFurigana()` のポーリングなしでふりがなの変更を検知できます。
また、出力先の input 要素を指定している場合は、その要素に `bubbles: true` の `input` イベントも発火します。

```vue
<template>
  <div id="app">
    <div>
      <label for="name">名前</label>
      <input name="name" id="name" v-model="name" />
    </div>
    <div>
      <label for="furigana">ふりがな</label>
      <input name="furigana" id="furigana" v-model="furigana" readonly />
    </div>
    <h2>入力内容の確認</h2>
    <p>名前: {{ name }}</p>
    <p>ふりがな: {{ furigana }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { bind } from '@j1nn0/vanilla-autokana';

const name = ref('');
const furigana = ref('');
let autokana;

onMounted(() => {
  autokana = bind('#name', '#furigana', {
    onChange: (value) => {
      furigana.value = value;
    },
  });
});

onUnmounted(() => {
  autokana?.destroy();
});
</script>
```

`v-model`を使用している場合でも、出力先 input には `input` イベントが発火します。ただし、状態同期には `onChange` コールバックの利用を推奨します。
`onChange` コールバックを使わずに `getFurigana` メソッドでふりがなを取り出すこともできますが、`onChange` の使用を推奨します。

```html
<!-- 非推奨: getFurigana() をポーリングして同期する -->
<input name="name" id="name" v-model="name" @input="handleNameInput" />
```

### React.jsと組み合わせる

Vue.jsと同様に `onChange` コールバックが使えます。

```jsx
import { useEffect, useState } from 'react';
import { bind } from '@j1nn0/vanilla-autokana';

function App() {
  const [name, setName] = useState('');
  const [furigana, setFurigana] = useState('');

  useEffect(() => {
    const autokana = bind('#name', '#furigana', {
      onChange: (value) => {
        setFurigana(value);
      },
    });

    return () => {
      autokana.destroy();
    };
  }, []);

  return (
    <div className="App">
      <div>
        <label htmlFor="name">名前</label>
        <input name="name" id="name" value={name} onInput={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label htmlFor="furigana">ふりがな</label>
        <input name="furigana" id="furigana" value={furigana} readOnly />
      </div>
      <h2>入力内容の確認</h2>
      <p>名前: {name}</p>
      <p>ふりがな: {furigana}</p>
    </div>
  );
}

export default App;
```

## 移行ガイド（v1 → v2）

v2.0.0 で `katakana` オプションの値が変更されました。

### 変更点

| 変更前 (v1)       | 変更後 (v2)                |
| ----------------- | -------------------------- |
| `katakana: false` | `katakana: 'hiragana'`     |
| `katakana: true`  | `katakana: 'full'`         |
| なし              | `katakana: 'half'`（新設） |

### 移行手順

```js
// v1
AutoKana.bind('#name', '#furigana', { katakana: true });

// v2
AutoKana.bind('#name', '#furigana', { katakana: 'full' });
```

## 移行ガイド（v2 → v3）

v3.0.0 で公開 export が縮小されました。`KanaConverter` と `KanaExtractor` はパッケージエントリから export されなくなります（ADR-0003）。`bind` / `AutoKana` / 型の export は変更ありません。

```js
// v2: ユーティリティを直接 import していた場合
import { bind, KanaConverter } from '@j1nn0/vanilla-autokana';
KanaConverter.toKatakana('やまだ', 'full'); // → 'ヤマダ'

// v3: 公開 API は bind / AutoKana / 型
import { bind } from '@j1nn0/vanilla-autokana';
```

ふりがなのカタカナ変換は `katakana` オプションで行えます。単体のカタカナ変換が必要な場合は専用ライブラリをご利用ください。

その他、v3.0.0 での変更:

- `option` プロパティは読み取り専用になりました。実行時に出力形式を変えるには `setKatakana()` を使用してください
- `isActive` プロパティは読み取り専用になりました。追跡の on/off は `start()` / `stop()` / `toggle()` を使用してください
- `toggle(event?)` は削除されました。チェックボックスの変更イベントでは `event.target.checked ? autokana.start() : autokana.stop()` を使用してください
- `initializeValues()` は削除されました。`reset()` を使用してください
- `processValue()` と `setFurigana()` は非公開になりました。入力・IME イベント、`reset()`、`setKatakana()` など公開 interface を使用してください。
- `stop()` は DOM の入力・IME イベントによる自動追跡だけを停止します。`reset()` と `setKatakana()` は停止中も出力を更新します
- `destroy()` は冪等です。破棄後の状態変更メソッドは no-op になり、`getFurigana()` と `option` は最後の値を返します
- `reset()` はふりがな出力（DOM 要素と onChange）もクリアするようになりました（reset 時に onChange が発火します）

## ライセンス

MIT

## 謝辞

このプロジェクトは [ryo-utsunomiya/vanilla-autokana](https://github.com/ryo-utsunomiya/vanilla-autokana) をベースにしています。

このライブラリの設計・実装は jquery-autokana(https://github.com/harisenbon/autokana) に大きく影響を受けています。
