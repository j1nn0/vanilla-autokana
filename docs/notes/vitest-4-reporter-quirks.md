# Vitest 4 の `basic` reporter に関する注意点

## 観測されたエラー

Vitest 4.1.10 で、次のように `basic` reporter を指定すると起動時に失敗する。

```sh
vitest run --reporter=basic
```

主なエラーは次のとおり。

```text
Error: Failed to load custom Reporter from basic
[cause]: Error: Failed to load url basic (resolved id: basic). Does the file exist?
```

## 原因

Vitest 4 では、`basic` reporter が組み込み reporter から削除された。利用可能な組み込み reporter にない名前を指定すると、Vitest はその値をカスタム reporter のモジュール名として読み込もうとする。そのため `basic` というモジュールを解決できず、テスト実行前にエラーになる。

これはテスト対象やアプリケーションコードの問題ではなく、Vitest 3 から 4 への移行時に reporter の指定を更新していないことによる互換性の問題である。

## 回避策

通常のテスト出力でよければ、組み込みの `default` reporter を指定する。

```sh
vitest run --reporter=default
```

reporter を指定しなければ `default` が使われるため、次の指定でもよい。

```sh
vitest run
```

テストケースごとの詳細な出力が必要な場合は `verbose` を使う。

```sh
vitest run --reporter=verbose
```

CI や別ツールへ結果を渡す場合は、用途に応じて `tap`、`junit`、`json` などの reporter を選ぶ。`basic` を固定している外部スクリプト、IDE 設定、CI 設定がある場合は、これらのいずれかへ変更する。

## 利用可能な reporter

Vitest 4.1.10 で次のコマンドを実行した結果、`--help` に表示された reporter は以下のとおり。

```sh
vitest --help 2>&1 | grep -A 2 -- '--reporter'
```

```text
default, agent, minimal, blob, verbose, dot, json, tap, tap-flat, junit,
tree, hanging-process, github-actions
```

`html` は上記の組み込み reporter 一覧には含まれない。HTML レポートを使う場合は `@vitest/ui` を追加で導入したうえで、`--reporter=html` を指定する。`@vitest/ui` がない環境では、`html` の指定も reporter の読み込みエラーになる。
