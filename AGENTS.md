# AGENTS.md

## 最優先ルール

- ユーザー向けの返答は必ず日本語で書く。
- シェルコマンドは `rtk` を前置して実行する。例: `rtk pnpm run ci`。
- MCP の `codegraph`、`context7`、`serena` が利用可能な環境では積極的に使い、コード探索・外部仕様確認・変更影響の把握に役立てる。
- 変更前に対象ファイルと周辺の実装を読む。推測だけで既存 API や挙動を変えない。
- ユーザーが明示しない限り、`dist/` などの生成物を手編集しない。
- 既存のユーザー変更を巻き戻さない。作業前後に差分を確認し、自分の変更だけを扱う。

@RTK.md

## プロジェクト概要

- パッケージ: `@j1nn0/vanilla-autokana`
- 種別: 単一パッケージの TypeScript ライブラリ
- 目的: 日本語の氏名入力から、IME の変換状態を追跡してふりがなを自動生成する
- エントリポイント: `src/index.ts`
- メイン実装: `src/AutoKana.ts`
- ビルド: Vite ライブラリモードで UMD / ES module を出力し、`unplugin-dts` で型定義を生成する

## 主要ファイル

- `src/index.ts`: 公開 API。`bind`、`AutoKana`、公開型のみを export する。`KanaConverter` / `KanaExtractor` は内部 module。
- `src/AutoKana.ts`: DOM イベントを `InputTracker` の状態遷移へ写し、返されたふりがなを既存の出力 policy で配信する adapter。
- `src/InputTracker.ts`: IME 状態機械。composition 状態、確定かな / 未確定かな、入力追跡、変換検出を所有する。
- `src/ElementResolver.ts`: 文字列セレクタまたは DOM 要素から `input` / `textarea` を解決する。
- `src/KanaExtractor.ts`: 生入力からかなとスペースを抽出し、変換検出用に小さいかなを圧縮する。
- `src/KanaConverter.ts`: ひらがな、全角カタカナ、半角カタカナへの変換を担当する。
- `src/katakanaMap.ts`: 全角カタカナから半角カタカナへの対応表。
- `__tests__/AutoKana.test.ts`: DOM adapter の公開契約を jsdom イベントで検証する。
- `__tests__/AutoKana.ime.test.ts`: IME composition の adapter 契約を検証する。
- `__tests__/InputTracker.test.ts`: InputTracker の状態機械 interface を直接検証する。
- `__tests__/kana.test.ts`: かな抽出・変換の純粋ロジックを検証する。
- `__tests__/setup.ts`: DOM / IME テストの共通 helper。
- `stories/`: HTML / Vue / React の Storybook サンプル。
- `CONTEXT.md`: ドメイン用語。変更時は用語を揃える。
- `docs/adr/`: 既存の設計判断。API の意味を変える場合は先に読む。

## 公開 API と互換性

- `bind(name, furigana?, option?)` は `AutoKana` インスタンスを返す。
- `name` と `furigana` は、CSS セレクタ文字列、ID 文字列、`HTMLInputElement`、`HTMLTextAreaElement` を受け付ける。
- `furigana` は省略可能。出力要素が常に存在する前提で実装しない。
- `AutoKanaOption.katakana` は `'hiragana' | 'full' | 'half'`。`false` は現行 API ではない。
- デフォルトの `katakana` は `'hiragana'`。
- `onChange` はふりがなが変わるたびに呼ばれる。Vue / React の controlled input 連携で重要。
- ふりがな要素がある場合、値の更新時に bubbling する `input` event を dispatch する。
- `reset()` が現在の推奨 API。後方互換 alias はない。

## 実装上の注意

- IME の変換検出は `compositionstart`、`compositionend`、`input`、`focus`、`blur` のイベント駆動で成り立っている。composition 状態と遷移は `InputTracker` が所有し、各遷移は処理後のふりがなを返す。`AutoKana` は各イベントを1回の遷移へ写して返値を配信するだけにする。
- `committedKana` は確定かな、`pendingKana` は未確定かな、`furigana` は最終出力。`CONTEXT.md` の用語に合わせる。
- 変換確定時は未確定かなを確定かなへ移す。候補選択中の一時的な入力減少で未確定かなを失わないようにする。
- IME の変換検出を変更するときは `__tests__/AutoKana.ime.test.ts` と `__tests__/InputTracker.test.ts` の event / interface 契約を更新する。純粋な抽出・変換は `__tests__/kana.test.ts` で検証する。
- 半角カタカナモードでは全角スペースを半角スペースへ変換する。
- DOM 要素解決のエラーは `AutoKana:` prefix を維持する。SPA 向けのマウント後実行ガイダンスも保持する。
- `destroy()` は登録したイベントリスナーをすべて解除し、複数回呼び出しと破棄後の状態変更を安全な no-op にする必要がある。

## コマンド

- 必要環境: Node.js `>=24`、pnpm `>=10`
- パッケージマネージャ: `pnpm@10.34.1`
- 依存関係の導入: `rtk pnpm install`
- lint: `rtk pnpm run lint`
- typecheck: `rtk pnpm run typecheck`
- テスト watch: `rtk pnpm run test`
- テスト単発 / coverage: `rtk pnpm run test:coverage`
- 単一テスト: `rtk pnpm exec vitest run __tests__/AutoKana.test.ts __tests__/AutoKana.ime.test.ts __tests__/InputTracker.test.ts __tests__/kana.test.ts`
- build: `rtk pnpm run build`
- CI 相当: `rtk pnpm run ci`
- Storybook: `rtk pnpm run storybook`
- format: `rtk pnpm run format`

## テスト方針

- 機能追加、バグ修正、リファクタの前には `test-driven-development` skill を読み、テストで期待挙動を固定してから実装する。
- 完了報告前には `verification-before-completion` skill を読み、実行した検証コマンドと結果を確認する。
- 振る舞い変更では `__tests__/AutoKana.test.ts` を更新する。
- DOM / IME 関連は jsdom のイベントで再現する。単なる private state の検証だけで済ませない。
- カタカナ変換やかな抽出の純粋ロジックは直接テストしてよい。
- 可能なら最後に `rtk pnpm run ci` を実行する。時間や環境制約で省く場合は、何を実行して何を未実行にしたか報告する。

## Storybook とフロントエンド例

- Storybook を変更する場合は `storybook` skill を読む。
- HTML / Vue / React のサンプルは、公開 API の実利用例として扱う。
- Vue / React 例では `onChange` と bubbling `input` event の意義を壊さない。
- Storybook は説明過多にせず、実際に入力して挙動を確認できる状態を優先する。

## ビルドと生成物

- ソースの真実は `src/`。
- `dist/` はビルド生成物。型定義も `unplugin-dts` が生成するため手編集しない。
- `vite.config.ts` はライブラリ出力と型生成の設定を持つ。
- `tsconfig.build.json` は `rootDir: "src"` で型生成対象を絞る。
- 公開 export を変える場合は `src/index.ts`、README、テスト、必要なら ADR を揃える。

## ドキュメント更新

- API の説明や利用方法を変える場合は `README.md` と `README_en.md` の整合を確認する。
- ドメイン用語を追加・変更する場合は `CONTEXT.md` を更新する。
- 公開 API や互換性に関わる設計判断は `docs/adr/` に ADR を追加または更新する。
- `CHANGELOG.md` はリリース向け変更を記録する必要がある場合に更新する。

## 作業手順

1. `rtk git status --short` で作業ツリーを確認する。
2. 関連ファイルを読み、既存の命名・設計・テストパターンに合わせる。
3. 挙動変更なら先にテストを書き、失敗を確認する。
4. `src/` と必要なテスト・ドキュメントだけを最小限に編集する。
5. `rtk pnpm run lint`、`rtk pnpm run typecheck`、関連テストを実行する。
6. 可能なら `rtk pnpm run ci` を実行する。
7. 最終報告では変更内容、検証結果、未検証事項を簡潔に伝える。

## コーディング規約

- TypeScript strict 前提で、公開型を曖昧にしない。
- 既存の quote style と import style に合わせる。
- コメントは複雑な IME / 変換検出ロジックの意図を補う場合だけ追加する。
- 互換性のない API 変更は、ユーザーの明示依頼または ADR を伴う場合に限る。
- 小さな修正で新しい抽象化を増やさない。既存の責務分割に沿って変更する。

## Agent skills

### Issue tracker

Issues live in GitHub Issues (`j1nn0/vanilla-autokana`); external PRs are not a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repo: one `CONTEXT.md` at root and `docs/adr/` for architectural decisions. See `docs/agents/domain.md`.
