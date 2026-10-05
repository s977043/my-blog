---
title: "第4部 River Reviewで実際にレビューする"
---

## この部で答える問い

> **同じ変更を、実装前から実装後までどのArtifactでレビューすればよいのか。**

第3部と同じ「User Profile APIへoptional localeを追加する」例を使います。

## 章の流れ

~~~text
First Review
   ↓
Plan
   ↓
Diff
   ↓
Tests
   ↓
Review Result / W-check
   ↓
Repository Context
~~~

新しいツールを章ごとに増やすのではなく、**同じ変更をどのArtifact・Evidenceから判断するか**を切り替えます。

実際のプロジェクトではファイル名やコマンドが異なります。目的はCLI暗記ではありません。

## 読み終えたとき

レビューを「PR完成後の1回」ではなく、**Plan → Diff → Tests → Review Resultへ連続した判断工程として配置**できる状態を目指します。

第5部では、そのレビュー自体が完遂・検証できているかを疑います。
