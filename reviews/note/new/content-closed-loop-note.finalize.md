# content-closed-loop-note Final Gate

> 対象: `articles_note/new/content-closed-loop-note.md`
>
> 実施日: 2026-09-23
>
> 目的: `note-finalize` の公開直前Gateに沿って、本文を変更せず最終判定する。

## Article Contract

- Topic: AI記事制作で、文章生成や自動投稿を増やす前に Signal → Seed → Article → Publish → Metrics → Learning の追跡可能性をどう閉じたか
- Claim: 自動化の中心は文章生成ではなく、状態・根拠・結果をつなぎ、公開後の学びを次の入力へ戻せる仕組みに置く
- Audience: AIを使って記事制作・メディア運用を自動化しているエンジニア / 個人開発者
- Reader Promise: provenance、stable Seed ID、派生Graph、Metrics link、人間の判断境界の最小構成を理解できる

## Terminology Contract

- Concept labelとして維持: Seed / Article Graph / Metrics / Learning / Canary
- 初出で日本語補足: Article Graph（記事の関係図）、Metrics（反応データ）、Canary（本番の流れを最初に通す試験記事）
- 初出後は日本語中心: Human Gate → 人間の承認、query/hash → URLの余分なパラメータ
- `seed_id` / `promoted_to` / `seed_ids` は実装フィールド名なのでコード表記を維持

## Domain Review: PASS

確認した中心事実:

1. 参照元記事は2026-09-12公開。
2. URLを情報インボックスへ蓄積する第1層、当日のnote実績とインボックスから翌日3枠を作る第2層、7時/12時/20時に投稿する第3層が記載されている。
3. PV / スキ / フォロワー増減を翌日の生成へ戻す旨が記載されている。
4. 投稿確認を別系統で監視する旨が記載されている。
5. 本記事では、参照元著者の成果値・再現性を自分の実績として扱っていない。

一次情報:
- https://note.com/like_tulip76/n/n7548bacaf90b

筆者側の実装事実はmain上の以下で確認:
- `article_seeds/media-operating-system/2026-09-23-content-closed-loop.md`
- `docs/article-graph.json`
- `scripts/fetch-channel-metrics.mjs`

## Language Review: PASS

既存 `scripts/check-article-language-density.js` と同一の判定条件を対象記事1本へ適用。

結果:

```text
warningCount: 0
```

英語名詞密集のblocking findingなし。

本文では、初稿に多かった `read-only` / `Human Gate` / `query/hash` を日本語化または初出説明へ変更済み。

## Visual Review: N/A / PASS

- Markdown画像参照: 0
- 記事理解に必須の外部画像: なし
- fenced blockは状態遷移やデータ例を示すテキスト図 / YAML / JSONで、本文と意味が一致している
- 画像本体を確認できないことによるUNVERIFIED要因なし

## Editorial Review: PASS

既存の3ループ論旨レビュー:

- Loop 1: Thesis / logic
- Loop 2: operational boundaries / counterarguments
- Loop 3: note readability / density

結果:

- unresolved Must/High: 0
- Article Contract drift: none
- second thesis: none
- first-time reader path: pass

詳細:
- `reviews/note/new/content-closed-loop-note.thesis-loop.md`
- `reviews/note/new/content-closed-loop-note.md`

## WXR preflight

記事本文側の静的条件:

- H1 title: あり
- ローカル画像参照: なし
- Markdown table: なし
- `]]>` CDATA衝突文字列: 本文なし
- `> 区分: 個人`: `md_to_wxr.py` のMETA_LINE_RE除去対象
- note WXRは常に新規下書きになるため、既存記事上書きリスクなし

WXR生成と公式exportとの差分検証はローカルで次を実行する。

```bash
python3 .claude/skills/note-export-import/scripts/md_to_wxr.py \
  articles_note/new/content-closed-loop-note.md

python3 .claude/skills/note-export-import/scripts/verify_wxr.py \
  articles_note/build/import-content-closed-loop-note-*.xml
```

`verify_wxr.py` は `articles_note/export/<date>/*.zip` の公式WXRを参照するため、ローカル保管済みexportが必要。

## Final Editorial Gate

```text
Article Contract: PASS
Terminology Contract: PASS
Domain Review: PASS
Language Review: PASS
Visual Review: N/A / PASS
Editorial Review: PASS
Thesis Loop: completed (3 loops)

Verdict: READY
```

## READYの意味

`READY` は「記事本文とレビューが公開準備可能」という意味。

自動公開はしない。次のHuman Gateは以下。

1. ローカルでWXR生成
2. `verify_wxr.py` PASSを確認
3. noteへインポートし下書き確認
4. 人間が公開
5. 公開URLをSeedの `promoted_to` へ追加
6. Metrics取得で同じ `seed_id` が付くことを確認
7. 実測結果からLearning Proposalを作る
