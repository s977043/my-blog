# articles/open-design-design-quality.md 品質検証レポート

検証日: 2026-05-20
対象: `articles/open-design-design-quality.md`
判定: **READY（公開前の追加修正なしでよい）**
スコア: **91 / 100**

## 実施した検証

### 1. 機械検証

実行コマンド:

```bash
npm run check
```

結果:

- `zenn list:articles`: OK。対象記事 `open-design-design-quality` を認識
- `zenn list:books`: OK
- `qiita version`: OK
- `check:note-ref`: OK
- `check:note-images`: OK
- `check:qiita-publish-hygiene`: OK
- `check:doc-freshness`: OK
- `check:zenn-title`: OK。全30記事が70文字以内
- `check:fm-title`: OK。全44記事のtitleがYAML安全
- `check:note-tables`: WARN。ただし対象外の `articles_note/new/*` 2ファイルに関するnote取り込み警告で、対象Zenn記事には影響なし

### 2. リンク到達性

`curl -I` で参考リンクの到達性を確認した。

| URL | 結果 |
| --- | --- |
| `https://the3396.com/articles` | 200 OK |
| `https://the3396.com/design-system` | 200 OK |
| `https://zenn.dev/minewo/articles/penpot-react-design-system-contract` | 200 OK |
| `https://zenn.dev/minewo/articles/design-md-guide-and-adoption-log` | 200 OK |

### 3. 技術的正確性

公式情報に照らして確認した。

- Penpotはopen-sourceで、ブラウザ利用またはself-hostingが可能
- PenpotはSVG / CSS / HTML / JSONなどのopen standardsに言及している
- PenpotのDesign TokensはW3C DTCGのDesign Tokens Format Moduleに準拠する説明がある
- PenpotのInspect modeはSVG / CSS / HTML codeへのアクセスを提供する

記事本文の主張「Open DesignはSVG差分、token往復、AI可読性、レビュー非依存性に効く」は、Penpot公式README / Penpot Design Tokens公式ドキュメントの範囲と矛盾しない。

## 品質観点レビュー

### Structure & Flow

- 冒頭 `:::message` で前2記事との関係、この記事の焦点、想定読者が明確
- TL;DRは3点に絞られており、記事の結論が先に分かる
- 1章で「デザイン品質」を再現性・一貫性・レビュー可能性に定義してから、3章でOpen Designの効き方へ接続している
- 3-1〜3-4の各節に「要点」行があり、流し読みでも中核主張が追える
- 4章で前作・ガイドとの接続を図示し、続編単体でも最低限の文脈を補っている

### Technical Accuracy

- `pnpm penpot:push` / `pnpm penpot:sync` / `pnpm penpot:verify` は自作コマンドとして明示され、一般的なPenpot標準コマンドのようには書かれていない
- `W3C / Design Tokens Community Group形式` という表現は、Penpot公式のDesign Tokens説明と整合する
- 「定量効果はまだ十分に蓄積していない」と明記され、効果を過大に断定していない
- 「Penpot専用ではない」と明示され、Open Designを特定製品の宣伝に寄せすぎていない

### Style & Tone

- Zenn向けに技術判断と運用設計の話へ寄せられており、媒体方針「体系化された技術知識」と整合する
- 見た目の美しさではなく品質構造を扱う、という主張が全体で一貫している
- 参考リンクは末尾にまとまり、クロスプラットフォーム参照ルールにも反していない
- 表・コードブロック・detailsの使い方は過剰ではない

### SEO & Metadata

- titleは70文字以内で、`Open Design` / `デザイン品質` / `Penpot` / `DESIGN.md` を含む
- topicsは5件以内で、`designsystem`, `penpot`, `opendesign`, `ai`, `frontend` と記事内容に対応している
- `published: false` のため、公開前下書き状態として適切
- 画像は `images/open-design-design-quality/open-design-quality-flow.png` を1点使用。alt textは本文内容に対応している

## 残る軽微リスク

- `Open Design` という語が一般概念としても、特定ツール/潮流としても読めるため、読者によっては `nexu-io/open-design` との混同余地がある。ただし2章で「ここでいうOpen Design」を定義しているため、公開阻害ではない。
- `pnpm penpot:*` コマンドはGrowth Lab固有の運用に依存する。本文で自作コマンドと補足済みだが、前作未読者には詳細までは分からない。続編記事として許容範囲。

## 最終判断

公開前品質ゲートとしては **READY**。

追加修正を行うなら、優先度は低いが次の1点のみ:

- 2章またはまとめに「本記事のOpen Designは一般概念として扱う。nexu-io/open-design等の特定実装の導入ログではない」と1文足すと、用語の混同リスクをさらに下げられる。
