---
title: advisory な AI レビューは「実行失敗」と「指摘なし」を分けて出す（GitHub Models 退役で green のまま止まっていた件）
tags:
  - GitHubActions
  - CI
  - CodeReview
  - LLM
  - GitHubModels
private: false
updated_at: '2026-10-22T12:00:00+09:00'
id: null
organization_url_name: null
slide: false
ignorePublish: true
posting_campaign_uuid: null
agreed_posting_campaign_term: false
---

## 結論

AI レビューを advisory（ジョブを落とさない設定）で CI に入れるなら、**「AI レビューが実行に失敗した」と「AI レビューが動いて指摘がなかった」を別の状態として出してください**。区別しないと、接続先の API が使えなくなっても CI は green のままで、気づきにくくなります。

筆者の個人 OSS（[s977043/river-review](https://github.com/s977043/river-review)）では、GitHub Models の退役（2026-07-30）のあと、AI レビューが動かないまま CI が success を続けていました。この記事では、そのときログに何が残っていたかと、どう出し分けるかをまとめます。

## 経緯

### GitHub Models へ切り替えていた

2026-07-12 に、リポジトリの AI レビュー（LLM レビュー）の接続先を GitHub Models に切り替えました（commit `febb88f2`）。`GITHUB_TOKEN` で `models.github.ai` を呼び、モデルは `openai/gpt-4o-mini` です。API キーを別に用意しなくてよいのが理由でした。

### GitHub Models の退役

GitHub は 2026-07-01 の changelog で、GitHub Models を 2026-07-30 に完全に退役すると告知しました。その前に 07-16 と 07-23 に brownout（予定された一時停止）を行うとも書いています。そして 07-30 の changelog で、playground・モデルカタログ・inference API・BYOK のすべてが使えなくなったと告知しました。

- [GitHub Models is being fully retired on July 30, 2026](https://github.blog/changelog/2026-07-01-github-models-is-being-fully-retired-on-july-30-2026/)
- [GitHub Models is now retired](https://github.blog/changelog/2026-07-30-github-models-is-now-retired/)

### それでも CI は green だった

ワークフローでは AI レビューを advisory にしていました。

```yaml
gate: false # advisory only — never fail the job
```

AI レビューが失敗してもジョブは落ちません。さらにヒューリスティックの判定が 0 件だと、最終的な成果物は「指摘なし」と同じ見た目になります。この状態が issue として記録されたのは、2026-09-23 に #2410 を起票したときでした。

## ログに何が残っていたか

AI レビューの実行ログには、スキップしたスキルの詳細として `- LLM:` で始まる行が出ます。success になった run について、この行を全数確認しました（failure・cancelled などの run のログは見ていません）。

### 退役前: 動いていた

退役前の最後の例は run 30549148396（2026-07-30 13:54 UTC）です。

```text
- LLM: used (`openai/gpt-4o-mini`)
```

### 退役後: 410 brownout

同じ日の夜、run 30583883594（2026-07-30 21:33 UTC）から次の行に変わりました。

```text
- LLM: skipped (OpenAI API error 410: {"error":{"code":"github_models_retirement_brownout","message":"GitHub Models is temporarily unavailable as part of a scheduled retirement brownout."}}
```

この 410 は success run の 95 件に出ていて、最後は 08-10 の run です。run の結論はすべて success でした。

### その後: 200 "OK" で JSON の解析に失敗

09-23 の修正直前には、エンドポイントが `HTTP 200` で本文 `OK` を返すようになっていました。JSON として読めず、AI レビューは使われていない（`llmUsed: false`）扱いになります。

```text
Unexpected token 'O', "OK\r\n" is not valid JSON
```

エラーの形は 410 から「200 だが中身が違う」に変わりました。どちらでもジョブは success のままです。

**退役後から 09-23 の修正までの success run で、AI レビューが `used` になった run は 0 件でした**（success run の範囲での全数確認です）。

### 気づいたきっかけ

気づいたのは、Actions の artifact にあるデバッグ出力の `llmUsed: false` を見たときでした。issue #2410 の Root cause には「LLM failed → heuristic 0 → 最終 artifact が auto-approve / findings=[]」と書いています。実行されなかったレビューが、clean なレビューと同じ形で出ていたわけです。

## どう区別して出すか

### 1. 実行成否を「指摘の件数」と別のフィールドにする

指摘の配列が空かどうかだけでは、「見て何もなかった」と「見ていない」を区別できません。実行成否を別に持たせます。

```json
{
  "llmUsed": false,
  "llmStatus": "error",
  "llmError": "OpenAI API error 410: github_models_retirement_brownout",
  "findings": []
}
```

`findings: []` は `llmStatus` が成功のときだけ「指摘なし」と読めます。状態は少なくとも次の 3 つに分けます。

| 状態 | 意味 | 読み方 |
|---|---|---|
| used | 実行して結果を得た | 指摘の件数をそのまま読む |
| not configured | API キーなどが未設定で実行していない | AI レビューは行われていない |
| error | 実行したが失敗した | AI レビューは行われていない。原因を見る |

### 2. 目に入る場所に出す

artifact の中のデバッグ JSON は、何かを疑ったときにしか開きません。ジョブサマリー（`$GITHUB_STEP_SUMMARY`）や PR コメントの先頭など、毎回目に入る場所に出します。

```bash
if [ "$LLM_USED" != "true" ]; then
  echo "### ⚠️ AI レビューは実行されていません（${LLM_STATUS}）" >> "$GITHUB_STEP_SUMMARY"
  echo "理由: ${LLM_ERROR}" >> "$GITHUB_STEP_SUMMARY"
fi
```

advisory のままでも、「実行されていない」が毎回表示されれば、何日も続く前に気づけたはずです（ここは本事例からの推論で、検証はしていません）。

### 3. 「未実行」で自動承認しない

AI レビューが実行されていないのに、最終結果が auto-approve や「指摘なし」になる経路は塞ぎます。未実行なら結果は「判定なし」として扱い、承認の根拠にしません。

## river-review でやったこと

PR #2414 で、退役したエンドポイントを外しました。

- `models: read` 権限を削除
- `OPENAI_API_KEY` を `secrets.GITHUB_TOKEN` から `secrets.OPENAI_API_KEY` に戻す
- `models.github.ai` を向けていたベース URL の指定を削除し、既定の OpenAI API に戻す

ただし、**このリポジトリには `OPENAI_API_KEY` を設定していないので、修正後も AI レビューは動いていません**。修正後の run（例: run 35849964450）のログは次のとおりです。

```text
- LLM: LLM API key (ANTHROPIC_API_KEY / OPENAI_API_KEY / GOOGLE_API_KEY) not set
```

変わったのは、「動いていないのに指摘なしに見える」状態から、「キーが未設定で動いていない」と明示される状態になったことです。静かな失敗が、明示的な未実行になりました。

## まとめ

- advisory な AI レビューは、外部要因（接続先の退役など）で止まっても CI を落とさない
- 指摘が空であることと、レビューが実行されたことは別の情報。`llmUsed` のような実行成否を別に持たせる
- その状態はジョブサマリーや PR コメントなど、毎回目に入る場所に出す
- 未実行を自動承認の根拠にしない

AI レビューを advisory で入れている方は、直近の run で「実際に実行されたか」がどこに出ているかを一度確認してみてください。
