---
title: "付録A つまずき集・バイパス・アンインストール"
---

実践 Book として、現場で必ず出会う「動かない」「邪魔だ」を救済する手順をまとめます。ゲートは正しく機能するほど、どこかで邪魔になります。そのとき安全に逃げられる出口を知っておくことが、PlanGate を捨てずに使い続ける鍵です。

## Hook が発火しない

Hook が期待どおりに動かないときは、まず配線を確認します。

```bash
# 環境チェック（不足を診断）
bin/plangate doctor

# Hook の配線を自動修正（--dry-run で事前確認可）
bin/plangate doctor --fix --dry-run
bin/plangate doctor --fix --yes
```

`.claude/settings.json` に Hook が配線されていないと、PreToolUse hook（EH-1 / EH-2 / EH-3 など）は発火しません。`doctor --fix` がこの配線を行います。

## Hook が誤爆する（止めてほしくないのに止まる）

初期は **default モード（warning のみ）** で運用し、誤検知のパターンを観察してください。warning なら作業は止まりません。

```bash
# strict を一時的に解除して default に戻す（環境変数を外すだけ）
unset PLANGATE_HOOK_STRICT
```

誤爆が特定の操作に限られるなら、その操作のときだけ bypass します（下記）。恒常的に誤爆するなら、PBI の `forbidden_files` やスコープ宣言（plan.md の Files）を見直すほうが筋です。

## ゲートが邪魔な時の緊急バイパス

どうしても今すぐ進めたいときは、bypass で一時的に Hook を無効化できます。**禁止ではなく、記録付きで許す**設計です。

```bash
# このコマンド/セッションだけ Hook を pass させる
PLANGATE_BYPASS_HOOK=1 <実行したいコマンド>
```

bypass しても、監査ログには `BYPASS` として必ず記録されます。「いつ・誰が・なぜ逃げたか」が残るので、後から説明できます。常用は禁物ですが、緊急時の出口があること自体が運用継続の条件です。

```text
<ISO8601 UTC>	BYPASS	check-c3-approval	TASK-0001	PLANGATE_BYPASS_HOOK=1 set
```

## 既存 CI と競合した

ローカル Hook（PlanGate）と CI（GitHub Actions 等）で同じ検査を二重に走らせると、競合や無駄が生じます。第 4 章の方針どおり、**検査を分担**してください。

- ローカル Hook: 書くその瞬間の逸脱検知（速い・きめ細かい）
- CI: マージ前の最終関門（テスト通過・レビュー承認の保証）

同じ検査を両方でやらない、を原則にすれば両者は多層防御として補完します。

## Windows / WSL での差異

<!-- パス区切り文字 / 実行権限 / Git Hook の挙動差異など -->

PlanGate は POSIX shell 前提のため、Windows ではネイティブでなく **WSL 上での実行を推奨**します。パス区切り（`/` と `\`）、シェルスクリプトの実行権限、Git Hook の起動挙動が Windows ネイティブと WSL で異なるため、トラブルを避けるには WSL に揃えるのが確実です。

## 段階的に外す / アンインストール

導入をやめる、あるいは一部だけ無効化するのも簡単です。

- **一部の強制だけ外す**: `.claude/settings.json` から該当 Hook の配線を削除（または strict を default に戻す）
- **全 Hook を止める**: `PLANGATE_BYPASS_HOOK=1` を常設、または Hook 配線を外す
- **完全に外す**: PlanGate の Hook 配線を `.claude/settings.json` から削除すれば、リポジトリ本体には影響しない

「いつでも外せる」ことが分かっていると、導入の心理的ハードルは大きく下がります。まず default で試し、合わなければ外す ―― それで構いません。
