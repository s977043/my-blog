# Article Seeds

記事になる前の一次体験・観測・仮説を保存する場所。

完成原稿ではなく、**何が起きたか / 何を観測したか / どう解釈しているか**を分離して残す。記事制作の品質ゲートや媒体役割をここへ複製しない。

## 正本

- Lifecycle / provenance: [`docs/article-lifecycle-contract.md`](../docs/article-lifecycle-contract.md)
- 媒体役割: [`docs/content-channel-strategy.md`](../docs/content-channel-strategy.md)
- 公開境界: [`docs/publish-operating-policy.md`](../docs/publish-operating-policy.md)

## 新規 Seed

[`TEMPLATE.md`](./TEMPLATE.md) を起点にする。

新規 Seed は最低限、次を持つ。

- `seed_id`
- `source`
- `evidence_status`
- `promoted_to`
- 外部Signalなら `source_url` または `source_ref`

本文では観測事実と解釈・仮説を混ぜない。

記事化判断・構成設計へ進めるときは `.claude/skills/tech-blog-writing/SKILL.md` を入口にする。このSkillは `CAPTURED → TRIAGED → PROMOTED → PLANNED` の上流整理とPlan Approval（Human）への受け渡しを担当し、本文生成・媒体別Review・Final Gate・公開処理は既存フローへ委譲する。

## 既存 Seed

既存ファイルには新しい metadata を一括適用しない。`seed_id` のない Seed は Article Graph 上で `legacy:*` として読み込まれる。

更新機会があり、追跡価値があるものだけ段階的に移行する。

## Article Graph

```bash
npm run build:article-graph
npm run check:article-graph
npm run test:article-graph
```

生成物:

- `docs/article-graph.json`: 機械可読
- `docs/article-graph.md`: 人間向け

どちらも派生成果物。直接編集しない。
