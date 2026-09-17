# Media Operating System Article Seeds

Webメディアを継続的に作り、届け、計測し、改善する仕組みを設計・運用する中で得たArchitecture Decision、実験、反証を保存する場所です。

## 目的

- 完成したベストプラクティスではなく、採用時点の設計判断と仮説を残す
- 実運用の変更履歴・調整コスト・権限設計・フロー指標からArchitectureを検証する
- 境界構造の再現性とShared Coreの再利用性を分けて評価する
- 2媒体目以降で、設計・運用モデル・実装のどのレイヤーまで再利用できるか確認する
- 検証結果から仮説や境界を変更した場合、その経緯を追記する

## Index

| Date | Title | Status | Topics |
| --- | --- | --- | --- |
| 2026-09-11 | [Webメディアを4つのリポジトリに分けた。分けたかったのはコードではなく「変更理由」だった](./2026-09-11-four-repository-media-operating-system.md) | `seed` | Architecture / Reason to Change / AI Agent / Growth |

## 検証の基本方針

このseed群では、少なくとも次の3レイヤーを分けて考えます。

1. **Boundary** — Reason to Changeに沿った境界が独立変更と権限分離に効いているか
2. **Operating Model** — 同じ設計・運用フローを別媒体でも再現できるか
3. **Shared Core** — 共通化する価値がある実装を無理なく再利用できるか

共通コードを再利用できないことだけを理由に、境界設計の失敗とは判断しません。逆にShared Coreを作れても、横断調整や例外が増えるなら成功とは判断しません。
