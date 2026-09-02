<!-- publish-readiness: blocked=false mustHigh=0 verified=true articleHash=b43e3cbbe4329377cece98789e90ffee73cb9822 loops=1 reviewedAt=2026-08-27T09:41:31Z -->

# レビュー成果物: ai-second-brain-multi-agent-memory

- 対象記事: `articles/ai-second-brain-multi-agent-memory.md`（articleHash `b43e3cbbe4329377cece98789e90ffee73cb9822`。レビュー実施時点は `de26d5b3ce87a0dc09d4b700cbe5c8ad609e3606`、F1 反映後に `5b876497…`、2026-09-02 の主張境界レビュー反映後に `b43e3cbb…`）
- Zennカテゴリー: Idea（`type: "idea"`。設計思想と運用ふりかえりが主で、Zenn 公式の Idea 定義と一致）
- 構成タイプ: 概念解説・考察（記憶集約の設計 + 運用ふりかえり）
- 改善ループ数: 2（レビュー自体は review-only。F1 を 1 回、2026-09-02 の主張境界指摘 3 件をもう 1 回、それぞれ改稿で反映した）
- レビュー状態: fresh-review-verified（全指摘を一次情報または著者のローカル実環境で裏取り済み）／ F1 反映済み（2026-08-28）／ 主張境界レビュー（`oss-article-claim-boundary`）指摘 high 1・medium 2 反映済み（2026-09-02、詳細は 7 章）
- 総合判定: **must 0 件 / high 1 件（F1）→ 反映済みで残 0 件。2026-09-02 に新規 high 1 件（ChatGPT 記述の矛盾）を検出し反映済みで残 0 件。medium は F5（重複段落）を含む 2 件を 2026-09-02 に反映済み、残る medium 3 件・low 3 件は未反映（公開ブロッカーではない）。`published: false` のまま。in-review 条件（`blocked=false` かつ `mustHigh=0`）を満たしたため `blocked=false`。**

> **本レビューを実施した理由**: 直前のレビュー（PR #537、`reviewedAt=2026-08-27T03:36:12Z`、`articleHash=2911ba59…`）のあとに PR #539「未公開4記事の末尾に X アカウント導線を追加」が本文を変更したため、`check:publish-readiness` が articleHash 不一致（recorded=`2911ba59` / current=`de26d5b3`）の stale 判定を返す状態だった。本ファイルは現行フォーマットのまま **現在の本文（L1-L204）に対する新規レビュー**として全面的に書き直したもので、旧レビューの結論をそのまま引き継いではいない。
>
> `blocked` の変遷: レビュー実施時点では **技術的誤り・危険手順といった must 相当の欠陥は 1 件も無い**一方、high を 1 件（F1: 一次資料リンクの参照先ズレ）検出していたため `blocked=true mustHigh=1` としていた。その後 **2026-08-28 に F1 を 1 行の URL 差し替えで反映済み**（差分は 3 章 F1 節に記載）。high 残件が 0 になったため `blocked=false mustHigh=0` へ更新した。medium 5 件・low 3 件は意図的に未反映のまま残している。

---

## 1. 3ペルソナ チェック結果

| 観点 | 状況 | コメント |
| --- | --- | --- |
| Webディレクター | 要改善（low 2 件） | 「想定読者 → 前提 → 先に結論 → 全体像 → 詳細 → 運用 → つまずき → まとめ」の順で価値が早期に立っており、Idea 記事として構成は妥当。残るのはタイトル語彙（F9）と Vault 構成図の網羅性（F7）のみ |
| Web編集者 | 要改善（medium 1 / low 1） | 誤字脱字・表記ゆれは検出なし。L150 と L152 の内容重複（F5）と、L204 署名行の文体不一致（F8）を検出 |
| Webエンジニア読者 | 要改善（high 1 / medium 3） | 中核となる設定キー・パス・コマンドは**著者のローカル実環境で全件実在を確認**（2 章）。一方で一次資料リンクの参照先（F1）、公式が明記する MEMORY.md の読み込み上限の欠落（F2）、Codex の「保存先を変更できない」（F3）、集約の中核設定の記述例が無い（F4）が残る |
| 技術的事実検証 | OK（一部を除き全件裏取り済み） | 下記 2 章のとおり、外部リンク 5 本・設定キー 3 件・ローカル実設定 3 件を実測。裏取りできなかった 1 件は 5 章に「未検証」として明記 |

---

## 2. 事実検証（2026-08-27T09:4x UTC 実施）

### 2-1. 記事が参照している外部 URL（全 5 本、curl による実測）

| 記事中の位置 | URL | HTTP status |
| --- | --- | --- |
| L128 | `https://code.claude.com/docs/en/settings` | 200（ただし参照先として不適切 → F1） |
| L130 | `https://google-gemini.github.io/gemini-cli/docs/get-started/configuration.html` | 200（`context.fileName` の記載を本文中に確認） |
| L198 | `https://zenn.dev/minewo/articles/obsidian-supermemory-mcp` | **200（公開済み）** |
| L199 | `https://zenn.dev/minewo/articles/ai-agent-autonomy-boundary-with-memory` | **200（公開済み）** |
| L200 | `https://zenn.dev/minewo/articles/agent-learnings-md-operation` | **200（公開済み）** |

関連 3 本はいずれも公開済みで、リンク切れなし。`npm run check:internal-links` も内部リンク切れ 0 件（checked 102 files）。

### 2-2. 記事の技術的主張 vs 著者のローカル実環境・公式ドキュメント

| # | 記事中の記述（行） | 検証方法 | 結果 |
| --- | --- | --- | --- |
| 1 | `autoMemoryDirectory` で Claude Code のメモリー保存先を自前 Vault へ向けられる（L128） | `code.claude.com/docs/en/memory` を curl 取得して逐語確認 + 実設定の grep | **正確**。公式: 「To store auto memory in a different location, set `autoMemoryDirectory` in your settings.json. It is read from any settings scope: user, project, local, policy, or `--settings`.」。さらに `my-blog/.claude/settings.local.json:84` に `"autoMemoryDirectory": "~/Documents/GitHub/ai-second-brain/08 Agent Context/memory/my-blog"` が実在し、記事の設計が実運用されていることを確認 |
| 2 | project/local スコープ設定時はワークスペース信頼ルール配下で有効（L128） | 同上 | **正確**。公式: 「When you set it in a project's `.claude/settings.json` or `.claude/settings.local.json`, Claude Code honors it under the same workspace trust rule as hooks in settings files.」 |
| 3 | auto memory の ON/OFF は `autoMemoryEnabled`（L128） | 同上 | **正確**。公式にキーが 6 回出現、既定 ON・プロジェクト単位で `false` 化可 |
| 4 | Codex CLI は `~/.codex/AGENTS.md` に指示ベースで Vault を参照させる（L129） | `~/.codex/AGENTS.md` を実読 | **実在・記述一致**。同ファイル L55 に「長期記憶の正本: `~/Documents/GitHub/ai-second-brain/08 Agent Context/memory/<リポジトリ名>/`」、L61 に形式の参照先が書かれており、「ファイル内容のミラーではなく参照先を指示として書く」という記事の説明どおり |
| 5 | Gemini CLI の `context.fileName` に `AGENTS.md` を追加する（L130, L132） | 公式ドキュメントを curl + `~/.gemini/settings.json` を実読 | **実在・記述一致**。実設定は `"context": { "fileName": ["GEMINI.md", "AGENTS.md"] }` で、本文の記述と完全一致 |
| 6 | 記憶の正本は `08 Agent Context/memory/<repo>/`、`MEMORY.md` は 1 行 1 記憶の索引（L84-92） | Vault 実体を `ls` / `head` | **実在・記述一致**。`08 Agent Context/memory/` 配下に 15 リポジトリ分のサブフォルダと `MEMORY.md` が実在。`my-blog/MEMORY.md` は 24 行で全行が `- [タイトル](file.md) — 1行要約` 形式 |
| 7 | メモリーは frontmatter を持ち `user \| feedback \| project \| reference` の 4 type（L110-122） | Vault 全メモリーの frontmatter を集計 | **実在・記述一致**。`type:` の実測分布は feedback 85 / project 18 / reference 12 / user 2 で、記事が挙げる 4 値以外は 0 件。記事のサンプルが使う `metadata:` ネスト形式も `memory/plangate/` 配下に実在（トップレベル `type:` 形式と併存）ため、サンプルは実在形式のひとつ |
| 8 | Vault は PARA を参考にした番号付きフォルダ構成（L66-78） | Vault ルートを `ls` | **一部不一致**。記事の図は `00`〜`08` だが、実 Vault には `09 Projects` も存在する（→ F7） |
| 9 | `npm run gh:ensure` 等、記憶に書く「リポジトリ固有の制約」の例（L99, L121） | `package.json` を grep | **実在**。`"gh:ensure": "bash scripts/check-gh-account.sh --fix"` |

**結論**: 記事が依拠する設定キー・パス・コマンドは、公式ドキュメントと著者のローカル実環境の両方で裏が取れた。**事実の誤りは 0 件**、精度不足が 1 件（Codex の「変更できない」→ F3）、参照先の付け間違いが 1 件（F1）。

---

## 3. 指摘コメント

### F1 — high: 一次資料リンクが、その事実を載せていないページを指している

**該当箇所**: L128

> project/local スコープで設定した場合は、ワークスペースの信頼ダイアログを承認したあとに有効になる（参照: [Claude Code settings](https://code.claude.com/docs/en/settings)）

**問題**
この一文が担保しているのは、記事でもっとも技術的に負荷の高い 3 つの主張（`autoMemoryDirectory` の存在 / `autoMemoryEnabled` の役割 / project・local スコープの信頼ルール）である。しかし参照先に指定された `https://code.claude.com/docs/en/settings` を実際に取得して検索すると、`autoMemoryDirectory` も `autoMemoryEnabled` も **出現回数 0**。3 件とも記載されているのは `https://code.claude.com/docs/en/memory` のほう（`autoMemoryDirectory` 4 回 / `autoMemoryEnabled` 6 回、信頼ルールの一文も逐語で存在）。読者がリンクを踏んで裏を取ろうとしても該当記述に到達できず、「Markdown を正本に置く」という記事の中核設計の根拠が確認不能になる。主張自体は正しい（2 章 #1-#3）ため、誤っているのはリンク先だけ。

**提案**
L128 の参照先を差し替える。主張・語順・強調は変えない。

- before: `（参照: [Claude Code settings](https://code.claude.com/docs/en/settings)）`
- after: `（参照: [Claude Code memory](https://code.claude.com/docs/en/memory)）`

**反映状況: 反映済み（2026-08-28）**

提案どおり L128 の参照先のみを差し替えた。主張・語順・強調・その他の行は変更していない（記事全体で 1 行 1 箇所のみの変更）。

```diff
-- **Claude Code**: 公式設定の `autoMemoryDirectory`（auto memory の保存先を指定するキー）で、メモリーディレクトリを自前 Vault 配下に向けて自動接続できる。なお auto memory 自体の ON/OFF は `autoMemoryEnabled` で制御する。project/local スコープで設定した場合は、ワークスペースの信頼ダイアログを承認したあとに有効になる（参照: [Claude Code settings](https://code.claude.com/docs/en/settings)）
++ **Claude Code**: 公式設定の `autoMemoryDirectory`（auto memory の保存先を指定するキー）で、メモリーディレクトリを自前 Vault 配下に向けて自動接続できる。なお auto memory 自体の ON/OFF は `autoMemoryEnabled` で制御する。project/local スコープで設定した場合は、ワークスペースの信頼ダイアログを承認したあとに有効になる（参照: [Claude Code memory](https://code.claude.com/docs/en/memory)）
```

反映後の再実測（2026-08-28、`curl` + `grep -c`）:

| ページ | HTTP | `autoMemoryDirectory` を含む行数 | `autoMemoryEnabled` を含む行数 |
| --- | :-: | :-: | :-: |
| 差し替え後 `https://code.claude.com/docs/en/memory` | 200 | 3 | 3 |
| 差し替え前 `https://code.claude.com/docs/en/settings` | 200 | 0 | 0 |

差し替え後の URL に両キーが実在することを確認済み（`grep -c` は出現回数ではなくヒット行数のため、レビュー時に記録した出現回数 4 / 6 とは数え方が異なる。0 か否かの判定は一致）。記事の articleHash は `de26d5b3…` → `5b876497…` に変化した。

---

### F2 — medium: 公式が明記する MEMORY.md の読み込み上限（200 行 / 25KB）が書かれていない

**該当箇所**: L84-92

> `MEMORY.md   # 索引。1行1記憶のポインタ`
> 「1ファイル1事実」にしているのは、後から AI が必要な記憶だけを拾いやすくするためです。索引（`MEMORY.md`）には1行サマリだけを並べ、詳細は個別ファイルに逃がします。

**問題**
公式ドキュメント（`docs/en/memory`）は「The first 200 lines of `MEMORY.md`, or the first 25KB, whichever comes first, are loaded at the start of every conversation. **Content beyond that threshold is not loaded at session start.**」と明記している。つまり索引が上限を超えると、超過分の記憶は**エラーも警告もなく読まれなくなる**。記事は「索引に 1 行サマリを並べる」という運用を勧めているので、リポジトリや記憶の数が増えた読者はこの上限に静かに突き当たる。著者の現状は `my-blog/MEMORY.md` 24 行・`plangate/MEMORY.md` 67 行・`memory/MEMORY.md` 46 行でいずれも上限内のため、著者本人はまだ踏んでいない罠である（＝経験からは出てこない指摘）。この制約の有無で、記事の中核である「索引に集約する」運用の設計判断（1 リポジトリ 1 索引に分ける理由）の説得力も変わる。

**提案**
L92 の段落末に 1 文足す。数値は公式の値をそのまま使う。例:

> なお `MEMORY.md` はセッション開始時に先頭 200 行 / 25KB までしか読み込まれず、超過分は無言で落ちる（[公式](https://code.claude.com/docs/en/memory)）。索引をリポジトリ単位に割っているのは、この上限に当てないためでもあります。

---

### F3 — medium: 「Codex CLI は保存先を変更できない」が実態より強い

**該当箇所**: L129

> **Codex CLI**: 保存先を変更できない。そこで `~/.codex/AGENTS.md` に**指示ベース**で「この Vault の memory を読め」と、対象パスを書いて接続する

**問題**
ローカルの Codex CLI の `--help` を実行すると `$CODEX_HOME/<name>.config.toml` の記述があり、Codex の設定・指示ファイル群の置き場所は環境変数 `CODEX_HOME`（既定 `~/.codex`）で移動できる。したがって「保存先を変更できない」は不正確で、正確には「Claude Code の `autoMemoryDirectory` に相当する**自動記憶の保存先設定を持たない**（そもそも自動記憶の機構がない）」である。読者が Claude Code 側と対称に「Codex にも設定キーがあるのでは」と探して時間を溶かす、あるいは逆に `CODEX_HOME` による集約案を検討対象から外してしまう。

**提案**
「変更できない」を「該当する設定キーがない」に寄せる。差し替え例:

> **Codex CLI**: Claude Code の `autoMemoryDirectory` に相当する記憶ディレクトリの設定キーがない（`CODEX_HOME` で設定ディレクトリ自体は移せるが、自動記憶の機構そのものがない）。そこで `~/.codex/AGENTS.md` に**指示ベース**で〜

---

### F4 — medium: 集約の中核である `autoMemoryDirectory` の設定例だけが本文に無い

**該当箇所**: L110-122（frontmatter のサンプルはある）と L128（設定キーの記述のみ）

**問題**
記事は「1つの Vault に集約する」ことを主題に据え、メモリーファイルの frontmatter については 13 行のサンプルを載せている。一方、集約を実際に成立させている唯一の設定である `autoMemoryDirectory` は、キー名が文中に出るだけで記述例がない。著者の実環境には `my-blog/.claude/settings.local.json:84` に 1 行で存在しており（2 章 #1）、公開できない情報でもない。読者が最初に手を動かす箇所がサンプル欠落になっているため、「まずは `memory/<repo>/MEMORY.md` から始めれば十分」（L194）という締めの再現性の主張と噛み合わない。

**提案**
L128 の箇条書きの直後に 3 行のコードブロックを足す（値はパスを一般化してよい）。公式が「値は絶対パスか `~/` 始まり」と明記しているので、その制約も 1 行添えると読者が詰まらない。

```json
// .claude/settings.json（絶対パスか ~/ 始まりのみ）
{ "autoMemoryDirectory": "~/second-brain/08 Agent Context/memory/my-blog" }
```

---

### F5 — medium: L150 と L152 が同じ内容を 2 回述べている

**該当箇所**: L150 / L152

> L150: 記憶を共有する併用ツール（Claude / Codex / Gemini / ChatGPT）に加え、最新情報の調査や外部比較は Grok に振る、という役割の振り分けです。
> L152: 記憶を共有する4ツール（Claude / Codex / Gemini / ChatGPT）に加え、調査特化の Grok を実行者として役割分担に組み込みます。

**問題**
「記憶を共有する 4 ツール + 調査担当の Grok」という同一の情報が、間に 1 段落もはさまずに 2 回繰り返されている。列挙されるツール名も順序も同じ。表（L154-160）の直前で読者の集中が要る位置なので、重複が目立つ。

**提案**
L152 の該当一文を削り、表の導入として機能している後半だけを残す。例: 「次の表の『避けること』列は、机上のルールではなく仕組みのブロックと二重化しています（後述）。」。Grok を実行者に含める旨は L150 に残るので情報は失われない。

**反映状況: 反映済み（2026-09-02、`oss-article-claim-boundary` レビュー経由）**

2段落を1段落へ統合した。統合の過程で「記憶を共有する4ツール（Claude / Codex / Gemini / ChatGPT）」という誤った前提も解消している（詳細は 7 章 G1）。

---

### F6 — medium: 「ブロックされました」の主体が書かれておらず、根拠として弱い

**該当箇所**: L162（同趣旨が L181, L190 にも波及）

> たとえば、あるリポジトリのコンテンツを別リポジトリへ一括 push しようとした操作や、自分の権限設定を書き換えようとした操作が、ブロックされました。

**問題**
この段落は「役割分担と安全機構はセットで効く」という、記事が終盤（L190）で「想定外の収穫」として挙げる主張の唯一の実例である。しかし**何がブロックしたのか**（エージェント実行環境の権限機構なのか、リポジトリの Git hook なのか、CLI 側のサンドボックスなのか）が書かれていないため、読者は自分の環境で同じ守りが働くかを判断できない。「仕組みのブロックと二重化しています」（L152）という言い切りの裏づけも、機構名がないと確認できない。事実として誤りではなく、特定に必要な情報が落ちている。

**提案**
機構名と、それが「記事の設計に固有のものか、使っているツールの既定機能か」を 1 句だけ添える。読者の再現条件が確定すればよいので、具体的なログや詳細な再現手順までは不要。

---

### F7 — low: Vault の構成図に `09 Projects` が無い

**該当箇所**: L68-78

**問題**
本文は「Vault は PARA を参考にした番号付きフォルダ構成にしています」と述べたうえで `00 Inbox` 〜 `08 Agent Context` の 9 つを列挙するが、実 Vault のルートには `09 Projects` も存在する（`ls` で確認）。PARA の P（Projects）に対応する枠が図から抜けているため、PARA を参考にしたという説明と図が噛み合わない。

**提案**
`09 Projects/` を 1 行足すか、図の直前に「主要なものだけ抜粋」と断る。どちらでも主張は変わらない。

---

### F8 — low: 末尾の署名行だけ文体が常体で、本文（敬体）と揃っていない

**該当箇所**: L204

> 普段は X（[@mine_take](https://x.com/mine_take)）で、AIコーディングをチーム開発に乗せる運用設計について発信している。

**問題**
本文は全編が敬体（「解きました」「しています」「決めておきます」）だが、この 1 行だけ常体で終わる。読者が最後に読む行なので、文体の切り替わりが目に付く。ただしこの行は PR #539 で未公開 4 記事に一括追加された共通の署名で（`articles/` 配下の 4 記事すべてに同一文字列が存在）、他の 3 記事は本文自体が常体のため衝突していない。また L202 の `---` で本文と区切られた署名ブロックとして読めるため、実害は小さい。

**提案**
（a）この記事だけ敬体に揃える（「〜発信しています。」）か、（b）4 記事共通の署名として常体のまま据え置く、のいずれか。共通署名の一貫性を優先するなら (b) でよく、その場合は指摘を却下扱いにして構わない。

---

### F9 — low: タイトルの "Hermes" が、本文で「製品名ではない」と打ち消される語

**該当箇所**: L2（`title`）と L140

> title: "AIエージェントの記憶を1つのObsidian Vaultに集約する — Hermes司令塔のmulti-agent設計"
> L140: ここで言う Hermes は、特定の製品やサービスの名前ではなく、**「指示・分解・統合・レビューだけを担う役割」そのもの**を指す呼び名です。

**問題**
タイトル後半の主語である "Hermes" は、本文 L140 で「製品名ではない」と明示的に打ち消される著者固有の呼称である。検索してもヒットしない語がタイトルの主要素になっているため、一覧で見た読者は既知のツール紹介記事と誤認するか、逆に「自分には関係ない独自基盤の話」と判断して離脱しうる。記事の実体（複数 AI エージェントの記憶を 1 か所に集約する設計と、その司令塔役の置き方）はタイトル前半で十分に表現できている。なお本文側の定義は L140 で足りており、追加の説明は不要。

**提案**
タイトル後半を、検索意図に乗る語へ寄せる案（いずれか 1 つ）。前半・主張は変えない。

- 「— 司令塔役を置くmulti-agent設計」
- 「— Organizer（司令塔）を置くmulti-agent設計」

`topics`（`["ai駆動開発", "obsidian", "claudecode", "codex", "memory"]`）は記事の中心語を過不足なく拾えているため変更不要。

---

## 4. 旧レビュー（2026-06-18 実施・旧形式）の反映状況

旧形式レビューの全 8 指摘は、PR #438 / #537 の時点で反映確認済み。今回、現行本文に対して再確認した結果も同じ（high 3 件・medium 2 件は反映済み、low 1 件「昇格」の比喩のみ据え置き）。旧形式レビューの原文は PR #537 以前の本ファイル（git 履歴）で参照できるため、本ファイルには再掲しない。

前回レビュー（PR #537）で新規に挙がった medium 1 件「note 記事 `nc1ac531190c9.md` との Hermes 役割定義の粒度差（窓口 / Organizer）」は、本文が未変更のため**未反映のまま有効**。公開ブロッカーではないため今回は指摘一覧に再掲せず、次回の磨き込み候補として引き継ぐ。

---

## 5. 未検証事項

- **L182「Codex CLI は、ログインしていてもプランに利用権がないと全モデルが拒否される」**: 著者のアカウント状態に依存する経験則で、本レビューでは再現も反証もできなかった。**未検証**として記録する（誤りと判断したわけではない）。公開するなら、発生時期か観測されたエラー文言を 1 つ添えると読者が自分のケースと照合できる。
- **L180「Vault の構成は変わるので集約スクリプトを追従させる必要がある」/ L181「個人 Vault への一括転送は止められることがある」**: いずれも著者の運用経験の記述で、対象スクリプトが本リポジトリ外にあるため実行検証はしていない。F6 と同じく、機構名が入れば読者側で確認可能になる。

---

## 6. 総合評価

### 良い点

- 記事の技術的な骨格（`autoMemoryDirectory` / `autoMemoryEnabled` / 信頼ルール / `~/.codex/AGENTS.md` の指示ベース接続 / Gemini の `context.fileName` / `memory/<repo>/MEMORY.md` の構造と 4 type）は、**公式ドキュメントと著者のローカル実環境の両方で 9 項目中 9 項目の裏が取れた**。設計を語る Idea 記事でありながら、記述が実運用と乖離していない
- 関連 3 記事はいずれも公開済み（HTTP 200）で、`obsidian-supermemory-mcp` とは本文 L126 と参考リンク L198 の 2 箇所で差別化が明示されている。テーマが近い自記事とのカニバリ対策が効いている
- 「冒頭の 3 点（設計）」と「運用して効いた別の 3 点」を分けた L184-192 の構成は、設計論に終始しがちなテーマで実際の学びを立たせており、結論の再掲にならずに締められている

### 残る改善点

- **公開前に直す（high 2、いずれも反映済み）**: F1 — 一次資料リンクの参照先を `docs/en/settings` から `docs/en/memory` へ → **反映済み（2026-08-28）**。G1 — 「記憶を共有する4ツール」に ChatGPT を含める記述の矛盾 → **反映済み（2026-09-02、7 章参照）**
- **推奨（medium 3、未反映）**: F2（MEMORY.md の 200 行 / 25KB 上限）、F3（Codex「保存先を変更できない」）、F4（`autoMemoryDirectory` の設定例）※ F5（L150/L152 の重複）・F6 相当の note 参照追加は **2026-09-02 に反映済み**（7 章参照。F6 本体の「ブロックの主体」明記は未反映のまま残置）
- **任意（low 3、いずれも未反映）**: F7（`09 Projects`）、F8（署名行の文体）、F9（タイトルの "Hermes"）

### 推奨アクション

1. ~~F1 を反映する（1 行の URL 差し替え）。反映後にヘッダを `blocked=false mustHigh=0` へ更新し、`articleHash` を再取得して差し替える~~ → **完了（2026-08-28）**
2. ~~`oss-article-claim-boundary` 指摘（G1 / F5 / G2）を反映する~~ → **完了（2026-09-02、7 章参照）**
3. 併せて F2・F3・F4 を反映すると、読者が手を動かす部分（設定・上限・ツール差）の精度がさらに揃う
4. `published: true` への切替は本レビューの範囲外。別途人間判断・別 PR で、`release/zenn` 経由の公開フローに従って行う

### 総合判定

| 項目 | 状態 |
| --- | --- |
| must（技術的誤り・危険手順・重大な再現性欠如） | **0 件** |
| high 残件 | **0 件（F1 は 2026-08-28、G1 は 2026-09-02 に反映済み）** |
| `blocked` | **false**（in-review 条件 `blocked=false` かつ `mustHigh=0` を満たす） |
| `mustHigh` | **0** |
| `verified` | true（外部 URL 5 本 / 公式ドキュメント 3 キー / ローカル実環境 6 項目を実測。G1〜G3 は 7 章の実測で追加裏取り） |
| 記事本文の変更 | F1（L128 の参照 URL 差し替え）＋ 2026-09-02 の G1/F5 統合段落・参考リンク追加（7 章）。`published: false` は維持 |
| medium / low 残件 | **medium 3 件・low 3 件は未反映**（公開ブロッカーではないため今回は据え置き） |
| 検証コマンド | `npm run check:publish-readiness -- ai-second-brain-multi-agent-memory` / `npm run check:internal-links` / `npm run check:article-humanizer` / `npm run check:zenn-image-format` |

---

## 7. 2026-09-02 反映記録（主張境界レビュー: high 1 / medium 2）

`.claude/skills/oss-article-claim-boundary/SKILL.md` の判定基準に基づく主張境界レビューで検出された3指摘を、最小差分で反映した（記事の主張・タイトル・`topics`・`published: false` は不変）。

### G1 — high: 「記憶を共有する4ツール」に ChatGPT が含まれるが接続方法がない（矛盾）

**該当箇所**: 反映前 L150 / L152（「Hermesを司令塔にする」節）

**問題**: 「ツールごとの『接続方法』の違いを吸収する」節（旧 L124-134）は Claude Code / Codex CLI / Gemini CLI の3つの接続方法しか説明していないのに、「Hermesを司令塔にする」節は「記憶を共有する4ツール（Claude / Codex / Gemini / ChatGPT）」と書いており、ChatGPT がどう Vault を読むのかが記事のどこにも書かれていなかった。さらに冒頭「なぜ記憶が分断するのか」節（L48）は「ChatGPT は会話の中（基本は揮発する）」と、むしろ共有できない側として説明しており、記事内で矛盾していた。

**一次情報照合（2026-09-02 実測）**:
- `ls ~/.codex/AGENTS.md ~/.gemini/settings.json` → 両ファイルとも実在。中身に ChatGPT への言及なし
- `~/.gemini/settings.json` の内容: `"context": { "fileName": ["GEMINI.md", "AGENTS.md"] }`（記事本文の記述と一致。ChatGPT 関連キーは無し）
- `grep -n "autoMemory" .claude/settings.local.json` → このワークツリーに当該ファイルは存在しない（local-only 設定のため worktree 間で共有されない）。ただし前回レビュー（2章 #1）で `my-blog/.claude/settings.local.json` に `autoMemoryDirectory` が実在することは確認済みで、今回はこの事実を否定する情報は得られていない
- ChatGPT が Vault を読む設定・接続方法: `find ~ -maxdepth 2 -iname "*chatgpt*"` で該当なし（ダウンロード済みアプリのインストーラー・画像のみ）。**Vault 接続の実装は確認できなかった**

**判断**: 実態は「記憶を共有できるのは Claude / Codex / Gemini の3ツール」であり、ChatGPT は Vault に接続していない。本文 L140 が既に述べる「筆者はこの役割を Claude / ChatGPT 上のプロンプト規約として与えた1エージェントとして運用している」という記述と整合させ、ChatGPT は「Hermes 運用のプロンプト基盤／人間による手動転記」という別枠の扱いに揃えた。実在しない接続方法は書いていない。

**反映（articles/ai-second-brain-multi-agent-memory.md L150-152 相当、F5 の重複解消と同一箇所で統合実施）**:

```diff
-実行者（Claude Code / Codex / Grok / Gemini）は、割り当てられた範囲だけを担当します。記憶を共有する併用ツール（Claude / Codex / Gemini / ChatGPT）に加え、最新情報の調査や外部比較は Grok に振る、という役割の振り分けです。勝手にスコープを広げず、成果物には前提・変更点・検証結果・残リスクを書きます。そして**外部投稿・破壊的変更・永続設定の変更はしません**。
-
-記憶を共有する4ツール（Claude / Codex / Gemini / ChatGPT）に加え、調査特化の Grok を実行者として役割分担に組み込みます。次の表の「避けること」列は、机上のルールではなく仕組みのブロックと二重化しています（後述）。
+実行者（Claude Code / Codex / Grok / Gemini）は、割り当てられた範囲だけを担当します。記憶を共有する併用ツールは Claude / Codex / Gemini の3つで、これに加えて最新情報の調査や外部比較を Grok に振ります。ChatGPT は Vault への接続方法を持たないため実行者には含めず、Hermes 運用のプロンプト基盤として使うか、必要な内容は人間が手動で転記します。勝手にスコープを広げず、成果物には前提・変更点・検証結果・残リスクを書き、**外部投稿・破壊的変更・永続設定の変更はしません**。次の表の「避けること」列は、机上のルールではなく仕組みのブロックと二重化しています（後述）。
```

役割分担表（Role テーブル）は元々 ChatGPT を行として含んでおらず、この反映と矛盾しない。

### F5（再掲） — medium: 同じ内容の段落が連続している

G1 の反映（2段落を1段落へ統合）で同時に解消。詳細は 3 章 F5 の「反映状況」参照。

### G2 — medium: Hermes の説明が既存 note 記事と食い違って読める

**該当箇所**: L140（「特定の製品やサービスの名前ではなく、役割そのものを指す呼び名」という説明）と、公開済み note 記事 `https://note.com/mine_unilabo/n/nc1ac531190c9`（「Hermes Agent を『依頼窓口』として導入し始めた」）

**問題**: 両記事を読む読者には「役割の呼び名」（本記事）と「導入した実体」（note）が衝突して見える。旧レビュー4章（PR #537 由来の medium 1件）で既に「粒度差」として指摘されていたが未反映のまま残っていた。

**対応方針**: 本文中の説明を変更すると記事の主張（Hermes=役割の呼び名という中核設計）に踏み込むため、`## 参考` 節への note 記事へのリンク追加のみで対応した（本文中の断定は変更していない）。AGENTS.md の「記事内クロスプラットフォーム参照」規約（本文中への配置禁止・末尾リンク集への配置のみ許可）に従い、リンクは `## 参考` 節配下に置いた。`npm run check:note-ref` で `no note.com/mine_unilabo links outside allowed sections` を確認済み。

**反映**:

```diff
 - 関連: [推測で書いた学びが次の罠になった — AGENT_LEARNINGS.md の運用設計](https://zenn.dev/minewo/articles/agent-learnings-md-operation)
+- 関連: [Hermes Agentを「依頼窓口」として導入し始めた](https://note.com/mine_unilabo/n/nc1ac531190c9) — 「役割の呼び名」（本記事）と「導入した実体」（note）は別の粒度の説明
```

この対応で旧レビュー4章の note 粒度差指摘（PR #537 由来）は解消として扱う。

### 反映後の検証

- `npm run check` → exit 0（全チェック通過。`check:note-ref` OK、`check:internal-links` OK）
- articleHash: `de26d5b3ce87a0dc09d4b700cbe5c8ad609e3606` → `5b87649768cb5df4a159a8c4e42ffbe115972ad5`（F1 反映後）→ `b43e3cbbe4329377cece98789e90ffee73cb9822`（G1/F5/G2 反映後）
- `published: false`、タイトル、`topics`、記事の中心的主張は変更していない
