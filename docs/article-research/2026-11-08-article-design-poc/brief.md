# 記事構成デザイン PoC: 構成案の生成（read-only）

ファイルを編集・commit・push しない。成果は指定の出力ファイル 1 つにだけ書く。他の出力ファイル（scratchpad/poc/ の別名）は読まない。

## 固定条件（Freeze）
- リポジトリ: <repo>/、基準 origin/main = fdc33406836f8ea3642dd385f63fca58a4bbd2a6。読むときは `git -C <repo>/ show fdc3340:<path>` を使う
- Fixture N（note 体験記事）: articles_note/published/nb5d70c30380b.md（公開版のミラー）。履歴参考: commit 9f65b84 の articles_note/new/harness-practice-note.md
- Fixture Z（Zenn 技術記事）: articles/river-review-judgment-placement.md
- 共通ルール: AGENTS.md、.claude/skills/tech-blog-writing/SKILL.md、docs/content-channel-strategy.md、媒体別ガイド（note: articles_note/checklists/note-article-quality-checklist.md、Zenn: articles/README.md）

## 方式
- A（Control）: 共通ルールだけで構成改善案を作る。talk-story / talk-design は読まない
- B（Treatment）: 共通ルールに加え、.claude/skills/talk-story/SKILL.md、.claude/skills/talk-design/SKILL.md、talks/DESIGN.md を読み、本文作成前に次を設計する: (1) Article Contract Snapshot（reader / reader_problem / central_claim / evidence / out_of_scope / channel）(2) Story Architecture (3) Section Map（各 H2 の役割、読者の問い、主張、根拠、前後接続）(4) Editorial Design（情報階層、図・本文の役割、段階的開示、モバイル）(5) Keep / Move / Cut。LT の型を機械的に強制しない

## 守ること
中心主張、一次経験、数値、出典、実装状態を変えない。変更不要な節は NO_CHANGE と書く。主張変更が必要な案は「著者判断」として分ける。本文の全面書き直しはせず、構成案（H2/H3 の並び、各節の要旨、移動・削除候補と理由）を出す。

## 出力ファイルの形式（Markdown）
1. 固定した入力（パス、SHA）
2. 現行構成のベースライン（H2/H3 一覧と各節 1 行要旨）
3. 構成改善案（新しい見出し並び、各節の要旨、変更理由、NO_CHANGE の節）
4. Keep / Move / Cut の一覧と理由
5. 著者判断に回す案
6. 自己申告: 所要時間の目安、読んだファイル一覧

完了報告は出力ファイルのパスと 5 行の要約のみ。
