---
name: talk-slide-design
description: Story ArchitectureからMarp互換の登壇スライドを作る。1 slide = 1 message、Progressive Disclosure、図中テキスト最小化、投影可読性、Speaker Notesへの説明分離を重視する。
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
---

# talk-slide-design

`brief.md` と `story.md` から `deck.md` を作るためのSkill。

初回実装では特定テーマや外部Marpツールを必須依存にしない。
生成物は標準Marp互換Markdownを基本とする。

## 1 slide = 1 message

各スライドに内部コメントで `message` を1つ置く。

```markdown
<!--
message: AIを使い切ることより、価値が流れることを優先する
time: 1:00
-->
```

1枚に複数の結論がある場合は分割する。

## スライドは原稿ではない

避ける:

- 長い本文段落
- 文章をそのまま箇条書きへ変換
- 図の箱の中に説明文を詰め込む
- Speaker Notesと同じ文章を表示する

優先する:

- 短い見出し
- キーワード
- 数値
- 対比
- 図
- 具体例
- 1つの問い

## Progressive Disclosure

複雑な図は複製して段階的に要素を追加する。

```text
State A
↓
State A + B
↓
State A + B + C
↓
完成モデル
```

同じ図を複数ページに分けることを「重複」と判定しない。
話の進行に必要な段階表示なら意図的な再利用とする。

## 図中テキスト

箱の中は名前・短いラベルを優先する。
説明は口頭またはSpeaker Notesへ置く。

目安:

- 図中ラベルは短く
- 重要な図中文字は投影時に読めるサイズを確保する
- 16pt未満相当の文字を前提にしない
- 本文テキストは小さく詰めるより、スライドを分割する

数値は絶対標準ではなくレビュー時の警告目安として扱う。

## Slide Types

必要な型だけ使う。

- title
- question
- fact
- quote
- comparison
- timeline
- system / model
- progressive figure
- code
- takeaway

同じ型を連続させすぎない。

## Code Slide

コードは説明対象だけ残す。

- 全ファイルを貼らない
- 差分・重要行だけ
- 口頭で説明できない行を載せない
- 小さな文字へ縮小して解決しない

## Evidence

外部事実・数値・引用には参照先を `references.md` またはスライド内の短い出典へ保持する。

出典情報を可読性のために削除しない。

## Speaker Notesとの責務分離

Deck:
- 視線を向けてほしい情報

Speaker Notes:
- 口頭説明
- 背景
- 遷移文
- 注意点
- 補足事例
- 言わないこと

## 参考設計

`minorun365/minorun-marp-skill` の story / figures / design の責務分離を参考にするが、コード・テーマ・ツールをコピー前提にしない。

## 完了条件

- [ ] 全スライドに実質1つのmessage
- [ ] story.mdの流れと一致
- [ ] core_thesisが変わっていない
- [ ] 説明文を詰め込んでいない
- [ ] Progressive Disclosure候補を適切に分割
- [ ] 視認性を文字縮小で解決していない
- [ ] 重要な出典が保持されている
- [ ] Speaker Notesへ逃がす情報が分離されている
