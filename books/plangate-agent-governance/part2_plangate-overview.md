---
title: "第2部 PlanGateとは何か"
---

ここからPlanGateの全体像を見ます。

個別のコマンド名から入るのではなく、**仕事の流れ・責務の分離・状態の置き場所**という3つの視点で読みます。

この部では次の順で進みます。

1. **Flow** — RequirementからPlan / Approval / Execution / Verificationへ、1タスクがどう流れるか
2. **Architecture** — Workflow / Skill / Agent / Gate / Artifact / Hookが何を担当するか
3. **State** — 会話ではなく、Plan / Current State / Evidence / Handoffへ何を残すか

```text
04 Flow
→ 仕事がどう進むか

05 Architecture
→ 誰が何を担当するか

06 State
→ 現在状態をどこへ残すか
```

この3つを分けると、PlanGateを「Pluginの機能一覧」ではなく、**判断境界を持つGovernance Harness**として理解しやすくなります。
