---
title: "AI-driven TDD × Next.js：小さく速く回す赤→緑→整えるの最小ループ"
emoji: "🧭"
type: "tech"
topics: ["Next.js", "TypeScript", "Jest", "Playwright", "TDD", "AI"]
published: false
---

:::message
**あらすじ**

- まず **Red**（失敗するテスト）。次に **Green**（最小実装）。最後に **Refactor**。  
- AI は「テスト雛形」「意図の要約」「実装候補」を出す係。**人が境界を決める**。  
- 本稿は **Next.js / TypeScript** 前提で、**Jest + Testing Library + Playwright** を軸に最小ループだけに絞る。
:::

## はじめに

AI は賢い。けれど、文脈は薄れやすい。  
意図をテストに残し、変更を小さく刻む。すると、会話も差分も穏やかになる。

ここでは **AI-driven TDD（AITDD）** を Next.js で回すための一式を最小構成でまとめる。  
大事なことはひとつ。**テストが先、実装は最小、リファクタは緑のまま。**

---

## 1. AITDD の最小ループ

### 1-1. Red（テスト先行）
- 1 機能に絞って **テストを 1 本** 書く（ユニット or コンポーネント）。  
- まず **落ちること** を確認する。失敗理由が記事化できるくらい明確だとよい。  
- AI へ依頼する時は、**対象・前提・期待値** を短く渡す。

### 1-2. Green（最小実装）
- テストを通すための **最小限の差分** のみ。  
- 余計な抽象化はしない。最適化もしない。  
- もう一度流して、**緑** を確認。

### 1-3. Refactor（整える）
- 命名、分割、依存の位置。**次の変更が楽** になるように。  
- テストは常に緑のまま。  
- 迷ったら AI に代替案とトレードオフを 2〜3 行で出させる。

---

## 2. Next.js 前提（最小の土台）

- App Router / React 18 / TypeScript  
- テスト：**Jest + @testing-library/react**（ユニット＆コンポーネント）  
- E2E：**Playwright**（任意）  
- CI：GitHub Actions など（後述のジョブ例）

> この記事は **手元の既存プロジェクトで実施** を想定。リポジトリ取得の手順は載せません。

---

## 3. ユニットテストの型（formatPrice の例）

**仕様**  
- 入力：`number`  
- 出力：`"¥1,234"` のような JPY 表記（負数は `-¥...`）

**テスト例（Jest + RTL）**
```ts
// __tests__/formatPrice.test.ts
import { formatPrice } from '@/utils/formatPrice';

describe('formatPrice', () => {
  test('正の数をJPY表記に整形する', () => {
    expect(formatPrice(1234)).toBe('¥1,234');
  });

  test('負の数は先頭にマイナスを付ける', () => {
    expect(formatPrice(-50)).toBe('-¥50');
  });
});
```

**（まずは落とす）最小実装の雛形**
```ts
// utils/formatPrice.ts
export const formatPrice = (value: number) => {
  // あえて未実装 or バグ実装でスタート
  return String(value);
};
```

> ここで一度テストを流し、**赤** を確認してから通す。  
> 通したら、命名や責務の分割など **軽いリファクタ** を 1 つだけ。

---

## 4. コンポーネントテストの型（SearchBox の例）

**要件**
- placeholder: `"Search…"`  
- 入力 → **400ms** 後に `onSearch` が 1 回呼ばれる  
- 空文字は呼ばれない

**テスト例（Jest + RTL）**
```tsx
// __tests__/SearchBox.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBox from '@/components/SearchBox';

jest.useFakeTimers();

test('入力から400ms後にonSearchが呼ばれる（空文字は呼ばれない）', async () => {
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  const onSearch = jest.fn();
  render(<SearchBox onSearch={onSearch} />);

  const input = screen.getByPlaceholderText('Search…');

  await user.type(input, 'nextjs');
  jest.advanceTimersByTime(400);
  expect(onSearch).toHaveBeenCalledWith('nextjs');

  // 空文字
  await user.clear(input);
  jest.advanceTimersByTime(400);
  expect(onSearch).toHaveBeenCalledTimes(1);
});
```

> デバウンスはテストで時間を進めるのが安定。`useFakeTimers` を忘れない。

---

## 5. E2E を足すなら（任意・最低限）

**例：/products の検索で件数が更新される**
```ts
// e2e/products.spec.ts
import { test, expect } from '@playwright/test';

test('/products で検索すると件数が更新される', async ({ page }) => {
  await page.goto('/products');
  await page.getByPlaceholder('Search…').fill('shirt');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('result-count')).toHaveText(/^\d+ 件$/);
});
```

> 安定化のコツ：`data-testid` を固定、遷移待ちは `expect` で吸収、`test.retry(2)` も検討。

---

## 6. AI への依頼テンプレ（雛形だけ）

**ユニット（テスト→最小実装）**
```
役割: Next.js/TS の TDD 支援
目的: 指定関数のテストを 1 本作り、まず失敗させたい。次に最小実装を提案してほしい。

対象: utils/formatPrice.ts
要件:
- 入力 number → "¥1,234" 形式で出力
- 負数は "-¥..." とする

出力:
1) テストファイル全文（Jest + RTL）
2) なぜ失敗するか（1〜2行）
3) 通すための最小実装の差分
4) 次に書くテスト候補（1行×3）
```

**コンポーネント（debounce）**
```
役割: React コンポーネントのテスト設計者
対象: <SearchBox />
要件:
- placeholder "Search…"
- 入力→400ms後に onSearch 1 回（空文字は呼ばれない）

出力:
1) RTLテスト全文
2) fakeTimers を使った安定化のポイントを1行
```

**E2E（任意）**
```
役割: Playwright の設計者
対象: /products 検索 → 件数表示
出力:
1) e2eテスト全文
2) 安定化（selector/data-testid/retry）の工夫を2行
```

---

## 7. CI の最小ジョブ（例）

```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:
    branches: [ main ]
  push:
    branches: [ main ]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - run: pnpm install --frozen-lockfile
      - name: Unit / Component
        run: pnpm jest --runInBand
      - name: E2E (optional)
        run: |
          npx playwright install --with-deps
          pnpm exec playwright test
```

> E2E は PR ラベルで分岐するのも手（重いときはオプション化）。

---

## 8. よくあるつまずき

- **AI が先に実装を書き始める**  
  → プロンプトで「まずテスト。実装は赤確認の後」と明記。

- **巨大な一括差分**  
  → 1 テスト = 1 変更。PR は ±300 行以内を目安に。

- **E2E が不安定**  
  → `data-testid` を固定、遷移待ちは `expect` 側で吸収、`retry` を併用。

- **“正しさ”が曖昧**  
  → 期待値を **具体例** で渡す（入出力を 2〜3 個）。

---

## おわりに

AI を“使う”だけでなく、**育てる**。  
テストとプロンプトは、そのための型だ。

- **今日やる 3 手**  
  1) 10〜30 分で終わる小粒な機能を選ぶ  
  2) テストを 1 本だけ書き、まず **赤** を出す  
  3) 緑に通し、軽いリファクタを 1 つ

あとは繰り返し。ループが小さいほど、速くなる。  

---

## 参考リンク

- Jest（公式）: https://jestjs.io/
- Testing Library（公式）: https://testing-library.com/docs/
- Playwright（公式）: https://playwright.dev/
- GitHub Actions（公式）: https://docs.github.com/actions
