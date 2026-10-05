---
title: "AIが速くなったら、判断がボトルネックになった"
---

AI支援開発で最初に注目しやすいのはコード生成速度です。しかし、AIが長く自律的に動けるようになるほど、別の問題が目立ってきます。

> **その成果物を、本当にそのまま受け入れてよいのか。**

River Reviewの設計思想では、これを **実装速度と判断速度の非対称** と整理しています。

## 生成速度だけが上がっても、判断は消えない

AIは実装diff、テスト、設計案、Plan、PR説明、レビューコメント、修正案まで短時間で作れます。

~~~text
Generate faster
      ↓
More artifacts
      ↓
More things to trust or reject
      ↓
Judgment becomes the bottleneck
~~~

レビューを全部人間が同期的に読むなら待ち時間が増えます。逆に「AIが書いたのでAIに全部レビューさせる」と、今度はレビュー結果をどこまで信じるかという問題が残ります。

つまり問題はレビュー量をゼロにすることではなく、**判断をどこへ置くか**です。

## River Review自身の開発でも、レビューは一度で終わらなかった

River Reviewの2026年9月5日の開発振り返りでは、範囲レビューを繰り返した結果、あるPRで「変更が対象機能だけに閉じず、別サブコマンドの意味まで変わる」静かな変更が見つかりました。さらに次の巡回では、別の引数消費漏れによってexit codeが変わる問題も見つかっています。

同じ振り返りでは、並列開発した2つのPRでconsumer側fixtureがproducerの実物データ形とずれ、両方を統合するとmainが赤くなる状態も記録されています。

ここから一般的なAI性能を断定することはしません。この事例から持ち帰るのは、次の構造です。

~~~text
Implementation
   ↓
Review
   ↓
New evidence
   ↓
Revision
   ↓
Review again
~~~

レビューは完成物へ最後にスタンプを押す工程ではなく、**判断に必要なEvidenceを増やすループ**です。

## 人間の注意をすべてへ均等に使えない

型エラー、依存方向、一時対応の撤去条件、Plan-Diff整合、認証境界の承認は、同じ種類の判断ではありません。

機械で証明できるもの、明示ルールで検出できるもの、意味理解が必要なもの、責任を伴うものがあります。

これらを適切な層へ配置する考えが、後で扱う **Judgment Placement** です。

## この章で持ち帰ること

AIが速くなるとレビューが不要になるのではありません。**何を、どのEvidenceで、どの層が判断するのか**を設計する必要性が高まります。

### Sources

- [River Review 設計思想](https://github.com/s977043/river-review/blob/main/docs/philosophy.md)
- [2026-09-05 Harness Session Retrospective](https://github.com/s977043/river-review/blob/main/docs/development/retrospectives/2026-09-05-harness.md)
