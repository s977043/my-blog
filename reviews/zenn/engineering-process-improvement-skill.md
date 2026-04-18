# articles/engineering-process-improvement-skill.mdの記事レビュー

## 🚩 レビュー方針

親ISSUE #11のレビュー観点（誤字脱字／用語誤用／文章わかりやすさ／内容重複／Web記事として読みやすい構成／技術記載の正確性／読者ニーズ充足／SEO改善）に基づき、「開発セッション直後の振り返りをPRに変える — engineering-process-improvement スキルの運用と行動変容」記事のレビューを実施しました。本記事は「運用スキルの紹介」と「行動変容の体験談」を兼ねるため、読者が再現行動に落とせるか（手順の完全性・コマンド例の妥当性）と、note記事（概念寄り）とのペア展開における Zenn 記事としての具体性を重視して確認しました。著者の既出記事（`ai-dev-guardrail-plangate-river-reviewer.md` / `ai-legible-repository-design.md`）で用いられている導入ブロック（`:::message`）や TL;DR 構成との一貫性も観点に加えています。

---

## チェック結果と観点

| 観点 | 担当者 | チェック項目 | 状況 |
| ---- | ------ | ------------ | ---- |
| **Webディレクター視点** | @claude | - タイトル訴求力・SEOキーワード<br>- 目次設計・想定読者の明確さ<br>- 導入文のフック | - [x] 済 |
| **Web編集者視点** | @claude | - 誤字脱字・表現統一<br>- 冗長箇所・トーン<br>- Zenn表現規約（Front Matter / 言語指定 / リンク） | - [x] 済 |
| **Webエンジニア視点** | @claude | - コマンド/スクリプトの実行可能性<br>- Claude Code固有仕様（user-level skill 等）の正確性<br>- 他記事との重複感・再現手順の完全性 | - [x] 済 |

### 共通チェックリスト
- [x] 見出し階層が正しい（h2-h3-h4 の逸脱なし）
- [x] 表に長文が入っていない
- [x] 画像パスが Zenn Preview で解決する（画像なし）
- [x] 公式リンクはクリック可能（※後述: 関連記事・リポジトリへの外部リンクが不足）
- [x] コードブロックの言語指定が適切（一部 Carry-over のプレーン fence は要検討）
- [x] メッセージボックス（:::message）の適切な使用（※本記事は未使用、後述）

---

## 指摘コメント

### 該当箇所 1
L1-L7 （Front Matter と導入設計）

```yaml
---
title: "開発セッション直後の振り返りをPRに変える — engineering-process-improvement スキルの運用と行動変容"
emoji: "🔧"
type: "tech"
topics: ["claudecode", "ai駆動開発", "github", "レトロスペクティブ", "プロセス改善"]
published: false
---
```

### 問題点
著者の既出記事（`ai-dev-guardrail-plangate-river-reviewer.md` L9-L19、`ai-legible-repository-design.md` L9-L11）では冒頭に `:::message` ブロックで「この記事で得られること」「元ネタ（Growth Lab 等）の出典」を明示するパターンが定着している。本記事にはその導入ブロックが無く、同一著者の他記事から流入した読者に対して体験の一貫性が欠ける。また、note 記事（概念寄り）とのペア展開という背景があるが、その対応関係が本文で明示されていないため、読者が「このZenn記事はどちらを先に読むべきか」を判断できない。

### 提案
L7 直後に既出記事と揃った導入ブロックを追加する。

```markdown
---
title: "開発セッション直後の振り返りをPRに変える — engineering-process-improvement スキルの運用と行動変容"
emoji: "🔧"
type: "tech"
topics: ["claudecode", "ai駆動開発", "github", "レトロスペクティブ", "プロセス改善"]
published: false
---

:::message
**この記事で得られること**

- `engineering-process-improvement` スキルの 8 ステップ / 軽量モード / meta-retrospective の使い分け
- 改善を A（ドキュメント）/ B（自動ガード）/ C（ツール運用）に分類して PR に落とす運用
- 導入前後で何が変わったか（振り返りが感想で終わらなくなる仕組み）
:::

> 姉妹記事: 概念・思想寄りの解説は note版「（タイトル）」に分けています。本記事は Zenn 向けに具体的な手順・コマンド・テンプレートに寄せています。
```

**優先度: High**（著者の他記事とトーンを揃える、ペア展開を明示する、という依頼背景への直接対応）

---

### 該当箇所 2
L19-L22 （語尾・文体の混在）

```markdown
そこで入れたのが、`engineering-process-improvement` という user-level スキルです。
開発セッション直後に呼び出して、**振り返り → 改善提案 → 実装 → PR 化** まで一気通貫で進めるためのスキル。

この記事は、その実運用と、導入前後の行動変容をまとめたものです。
```

### 問題点
本記事は L11-L17 までは常体（だ・である調、「困っていた」「ブレる」「終わりがちだった」）で書かれているが、L19 以降で敬体（です・ます調、「スキルです」「まとめたものです」）に切り替わっている。その後も L35-L36（「本記事で扱うのは前者です。」敬体）と L107（「のがルールです。」敬体）、L119（「…再発させない ようにします。」敬体）、一方で L81（「リスト化します。」敬体）と L82（「ベースに取る。」常体）が隣接するなど、記事全体で常体と敬体が頻繁に入り乱れている。編集者観点では読みにくさの主要因となるため、統一方針が必要。

### 提案
著者の `ai-dev-guardrail-plangate-river-reviewer.md` は敬体ベースで統一されているため、本記事も敬体に寄せる方針を推奨する。具体例:

```markdown
（Before）
そこで入れたのが、`engineering-process-improvement` という user-level スキルです。
開発セッション直後に呼び出して、**振り返り → 改善提案 → 実装 → PR 化** まで一気通貫で進めるためのスキル。

（After）
そこで導入したのが、`engineering-process-improvement` という user-level スキルです。
開発セッション直後に呼び出し、**振り返り → 改善提案 → 実装 → PR化** までを一気通貫で進めます。
```

他にも L82「ベースに取る。」→「ベースに取ります。」、L110「前回境界以降のマージ済み PR 本文も確認する。」→「～確認します。」など、常体末尾を敬体に寄せることで読みやすさが向上する。

**優先度: High**（記事全体に散在する問題で読者体験に直結）

---

### 該当箇所 3
L32-L36 （スキル比較表と位置付けの整理）

```markdown
| スキル | スコープ | タイミング | 成果物 |
|---|---|---|---|
| `engineering-process-improvement` | 直前の開発セッション（複数PR、品質レビュー、リリース等） | セッション直後 | 改善 PR（通常 1 本） |
| `retrospective-improvement` | スプリント全体 | Sprint Retrospective | 次スプリントで試す改善実験 |

本記事で扱うのは前者です。
```

### 問題点
L235 で「engineer-skill-creator との住み分け」が初出で触れられているが、L32 の比較表には `engineer-skill-creator` が入っていない。読者は L32 の段階で「振り返り系スキルは 2 つ」と理解したうえで、L235 で突然 3 つ目が出てくる構成になる。スキル同士の関係を冒頭で俯瞰できないため、想定読者（Claude Code で複数スキルを運用している EM / テックリード）の期待に応えきれない。

### 提案
比較表に `engineer-skill-creator` も加え、役割の違いを冒頭で明示する。

```markdown
| スキル | スコープ | タイミング | 成果物 |
|---|---|---|---|
| `engineering-process-improvement` | 直前の開発セッション（複数PR、品質レビュー、リリース等） | セッション直後 | 改善 PR（通常 1 本） |
| `retrospective-improvement` | スプリント全体 | Sprint Retrospective | 次スプリントで試す改善実験 |
| `engineer-skill-creator` | スキル自体の新規作成 | 新しい運用パターンを定着させたい時 | 新スキルの SKILL.md |

本記事で扱うのは一番上の `engineering-process-improvement` です。既存スキルの改善（meta-retrospective）と、新スキル作成（engineer-skill-creator）の使い分けは後述します。
```

**優先度: Medium**

---

### 該当箇所 4
L66-L78 （Step 1 の bash スニペット）

```bash
# 前回の振り返り PR を特定
PREV=$(gh pr list --state merged \
  --search "retrospective OR process-improvements OR 振り返り in:title" \
  --limit 1 --json mergeCommit --jq '.[0].mergeCommit.oid')
echo "前回境界: $PREV"

# そこから HEAD までのコミットが対象範囲
git log --oneline "${PREV}..HEAD"

# インシデント痕跡の確認
git reflog --date=iso | head -30
```

### 問題点
このスニペットには 2 つの実運用上の落とし穴がある。

1. 初回実行時（過去に振り返り PR が 1 件も無いリポジトリ）では `PREV` が空文字列となり、直後の `git log --oneline "..HEAD"` は `fatal: ambiguous argument '..HEAD'` で落ちる。L82 で「前回境界が特定できないときは、直近の `chore(release):` コミットをベースに取る」と補足はあるが、コード側でそのフォールバックが表現されていないため、読者がコピペして動かすとエラーになる。
2. `gh pr list --search` のクエリ `retrospective OR process-improvements OR 振り返り in:title` は、`in:title` 修飾子が OR 節の最後のみに適用される書き方で、実際には「タイトルに `振り返り` を含む、本文/タイトル問わず `retrospective` を含む、本文/タイトル問わず `process-improvements` を含む」というノイズの多い結果になりがち。

### 提案
フォールバックと検索クエリの堅牢化を含めた書き換え案。

```bash
# 前回の振り返り PR を特定（タイトル限定検索）
PREV=$(gh pr list --state merged \
  --search 'in:title retrospective OR "process-improvements" OR 振り返り' \
  --limit 1 --json mergeCommit --jq '.[0].mergeCommit.oid')

# 初回実行や該当なしのフォールバック
if [ -z "$PREV" ]; then
  PREV=$(git log --grep '^chore(release)' -n 1 --format=%H)
fi

if [ -z "$PREV" ]; then
  echo "前回境界が特定できません。範囲を手動指定してください。" >&2
  exit 1
fi
echo "前回境界: $PREV"

# そこから HEAD までのコミットが対象範囲
git log --oneline "${PREV}..HEAD"

# インシデント痕跡の確認
git reflog --date=iso | head -30
```

`in:title` は OR 節全体に効くよう先頭に置くのが `gh pr list --search`（= GitHub Search API）の慣習。

**優先度: High**（コピペ実行の即時失敗を防ぐ）

---

### 該当箇所 5
L121-L133 （Step 5 の実装 bash スニペット）

```bash
git status --short                         # WIP の有無を確認
git branch --list chore/process-*          # 衝突チェック
git checkout -b chore/process-improvements

# 変更を適用

git add <明示パス>                          # add -A は禁止
git status --short                         # コミット前再確認
git commit
```

### 問題点
コードブロック内のコメント `# 変更を適用` は、空行を跨いだ自然言語の説明であり、bash のコメントとして成立はするが、**スニペットをそのままコピーしても「変更適用」の具体的なコマンドが無い**ため手順書として不完全。また `git add <明示パス>` の `<明示パス>` は角括弧のまま記載されているため、コピペするとリテラルな `<` `>` が shell のリダイレクト/グロブとして解釈されてエラーになる。Zenn 記事は読者がそのままコピペして動作確認することが多いため、placeholder 表記を明示したほうがよい。

### 提案
placeholder を波括弧 + コメントの形にし、「変更を適用」を明示的なプレースホルダのブロックに置き換える。

```bash
# 1) ブランチ衛生
git status --short                         # WIP の有無を確認
git branch --list 'chore/process-*'        # 衝突チェック
git checkout -b chore/process-improvements

# 2) 変更を適用
#    例: edit AGENT_LEARNINGS.md / 新規CIステップ追加 / lintルール更新
#    ここでは手順で決まった A/B/C の改善項目だけを編集する

# 3) ステージング（add -A は使わない）
git add path/to/AGENT_LEARNINGS.md .github/workflows/check.yml
git status --short                         # コミット前再確認

# 4) コミット
git commit
```

`branch --list` のパターンは shell のグロブ展開を避けるため `'chore/process-*'` と単引用符で囲むのが安全。

**優先度: Medium**

---

### 該当箇所 6
L133 （`git stash push` の pathspec 書式）

```markdown
WIP と同一ファイルを触る必要がある場合は、`git stash push -- <specific-paths>` でユーザー WIP を先に退避する。
```

### 問題点
`git stash push` に pathspec を渡すには `-m` でメッセージを付けない場合、`--` 以降に直接書けるのは正しいが、Claude Code 等のエージェント運用ではメッセージ必須で運用したい場面が多い。メッセージ付きの書式が併記されていないと、読者は `git stash push -m "msg" -- path/a path/b` の正しい形が分からず、`git stash push "msg"` のような誤用に流れやすい。また「先に退避する」だけで、退避したあとの `git stash pop`（または `git stash apply`）の取り戻し手順が本文に無く、再現手順として閉じていない。

### 提案
メッセージ必須形と取り戻し手順を 1 行で補足する。

```markdown
WIPと同一ファイルを触る必要がある場合は、`git stash push -m "wip before process-improvement" -- path/a path/b` でユーザーWIPを先に退避し、改善PRのマージ後に `git stash pop` で戻します。退避対象はサブセットに限定し、`-u`（untracked含む）を使うときは不要ファイルを巻き込まないよう `.gitignore` 側を先に整えます。
```

**優先度: Low**（動かないわけではないが、再現手順としての完全性向上）

---

### 該当箇所 7
L226-L238 （Meta-retrospective の説明）

```markdown
このスキルには、自分自身を改善するためのモードがある。

「改善フローのスキルを改善して」と依頼されたときの扱い:

1. 対象範囲は **直近の複数ラウンド**（単一セッションでなく、過去 3 〜 5 回の運用を俯瞰）
2. 観察項目は **スキル構造**（どの Step で迷ったか、どの Quality Gate を守れたか、軽量/通常モードの比率）
3. 改善ターゲットは `~/.claude/skills/engineering-process-improvement/SKILL.md` 本体
4. ユーザーレベルスキルは git 管理外のため、**PR は発生しない**（直接編集 + チャット報告で完了）
5. **engineer-skill-creator との住み分け**: 新スキル作成は engineer-skill-creator、既存スキル改善は本スキルの meta-retrospective モード
```

### 問題点
2 点の技術的・編集的な問題がある。

1. 「ユーザーレベルスキルは git 管理外」という前提は、**読者の環境に依存する**。`~/.claude/skills/` を個別に `git init` してバージョン管理している運用者は少なくないため、「git管理外のため、PRは発生しない」と断言すると不正確。正しくは「`~/.claude/skills/` を git 管理していない場合は PR は発生しない」。
2. L235 の「engineer-skill-creator との住み分け」が箇条書き内に混在し、meta-retrospective の手順説明と「他スキルとの境界の話」が同じリストに並んでいる。後者は別ブロック（見出し or 注記）に分けた方が読者の読み取りコストが下がる。

### 提案

```markdown
このスキルには、自分自身を改善するためのモードがあります。

「改善フローのスキルを改善して」と依頼されたときの扱い:

1. 対象範囲は **直近の複数ラウンド**（単一セッションではなく、過去 3〜5 回の運用を俯瞰）
2. 観察項目は **スキル構造**（どの Step で迷ったか、どの Quality Gate を守れたか、軽量/通常モードの比率）
3. 改善ターゲットは `~/.claude/skills/engineering-process-improvement/SKILL.md` 本体
4. `~/.claude/skills/` を git 管理していない場合、**PR は発生しない**（直接編集 + チャット報告で完了）。git 管理している場合は通常の Step 5〜8 に従う

:::message
**engineer-skill-creator との住み分け**

- 新しい運用パターンをスキルとして立ち上げる → `engineer-skill-creator`
- 既存スキルの改善 → 本スキルの meta-retrospective モード
:::
```

**優先度: Medium**

---

### 該当箇所 8
L254-L298 （「導入前後の行動変容」と L301-L321「運用してみた気づき」の役割重複）

```markdown
## 導入前後の行動変容
（中略）
### 特に効いたポイント

**1. 影響を数字で書く癖**
（中略）
**4. 軽量モードという逃げ道**

---

## 運用してみた気づき

スキル化して 10 回ほど回してから気づいたことをいくつか。

### 振り返りが「怖くない」感覚になった
（中略）
### Meta-retrospective の発動タイミング
```

### 問題点
「行動変容 → 特に効いたポイント → 運用してみた気づき」と、著者の主観的な体験を語るセクションが 3 つ連続している。それぞれの境界が弱く、読者視点では「同じトーンの体験談が続いている」印象を持ちやすい。特に:

- L282-L286 の「自動ガード優先の方針」と L301-L321 の「Meta-retrospective の発動タイミング」は「ルール化の価値」という同じ主張。
- L293-L298 の「軽量モードという逃げ道」と L311-L314 の「Carry-over observations の価値」は隣接する主題（軽量モードの副産物）を別セクションで語っている。

### 提案
3 セクションを 2 セクションに統合するか、明確に役割を分ける。推奨構成:

```markdown
## 導入前後の行動変容
### Before / After（現状の箇条書きはそのまま）
### 特に効いた3つの仕組み
  1. 影響を数字で書く癖
  2. 自動ガード優先の方針（Quality Gate による強制）
  3. 前回境界からのチェーン

## 10回運用して気づいたこと
### 振り返りが「怖くない」感覚になった
### 軽量モード + Carry-over observations の組み合わせが効く
### Meta-retrospective は 3 回ルールが正解だった
```

「特に効いたポイント」を 4 項目 → 3 項目に圧縮し、「軽量モード」の話は「運用してみた気づき」側に寄せて Carry-over とセットで語ると、セクション間の役割が明確になる。

**優先度: Medium**

---

### 該当箇所 9
L324-L338 （まとめセクション：外部リンクと CTA の不在）

```markdown
## まとめ

`engineering-process-improvement` は、開発セッション直後の振り返りを、仕組みに変換する運用スキルです。

- 8 ステップの通常モード、軽量モード、meta-retrospective の 3 モード
- 改善は A（ドキュメント）/ B（自動ガード）/ C（ツール運用）の 3 分類
- 最低 1 件は B（自動ガード）に落とす
- 前回境界からチェーンを辿れる PR 本文
- ユーザーレベル user-level スキル、git 管理外で維持

運用し始めてから、振り返りが感想で終わることがなくなり、同じ失敗を踏む頻度が目に見えて減りました。
改善サイクルが、注意力ではなく設計で回るようになっている感覚があります。

気合いではなく、仕組みで事故率を下げる。
これを実現するための土台として、かなり手応えのあるスキルになっています。
```

### 問題点
2 点の SEO / 編集上の問題がある。

1. 「ユーザーレベル user-level スキル」は同じ意味を日英併記しており、冗長。L19 でも「user-level スキル」、L332 でも「user-level スキル」と使われているので、日本語を足すならどちらかに統一する。
2. 著者の他記事（`ai-dev-guardrail-plangate-river-reviewer.md` / `ai-legible-repository-design.md`）や、記事中で言及されているスキル `retrospective-improvement` / `engineer-skill-creator` への**内部リンクが一切ない**。読者の次アクション（関連スキルの記事を読む、姉妹 note 記事を読む、実装サンプルを見る）への導線が途切れており、Zenn の回遊率・SEO 両面で機会損失。

### 提案

```markdown
## まとめ

`engineering-process-improvement` は、開発セッション直後の振り返りを、仕組みに変換する運用スキルです。

- 8 ステップの通常モード、軽量モード、meta-retrospective の 3 モード
- 改善は A（ドキュメント）/ B（自動ガード）/ C（ツール運用）の 3 分類
- 最低 1 件は B（自動ガード）に落とす
- 前回境界からチェーンを辿れる PR 本文
- user-level スキルとして `~/.claude/skills/` 配下で維持（git管理の有無は運用者次第）

運用し始めてから、振り返りが感想で終わることがなくなり、同じ失敗を踏む頻度が目に見えて減りました。
改善サイクルが、注意力ではなく設計で回るようになっている感覚があります。

気合いではなく、仕組みで事故率を下げる。これを実現する土台として、かなり手応えのあるスキルになっています。

### 関連記事

- 姉妹記事（概念寄り）: note版「（タイトル）」
- 実装前後の 2 層ガード設計: [AI駆動開発の2層ガード設計：PlanGateとRiver Reviewerで実装前後を守る](/articles/ai-dev-guardrail-plangate-river-reviewer)
- AIが読むリポジトリ構造: [AIが迷わないリポジトリ設計：長いプロンプトより先に整える4つの置き場所](/articles/ai-legible-repository-design)
```

**優先度: Medium**（SEO と回遊率への影響、既出記事との連結は依頼背景に明記されている要件）

---

### 該当箇所 10
L200-L205 （Carry-over 例のコードフェンス言語指定）

```markdown
Carry-over の例:

\`\`\`
ユーザーの 12d6e28 は stash→checkout --theirs の迂回を記録している。
今後の同種作業では `git reset --soft` + `git add -p` を優先候補にする。
\`\`\`
```

### 問題点
このコードフェンスは言語指定がない（```` ``` ````のみ）。記事内の他のコードブロックは `bash` / `markdown` / `yaml` を明示しているため、表現規約が揃っていない。中身は「自然言語の短文メモ」であり、シンタックスハイライトは不要だが、Zenn の共通チェックリストで「コードブロックの言語指定が適切」を満たすには `text` を明示するのが望ましい。

### 提案

````markdown
Carry-over の例:

```text
ユーザーの 12d6e28 は stash→checkout --theirs の迂回を記録している。
今後の同種作業では `git reset --soft` + `git add -p` を優先候補にする。
```
````

同様に L66 のフェンス開始 ```` ```bash ```` も問題ないが、L121 のスニペット内で bash コメント（`#`）とプレースホルダ（`<明示パス>`）が混在している点は該当箇所5で触れた。

**優先度: Low**

---

## 総合評価

### 良い点

- **テーマの一貫性**: 「振り返りを仕組みに変換する」という主張が冒頭・8ステップ・Quality Gates・Anti-patterns・Before/Afterを通して一貫しており、主張と運用が剥離していない。
- **A/B/C 分類の実用性**: 改善アクションを「ドキュメント / 自動ガード / ツール運用」の3分類に落とす設計は、読者が自分のチームで即適用しやすい具体性がある。
- **軽量モードの提示**: 「振り返り依頼 → 必ず PR 作成」のアンチパターン化を明示し、サイクル自体の健全性に踏み込んでいる点は、他のプロセス改善記事には少ない独自性。
- **Meta-retrospective の抑制ルール**: 「3回以上運用してから」というガードを明示することで、過剰最適化を防いでいる。読者が自分のスキル運用に持ち込める学びになっている。
- **前回境界からのチェーン**: PR 本文に前回振り返り PR を必ず貼るという運用は、半年後に効く設計として具体性がある。

### 改善点

- **文体（常体/敬体）の統一**: 記事全体に散在しており、編集観点で最優先修正。
- **手順スニペットの堅牢化**: Step 1 の `gh pr list` / Step 5 の `git add` まわりは、初回実行や placeholder 扱いでハマる。
- **著者の他記事との体裁統一**: 冒頭 `:::message` ブロックの欠落、関連記事リンクの不在、姉妹 note 記事との対応関係の未言及は、ペア展開の企画意図と噛み合わない。
- **セクション統合**: 「導入前後の行動変容」「運用してみた気づき」の2セクションは、体験談の再配置で密度を上げられる。
- **user-level スキルの git 管理前提の断言**: 読者環境に依存するため条件付き表現に差し替えるべき。

### 推奨アクション

1. **High 優先度 3 件の修正**: 導入 `:::message` 追加（指摘1）、文体統一（指摘2）、Step 1 スクリプトのフォールバック追加（指摘4）。この3件で「公開可能」の水準に到達する。
2. **Medium 優先度 4 件の修正**: スキル比較表の3スキル化（指摘3）、Step 5 のプレースホルダ整理（指摘5）、Meta-retrospective の git 前提の条件化（指摘7）、行動変容セクションの再構成と関連記事リンク追加（指摘8, 9）。公開後に追加修正でも対応可。
3. **Low 優先度 2 件**: `git stash push` のメッセージ書式補足（指摘6）、Carry-over の `text` 言語指定（指摘10）。最終仕上げで対応。
4. **姉妹 note 記事との相互リンク整備**: 公開順序が決まったタイミングで双方向リンクを追加する。

### 公開可否と条件

**条件付き公開可**。High 優先度 3 件（指摘1・2・4）を反映すれば Zenn 公開可能な水準。Medium 優先度の指摘は公開後の追補でも差し支えないが、指摘 9（関連記事リンク）は依頼背景の「著者の他記事と文体を揃えたい」に直接対応する要件のため、公開前に対応するのが望ましい。

### SEO観点での改善提案

- **タイトル**: 現状「開発セッション直後の振り返りをPRに変える — engineering-process-improvement スキルの運用と行動変容」は長く（41文字＋英語スキル名）、検索結果で末尾が省略される可能性。「Claude Code」を入れるとキーワード強化になる。例: 「Claude Code で開発セッション直後の振り返りをPRに変える — engineering-process-improvement スキル運用記」。
- **topics**: `["claudecode", "ai駆動開発", "github", "レトロスペクティブ", "プロセス改善"]` は適切だが、「agentskills」「userlevelskill」などのニッチ語より「振り返り」や「kpt」の方が検索流入が見込めるかは検討余地あり。Zenn のトピック表記慣習（英数小文字中心）に従い、`振り返り` は `retrospective` と重複するため現状維持でよい。
- **内部リンク**: 指摘9で提案した関連記事リンクの追加で回遊率向上が見込める。
- **h2/h3 階層**: 現状の階層は適切。目次ジャンプしやすい構造になっている。
- **導入文のフック**: 冒頭 L11-L17 の「振り返りは『今回はこれが大変だった』『次は気をつけよう』のループで終わりがち」は読者の実感と接続しやすい良いフック。`:::message` を追加しても、このフックは残すのが望ましい。

---

*レビュー実施者: @claude*
*レビュー実施日: 2026-04-18*
