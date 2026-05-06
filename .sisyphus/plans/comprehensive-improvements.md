# vanilla-autokana 包括的改善計画

## TL;DR

> **概要**: `@j1nn0/vanilla-autokana` ライブラリの品質を包括的に向上させる。型安全性・API改善、テストカバレッジ補完、CI/CD構築、パッケージ設定改善、コード品質向上、ドキュメント同期を行う。
> 
> **成果物**:
> - GitHub Actions CI/CD ワークフロー
> - katakanaMap モジュール分離
> - 未カバーブランチのテスト追加
> - AutoKana クラスの型安全性・可視性改善
> - package.json の exports/sideEffects/provenance 追加
> - CHANGELOG.md リネーム + README 同期
> 
> **推定作業量**: Medium（8タスク、3ウェーブ + 最終検証）
> **並列実行**: YES - 3ウェーブ
> **クリティカルパス**: T2 → T6 → T8 → F1-F4

---

## Context

### Original Request
ユーザーが「改善点を提案してください」と要求。コードベース全体を分析し、5カテゴリ（型安全性・API、テスト・CI、パッケージ設定、コード品質、ドキュメント）の改善点を特定。ユーザーは全カテゴリの改善と詳細な作業計画作成を希望。

### Interview Summary
**Key Discussions**:
- 内部プロパティのprivate化: 破壊的変更だが、テスト修正込みでv1.4.0としてリリース. テストは `autokana.baseKana = '...'` のように内部プロパティに直接アクセスしている箇所が10+あるが、テスト内アクセス箇所をリファクタリングで対応
- CI/CD: 既存の `pnpm run ci` のみ実行するシンプルなGitHub Actions
- katakanaMap: 別ファイル (`src/katakanaMap.ts`) に分離

**Research Findings**:
- テストカバレッジ: 96.85% Stmts / 83.33% Branches / 100% Functions / 96.72% Lines
- 未カバーライン: L34 (HTMLElement以外のElement分岐), L293, L306-307 (checkConvertエッジケース)
- CI/CDパイプラインなし (Dependabotのみ)
- `package.json` に `exports`, `sideEffects`, `provenance` フィールドなし
- `fullToHalfKatakanaMap` が90+行インライン
- `CHANGELOG` に `.md` 拡張子なし

### Metis Review
**Identified Gaps (addressed)**:
- public→privateの破壊的変更: テスト修正込みで対応決定 (v1.4.0)
- `toggle(event)` の型安全性: `Event` 引数をより厳格な型に改善
- `Bindable` 型を `HTMLElement` に制限すべき (SVGElement等の誤用防止)
- L34 (SVGElement分岐) のテスト追加方針: テスト追加で対応
- `registerEvents()` は private にすべき (外部API不要)
- CI トリガー: PR + push to main

---

## Work Objectives

### Core Objective
`@j1nn0/vanilla-autokana` ライブラリの保守性・型安全性・開発体験を包括的に向上させる。

### Concrete Deliverables
- `.github/workflows/ci.yml` — PR/push時の自動CI
- `src/katakanaMap.ts` — katakanaMap定数モジュール
- `__tests__/AutoKana.test.ts` — 未カバーブランチのテスト追加
- `src/AutoKana.ts` — 型安全性・可視性改善
- `src/index.ts` — 型エクスポート改善
- `package.json` — exports/sideEffects/provenance追加
- `CHANGELOG.md` — リネーム済み
- `README_en.md` — 日本語版と同期済み

### Definition of Done
- [ ] `pnpm run ci` が全テストパス
- [ ] `pnpm run typecheck` がエラーなし
- [ ] `pnpm run lint` がエラーなし
- [ ] GitHub Actions CI が PR/push で自動実行される
- [ ] ブランチカバレッジが 85%以上
- [ ] AutoKana クラスの内部プロパティが private 化済み
- [ ] `exports`, `sideEffects`, `provenance` が package.json に追加済み

### Must Have
- 全既存テストがパスすること（テスト修正込み）
- 変換ロジックの動作が一切変更されないこと
- ビルド成果物 (`dist/`) の後方互換性維持
- CI ワークフローが既存の `pnpm run ci` を実行すること

### Must NOT Have (Guardrails)
- 変換アルゴリズム（`toKatakana`, `removeString`, `checkConvert`）のロジック変更
- 新機能の追加（`reset()` メソッド等はスコープ外）
- `main`/`module`/`types` フィールドの削除・変更（`exports` は追加のみ）
- README の内容変更（英語版は日本版との同期のみ）
- E2EテストやPlaywrightの導入（スコープ外）
- パフォーマンス最適化（スコープ外）
- バンドルサイズの変更をもたらるような変更

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** - ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (vitest + jsdom + v8 coverage)
- **Automated tests**: YES (Tests-after — 各タスクの実装後にテストを確認)
- **Framework**: vitest
- **If TDD**: N/A (tests-after approach)

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Library/Module**: Use Bash — `pnpm run typecheck`, `pnpm run lint`, `pnpm run test:coverage`
- **CI/CD**: Use Bash — `gh workflow run` または yaml 検証
- **Documentation**: Use Bash — `diff`, ファイル存在確認

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately - foundation + independent work):
├── T1: GitHub Actions CI workflow [quick]
├── T2: Extract katakanaMap to separate module [quick]
├── T3: Add tests for uncovered branches [unspecified-high]
├── T4: Package.json config improvements [quick]
└── T5: Rename CHANGELOG → CHANGELOG.md [quick]

Wave 2 (After Wave 1 - AutoKana.ts improvements):
├── T6: AutoKana.ts type safety + private properties + test refactoring [deep]
└── T7: Sync README_en.md with README.md [writing]

Wave 3 (After Wave 2 - documentation + exports):
└── T8: Add JSDoc to public APIs + export type improvements [quick]

Wave FINAL (After ALL tasks — 4 parallel reviews, then user okay):
├── F1: Plan compliance audit (oracle)
├── F2: Code quality review (unspecified-high)
├── F3: Real manual QA (unspecified-high)
└── F4: Scope fidelity check (deep)
→ Present results → Get explicit user okay

Critical Path: T2 → T6 → T8 → F1-F4 → user okay
Parallel Speedup: ~50% faster than sequential
Max Concurrent: 5 (Wave 1)
```

### Dependency Matrix

| Task | Depends On | Blocks | Files |
|------|-----------|--------|-------|
| T1 | - | F1-F4 | .github/workflows/ci.yml |
| T2 | - | T6 | src/katakanaMap.ts, src/AutoKana.ts |
| T3 | - | - | __tests__/AutoKana.test.ts |
| T4 | - | - | package.json |
| T5 | - | - | CHANGELOG.md |
| T6 | T2 | T8 | src/AutoKana.ts, __tests__/AutoKana.test.ts |
| T7 | - | - | README_en.md |
| T8 | T6 | F1-F4 | src/AutoKana.ts, src/index.ts |

### Agent Dispatch Summary

- **Wave 1**: **5** — T1→`quick`, T2→`quick`, T3→`unspecified-high`, T4→`quick`, T5→`quick`
- **Wave 2**: **2** — T6→`deep`, T7→`writing`
- **Wave 3**: **1** — T8→`quick`
- **FINAL**: **4** — F1→`oracle`, F2→`unspecified-high`, F3→`unspecified-high`, F4→`deep`

---

## TODOs

- [x] 1. GitHub Actions CI ワークフロー追加

  **What to do**:
  - `.github/workflows/ci.yml` を作成
  - トリガー: `push` (branches: main), `pull_request` (branches: main)
  - ジョブ: `pnpm install → pnpm run lint → pnpm run typecheck → pnpm run test:coverage → pnpm run build`
  - Node.js バージョン: 24 (package.jsonのenginesに合わせる)
  - pnpm バージョン: 10 (corepack で有効化)
  - coverage artifact のアップロード (actions/upload-artifact)
  - CI失敗時にわかりやすいエラーメッセージが出るようにする

  **Must NOT do**:
  - npm publish や Release Please は追加しない
  - `pnpm run ci` 以外のコマンドを追加しない
  - キャッシュ設定は最小限に (node_modules cache のみ)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 既存コマンドの順次実行のみ、設計判断不要
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `typescript-advanced-types`: CI設定に型知識不要

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T2, T3, T4, T5)
  - **Blocks**: F1-F4
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `.github/dependabot.yml` — 既存のGitHub設定パターン (YAMLインデント、prefix等)
  - `package.json:scripts.ci` — 実行すべきコマンドチェーン

  **API/Type References**:
  - `package.json:engines` — Node>=24, pnpm>=10 の制約

  **External References**:
  - GitHub Actions docs: https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions
  - pnpm GitHub Actions: https://pnpm.io/continuous-integration#github-actions

  **WHY Each Reference Matters**:
  - `dependabot.yml`: 同じリポジトリのYAML設定パターンを踏襲するため
  - `package.json:scripts.ci`: CIで実行すべき完全なコマンドチェーン
  - `package.json:engines`: CIのNode/pnpmバージョンを決定するため

  **Acceptance Criteria**:

  - [ ] `.github/workflows/ci.yml` が存在する
  - [ ] ワークフローが push (main) と pull_request (main) でトリガーされる
  - [ ] CI ジョブが `pnpm install → lint → typecheck → test:coverage → build` を実行する
  - [ ] YAML 構文が正しい (actionlint または `gh workflow lint` で検証)

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: CI workflow file is valid YAML and triggers correctly
    Tool: Bash
    Preconditions: .github/workflows/ci.yml exists
    Steps:
      1. Run `cat .github/workflows/ci.yml | python3 -c "import yaml,sys; yaml.safe_load(sys.stdin)"` to validate YAML syntax
      2. Verify `on.push.branches` contains "main"
      3. Verify `on.pull_request.branches` contains "main"
      4. Verify the steps include: pnpm install, pnpm run lint, pnpm run typecheck, pnpm run test:coverage, pnpm run build
    Expected Result: YAML parses without errors, triggers on push/PR to main, all CI steps present
    Failure Indicators: YAML parse error, missing trigger, missing step
    Evidence: .sisyphus/evidence/task-1-ci-workflow.txt

  Scenario: CI commands pass locally
    Tool: Bash
    Preconditions: pnpm dependencies installed
    Steps:
      1. Run `pnpm run ci`
      2. Verify exit code is 0
    Expected Result: All steps pass (lint, typecheck, test, build)
    Failure Indicators: Non-zero exit code, test failures, type errors
    Evidence: .sisyphus/evidence/task-1-ci-local-run.txt
  ```

  **Commit**: YES
  - Message: `ci: add GitHub Actions workflow for PR and push`
  - Files: `.github/workflows/ci.yml`
  - Pre-commit: `pnpm run ci`

- [x] 2. katakanaMap を別モジュールに抽出

  **What to do**:
  - `src/katakanaMap.ts` を新規作成し、`fullToHalfKatakanaMap` 定数を移動
  - `src/AutoKana.ts` から `fullToHalfKatakanaMap` を `import` するよう変更
  - 移動元の `const fullToHalfKatakanaMap` 定義を削除
  - 新モジュールに `Record<string, string>` 型アノテーションを維持
  - `pnpm run typecheck` と `pnpm run test:coverage` がパスすることを確認

  **Must NOT do**:
  - `fullToHalfKatakanaMap` のマッピング内容を変更しない
  - 変換ロジック（`toKatakana`等）を変更しない
  - 他のリファクタリングを同時に行わない

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: コード移動とインポート追加のみ、設計判断不要
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1, T3, T4, T5)
  - **Blocks**: T6
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/AutoKana.ts:47-135` — 移動対象の `fullToHalfKatakanaMap` 定義 (90行)
  - `src/AutoKana.ts:266` — `fullToHalfKatakanaMap` の使用箇所 (`toKatakana` メソッド内)
  - `src/index.ts:1-2` — import パターンの参考

  **WHY Each Reference Matters**:
  - L47-135: 移動元の正確なコード。1行も変更せずに移動する
  - L266: 移動後に import 先が正しく参照できることの確認箇所
  - index.ts: 既存の import/export パターンに合わせるため

  **Acceptance Criteria**:

  - [ ] `src/katakanaMap.ts` が存在し、`fullToHalfKatakanaMap` を export している
  - [ ] `src/AutoKana.ts` に `import { fullToHalfKatakanaMap } from './katakanaMap'` が追加されている
  - [ ] `src/AutoKana.ts` からインライン `fullToHalfKatakanaMap` 定義が削除されている
  - [ ] `pnpm run typecheck` がエラーなしで通過
  - [ ] `pnpm run test:coverage` の全テストがパス
  - [ ] `pnpm run build` の成果物に変更がない (dist/ 出力が同一)

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Module extraction preserves behavior
    Tool: Bash
    Preconditions: katakanaMap.ts created, AutoKana.ts updated
    Steps:
      1. Run `pnpm run typecheck` — must pass
      2. Run `pnpm run test:coverage` — all 47 tests must pass
      3. Run `pnpm run build` — must succeed
      4. Verify `src/katakanaMap.ts` contains `export const fullToHalfKatakanaMap`
      5. Verify `src/AutoKana.ts` has `import { fullToHalfKatakanaMap } from './katakanaMap'`
      6. Verify `src/AutoKana.ts` no longer contains inline `const fullToHalfKatakanaMap`
    Expected Result: All checks pass, behavior unchanged
    Failure Indicators: Type errors, test failures, build failures, missing import
    Evidence: .sisyphus/evidence/task-2-katakana-extract.txt

  Scenario: Build output unchanged
    Tool: Bash
    Preconditions: Build completes successfully
    Steps:
      1. Record hash of dist/autokana.es.js and dist/autokana.umd.js before changes (use current)
      2. After changes, run `pnpm run build`
      3. Compare the functionally relevant content of the new dist files (date comments may differ)
    Expected Result: Build output is functionally identical
    Failure Indicators: Different exports, missing symbols, bundle size changes significantly
    Evidence: .sisyphus/evidence/task-2-build-comparison.txt
  ```

  **Commit**: YES
  - Message: `refactor: extract katakanaMap to separate module`
  - Files: `src/katakanaMap.ts`, `src/AutoKana.ts`
  - Pre-commit: `pnpm run typecheck && pnpm run test:coverage`

- [x] 3. 未カバーブランチのテスト追加

  **What to do**:
  - 現在のカバレッジ未カバー行 (L34, L293, L306-307) に対応するテストケースを追加
  - L34 (`ensureElement` で `HTMLElement` 以外の `Element` の返却): `SVGElement` など非HTMLElement要素を渡した場合のテスト (null返却 → `requireElement` で例外)
  - L293 (`removeString` 内のループで文字が一致する場合): `ignoreString` と `newInput` の先頭文字が1文字ずつ一致するケース
  - L306-307 (`checkConvert` で `input.match(kanaExtractionPattern)` がtruthy): 入力に非かな文字が含まれる変換ケース
  - テストは `describe('uncovered branches')` グループにまとめる
  - 各テストに明確な説明を付ける (日本語可)

  **Must NOT do**:
  - 既存テストの変更・削除をしない
  - テストのためにプロダクションコードを変更しない
  - `__tests__/AutoKana.test.ts` 以外のファイルを変更しない

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: カバレッジギャップの分析とエッジケースのテスト作成には慎重な思考が必要
  - **Skills**: [`test-driven-development`]
    - `test-driven-development`: テストファーストの手法でエッジケーステストを作成するため

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1, T2, T4, T5)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `__tests__/AutoKana.test.ts:1-506` — 既存テストの構造、`setup()` ヘルパー、アサーションパターン
  - `__tests__/AutoKana.test.ts:384-506` — `describe('IME composition events')` の構造 (describe/itパターンの参考)

  **API/Type References**:
  - `src/AutoKana.ts:24-35` — `ensureElement` 関数 (L34のnull返却分岐が未カバー)
  - `src/AutoKana.ts:285-297` — `removeString` メソッド (L293が未カバー)
  - `src/AutoKana.ts:299-310` — `checkConvert` メソッド (L306-307が未カバー)

  **Test References**:
  - `__tests__/AutoKana.test.ts:258-261` — 既存のエラーテストパターン (`expect(() => ...).toThrow()`)
  - `vitest.config.ts` — テスト環境設定 (jsdom, globals: true)

  **WHY Each Reference Matters**:
  - L1-506 of test file: テストの書き方、命名規則、セットアップパターンを理解するため
  - L24-35: L34のカバレッジギャップの正確なコードパス
  - L285-297: L293のカバレッジギャップの正確なコードパス
  - L299-310: L306-307のカバレッジギャップの正確なコードパス

  **Acceptance Criteria**:

  - [ ] `__tests__/AutoKana.test.ts` に少なくとも3つの新しいテストケースが追加されている
  - [ ] `pnpm run test:coverage` のブランチカバレッジが 85% 以上
  - [ ] 全既存テスト (47個) がパス
  - [ ] 新テストが L34, L293, L306-307 のカバレッジギャップをカバーしている

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: New tests cover previously uncovered branches
    Tool: Bash
    Preconditions: New test cases added
    Steps:
      1. Run `pnpm run test:coverage`
      2. Check coverage output for AutoKana.ts — branch coverage should be ≥ 85%
      3. Verify the uncovered line numbers (34, 293, 306-307) show as covered
      4. Verify all 47 existing tests still pass
    Expected Result: Branch coverage ≥ 85%, all tests pass
    Failure Indicators: Coverage below 85%, any test failure, uncovered lines remain
    Evidence: .sisyphus/evidence/task-3-coverage-report.txt

  Scenario: Edge case - SVGElement passed to AutoKana constructor (L34)
    Tool: Bash
    Preconditions: New test added for non-HTMLElement Element
    Steps:
      1. Run `pnpm exec vitest run __tests__/AutoKana.test.ts` 
      2. Verify the SVGElement/null branch test passes
      3. Check that the test exercises `ensureElement` returning null for non-HTMLElement
    Expected Result: SVGElement test passes, L34 shows as covered in coverage report
    Failure Indicators: Test failure, L34 still uncovered
    Evidence: .sisyphus/evidence/task-3-svgelement-test.txt
  ```

  **Commit**: YES
  - Message: `test: add coverage for uncovered branches`
  - Files: `__tests__/AutoKana.test.ts`
  - Pre-commit: `pnpm run test:coverage`

- [x] 4. package.json に exports / sideEffects / provenance 追加

  **What to do**:
  - `package.json` に以下を追加:
    - `"exports"` フィールド: `"."` → `{ "import": "./dist/autokana.es.js", "require": "./dist/autokana.umd.js", "types": "./dist/index.d.ts" }`
    - `"sideEffects": false`
    - `publishConfig.provenance: true` を追加 (既存の `publishConfig.access` は保持)
  - 既存の `main`, `module`, `types` フィールドは削除せず維持 (後方互換性)
  - `pnpm run build` が成功することを確認
  - `pnpm run typecheck` がパスすることを確認

  **Must NOT do**:
  - `main`, `module`, `types` フィールドを削除しない (後方互換性のため)
  - バージョン番号を変更しない
  - 依存関係を追加・変更しない

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: package.json フィールドの追加のみ、設計判断不要
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1, T2, T3, T5)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `package.json:1-44` — 現在の package.json 構造 (main, module, types フィールドの位置)

  **External References**:
  - Node.js exports field: https://nodejs.org/api/packages.html#exports
  - npm provenance: https://docs.npmjs.com/generating-provenance-statements

  **WHY Each Reference Matters**:
  - package.json: 既存フィールドとの整合性を保つため
  - exports docs: 正しい条件付きエクスポート構文のため
  - provenance docs: 正しい provenance 設定のため

  **Acceptance Criteria**:

  - [ ] `package.json` に `"exports"` フィールドが存在し、`import`, `require`, `types` 条件を含む
  - [ ] `package.json` に `"sideEffects": false` が存在する
  - [ ] `package.json` の `publishConfig` に `provenance: true` が存在する
  - [ ] `main`, `module`, `types` フィールドが維持されている
  - [ ] `pnpm run typecheck` がパス
  - [ ] `pnpm run build` が成功し、dist/ 出力が同一

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Package.json exports field is correctly structured
    Tool: Bash
    Preconditions: package.json updated
    Steps:
      1. Run `node -e "const p=require('./package.json'); console.log(JSON.stringify(p.exports, null, 2))"`
      2. Verify output contains: `"."` key with `import`, `require`, `types` subkeys
      3. Verify `import` points to `./dist/autokana.es.js`
      4. Verify `require` points to `./dist/autokana.umd.js`
      5. Verify `types` points to `./dist/index.d.ts`
      6. Verify `sideEffects` is `false`
      7. Verify `publishConfig.provenance` is `true`
    Expected Result: All fields present with correct values
    Failure Indicators: Missing fields, wrong paths, wrong values
    Evidence: .sisyphus/evidence/task-4-package-json.txt

  Scenario: Build output unchanged after package.json changes
    Tool: Bash
    Preconditions: Build completes successfully
    Steps:
      1. Run `pnpm run build`
      2. Verify exit code is 0
      3. Verify `dist/autokana.es.js` and `dist/autokana.umd.js` exist
    Expected Result: Build succeeds, output files exist
    Failure Indicators: Build failure, missing output files
    Evidence: .sisyphus/evidence/task-4-build-output.txt
  ```

  **Commit**: YES
  - Message: `build: add exports, sideEffects, provenance to package.json`
  - Files: `package.json`
  - Pre-commit: `pnpm run typecheck && pnpm run build`

- [x] 5. CHANGELOG を CHANGELOG.md にリネーム

  **What to do**:
  - `CHANGELOG` ファイルを `CHANGELOG.md` にリネーム (`git mv`)
  - リポジトリ内で `CHANGELOG` を参照している箇所があれば `CHANGELOG.md` に更新
  - `CHANGELOG.md` が GitHub 上で正しくレンダリングされることを確認

  **Must NOT do**:
  - CHANGELOG の内容を変更しない
  - 新しい変更履歴を追加しない

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: ファイルリネームのみ
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1, T2, T3, T4)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `CHANGELOG` — 現在のファイル (リネーム元)

  **WHY Each Reference Matters**:
  - CHANGELOG: リネーム元ファイルの確認

  **Acceptance Criteria**:

  - [ ] `CHANGELOG.md` が存在する
  - [ ] 元の `CHANGELOG` ファイルが存在しない
  - [ ] `CHANGELOG.md` の内容が元ファイルと同一

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: File renamed correctly
    Tool: Bash
    Preconditions: Rename completed
    Steps:
      1. Run `test -f CHANGELOG.md && echo "EXISTS" || echo "MISSING"`
      2. Run `test -f CHANGELOG && echo "OLD EXISTS" || echo "OLD GONE"`
      3. Run `head -5 CHANGELOG.md` to verify content preserved
    Expected Result: CHANGELOG.md EXISTS, old file GONE, content preserved
    Failure Indicators: CHANGELOG.md missing, old file still exists, content changed
    Evidence: .sisyphus/evidence/task-5-changelog-rename.txt
  ```

  **Commit**: YES
  - Message: `docs: rename CHANGELOG to CHANGELOG.md`
  - Files: `CHANGELOG` → `CHANGELOG.md`
  - Pre-commit: none

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [ ] 6. AutoKana.ts 型安全性改善 + 内部プロパティprivate化 + テストリファクタリング

  **What to do**:
  - **Bindable型の改善**: `Bindable` を `string | HTMLElement` に変更 (`Element` → `HTMLElement`)。`ensureElement` の戻り値も `HTMLElement | null` に
  - **ensureElement の改善**: `HTMLElement` チェック後の `return null` を `/^[[.#:]/` の正規表現でマッチしなかった場合も考慮
  - **toggle() の型改善**: `toggle(event?: Event)` の引数を `toggle(event?: Pick<Event, 'target'> & { target: { checked: boolean } })` または同等の型に改善
  - **registerEvents() のprivate化**: メソッドに `private` 修飾子を追加
  - **内部プロパティのprivate化**: `baseKana`, `furigana`, `isComposing`, `ignoreString`, `input`, `values`, `elName`, `elFurigana` に `private` 修飾子を追加
  - **テストリファクタリング**: テスト内でprivateプロパティに直接アクセスしている箇所 (例: `autokana.baseKana = '...'`) を、パブリックメソッド経由または `@ts-expect-error` で対処
  - **isActive と option はpublicのまま維持** (外部からの読み取りに意味がある)
  - `pnpm run typecheck` と `pnpm run test:coverage` がパスすることを確認

  **Must NOT do**:
  - 変換ロジックのアルゴリズムを変更しない
  - 新しいパブリックメソッドを追加しない
  - `isActive`, `option`, `getFurigana()`, `start()`, `stop()`, `toggle()` のシグネチャを変更しない
  - テストの意図（何を検証しているか）を変えない。あくまでアクセス方法を変えるのみ

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 複数の型変更とテストリファクタリングの連鎖。慎重な設計判断が必要
  - **Skills**: [`typescript-advanced-types`]
    - `typescript-advanced-types`: `Bindable`型の改善、`toggle()`の型定義、private プロパティアクセスの型レベル対処に必要

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on T2 completing first)
  - **Parallel Group**: Wave 2 (with T7 which is independent)
  - **Blocks**: T8
  - **Blocked By**: T2 (katakanaMap import)

  **References**:

  **Pattern References**:
  - `src/AutoKana.ts:1-10` — `Bindable` 型定義 (変更対象)
  - `src/AutoKana.ts:24-35` — `ensureElement` 関数 (型変更対象)
  - `src/AutoKana.ts:138-150` — AutoKana クラスのプロパティ宣言 (private化対象)
  - `src/AutoKana.ts:220-229` — `toggle()` メソッド (型改善対象)
  - `src/AutoKana.ts:240-246` — `registerEvents()` メソッド (private化対象)

  **API/Type References**:
  - `src/index.ts:12-18` — `bind()` 関数の引数型に `Bindable` が使われている箇所

  **Test References**:
  - `__tests__/AutoKana.test.ts` 全体 — private プロパティへの直接アクセス箇所の特定と修正に必要
  - 具体的な修正対象箇所:
    - L66: `autokana.baseKana = 'やまだ　たろう'`
    - L75: `autokana.baseKana = 'やまだ　たろう'`
    - L105: `autokana.baseKana = 'たろう'`
    - L127-L128: `const nameInput = ...`
    - L151: `autokana.isComposing = true`
    - L173: `autokana.isComposing = true`
    - L219: `autokana.baseKana = 'previous'`
    - L227-228: `autokana.baseKana = 'や'`, `autokana.values = ['ま', 'だ']`
    - L326-328: `autokana.baseKana = ...`, `autokana.furigana = ...`, `autokana.values = [...]`
    - L357-360: `nameInput.value = ...` (event-based access)
    - L374-379: `autokana.baseKana = ...`, `autokana.values = [...]`
    - L421: `furiganaInput.value = ...`

  **WHY Each Reference Matters**:
  - AutoKana.ts L1-10: `Bindable` 型の変更元
  - AutoKana.ts L138-150: 全 private 化対象プロパティの一覧
  - AutoKana.ts L220-229: `toggle()` の型改善対象
  - テスト全体: private アクセスの修正箇所を漏らさないため

  **Acceptance Criteria**:

  - [ ] `Bindable` 型が `string | HTMLElement` になっている (`Element` ではない)
  - [ ] `ensureElement` の戻り値型が `HTMLElement | null` になっている
  - [ ] `toggle()` の引数型が改善されている (非チェックボックスイベントの誤用を防ぐ)
  - [ ] `registerEvents()` が `private` になっている
  - [ ] `baseKana`, `furigana`, `isComposing`, `ignoreString`, `input`, `values`, `elName`, `elFurigana` が `private` になっている
  - [ ] `isActive` と `option` は `public` のまま
  - [ ] `pnpm run typecheck` がパス
  - [ ] `pnpm run test:coverage` の全テストがパス
  - [ ] テスト内のprivate プロパティアクセスが `@ts-expect-error` またはパブリックメソッド経由に修正されている

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Type safety improvements compile and pass
    Tool: Bash
    Preconditions: All type and visibility changes applied
    Steps:
      1. Run `pnpm run typecheck` — must pass with 0 errors
      2. Run `pnpm run test:coverage` — all tests must pass
      3. Run `pnpm run lint` — must pass with 0 errors
    Expected Result: All commands pass successfully
    Failure Indicators: Type errors, test failures, lint errors
    Evidence: .sisyphus/evidence/task-6-type-safety.txt

  Scenario: Private properties are inaccessible from outside
    Tool: Bash
    Preconditions: Private properties applied
    Steps:
      1. Create a test file that tries: `const ak = new AutoKana('name'); ak.baseKana;`
      2. Run `pnpm run typecheck` — should report a type error for accessing private property
      3. Remove test file
    Expected Result: TypeScript reports error for accessing private property from outside
    Failure Indicators: No type error (property still accessible)
    Evidence: .sisyphus/evidence/task-6-private-access.txt
  ```

  **Commit**: YES
  - Message: `refactor: improve type safety and make internal properties private`
  - Files: `src/AutoKana.ts`, `__tests__/AutoKana.test.ts`, `src/index.ts`
  - Pre-commit: `pnpm run typecheck && pnpm run test:coverage`

- [ ] 7. README_en.md を README.md と同期

  **What to do**:
  - `README.md` (日本語版) と `README_en.md` (英語版) の内容を比較
  - 英語版に日本語版の最新内容が反映されていない箇所を特定
  - 英語版に不足している内容 (CSS セレクタ対応、`getFurigana()` メソッド、Vue/React 例) を翻訳・追加
  - 英語版の表現が日本語版と整合するように更新
  - 翻訳品質: 技術用語は英語の標準的な表現を使用 (例: "furigana" は "furigana" のまま、"ひらがな" → "hiragana")

  **Must NOT do**:
  - 日本語版 (README.md) の内容を変更しない
  - 新しいセクションを追加しない (同期のみ)
  - API仕様を変更しない

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: ドキュメントの翻訳・同期作業
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (independent of T6)
  - **Parallel Group**: Wave 2
  - **Blocks**: None
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `README.md` — 日本語版 (マスタードキュメント、最新)
  - `README_en.md` — 英語版 (同期先)

  **WHY Each Reference Matters**:
  - README.md: 同期元。全内容を英語版に反映する必要がある
  - README_en.md: 同期先。不足箇所を特定・補完する

  **Acceptance Criteria**:

  - [ ] README_en.md の全セクションが README.md に対応している
  - [ ] CSS セレクタ対応の説明が英語版に含まれている
  - [ ] `katakana` オプションの説明 (`false`, `'full'`, `'half'`) が英語版に含まれている
  - [ ] Vue.js / React との組み合わせ例が英語版に含まれている
  - [ ] インストール方法、使用方法、オプション、ライセンスの各セクションが揃っている

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: English README mirrors Japanese README
    Tool: Bash
    Preconditions: README_en.md updated
    Steps:
      1. Run `grep -c "CSS selector" README_en.md` — should be ≥ 1
      2. Run `grep -c "getFurigana" README_en.md` — should be ≥ 1
      3. Run `grep -c "katakana" README_en.md` — should be ≥ 3
      4. Run `grep -c "Vue" README_en.md` — should be ≥ 1
      5. Run `grep -c "React" README_en.md` — should be ≥ 1
      6. Verify README_en.md has sections: Install, Usage, Options, Vue, React, License
    Expected Result: All key topics present in English README
    Failure Indicators: Missing sections or topics
    Evidence: .sisyphus/evidence/task-7-readme-sync.txt
  ```

  **Commit**: YES
  - Message: `docs: sync README_en.md with README.md`
  - Files: `README_en.md`
  - Pre-commit: none

- [ ] 8. パブリックAPIへのJSDoc追加 + 型エクスポート改善

  **What to do**:
  - `src/AutoKana.ts` のパブリックメソッドに JSDoc コメントを追加:
    - `getFurigana()`: ふりがなの取得、返り値の説明
    - `start()`: 追跡の再開
    - `stop()`: 追跡の一時停止
    - `toggle(event?)`: チェックボックス連動の説明
    - `initializeValues()`: 内部状態のリセット
    - `destroy()`: イベントリスナーの削除
  - `src/index.ts` から `Bindable` 型と `KatakanaOption` 型をエクスポート:
    - `export type { Bindable, AutoKanaOption }` を確認 (KatakanaOption は既にエクスポート済み)
    - `Bindable` 型のエクスポートを追加
  - `bind()` 関数の JSDoc を更新 (引数の型説明を改善)
  - `pnpm run typecheck` がパスすることを確認

  **Must NOT do**:
  - メソッドのシグネチャを変更しない
  - 新しいパブリックメソッドを追加しない
  - private メソッドに JSDoc を追加しない (外部から不要)
  - `debug()` メソッドに JSDoc を追加しない (デバッグ用)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: JSDoc の追加と型エクスポートの改善。設計判断は最小限
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on T6 completing first)
  - **Parallel Group**: Wave 3
  - **Blocks**: F1-F4
  - **Blocked By**: T6 (private/public変更が確定してからJSDocを書く必要がある)

  **References**:

  **Pattern References**:
  - `src/index.ts:4-11` — 既存の `bind()` 関数の JSDoc パターン (既存スタイルに合わせる)
  - `src/AutoKana.ts:138-150` — public プロパティとメソッドの宣言 (JSDoc 追加対象)

  **API/Type References**:
  - `src/AutoKana.ts:1-10` — `Bindable` と `KatakanaOption` 型 (エクスポート改善対象)
  - `src/index.ts:1-21` — 現在のエクスポート構成

  **Test References**:
  - `__tests__/AutoKana.test.ts` — JSDoc がテストの動作に影響しないことの確認

  **WHY Each Reference Matters**:
  - `src/index.ts:4-11`: JSDoc のスタイルガイド (既存パターンに統一するため)
  - `src/AutoKana.ts:138-150`: JSDoc 追加対象のメソッド一覧
  - `src/AutoKana.ts:1-10`: エクスポート改善する型定義

  **Acceptance Criteria**:

  - [ ] `getFurigana()`, `start()`, `stop()`, `toggle()`, `initializeValues()`, `destroy()` に JSDoc がある
  - [ ] `Bindable` 型が `src/index.ts` からエクスポートされている
  - [ ] `KatakanaOption` 型が引き続きエクスポートされている
  - [ ] `pnpm run typecheck` がパス
  - [ ] JSDoc のスタイルが `bind()` の既存 JSDoc と統一されている

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: JSDoc comments present on public methods
    Tool: Bash
    Preconditions: JSDoc added to all public methods
    Steps:
      1. Run `grep -c "^\s\*\s" src/AutoKana.ts` to count JSDoc lines
      2. Run `pnpm run typecheck` — must pass
      3. Verify JSDoc for getFurigana, start, stop, toggle, initializeValues, destroy
      4. Verify `src/index.ts` exports `Bindable` and `KatakanaOption` types
    Expected Result: JSDoc present on all 6 public methods, types exported correctly
    Failure Indicators: Missing JSDoc, type errors, missing exports
    Evidence: .sisyphus/evidence/task-8-jsdoc.txt

  Scenario: Build produces correct .d.ts with JSDoc
    Tool: Bash
    Preconditions: Build completed
    Steps:
      1. Run `pnpm run build`
      2. Check `dist/index.d.ts` contains JSDoc comments on exported methods
      3. Verify `Bindable` type appears in the type definition file
    Expected Result: JSDoc visible in type definitions, Bindable exported
    Failure Indicators: Missing JSDoc in .d.ts, Bindable not exported
    Evidence: .sisyphus/evidence/task-8-dts-output.txt
  ```

  **Commit**: YES
  - Message: `docs: add JSDoc to public APIs and improve type exports`
  - Files: `src/AutoKana.ts`, `src/index.ts`
  - Pre-commit: `pnpm run typecheck`

---

## Final Verification Wave
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `pnpm run typecheck` + `pnpm run lint` + `pnpm run test:coverage`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names. Verify branch coverage ≥ 85%.
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Coverage [X%] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high`
  Start from clean state (`pnpm install && pnpm run ci`). Verify CI workflow file syntax (actionlint or similar). Verify each deliverable: CI triggers, katakanaMap module import, private property access from outside fails, package.json exports field valid, CHANGELOG.md exists, README_en.md matches README.md content. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (`git log/diff`). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **T1**: `ci: add GitHub Actions workflow for PR and push` - .github/workflows/ci.yml
- **T2**: `refactor: extract katakanaMap to separate module` - src/katakanaMap.ts, src/AutoKana.ts
- **T3**: `test: add coverage for uncovered branches` - __tests__/AutoKana.test.ts
- **T4**: `build: add exports, sideEffects, provenance to package.json` - package.json
- **T5**: `docs: rename CHANGELOG to CHANGELOG.md` - CHANGELOG.md
- **T6**: `refactor: improve type safety and make internal properties private` - src/AutoKana.ts, __tests__/AutoKana.test.ts
- **T7**: `docs: sync README_en.md with README.md` - README_en.md
- **T8**: `docs: add JSDoc to public APIs and improve type exports` - src/AutoKana.ts, src/index.ts

---

## Success Criteria

### Verification Commands
```bash
pnpm run lint          # Expected: 0 warnings, 0 errors
pnpm run typecheck     # Expected: no errors
pnpm run test:coverage # Expected: all tests pass, branch coverage ≥ 85%
pnpm run build         # Expected: successful build
pnpm run ci            # Expected: full CI pipeline passes
```

### Final Checklist
- [ ] All "Must Have" present (CI workflow, private properties, exports, etc.)
- [ ] All "Must NOT Have" absent (no algorithm changes, no new features)
- [ ] All 47 existing tests still pass
- [ ] Branch coverage ≥ 85%
- [ ] `pnpm run ci` passes locally
- [ ] GitHub Actions CI runs on push/PR