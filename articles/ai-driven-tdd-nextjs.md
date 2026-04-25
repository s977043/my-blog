---
title: "Next.js App Router時代のAI-driven TDD：実践的な最小ループと具体的な実装パターン"
emoji: "🧪"
type: "tech"
topics: ["nextjs", "playwright", "tdd", "zennfes2025ai", "testing"]
published: true
---

:::message
**この記事で得られること**

- **Next.js App Router 環境での AI-driven TDD**の具体的な実装手順
- **実際に動くコード例**を通じた実践的な学習
- **AI との効果的な協働方法**とプロンプトテンプレート集
- **CI/CD 環境での自動テスト**の最小構成

**対象読者**: Next.js App Router での開発経験があり、テスト駆動開発と AI 活用に興味がある方
:::

## はじめに

**AI 時代のテスト駆動開発**は、従来の TDD とは違ったアプローチが求められます。

AI は優秀なペアプログラマーですが、**文脈の理解**と**意図の継続**に課題があります。だからこそ、テストファーストの思想がより重要になります。テストに残された意図が、AI との対話品質を決定的に左右するのです。

本記事では、**Next.js App Router**を前提とした**AI-driven TDD（AITDD）**の実践的な手法を、実際に動くコード例とともに解説します。大切なのは**小さく確実なサイクル**を回すこと。まずは 10 分で完結する最小ループから始めましょう。

---

## 1. AITDD の基本原則と最小ループ

### 1-1. Red（失敗テスト）: 意図を明確に記述する

AI との協働では、**テストが仕様書**の役割を果たします。曖昧な要求ではなく、具体的な期待値を含むテストを先に書きます。

**原則**:

- **1 機能につき 1 テスト**から開始（複雑化を避ける）
- **明確な失敗理由**を確認（実装の指針となる）
- **AI への依頼は具体的に**（対象・前提・期待値を明示）

```typescript
// ❌ 曖昧なテスト
expect(formatPrice(1000)).toBeTruthy();

// ✅ 明確なテスト
expect(formatPrice(1000)).toBe("¥1,000");
expect(formatPrice(-500)).toBe("-¥500");
```

### 1-2. Green（最小実装）: AI と協働で最短パスを見つける

テストを通すための**最小限のコード**を実装します。この段階では完璧さより速度を重視。

**原則**:

- **過度な抽象化は避ける**（YAGNI 原則の厳守）
- **ハードコードも辞さない**（リファクタで改善）
- **テスト実行で緑確認**は必須

### 1-3. Refactor（継続的改善）: 次の変更を楽にする

機能追加や修正が**楽になる**設計に整えます。AI に複数の改善案を提案してもらい、トレードオフを比較検討します。

**原則**:

- **テストは常に緑**を維持
- **1 回に 1 つの改善**（複数同時は混乱の元）
- **命名・分割・依存関係**の見直し

---

## 2. Next.js App Router 専用環境のセットアップ

**最小構成**: 実際のプロジェクトで即座に始められる設定

```jsonc
// package.json（関連部分のみ）
{
  "scripts": {
    "test": "jest --watchAll=false",
    "test:watch": "jest --watch",
    "test:e2e": "playwright test"
  },
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "@testing-library/user-event": "^14.5.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "@playwright/test": "^1.40.0"
  }
}
```

```javascript
// jest.config.js
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
};

module.exports = createJestConfig(customJestConfig);
```

```javascript
// jest.setup.js
import "@testing-library/jest-dom";
```

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

:::message alert
**App Router 特有の注意点**

- Server Components のテストは従来とは異なるアプローチが必要
- `use client` ディレクティブの有無でテスト戦略が変わる
- App Router の新しいディレクトリ構造を考慮したモジュール解決設定が重要
  :::

---

## 3. 実践例 1: ユニットテスト（formatCurrency 関数）

**ユースケース**: App Router で多言語対応 EC サイトの価格表示機能

### Step 1: Red - 失敗するテストを作成

```typescript
// __tests__/utils/formatCurrency.test.ts
import { formatCurrency } from "@/app/lib/formatCurrency";

describe("formatCurrency", () => {
  test("日本円を正しく表示する", () => {
    expect(formatCurrency(1000, "JPY", "ja")).toBe("¥1,000");
  });

  test("米ドルを正しく表示する", () => {
    expect(formatCurrency(1000, "USD", "en")).toBe("$1,000.00");
  });

  test("負の金額を正しく処理する", () => {
    expect(formatCurrency(-500, "JPY", "ja")).toBe("-¥500");
  });

  test("小数点を含む金額を適切に処理する", () => {
    expect(formatCurrency(1234.56, "USD", "en")).toBe("$1,234.56");
  });
});
```

**AI プロンプト例**:

```
Next.js App Routerで多言語ECサイトを開発中です。
以下のテスト仕様を満たす formatCurrency 関数の最小実装を提案してください。

テスト要件:
- 日本円: formatCurrency(1000, 'JPY', 'ja') → '¥1,000'
- 米ドル: formatCurrency(1000, 'USD', 'en') → '$1,000.00'
- 負数対応: formatCurrency(-500, 'JPY', 'ja') → '-¥500'

まず失敗する最小実装から始めて、その後正しい実装を提案してください。
```

### Step 2: Green - 最小実装

```typescript
// app/lib/formatCurrency.ts（最初の失敗実装）
export const formatCurrency = (
  value: number,
  currency: string,
  locale: string
): string => {
  // まず意図的に失敗させる
  return value.toString();
};
```

**テスト実行**: `npm run test formatCurrency.test.ts`

```bash
# 予想される失敗結果
FAIL __tests__/utils/formatCurrency.test.ts
✕ 日本円を正しく表示する (2 ms)
✕ 米ドルを正しく表示する (1 ms)
...
```

### Step 3: Green - 正しい最小実装

```typescript
// app/lib/formatCurrency.ts（正しい実装）
export const formatCurrency = (
  value: number,
  currency: string,
  locale: string
): string => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(value);
};
```

### Step 4: Refactor - App Router 特有の改善

```typescript
// app/lib/formatCurrency.ts（App Router最適化版）
export const formatCurrency = (
  value: number,
  currency: string,
  locale: string
): string => {
  // 入力検証の追加
  if (typeof value !== "number" || !isFinite(value)) {
    throw new Error("Invalid number value");
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(value);
};

// Client Component用の型安全なラッパー（必要に応じて）
export const formatCurrencyClient = formatCurrency;
```

:::message
**App Router 固有のポイント**

- TypeScript の型安全性を活用した入力検証
- Client/Server Components 両方で使用可能なシンプルな設計
- `Intl.NumberFormat`によるブラウザネイティブな最適化
  :::

---

## 4. 実践例 2: App Router コンポーネントテスト（SearchBox）

**ユースケース**: Next.js App Router の商品検索機能

### Step 1: Red - Client Component のテスト設計

```tsx
// __tests__/components/SearchBox.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter, useSearchParams } from "next/navigation";
import SearchBox from "@/app/components/SearchBox";

// Mock useRouter for App Router
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

const mockPush = jest.fn();
const mockReplace = jest.fn();

describe("SearchBox", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test("検索語入力から400ms後にURLが更新される", async () => {
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });

    render(<SearchBox />);

    const input = screen.getByPlaceholderText("商品を検索...");
    await user.type(input, "iPhone");

    // 400ms経過前は呼ばれない
    expect(mockReplace).not.toHaveBeenCalled();

    jest.advanceTimersByTime(400);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/search?q=iPhone");
    });
  });

  test("空文字検索は実行されない", async () => {
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });

    render(<SearchBox />);

    const input = screen.getByPlaceholderText("商品を検索...");
    await user.type(input, "   ");

    jest.advanceTimersByTime(400);

    expect(mockReplace).not.toHaveBeenCalled();
  });

  test("連続入力時は最後の値のみでURL更新される", async () => {
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });

    render(<SearchBox />);

    const input = screen.getByPlaceholderText("商品を検索...");

    await user.type(input, "iP");
    jest.advanceTimersByTime(200);

    await user.type(input, "hone");
    jest.advanceTimersByTime(400);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith("/search?q=iPhone");
    });
  });
});
```

### Step 2: Green - Client Component 実装

```tsx
// app/components/SearchBox.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface SearchBoxProps {
  placeholder?: string;
  className?: string;
}

export default function SearchBox({
  placeholder = "商品を検索...",
  className = "",
}: SearchBoxProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  // デバウンス処理
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const trimmedQuery = query.trim();
      if (trimmedQuery) {
        // URLを更新してServer Componentでの検索をトリガー
        const params = new URLSearchParams(searchParams);
        params.set("q", trimmedQuery);
        router.replace(`/search?${params.toString()}`);
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [query, router, searchParams]);

  // URL同期（App Router対応）
  useEffect(() => {
    const currentQuery = searchParams.get("q") || "";
    if (currentQuery !== query) {
      setQuery(currentQuery);
    }
  }, [searchParams]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedQuery = query.trim();
      if (trimmedQuery) {
        // URLを更新（App Router）
        const params = new URLSearchParams(searchParams);
        params.set("q", trimmedQuery);
        router.replace(`?${params.toString()}`);
      }
    },
    [query, router, searchParams]
  );

  return (
    <form onSubmit={handleSubmit} className={className}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        aria-label="検索"
      />
    </form>
  );
}
```

### Step 3: Refactor - Server Component 統合

```tsx
// app/search/page.tsx（Server Component側）
import { Suspense } from "react";
import SearchBox from "@/app/components/SearchBox";
import SearchResults from "@/app/components/SearchResults";

interface SearchPageProps {
  searchParams: { q?: string };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || "";

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">商品検索</h1>

      <SearchBox placeholder="商品を検索..." className="mb-8" />

      <Suspense fallback={<div>検索中...</div>}>
        <SearchResults query={query} />
      </Suspense>
    </div>
  );
}
```

**Server Actions 連携例**:

```tsx
// app/actions/search.ts
"use server";

export async function searchProducts(query: string) {
  // データベース検索やAPI呼び出し
  return {
    products: [
      { id: 1, name: `${query}関連商品1`, price: 1000 },
      { id: 2, name: `${query}関連商品2`, price: 2000 },
    ],
    total: 2,
  };
}

// app/components/SearchResults.tsx
import { searchProducts } from "@/app/actions/search";

interface SearchResultsProps {
  query: string;
}

export default async function SearchResults({ query }: SearchResultsProps) {
  if (!query) return <div>検索キーワードを入力してください</div>;

  const results = await searchProducts(query);

  return (
    <div data-testid="search-results">
      <p data-testid="result-count">{results.total}件の商品が見つかりました</p>
      <div className="grid gap-4">
        {results.products.map((product) => (
          <div
            key={product.id}
            data-testid="product-card"
            className="border p-4"
          >
            <h3 data-testid="product-title">{product.name}</h3>
            <p data-testid="product-price">¥{product.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

:::message
**App Router 特有のテストポイント**

- `next/navigation` のモックが必須
- Server/Client Components の境界を意識したテスト設計
- URLSearchParams との連携テスト
- Suspense との協調動作確認
  :::

---

## 5. 実践例 3: App Router E2E テスト（Playwright）

**ユースケース**: 商品検索から詳細画面への遷移フロー

### Step 1: E2E テストの設計

```typescript
// e2e/product-search.spec.ts
import { test, expect } from "@playwright/test";

test.describe("商品検索フロー", () => {
  test.beforeEach(async ({ page }) => {
    // App Routerのダイナミックルーティング対応
    await page.goto("/search");
    await expect(page).toHaveTitle(/商品検索/);
  });

  test("検索→結果表示→詳細画面遷移の一連フロー", async ({ page }) => {
    // 検索実行
    const searchInput = page.getByPlaceholder("商品を検索...");
    await searchInput.fill("iPhone");
    await searchInput.press("Enter");

    // URL更新確認（App Router）
    await expect(page).toHaveURL(/\/search\?q=iPhone/);

    // 検索結果の表示確認
    await expect(page.getByTestId("search-results")).toBeVisible();
    await expect(page.getByTestId("result-count")).toHaveText(
      /\d+件の商品が見つかりました/
    );

    // 商品カードの存在確認
    const firstProduct = page.getByTestId("product-card").first();
    await expect(firstProduct).toBeVisible();

    // 商品詳細への遷移
    await firstProduct.click();

    // 詳細ページの確認（App Routerのダイナミックルーティング）
    await expect(page).toHaveURL(/\/products\/\d+/);
    await expect(page.getByTestId("product-title")).toBeVisible();
    await expect(page.getByTestId("product-price")).toBeVisible();
  });

  test("検索結果が0件の場合の表示", async ({ page }) => {
    const searchInput = page.getByPlaceholder("商品を検索...");
    await searchInput.fill("存在しない商品XYZ123");
    await searchInput.press("Enter");

    await expect(page.getByTestId("no-results")).toBeVisible();
    await expect(page.getByTestId("no-results")).toHaveText(
      /該当する商品が見つかりませんでした/
    );
  });

  test("ページネーション機能", async ({ page }) => {
    const searchInput = page.getByPlaceholder("商品を検索...");
    await searchInput.fill("スマートフォン");
    await searchInput.press("Enter");

    // 複数ページある場合のテスト
    const paginationNext = page.getByTestId("pagination-next");
    if (await paginationNext.isVisible()) {
      await paginationNext.click();

      // URLクエリパラメータの確認
      await expect(page).toHaveURL(/page=2/);
      await expect(page.getByTestId("search-results")).toBeVisible();
    }
  });
});

test.describe("レスポンシブ対応", () => {
  test("モバイル表示での検索機能", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/search");

    const searchInput = page.getByPlaceholder("商品を検索...");
    await expect(searchInput).toBeVisible();

    await searchInput.fill("iPad");
    await searchInput.press("Enter");

    // モバイルレイアウトでの結果表示確認
    await expect(page.getByTestId("search-results")).toBeVisible();
    const productCards = page.getByTestId("product-card");

    // モバイルでは縦並び表示
    const firstCard = productCards.first();
    const secondCard = productCards.nth(1);

    if (await secondCard.isVisible()) {
      const firstBox = await firstCard.boundingBox();
      const secondBox = await secondCard.boundingBox();

      // Y座標を比較して縦並びを確認
      expect(secondBox?.y).toBeGreaterThan(firstBox?.y || 0);
    }
  });
});
```

### Step 2: App Router 対応の Page Object パターン

```typescript
// e2e/pages/SearchPage.ts
import { Page, Locator, expect } from "@playwright/test";

export class SearchPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly searchResults: Locator;
  readonly resultCount: Locator;
  readonly noResults: Locator;
  readonly productCards: Locator;
  readonly pagination: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByPlaceholder("商品を検索...");
    this.searchResults = page.getByTestId("search-results");
    this.resultCount = page.getByTestId("result-count");
    this.noResults = page.getByTestId("no-results");
    this.productCards = page.getByTestId("product-card");
    this.pagination = page.getByTestId("pagination");
  }

  async goto() {
    await this.page.goto("/search");
    await expect(this.page).toHaveTitle(/商品検索/);
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.searchInput.press("Enter");

    // App RouterのURL更新を待機
    await expect(this.page).toHaveURL(
      new RegExp(`q=${encodeURIComponent(query)}`)
    );
  }

  async expectResultsVisible() {
    await expect(this.searchResults).toBeVisible();
  }

  async expectResultCount(pattern: RegExp) {
    await expect(this.resultCount).toHaveText(pattern);
  }

  async expectNoResults() {
    await expect(this.noResults).toBeVisible();
  }

  async clickFirstProduct() {
    await this.productCards.first().click();
  }

  async goToPage(pageNumber: number) {
    await this.page.getByTestId(`pagination-page-${pageNumber}`).click();
    await expect(this.page).toHaveURL(new RegExp(`page=${pageNumber}`));
  }
}
```

### Step 3: CI/CD 環境での安定実行

```typescript
// playwright.config.ts（CI最適化版）
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 1, // CI環境では多めにリトライ
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? "github" : "html",

  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    // App Routerでのナビゲーション待機時間
    navigationTimeout: 30000,
    actionTimeout: 15000,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],

  webServer: {
    command: process.env.CI ? "npm run build && npm start" : "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: process.env.CI ? 120000 : 60000,
  },
});
```

:::message
**App Router E2E テストの重要ポイント**

- **ダイナミックルーティング**の URL 検証
- **Server/Client Components**の描画タイミング
- **Suspense 境界**での読み込み状態管理
- **モバイルファースト**のレスポンシブテスト
  :::

---

## 6. AI との効果的な協働: 実践的プロンプトテンプレート集

### 6-1. ユニットテスト生成プロンプト

:::details ユニットテスト生成プロンプト（クリックで展開）
```plaintext
## 役割
Next.js App Router + TypeScript専門のTDDアシスタント

## 依頼内容
以下の関数仕様に対する完全なテストスイートを作成してください。

### 対象関数
`app/lib/formatCurrency.ts` の formatCurrency 関数

### 仕様
- 入力: (value: number, currency: 'JPY'|'USD', locale: 'ja'|'en')
- 出力: ロケールに応じた通貨表示文字列
- 例: formatCurrency(1000, 'JPY', 'ja') → '¥1,000'

### 出力要件
1. **テストファイル全文**（Jest + @testing-library）
2. **最初に失敗する実装**（1-2行のコメント付き）
3. **テストを通す最小実装**
4. **エッジケース提案**（3つまで）
5. **App Router固有の考慮点**があれば1行で

### 制約
- TypeScript strict mode対応
- 1テストケース = 1つのexpect
- モック使用は最小限
```
:::

### 6-2. Client Component テスト生成プロンプト

:::details Client Component テスト生成プロンプト（クリックで展開）
```plaintext
## 役割
React Testing Library + App Router専門のコンポーネントテスト設計者

## 対象コンポーネント
`'use client'` ディレクティブ付きの SearchBox コンポーネント

### 要件
- 機能: 400msデバウンス、空文字除外、Enter送信対応
- App Router: useRouter, useSearchParams使用
- URL統合: 検索クエリをURLパラメータとして管理

### 出力要件
1. **完全なテストファイル**（setup/teardown含む）
2. **Next.js 14 App Router対応のモック設定**
3. **非同期処理（デバウンス）の安定したテスト手法**
4. **アクセシビリティテスト**（aria-label等）
5. **URL更新の検証**方法

### 重視ポイント
- useFakeTimers の適切な使用
- userEvent の最新API活用
- App Routerフック対応
- useRouter.replace の呼び出し検証
```
:::

### 6-3. E2E シナリオ生成プロンプト

:::details E2E シナリオ生成プロンプト（クリックで展開）
```plaintext
## 役割
Playwright + Next.js App Router専門のE2Eテスト設計者

## シナリオ要求
商品検索アプリケーションの主要フローテスト

### 対象フロー
1. `/search` ページでの検索実行
2. 結果表示とページネーション
3. 商品詳細画面 `/products/[id]` への遷移
4. モバイル表示での動作確認

### 出力要件
1. **メインシナリオテスト**（成功パス）
2. **異常系テスト**（0件検索、エラー処理）
3. **Page Objectパターン**の基本実装
4. **CI環境対応設定**（リトライ、タイムアウト）
5. **App Router特有の注意点**（ダイナミックルーティング等）

### 制約条件
- data-testid ベースのセレクタ
- レスポンシブ対応必須
- 実行時間5分以内
```
:::

### 6-4. リファクタリング相談プロンプト

:::details リファクタリング相談プロンプト（クリックで展開）
```plaintext
## 役割
Next.js App Router + Clean Architecture専門のリファクタリングアドバイザー

## 現在のコード
[対象コードを貼り付け]

## リファクタリング要求
以下の観点で改善提案をお願いします：

### 評価軸
1. **App Router最適化**（Server/Client Components分離）
2. **型安全性向上**（TypeScript活用）
3. **テスタビリティ**（依存注入、モック容易性）
4. **パフォーマンス**（バンドルサイズ、レンダリング最適化）

### 出力形式
各改善案について：
- **変更内容**（1-2行要約）
- **メリット/デメリット**（トレードオフ明記）
- **実装優先度**（High/Medium/Low）
- **影響範囲**（テスト修正の有無）

### 制約
- 既存テストは全て通ること
- 1回の変更で1つの改善のみ
- App Routerの思想に沿った提案
```
:::

### 6-5. デバッグ支援プロンプト

:::details デバッグ支援プロンプト（クリックで展開）
```plaintext
## 役割
Next.js App Routerのテスト失敗分析専門家

## 状況
以下のテストが失敗しています：

### 失敗テスト
[テストコードと実行結果を貼り付け]

### 実装コード
[関連する実装コードを貼り付け]

### 分析依頼
1. **失敗原因の特定**（根本原因分析）
2. **App Router固有の問題**があるか確認
3. **最小修正案**（テストまたは実装）
4. **類似問題の予防策**（1-2行）

### 出力要件
- 修正箇所の明確な特定
- Before/After の差分表示
- 他のテストへの影響確認
- デバッグ手法のTips

### 注意点
- 過度なコード変更は避ける
- App Routerの制約を考慮
- TypeScript型エラーも確認
```
:::

:::message
**AI プロンプト設計のコツ**

- **役割定義**で専門性を明確化
- **出力要件**を具体的に指定
- **制約条件**でスコープを限定
- **App Router 固有の観点**を必ず含める
  :::

---

## 7. App Router 対応 CI/CD: GitHub Actions 実装例

### 7-1. 完全なワークフロー設定

:::details CI/CD ワークフロー全文（クリックで展開）
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline for Next.js App Router

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: "20"
  NEXT_TELEMETRY_DISABLED: 1

jobs:
  setup:
    runs-on: ubuntu-latest
    outputs:
      cache-key: ${{ steps.cache-keys.outputs.cache-key }}
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - id: cache-keys
        run: echo "cache-key=node-modules-${{ hashFiles('package-lock.json') }}" >> $GITHUB_OUTPUT

      - name: Install dependencies
        run: npm ci --prefer-offline --no-audit

  lint-and-type-check:
    needs: setup
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci --prefer-offline --no-audit

      - name: Run ESLint
        run: npm run lint

      - name: TypeScript type check
        run: npm run type-check

      - name: Check Next.js build
        run: npm run build

      - name: Upload Next.js build artifact
        uses: actions/upload-artifact@v3
        with:
          name: next-build
          path: .next
          retention-days: 1

  unit-and-component-tests:
    needs: setup
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci --prefer-offline --no-audit

      - name: Run unit and component tests
        run: npm run test -- --coverage --passWithNoTests
        env:
          CI: true

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: false

  e2e-tests:
    needs: setup
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request' || github.ref == 'refs/heads/main'
    strategy:
      matrix:
        browser: [chromium, firefox]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"
      - name: Install dependencies
        run: npm ci --prefer-offline --no-audit
      - name: Install Playwright browsers
        run: npx playwright install --with-deps ${{ matrix.browser }}
      - name: Download Next.js build artifact
        uses: actions/download-artifact@v3
        with:
          name: next-build
          path: .next
      - name: Run E2E tests
        run: npx playwright test --project=${{ matrix.browser }}
        env:
          CI: true
      - name: Upload Playwright report
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report-${{ matrix.browser }}
          path: playwright-report/
          retention-days: 7

  visual-regression:
    needs: setup
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci --prefer-offline --no-audit

      - name: Install Playwright
        run: npx playwright install chromium

      - name: Build application
        run: npm run build

      - name: Run visual regression tests
        run: npx playwright test visual/ --project=chromium

      - name: Upload visual diff artifacts
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: visual-regression-diffs
          path: test-results/
          retention-days: 7

  deploy-preview:
    needs: [lint-and-type-check, unit-and-component-tests]
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci --prefer-offline --no-audit

      - name: Build for preview
        run: npm run build
        env:
          NEXT_PUBLIC_ENVIRONMENT: preview

      - name: Deploy to Vercel Preview
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          scope: ${{ secrets.VERCEL_ORG_ID }}
```
:::

### 7-2. パッケージ.json スクリプト設定

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint --max-warnings 0",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:visual": "playwright test visual/",
    "prepare": "husky install"
  }
}
```

### 7-3. 品質ゲート設定（Husky + lint-staged）

```jsonc
// package.json（追加設定）
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml,yaml}": ["prettier --write"],
    "*.{ts,tsx}": ["bash -c 'npm run type-check'"]
  }
}
```

```bash
#!/bin/sh
# .husky/pre-commit
. "$(dirname "$0")/_/husky.sh"

# 型チェック
npm run type-check

# リント・フォーマット
npx lint-staged

# 変更されたファイルに関連するテストを実行
CHANGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$' | tr '\n' ' ')
if [ -n "$CHANGED_FILES" ]; then
  npm run test -- --bail --findRelatedTests $CHANGED_FILES
fi
```

### 7-4. モニタリング・アラート設定

```yaml
# .github/workflows/performance-monitoring.yml
name: Performance Monitoring

on:
  schedule:
    - cron: "0 2 * * *" # 毎日午前2時実行
  workflow_dispatch:

jobs:
  lighthouse-ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli@0.12.x
          lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}

      - name: Comment PR with Lighthouse results
        if: github.event_name == 'pull_request'
        uses: foo-software/lighthouse-check-action@master
        with:
          accessToken: ${{ secrets.GITHUB_TOKEN }}
          gitHubApiUrl: https://api.github.com
          urls: "https://your-preview-url.vercel.app"
```

:::message
**CI/CD 最適化のポイント**

- **並列実行**でビルド時間短縮
- **キャッシュ戦略**で依存関係インストール高速化
- **段階的デプロイ**でリスク軽減
- **自動品質チェック**で手動レビュー負荷削減
  :::

---

## 8. よくあるつまずき

| つまずき | 対処 |
|---|---|
| **AI が先に実装を書き始める** | プロンプトで「まずテスト。実装は赤確認の後」と明記 |
| **巨大な一括差分** | 1 テスト = 1 変更。PR は ±300 行以内を目安に |
| **E2E が不安定** | `data-testid` を固定、遷移待ちは `expect` 側で吸収、`retry` を併用 |
| **”正しさ”が曖昧** | 期待値を **具体例** で渡す（入出力を 2〜3 個） |

---

## おわりに

AI を“使う”だけでなく、**育てる**。
テストとプロンプトは、そのための型だ。

- **今日やる 3 手**
  1. 10〜30 分で終わる小粒な機能を選ぶ
  2. テストを 1 本だけ書き、まず **赤** を出す
  3. 緑に通し、軽いリファクタを 1 つ

あとは繰り返し。ループが小さいほど、速くなる。

---

## 参考リンク

- Jest（公式）: https://jestjs.io/
- Testing Library（公式）: https://testing-library.com/docs/
- Playwright（公式）: https://playwright.dev/
- GitHub Actions（公式）: https://docs.github.com/actions

## 自社メディア

:::message
- [Growth Lab](https://the3396.com/) - AIエージェント開発、SEO最適化、仕様駆動開発の検証ログを、代表記事からすぐ読み進められる形で整理しています。
:::

## 関連記事

:::message
- [仕様を揃えて止めない：マルチエージェント開発の3原則（SDD・TDD・ノンブロッキング）](https://zenn.dev/minewo/articles/sdd-tdd-nonblocking-agent) - AI-driven TDD を支える仕様駆動と非ブロッキング運用の土台です。
- [アジャイルでAI駆動開発をどう回すか: PlanGateの考え方とテンプレート](https://zenn.dev/minewo/articles/plangate-ai-coding-workflow) - テスト前に計画と受入基準を固めるAI開発フローです。
- [GitHubにAI開発チームメイトを迎えよう — Gemini CLIでレビュー時間を1/3に短縮する方法](https://zenn.dev/minewo/articles/gemini-cli-github-actions-zenn-article) - CI、レビュー、品質チェックを自動化する実践例です。
:::
