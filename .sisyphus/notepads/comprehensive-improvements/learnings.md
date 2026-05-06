# Learnings

## CI Workflow Creation

- Created `.github/workflows/ci.yml` for GitHub Actions
- Uses `corepack enable` before `pnpm install` (as project uses `packageManager` field in package.json)
- Cache via `actions/setup-node@v4` with `cache: 'pnpm'`
- Steps match `package.json:scripts.ci`: lint → typecheck → test:coverage → build
- Coverage artifact uploaded via `actions/upload-artifact@v4`

## 2026-05-06: Renamed CHANGELOG → CHANGELOG.md
- Used `git mv CHANGELOG CHANGELOG.md` for proper git tracking
- Verified: content identical (`diff` zero exit), git status shows `R` (rename)
- GitHub will now render the file as formatted Markdown

## 2026-05-06: Branch Coverage Tests (Wave 1 - Test Improvements)

- Added 3 tests under `describe('uncovered branches', ...)` in `__tests__/AutoKana.test.ts`
- **L34 (SVGElement)**: `document.createElementNS('http://www.w3.org/2000/svg', 'svg')` creates an `Element` that is NOT `HTMLElement`. Passing it to constructor triggers `requireElement` → `Error`. Test expects `toThrow('Element not found')`.
- **L293 (removeString for-loop)**: When `ignoreString` is NOT a substring of `newInput` but they share prefix chars, the for-loop at L291-294 matches and removes those chars. Set `ignoreString = 'あいう'`, input `'あいか'`, result `'か'`.
- **L306-307 (checkConvert with non-kana)**: Requires `values.length === input.length` AND `input` has non-kana chars → triggers `onConvert()`. Sequence: process 'や' (values=['や']), then process 'a' (same length, non-kana) → `Math.abs(1-0) <= 1` falls to else-if → `1===1`, `'や'!=='a'`, `'a'.match(kanaExtractionPattern)` true → onConvert fires.
- Result: Branch coverage improved from 83.33% (50/60) → 91.66% (55/60). All 50 tests pass (47 original + 3 new).
- Key pattern: For `removeString` to hit the else branch, `ignoreString` must be non-empty; otherwise `''.indexOf('') === 0` hits the first branch.
