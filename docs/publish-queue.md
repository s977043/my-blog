# Publish Queue（週次公開キュー）

週次公開スケジューラ（[`weekly-publish-schedule.md`](./weekly-publish-schedule.md)）が参照するキュー。**`## Queue` の先頭が次に公開する1本**。月次振り返りで Rolling roadmap（[`content-channel-strategy.md`](./content-channel-strategy.md)）から補充する。

## エントリ形式

```
- platform: <qiita|zenn>
  basename: <ファイル名（拡張子なし）>
  path: <リポジトリ内パス>
  review_class: <Full|Standard|Light>
  goal_dod: <誰の・どの課題を解決し、読者は何ができるか 1行>
```

`- [SKIP] <理由>` を先頭に置くとその週はスキップ（publish ジョブが消化）。

## Queue

- platform: qiita
  basename: claude-code-scope-creep-countermeasure
  path: Qiita/public/claude-code-scope-creep-countermeasure.md
  review_class: Full
  goal_dod: Claude Code 利用者の「AIが実装範囲を勝手に広げる」課題を解決し、読者は実装前の境界設定を実践できる

- platform: qiita
  basename: ai-coding-preflight-checklist
  path: Qiita/public/ai-coding-preflight-checklist.md
  review_class: Full
  goal_dod: AIコーディング実務者の「計画が曖昧で実装後レビューが重い」課題を解決し、読者は5項目チェックを実践できる

## Done

（公開済みエントリを公開日とともにここへ移動）
