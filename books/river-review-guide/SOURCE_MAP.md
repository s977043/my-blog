# River Review Zenn Book — Source Map

> 内部編集用。Zennのchaptersには含めない。
>
> Verification snapshot: River Review `a61dadfccdcf9ef154ebb23e354a7396a2123ff6` / Latest Release `v1.126.0`（2026-10-05）
> Reverified: 2026-10-06 — 前回snapshot `60f55e7` から70 commits。本書が状態を述べる項目（Review Coverage / Riverbed / Loop Convergence / Progressive Disclosure / verify gate / Non-goal）とREADMEの差分を照合し、主張の変更なし

## 目的

各章末の `### Sources` は読者向けの出典です。

このファイルは逆に、**River Review側の仕様や設計が変わったとき、Bookのどの章を再確認すべきか**を追跡するためのmaintenance mapです。

Source type:

- **Design** — philosophy / concept / explanation。設計意図と責務境界
- **Reference** — schema / contract / stable interface。具体仕様
- **Runtime** — 実装コード。現在の実行挙動
- **Issue** — 実装背景・Gap・roadmap
- **Observed** — retrospective / 実行記録。実際に観測した事例

## Chapter → Primary Sources

| 章 | 主な一次情報 | Type | 再確認ポイント |
| --- | --- | --- | --- |
| 01 判断がボトルネック | `docs/philosophy.md`, `docs/development/retrospectives/2026-09-05-harness.md` | Design / Observed | 実体験を一般論へ広げすぎていないか |
| 02 レビューの価値 | `docs/philosophy.md`, `pages/explanation/human-judgment-focus.md` | Design | ReviewとApprovalの境界 |
| 03 判断基準の所有権 | `README.md`, `docs/philosophy.md` | Design | repo-owned / provider-agnosticの位置づけ |
| 04 Review Judgment as Code | `pages/explanation/concept.md`, `skills/midstream/hallucinated-reference/SKILL.md` | Design / Runtime asset | Skill実例とfalse-positive guard |
| 05 River Reviewの責務 | `README.md`, `docs/philosophy.md`, `pages/explanation/review-scope.md` | Design | Non-goal / PlanGateとの境界 |
| 06 開発の流れをレビュー | `pages/explanation/review-scope.md`, `pages/reference/artifact-input-contract.md` | Design / Reference | Review対象Artifact |
| 07 Skills / Gates / Riverbed | `README.md`, `pages/explanation/concept.md` | Design | Core Modelの3責務 |
| 08 実行モデル | `README.md`, `pages/explanation/what-is-river-review.md` | Design | Agent / Headless / deterministic実行 |
| 09 Skill設計 | `pages/reference/skill-schema.md`, `pages/explanation/skills.md` | Reference / Design | schema fields / evaluationType |
| 10 Artifact境界 | `pages/reference/artifact-input-contract.md`, `pages/reference/review-artifact.md` | Reference | 入出力contract |
| 11 Evidence | `src/lib/verifier.mjs`, `pages/reference/review-artifact.md` | Runtime / Reference | Verifierが意味判断へ越境していないか |
| 12 Judgment Placement | `pages/explanation/judgment-placement.md`, `pages/reference/skill-schema.md` | Design / Reference | 4層モデル |
| 13 Human Judgment | `pages/explanation/human-judgment-focus.md`, `pages/explanation/judgment-placement.md` | Design | Cliff / Hill / Field |
| 14 First Review | `README.md`, `pages/guides/agent-workflow.md` | Guide / Design | Plugin / agent workflowの現行手順 |
| 15 Plan Review | `pages/explanation/review-scope.md`, `pages/reference/artifact-input-contract.md` | Design / Reference | PlanGate非依存を維持 |
| 16 Diff Review | `src/lib/verifier.mjs`, `pages/reference/artifact-input-contract.md` | Runtime / Reference | pre-existing判定 / diff scope |
| 17 Test Review | `pages/reference/artifact-input-contract.md`, `pages/explanation/review-scope.md` | Reference / Design | test resultとadequacyの分離 |
| 18 Wチェック | `pages/guides/w-check.md`, `pages/reference/artifact-input-contract.md` | Guide / Reference | review-self / review-external |
| 19 Repo-wide Review | `pages/guides/repo-wide-review.md`, Issue #650 | Guide / Issue | Context budget / redaction / suppression |
| 20 Review Coverage | `docs/development/review-coverage-contract.md`, `pages/reference/stable-interfaces.md`, Issue #2212 | Reference / Issue | Experimental状態 / Gate opt-in |
| 21 Generation / Verification | `src/lib/verifier.mjs`, `pages/explanation/judgment-placement.md` | Runtime / Design | rule-based checkの実装範囲 |
| 22 Context Engineering | `pages/explanation/progressive-disclosure.md`, `pages/guides/repo-wide-review.md` | Design / Guide | proto / plannedの状態差 |
| 23 Review Team | `README.md`, `pages/reference/artifact-input-contract.md` | Design / Reference | Reviewer Role / reviewSignals |
| 24 Riverbed Memory | `pages/explanation/riverbed-memory.md`, `pages/reference/riverbed-storage.md`, `pages/reference/stable-interfaces.md`, Issue #474 | Design / Reference / Issue | v1 implemented と interface stability |
| 25 Suppression / Resurface | `pages/reference/riverbed-storage.md`, `pages/guides/repo-wide-review.md` | Reference / Guide | expiry / scope / resurface条件 |
| 26 Skill Evaluation | `pages/reference/evaluation-fixture-format.md`, `pages/guides/planner-evaluation.md` | Reference / Guide | positive / negative fixture、planner eval |
| 27 Improvement Loop | `pages/explanation/judgment-placement.md`, `pages/guides/adopter-playbook.md` | Design / Guide | promotionを万能自動化にしない |
| 28 Generate → Review → Revise | `pages/reference/loop-convergence-contract.md`, `docs/development/review-coverage-contract.md`, `docs/ai/generate-review-revise-loop.md` | Reference / Design | Coverage qualification / caller ownership |
| 29 One Skill | `pages/guides/adopter-playbook.md`, `pages/guides/use-skill-packs.md` | Guide | 最小導入 / maturity tier |
| 30 Project-specific Judgment | `pages/guides/repo-wide-review.md`, `pages/guides/adopter-playbook.md` | Guide | `.river/rules.md` / private judgment |
| 31 Plugin → CI | `pages/guides/adopter-playbook.md` | Guide | integration mode / comment-only rollout |
| 32 Human Review Boundary | `pages/explanation/human-judgment-focus.md`, `pages/explanation/judgment-placement.md`, `pages/reference/loop-convergence-contract.md` | Design / Reference | VerdictとAuthorityを分離 |
| 33 Continuous Improvement | `docs/philosophy.md`, `pages/guides/adopter-playbook.md`, `pages/reference/evaluation-fixture-format.md`, `pages/explanation/riverbed-memory.md` | Design / Guide / Reference | model改善ではなく判断系改善 |

## Reverse Impact Map

River Review側で次が変わった場合は、最低限この章群を再確認します。

| River Review source | Book chapters |
| --- | --- |
| `README.md` / `docs/philosophy.md` | 01〜08, 23, 33 |
| `skill-schema.md` / Skills | 04, 09, 12, 26, 29 |
| Artifact contracts | 06, 10, 15〜18, 23 |
| `verifier.mjs` | 11, 16, 21 |
| Human Judgment / Judgment Placement | 02, 12, 13, 21, 27, 32 |
| Repo-wide / Progressive Disclosure | 19, 22, 25, 30 |
| Review Coverage / Stable Interfaces | 20, 24, 28, 付録C |
| Riverbed | 07, 24, 25, 33, 付録C |
| Evaluation | 26, 27, 33 |
| Loop Convergence | 28, 32 |
| Adopter Playbook | 27, 29〜33 |

## Source Coverage Audit

2026-10-03の編集レビューで、**01〜33章すべてに最低1つの `### Sources` linkがあることを確認済み（33/33）**。

ただし、Sourceが存在することは主張が永続的に正しいことを保証しません。公開・改訂時にはverification snapshot以降の差分を確認します。
