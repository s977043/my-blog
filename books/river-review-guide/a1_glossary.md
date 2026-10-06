---
title: "付録A River Review用語集"
---

## まず押さえる5語

本文で頻出する語は、最初は次の読み替えで十分です。

- **Skill** — 何を判断するか
- **Artifact** — 何を材料にするか
- **Evidence** — 何を根拠にするか
- **Judgment Placement** — どこで判断するか
- **Human Judgment** — 誰が責任を持つか

細かな定義は以下で確認できます。

| 用語 | 本書での意味 |
| --- | --- |
| Artifact | レビュー対象・判断材料となる構造化成果物 |
| Evidence | Findingや判断を支える確認可能な材料 |
| Finding | レビューで検出された問題・リスク・確認事項 |
| Verdict | Caller / Humanが次の行動を決めるための判定素材 |
| Skill | レビュー職務・基準・適用条件を表す単位 |
| Gate | 適切なフェーズでSkillを実行する境界 |
| Riverbed Memory | 過去判断を次のレビューへ再利用するoperating memory |
| Review Coverage | 必要なReview Unitが実行できたかを表す実行coverage |
| Judgment Placement | 判断を適切な評価層へ配置する設計原則 |
| Human Judgment | 責任・価値・不可逆性を伴う最終判断 |
| Review Judgment as Code | レビュー観点・判断基準・Evidence・責任範囲などを、versioned / repo-owned / testableな資産として持つ考え方 |
| Caller | River Reviewを呼び出す側（Claude Code / Codex / GitHub Actions / 独自workflowなど）。Verdictを受けて続行・停止を決める |
| Authority | merge・承認・停止など、次の行動を決める権限。River ReviewのVerdictとは分けて持つ |
| Verifier | Findingの契約（Evidenceの有無、phase整合、severity上限など）をLLMを使わず機械で確かめる仕組み |
| Question | Evidenceが足りないとき、Findingとして断定せずに確認を求める出力 |
| Human Handoff | 機械やAIで確定できない判断を、人間へ引き渡すこと |
| Deterministic / Heuristic / Agentic Review | Judgment Placementの評価層。機械で証明できる判断、既知patternによる推定、文脈を読む意味判断 |
| Cliff / Hill / Field | 変更リスクに応じた人間監督の3階層（崖・丘・原っぱ）。Judgment Placementとは別の軸 |
| Judgment Promotion | 誤検知・見逃し・繰り返される人間の判断をもとに、判断を別の評価層へ移すこと |
| Suppression / Resurface | 了承済みの指摘を理由・範囲・期限付きで抑制し、条件が変われば再び浮上させる仕組み |
| Review Unit | Review Coverageの最小単位（reviewer role × diff chunk） |
