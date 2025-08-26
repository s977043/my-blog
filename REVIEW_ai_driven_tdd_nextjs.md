# articles/ai-driven-tdd-nextjs.mdの記事レビュー

## 🚩 レビュー方針
親ISSUE #11のレビュー観点に基づき、「Next.js App Router時代のAI-driven TDD：実践的な最小ループと具体的な実装パターン」記事のレビューを実施しました。特に「記事中にあるコードの確認を重視」の指示に従い、技術的正確性を中心に以下の3つの観点から確認し、気付いた点を指摘コメントとして残します。

---

## チェック結果と観点

| 観点 | 担当者 | チェック項目 | 状況 |
| ---- | ------ | ------------ | ---- |
| **Webディレクター視点** | @copilot | - 記事構成・読みやすさ<br>- 対象読者との整合性<br>- SEO最適化 | - [x] 済 |
| **Web編集者視点** | @copilot | - 誤字脱字・表現統一<br>- 文章の明確性<br>- 重複表現の確認 | - [x] 済 |
| **Webエンジニア視点** | @copilot | - コード例の技術的正確性<br>- 実装可能性<br>- App Router固有の実装パターン | - [x] 済 |

### 共通チェックリスト
- [x] 見出し階層が正しい（h2-h3-h4の適切な使用）
- [x] 表に長文が入っていない
- [x] 画像パスが Zenn Preview で解決する（画像なし）
- [x] 公式リンクはクリック可能（Markdown link）
- [x] コードブロックの言語指定が適切
- [x] メッセージボックス（:::message）の適切な使用

---

## 指摘コメント

### 該当箇所 1
L463-L466 （SearchBoxコンポーネントのServer Component実装）

```tsx
onSearch={(query) => {
  // Client側からのクエリ更新
  window.location.href = `/search?q=${encodeURIComponent(query)}`
}}
```

### 問題点
Server ComponentからClient Componentに渡すpropsで、Client側でのナビゲーション処理が古い手法（`window.location.href`）を使用している。App Routerでは`useRouter`の使用が推奨される。

### 提案
```tsx
// SearchBox内でのナビゲーション処理に統一
onSearch={(query) => {
  // SearchBox内部のhandleSubmitロジックに委ねる
  // 外部からのナビゲーション指示は避ける
}}
```

または、より App Router らしいアプローチとして：
```tsx
// app/search/page.tsx
'use client'
import { useRouter } from 'next/navigation'

export default function SearchPage({ searchParams }: SearchPageProps) {
  const router = useRouter()
  
  const handleSearch = (query: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('q', query)
    router.replace(`/search?${params.toString()}`)
  }
  // ...
}
```

---

### 該当箇所 2
L404-L409 （SearchBoxコンポーネントのURL同期処理）

```tsx
// URL同期（App Router対応）
useEffect(() => {
  const currentQuery = searchParams.get('q') || ''
  if (currentQuery !== query) {
    setQuery(currentQuery)
  }
}, [searchParams])
```

### 問題点
`query`が依存配列に含まれていないため、無限ループの可能性がある。また、`useSearchParams`の変更に対する同期処理で、初期化時の競合状態が発生する可能性がある。

### 提案
```tsx
// URL同期（App Router対応）
useEffect(() => {
  const currentQuery = searchParams.get('q') || ''
  setQuery(currentQuery)
}, [searchParams]) // queryを依存配列から除外

// または、より安全な実装
useEffect(() => {
  const currentQuery = searchParams.get('q') || ''
  if (currentQuery !== query.trim()) {
    setQuery(currentQuery)
  }
}, [searchParams, query])
```

---

### 該当箇所 3
L684-L688 （Playwright設定のwebServer設定）

```typescript
webServer: {
  command: 'npm run build && npm start',
  url: 'http://localhost:3000',
  reuseExistingServer: !process.env.CI,
  timeout: 120000,
},
```

### 問題点
`npm run build && npm start`は本番ビルドでのテスト実行となり、開発時のテストサイクルが遅くなる。また、開発環境でのテストとの差異が生じる可能性がある。

### 提案
```typescript
webServer: {
  command: process.env.CI ? 'npm run build && npm start' : 'npm run dev',
  url: 'http://localhost:3000',
  reuseExistingServer: !process.env.CI,
  timeout: process.env.CI ? 120000 : 60000,
},
```

---

### 該当箇所 4
L238-L255 （formatCurrency関数のApp Router最適化版）

```typescript
import { cache } from 'react'

// Server Componentsでのキャッシュ活用
export const formatCurrency = cache((
  value: number, 
  currency: string, 
  locale: string
): string => {
```

### 問題点
`cache()`の使用方法が不適切。`cache`は主にデータフェッチ関数で使用されるものであり、単純な計算関数には過度な最適化となる。また、`Intl.NumberFormat`は既にブラウザ側でキャッシュされる。

### 提案
```typescript
// シンプルな実装で十分
export const formatCurrency = (
  value: number, 
  currency: string, 
  locale: string
): string => {
  if (typeof value !== 'number' || !isFinite(value)) {
    throw new Error('Invalid number value')
  }
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(value)
}
```

---

### 該当箇所 5
L452-L456 （Server Actions使用例）

```tsx
const handleSearch = async (searchQuery: string) => {
  'use server'
  // Server Actionsでの検索処理
  // この部分は別途実装
}
```

### 問題点
Server Actionsの使用例が不完全で、実際の実装イメージが湧かない。また、この関数がServer Component内で定義されているが、実際にはどこからも呼び出されていない。

### 提案
```tsx
// app/actions/search.ts（別ファイルで定義）
'use server'

export async function searchProducts(query: string) {
  // 実際の検索処理
  const products = await db.products.findMany({
    where: {
      name: {
        contains: query,
        mode: 'insensitive',
      },
    },
    take: 20,
  })
  
  return products
}

// app/search/page.tsx
import { searchProducts } from '@/app/actions/search'

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || ''
  const products = query ? await searchProducts(query) : []
  // ...
}
```

---

### 該当箇所 6
L1094 （pre-commitフックのテスト実行）

```bash
npm run test -- --bail --findRelatedTests $(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$' | tr '\n' ' ')
```

### 問題点
関連テストの実行コマンドが複雑で、ファイルが存在しない場合やテストファイルが見つからない場合のエラーハンドリングがない。

### 提案
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

---

### 該当箇所 7
L102-L107 （jest.config.jsのモジュール解決設定）

```javascript
moduleNameMapping: {
  '^@/(.*)$': '<rootDir>/$1',
},
```

### 問題点
設定項目名が間違っている。正しくは`moduleNameMapping`ではなく`moduleNameMapper`。

### 提案
```javascript
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}
```

---

### 該当箇所 8
L6 （フロントマター設定）

```yaml
published: false
```

### 問題点
記事のpublished状態がfalseのままになっている。レビュー完了後の公開準備として、published状態の確認が必要。

### 提案
レビュー・修正完了後は以下に変更：
```yaml
published: true
```

---

## 総合評価

### 良い点
- **体系的な構成**: TDDの基本原則からApp Router固有の実装まで段階的に解説
- **実践的なコード例**: 実際のプロジェクトで使用できる具体的な実装パターン
- **AIプロンプトテンプレート**: 実用的なプロンプト集で即座に活用可能
- **CI/CD統合**: GitHub Actionsを含めた包括的な開発環境構築
- **App Router対応**: Next.js 14の最新機能を適切に活用

### 改善点
- **コード例の一部修正**: 技術的正確性の向上
- **実装例の完全性**: 不完全なコード例の補完
- **設定ファイルの正確性**: 設定項目名や構文の修正
- **ベストプラクティスの反映**: より App Router らしい実装パターンの採用

### 推奨アクション
1. **技術的修正**: 指摘箇所のコード修正
2. **実装例の完全化**: Server Actions等の具体的な実装例追加
3. **設定ファイル検証**: 実際に動作することの確認
4. **公開準備**: published: true への変更

### SEO観点での改善提案
- **タイトル最適化**: 「Next.js 14」「2024年版」等の年次情報追加検討
- **メタディスクリプション**: 記事の要約を150文字程度で追加
- **内部リンク**: 関連する他の技術記事へのリンク追加
- **目次の詳細化**: 検索性向上のための小見出し追加

---

*レビュー実施者: @copilot*  
*レビュー実施日: 2025-08-26*