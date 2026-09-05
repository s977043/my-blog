---
title: "ObsidianをAIエージェントのSSOTにした。でも最新仕様を追って、Memoryの責務を分け直した"
emoji: "🧠"
type: "idea"
topics: ["ai駆動開発", "obsidian", "claudecode", "codex", "memory"]
published: true
---

## 想定読者

- Claude Code / Codex CLI / Gemini CLI / ChatGPT を併用し、知見がツールごとに分断している人
- Obsidian を AI エージェントの共有Memoryとして使っている、または使おうとしている人
- `AGENTS.md` / `CLAUDE.md` / Memory / ADR の責務分担に悩んでいる人

:::message
この記事は2026年9月時点の Claude Code / Codex / Gemini CLI / ChatGPT の公式仕様を確認したうえで、実際に運用してきた構成を見直した記録です。

結論だけ先に言うと、**「ObsidianをSSOTにする」という考え方を捨てたわけではありません。自分がSSOTの対象を広く取りすぎていました。**
:::

## ObsidianをSSOTにする。最初はそれが正解だと思っていた

複数のAIエージェントを使っていると、同じ問題にぶつかります。

Claude Codeには伝えた。Codexには伝わっていない。ChatGPTで整理した前提を、次にGeminiを使うときにまた説明する。

この分断を解く方法として、**Obsidian VaultをAIエージェントのSingle Source of Truth（SSOT）にする**構成を見かけるようになりました。

2026年現在も、Obsidianをcanonical sourceとして外部Memoryへ一方向同期する [Hindsight](https://community.obsidian.md/plugins/hindsight) や、AIが提案したMemoryをreview inboxで承認してからVaultへ書く [Coder Engram](https://community.obsidian.md/plugins/coder-engram) など、VaultをAIの長期知識層として使う実装があります。

:::message alert
ここで紹介するのは実装例です。「ObsidianをSSOTにすること」がClaude Code / Codex / Gemini CLIなどの公式ベストプラクティスだ、という意味ではありません。
:::

発想は分かりやすいです。

```text
              Obsidian Vault
            Single Source of Truth
                    │
       ┌────────────┼────────────┐
       ↓            ↓            ↓
  Claude Code     Codex       Gemini
                    │
                 ChatGPT
```

**AIごとに記憶が分かれるなら、AIの外側に1つの正本を作ればいい。**

自分もこの考え方で実際に運用してきました。

- 人間はObsidianで読む・書く
- 各AIエージェントも同じMarkdownを読む
- 長期記憶を `08 Agent Context/memory/<repo>/` に集約する
- `MEMORY.md` をindexとして使う
- 各AIが得た学びもVaultへ戻す

この構成は機能しました。同じ前提を説明し直す回数は減り、Claude / Codex / Geminiを切り替えても、過去の判断や失敗を引き継ぎやすくなりました。

だから、しばらくは「ObsidianをSSOTにする」で良いと思っていました。

## 最新仕様を確認すると、「Memory」は1種類ではなかった

設計を見直すきっかけになったのは、各ツールのMemory仕様を公式ドキュメントであらためて確認したことでした。

2026年9月時点では、各ツールはそれぞれ異なる永続コンテキストの仕組みを持っています。

- **Claude Code**: 人間が管理する `CLAUDE.md` と、Claude自身が生成する auto memory
- **Codex**: `AGENTS.md` と、別途 local memories
- **Gemini CLI**: `GEMINI.md` などの hierarchical context files
- **ChatGPT**: ChatGPT独自の継続Memory

重要なのは、単に保存場所が違うのではなく、**責務が違う**ことです。

| レイヤー | 役割 | 例 |
|---|---|---|
| Instructions / Contract | モデルへ継続的に伝えるルール | `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` |
| Tool-local Memory | 各ツールが持つ補助的なrecall | Claude auto memory, Codex local memories, ChatGPT Memory |
| Enforcement | モデル判断に依存せず止める境界 | Hook, permissions, sandbox, ruleset, CI |
| Shared Knowledge | 複数ツールをまたいで再利用する知識 | Obsidian Vault |

Claude Code公式では、`CLAUDE.md` は人間が書く instructions / rules、auto memory はClaudeが書く learnings / patterns と分けられています。両方ともモデルへ渡すcontextであり、強制設定ではありません。[Claude Code: How Claude remembers your project](https://code.claude.com/docs/en/memory)

Codex公式も、local memoriesを将来の作業に役立つ recall layer と位置づけ、**必ず守るべきチームガイダンスは `AGENTS.md` またはversion controlされた文書に置く**よう明記しています。[OpenAI: Memories](https://learn.chatgpt.com/docs/customization/memories)

ここで問いが変わりました。

> すべてをObsidianへ集めることより、**「この情報について、何を正として確認するか」を先に決めるべきではないか。**

## 変えたのは「Obsidianを使うこと」ではなく、正本の責務

Before / Afterで見ると、変更点はシンプルです。

| | Before | After |
|---|---|---|
| Obsidian | AIが使う情報全体のSSOT | cross-tool operational memoryのcanonical store |
| AI生成Memory | Vaultへ集約 | tool-localのまま保持し、必要なものだけcandidate化 |
| ルール | Memoryにも保持 | checked-in instructionsへ |
| 強制 | prompt / Memory中心 | Hook / sandbox / ruleset / CIへ |
| 設計理由 | Memoryにも保持 | repoのADR / design docsを正とする |
| 検索index | Vaultと同等に扱い得る | 再生成可能なderived state |

SSOTは「信頼できる情報源を曖昧にしない」ための考え方です。

自分はそれを、いつの間にか **「AIが使う情報を全部1つのVaultへ集める」** と広く捉えすぎていました。

そこで現在は、**関心事ごとにauthoritative sourceを決める**ようにしています。この記事では、この「正本の責務分担」を便宜上 **Authority Mapping** と呼びます。

:::message
以前: 「どこに全部集めるか」を考えていた

今: **「この主張について、どこを見れば正しいか」を先に決める**
:::

## 今の構成：情報の種類ごとにAuthorityを分ける

| 確認したいこと | authoritative source |
|---|---|
| 現在の実装・設定・実行結果 | code / config / tests / CI / runtime observation |
| モデルへ常に伝えるチームルール | version controlされた `AGENTS.md` / `CLAUDE.md` / docs |
| 強制したい安全境界 | repository ruleset / branch protection / CI / Hook / permissions / sandbox |
| 設計判断とその理由 | repoの ADR / design docs |
| 個人が複数AIで再利用する運用知識 | Obsidian shared memory |
| 各ツールが自動的に覚えた内容 | tool-local memory |
| 未検証のメモ・外部情報 | candidate / raw |

```text
                 Repository / Runtime
       ┌─────────────────────────────┐
       │ code / config / tests       │ ← Current state
       │ AGENTS.md / CLAUDE.md       │ ← Behavioral contract
       │ ruleset / CI / permissions  │ ← Enforcement
       │ ADR / design docs           │ ← Decisions
       └──────────────┬──────────────┘
                      │
               verify against
                      ↓
                Obsidian Vault
        Cross-tool Operational Memory
                      │
           ┌──────────┼──────────┐
           ↓          ↓          ↓
        Claude      Codex      Gemini
           │          │
           ↓          ↓
      auto memory  local memories
```

Obsidianは「すべての情報のSSOT」ではなく、**複数ツールをまたいで再利用する operational memory の canonical store**に絞りました。

### Memoryとauthoritative sourceが食い違ったら

単純な優先順位表を作るのではなく、**まず「何についての主張か」を判定**します。

1. 現在の挙動なら code / config / tests / runtime を確認する
2. 必須ルールなら checked-in instructions / policy を確認する
3. 強制境界なら ruleset / CI / Hook / permissions を確認する
4. 設計理由なら ADR / design docs を確認する
5. Obsidian Memoryが矛盾していれば、Memory側を `stale` にして更新または削除する

Memoryが他のauthoritative sourceを上書きすることはありません。

## Obsidianに残すのは「再発見コストが高い知識」

基準は、**現在のリポジトリや公式sourceを見れば簡単に再取得できるか**です。

残しているものは主に次です。

- 個人の非機密な作業上の判断基準・好み
- 繰り返し発生した失敗と確立した対策
- リポジトリ固有の運用上の罠
- 判断理由や背景など、現在のコードだけでは失われる文脈
- 複数ツールで繰り返し使う個人ワークフロー

逆に、次は基本的に残しません。

- API key、token、cookie、認証情報
- 個人情報・会社の機密情報など、共有Memoryへ置く必要のない情報
- 現在のコード・設定・git historyを見れば分かる事実
- そのセッションだけの作業進捗
- 1回の失敗から推測しただけの「学び」
- Webやチャットの生ログ
- repoに置くべきチーム共通ルール

**Memoryは真実そのものではなく、再発見コストを下げるための索引と運用知識**として扱います。

## Tool-local memory と candidate を分ける

Claude Codeのauto memoryやCodex local memoriesは、各ツール自身が生成し、次回以降のcontextとして利用する **tool-local recall** です。

一方、`candidates/` は **cross-tool canonicalへ昇格するためのレビュー待ち領域**です。

```text
Claude auto memory      Codex local memories
      tool-local              tool-local
          │                       │
          └────── propose / copy ─┘
                     ↓
              Obsidian candidates
                     ↓
             Verify / Review
                     ↓
              canonical memory
```

以前はClaude Codeの `autoMemoryDirectory` をVaultのcandidate領域へ向ける案も考えていました。

ただ、auto memoryの `MEMORY.md` は次回セッションでもClaudeへ自動ロードされます。つまり「未検証candidate」と呼んでも、Claude自身にとっては既にpersistent contextです。

そのため現在は、**tool-local memoryはtool-localのまま残し、共有価値があるものだけcandidateとして提案・転記する**方に寄せています。

この「提案 → レビュー → 採用」という流れは、Coder Engramがreview inboxを置いている設計とも近いです。

## canonicalはsingle-writerにする

複数Agentからcanonicalへ直接書かせません。

複数Agentが同じ `MEMORY.md` やtopic fileを同時に更新すると、内容の競合だけでなく「誰が何を根拠に変更したか」も追いにくくなります。

```text
Claude ──→ candidates/claude/
Codex  ──→ candidates/codex/
Gemini ──→ candidates/gemini/
ChatGPT ─→ candidates/chatgpt/
                │
                ↓
        Organizer / Human Review
                │
                ↓
          memory/ canonical
```

各Agentはcandidateまでは提案できますが、canonicalへのpromotionはOrganizerまたは人間の1つの経路に寄せます。

必要ならVault自体をGit管理し、promotionを小さなcommitとして残すと、変更理由を追いやすくなります。

**shared memoryはmulti-reader / single-writerにする。** これで競合と責任境界を減らせます。

## Memoryに状態遷移を持たせる

```text
LOCAL / RAW
    ↓ propose
CANDIDATE
    ↓ verify
CANONICAL
    ↓ source changed / evidence expired
STALE
    ↓ review
CANONICAL or RETIRED
```

`canonical` は「永遠に正しい」という意味ではありません。**現時点で根拠を確認し、cross-toolで再利用してよい状態**という意味です。

## 外部コンテンツはrawのままinstructionへ入れない

Webページ、チャットログ、Issue本文などの外部コンテンツには、命令文やprompt injectionになり得るテキストも含まれます。

そのため `00 Inbox` や `candidates/` に入れたraw dataを、`AGENTS.md` / `CLAUDE.md` から無条件にimportしません。

```text
External content
      ↓
 raw / candidate   ← untrusted dataとして扱う
      ↓
 extract / verify
      ↓
 short canonical note
```

昇格時のレビューも、raw本文に書かれた命令を実行する工程にはしません。

- rawは「指示」ではなく「分析対象データ」として扱う
- review中は不要なwrite / publish / destructive toolを持たせない
- 外部コンテンツの指示に従ってcanonicalを書き換えない
- canonicalへ反映する前に、抽出した主張と根拠を別に確認する

Codexには、external contextを使ったchatをmemory generationから外す `memories.disable_on_external_context` という設定もあります。[OpenAI: Memories](https://learn.chatgpt.com/docs/customization/memories)

## MEMORY.mdは短いindexにする

共有Memoryはリポジトリ単位に分けています。

```text
08 Agent Context/memory/<repo-name>/
  MEMORY.md
  *.md
```

Claude Codeのauto memoryも `MEMORY.md` とtopic filesで構成され、セッション開始時に読む `MEMORY.md` は先頭200行または25KBまでです。[Claude Code memory](https://code.claude.com/docs/en/memory)

共有Memoryでも、**indexだけを短く保ち、必要な詳細を取りに行く**形にしています。

### Vector indexやMCP cacheはderived stateにする

将来、semantic searchやMCP serverを足す場合も、vector DBや検索indexを新しい正本にはしません。

```text
Obsidian Markdown  ← canonical
       │
       ├─→ vector index
       ├─→ MCP cache
       └─→ search database
             ↑
          rebuildable
```

検索indexは壊れてもMarkdownから再生成できる **derived state** にします。

HindsightがObsidianからmemory bankへ一方向同期し、「修正はsource noteで行う」としている構成もこの考え方に近いです。

## Memoryには「根拠」と「無効になる条件」を残す

```markdown
---
name: gh-account-switch
scope: repo
kind: operational-pitfall
status: canonical
verified_at: 2026-09-06
evidence:
  - "observed: PR operation failed under wrong active account"
---

PR操作前に gh の active account を確認する。

**Why:** 認証済みでも、対象repoへの権限がないアカウントではPR操作に失敗するため。
**How to apply:** PR作成・更新・マージ前にactive accountを確認する。
**Invalidate when:** GitHub認証方式や実行ラッパーが変更されたときに再検証する。
```

形式より重要なのは、次を追えることです。

- いつ確認したか
- 何を根拠にしたか
- どこまで適用するか
- 何が変われば再検証が必要か

## candidateをcanonicalへ昇格する条件

現在は次を満たすものだけを昇格させています。

1. 秘匿情報を含まない
2. 適用範囲が明確
3. 根拠を確認できる
4. 対応するauthoritative sourceと矛盾しない
5. 将来も再利用する可能性がある
6. 無効になる条件を説明できる

満たさないものはcandidateのまま残すか、捨てます。

## 各ツールは、同じMemoryを直接共有しているわけではない

### Claude Code

Claude Codeには、`CLAUDE.md` と auto memory の2種類があります。両方ともcontextであり、強制設定ではありません。

auto memoryは既定で有効で、既定保存先は `~/.claude/projects/<project>/memory/`。`autoMemoryDirectory` で別の場所を指定できます。[Claude Code memory](https://code.claude.com/docs/en/memory)

Claude Codeは `AGENTS.md` を直接読みません。共通Contractを `AGENTS.md` に置く場合は、`CLAUDE.md` からimportできます。

```markdown
@AGENTS.md

## Claude Code

- Use auto memory only for tool-local learnings.
- Verify shared memory against the authoritative source for the current claim.
```

### Codex

Codexは `AGENTS.md` / `AGENTS.override.md` を階層的に読みます。project instructionsの合計サイズは既定32KiBです。[OpenAI: AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md)

local memoriesは、

- `~/.codex/memories/` にgenerated stateとして保存
- ChatGPT webのMemoryとは別のlocal store
- 2026年9月時点では既定OFF
- `/memories` でchatごとの利用・生成を制御

という仕組みです。

公式は、local memoriesを **helpful recall layer**、required team guidanceを **`AGENTS.md` / checked-in documentation** と分けています。Codexはgenerated memory fieldsでsecret redactionを行いますが、公式もmemory artifactを共有する前のreviewを勧めています。[OpenAI: Memories](https://learn.chatgpt.com/docs/customization/memories)

### Gemini CLI

Gemini CLIでは、`GEMINI.md` などのcontext filesがhierarchicalに読み込まれます。`context.fileName` は配列も指定できます。

```json
{
  "context": {
    "fileName": ["GEMINI.md", "AGENTS.md"]
  }
}
```

`/memory show` で現在のcontextを確認し、`/memory refresh` で再読み込みできます。[Gemini CLI context](https://google-gemini.github.io/gemini-cli/docs/cli/gemini-md.html)

### ChatGPT

ChatGPTにも継続Memoryがあります。ただし、ChatGPT webのMemoryとCodex local memoriesは別の仕組みです。[OpenAI: Memory FAQ](https://help.openai.com/en/articles/8590148-memory-faq)

本構成ではChatGPT MemoryをVaultとmirrorせず、共有したい学びだけをcandidateとして取り込みます。

## AGENTS.mdをKnowledge Baseにしない

instruction fileへKnowledgeを詰め込みすぎると、それ自体がコンテキストを圧迫します。

Claude Code公式は `CLAUDE.md` を簡潔・具体的に保つよう推奨し、目安として200行未満を勧めています。Codexにもproject instruction chainの既定32KiB上限があります。

```text
AGENTS.md / CLAUDE.md
  = required contract
  + task routing
  + behavioral safety guidance

Obsidian shared memory
  = background knowledge
  + rationale
  + operational learnings

Tool-local memory
  = generated recall
```

**常に必要なものだけを常時ロードする。詳細Knowledgeは必要なときに読む。**

## Memoryに「禁止」と書くだけでは止まらない

Memoryとinstruction fileはモデルの判断材料であり、hard enforcementではありません。

- Claude Code: `PreToolUse` hook / permissions / sandbox
- Codex: OS-level sandbox / approval policy
- Gemini CLI: approval mode / sandbox
- GitHub側: repository ruleset / branch protection / CI

のような強制レイヤーと分けます。Codexの `--dangerously-bypass-approvals-and-sandbox` はsandboxとapprovalを無効にするため、公式にも非推奨です。[OpenAI: Agent approvals & security](https://learn.chatgpt.com/docs/agent-approvals-security)

```text
Knowledge / Memory
        ↓
Behavioral instruction
        ↓
Hook / Approval / Sandbox / Ruleset
        ↓
Side effect
```

**判断はprompt、不可逆な境界は仕組み**へ寄せます。

## 個人Vaultと会社の情報はdeny by defaultで分ける

明示的に許可したrepoだけを個人Vaultの対象にします。

```text
shared-memory policy
  default: deny
  allow:
    - explicitly approved personal repositories
```

`git remote get-url origin` のownerだけでは許可しません。fork、mirror、個人owner配下の業務repo、repository transferなどがあるためです。

また、`~/.claude/.../memory` や `~/.codex/memories` を丸ごとObsidian SyncやGitへ同期しません。cross-toolへ持ち出すのはレビュー済みcandidateだけにします。

## OrganizerはMemoryを整理する。ただし真実を決めない

複数Agentを使うと、candidateを誰が整理するかも必要になります。

自分はこの役割を **Organizer** と呼び、現在はHermes Agentを使っています。

Organizerは、candidateの分類、repo / docs / 一次情報との照合、重複・矛盾の検出、canonicalへの昇格案、staleなMemoryの洗い出しまで担当します。

ただし、**Organizer自身をauthoritative sourceにはしません。**

重要な情報ほど、対応するコード・設定・policy・ADR・一次情報へ戻って検証します。

## 週次で「増やす」より「捨てる」

運用は週次です。

1. `00 Inbox` と `candidates/` を確認する
2. secret・raw transcript・一時状態を落とす
3. authoritative sourceと照合する
4. 設計判断ならrepoのADRへ戻す
5. cross-toolで再利用する運用知識だけ `memory/` へ昇格する
6. `verified_at` が古いMemoryを再確認する
7. 根拠が消えたものは `stale` / `retired` にする

**簡単に再取得できるものは消し、再発見コストが高いものだけ残す。**

## 実際に設計を変えて分かった3つのこと

### 1. 「ObsidianをSSOTにする」は間違いではなかった

ただし、SSOTのスコープを広く取りすぎていました。

Obsidianが強いのは、**ツールをまたいで保持したい個人の運用知識や背景**です。

### 2. 「1つに集める」よりAuthority Mappingが重要だった

コードの話ならコード。モデルへのルールならchecked-in instructions。強制ならruleset / Hook / sandbox。設計理由ならADR。cross-tool operational memoryならObsidian。

**「この主張について、どこを確認すれば最も信頼できるか」** を先に決めるようになりました。

### 3. AIのMemoryは「学習済みの真実」ではない

Claude auto memoryもCodex local memoriesも便利ですが、AIが生成したMemoryはrecall layerです。

cross-tool canonicalへ昇格するには検証が要ります。

## 今の結論

最初はこう考えていました。

```text
AIの記憶が分断する
      ↓
ObsidianをSSOTにする
      ↓
全Agentが同じMemoryを見る
```

この構成は実際に動きました。

ただ、最新仕様と実運用を重ねると、もう一段分けた方が自然でした。

```text
       Authoritative sources
 code / rules / enforcement / ADR
               │
               ↓ verify
   Obsidian operational memory
               │
         cross-tool reuse
               │
    ┌──────────┼──────────┐
    ↓          ↓          ↓
 Claude      Codex      Gemini
    │          │
 tool-local  tool-local
  memory      memory
```

:::message
**Memoryを全部1つに統合するのではなく、正本の責務を分ける。**

Obsidianは「すべての情報のSSOT」ではなく、**cross-tool operational memory の canonical store**として使う。

そして判断するときは、その主張に対応するauthoritative sourceへ戻る。
:::

「ObsidianをSSOTにする」というシンプルな構成から始めたからこそ、どこまでを共有Memoryにすべきかが見えてきました。

ツールが変われば、この境界はまた変わるかもしれません。だから今は、特定ツールのMemory機能よりも、**情報の責務とAuthorityをどう分けるか**を設計することの方が重要だと考えています。

## 参考

### ObsidianをSSOT / shared memoryとして使う構成例

- [Hindsight - Obsidian Plugin](https://community.obsidian.md/plugins/hindsight) — Obsidianをcanonical sourceとして外部memory bankへ一方向同期する構成
- [Coder Engram - Obsidian Plugin](https://community.obsidian.md/plugins/coder-engram) — AI提案Memoryをreview inboxで承認してからVaultへ反映する構成
- [maxtechera/memory](https://github.com/maxtechera/memory) — Cross-platform AI memoryとObsidian syncの実装例
- [obsidian-ia-memory](https://github.com/aguitasantacruz-git/obsidian-ia-memory) — Claude Code / Codex / Cursor等からObsidianをSSOTとして使う構成
- [Claude Codeの記憶をObsidianでSSOT化する設計](https://zenn.dev/fukukei23/articles/claude-code-obsidian-ssot) — 複数AIからObsidianを共通知識源として使う事例

### 公式ドキュメント

- [Claude Code: How Claude remembers your project](https://code.claude.com/docs/en/memory)
- [OpenAI: Memories — ChatGPT / Codex](https://learn.chatgpt.com/docs/customization/memories)
- [OpenAI: Custom instructions with AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
- [OpenAI: Agent approvals & security](https://learn.chatgpt.com/docs/agent-approvals-security)
- [OpenAI: ChatGPT Memory FAQ](https://help.openai.com/en/articles/8590148-memory-faq)
- [Gemini CLI: Provide Context with GEMINI.md Files](https://google-gemini.github.io/gemini-cli/docs/cli/gemini-md.html)
- [Gemini CLI Configuration](https://google-gemini.github.io/gemini-cli/docs/get-started/configuration.html)

### 関連記事

- [ObsidianとSupermemory MCPをつなぐ知識管理ワークフロー](https://zenn.dev/minewo/articles/obsidian-supermemory-mcp)
- [AIエージェントの『進めて』問題：自走と確認の境界をmemoryで永続化する](https://zenn.dev/minewo/articles/ai-agent-autonomy-boundary-with-memory)
- [推測で書いた学びが次の罠になった — AGENT_LEARNINGS.md の運用設計](https://zenn.dev/minewo/articles/agent-learnings-md-operation)
- [Hermes Agentを「依頼窓口」として導入し始めた](https://note.com/mine_unilabo/n/nc1ac531190c9)

---

普段は X（[@mine_take](https://x.com/mine_take)）で、AIコーディングをチーム開発に乗せる運用設計について発信している。
