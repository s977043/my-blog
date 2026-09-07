---
title: "危険コマンドを止めるhookを書いたのに、素通ししていた"
emoji: "🕳️"
type: "tech"
topics: ["claudecode", "aiエージェント", "bash", "セキュリティ", "ai駆動開発"]
published: false
---

:::message
**この記事で得られること**

- PreToolUse hook が「検査に到達する前」に素通しする経路と、その実測
- exit code 2 以外の非ゼロは**ブロックしない**という仕様が、fail-open を作る仕組み
- 抽出できなかったときに止める（fail-closed）へ倒す実装と、その副作用

**想定読者**: Claude Code の hook で危険コマンドをブロックする設定を、すでに入れている人

**この記事が扱うもの**: hook の書き方ではなく、**書いた hook が効いているかの検証**です。実際に動く2つの実装（修正前・修正後）に同じペイロードを流し、exit code を突き合わせています
:::

## 動作確認したのに、本番のペイロードでは通っていた

Claude Code の PreToolUse hook で、`rm -rf` などの危険コマンドをブロックする設定を入れていました。

導入時の動作確認もしています。エージェントに `rm -rf ./tmp` を頼み、ブロックされることを目で見て確かめました。

その hook を後から検証したところ、こうなりました。

```bash
# 実際の PreToolUse ペイロードの形で rm -rf を渡す
$ printf '%s' '{"tool_name":"Bash","tool_input":{"command":"rm -rf /"}}' | ./safety.sh
$ echo $?
0
```

**exit 0。素通しです。**

同じ hook に、少し形の違う JSON を渡すとブロックされます。

```bash
$ printf '%s' '{"command":"rm -rf /"}' | ./safety.sh
[safety] Blocked by safety hook: rm -rf
[safety] Command: rm -rf /
$ echo $?
2
```

ブロックされる形と、されない形がありました。そして**されない方が、実際に届くペイロードの形**でした。

この記事は、なぜ素通ししていたのか、どこで検査に到達し損ねていたのか、どう直したのかを、実行結果とともに整理します。

## exit code 2 以外は、ブロックではない

前提としてひとつ確認しておきます。PreToolUse hook の exit code の意味です。

公式ドキュメントはこう書いています。

> ほとんどのフック イベントでは、終了コード 2 のみがアクションをブロックします。Claude Code は終了コード 1 を非ブロッキング エラーとして扱い、1 が従来の Unix 失敗コードであっても、アクションを進行させます。

つまり、

| exit code | PreToolUse での意味 |
| --- | --- |
| `0` | 成功。ツール呼び出しは進む |
| `2` | **ブロック**。ツール呼び出しを止める |
| その他の非ゼロ（1, 5, ...） | 非ブロッキングエラー。`hook error` 通知は出るが、**ツール呼び出しは進む** |

ここが hook の安全性を考えるうえで効いてきます。**hook が途中で死んでも、コマンドは実行される**ということです。

しかも、その他の非ゼロのときはトランスクリプトに `hook error` の通知が出ます。**hook が動いている手応えはあるのに、止まっていない**という状態が作れてしまいます。

## 素通しの経路は「検査の手前」にあった

問題の hook はシェルスクリプトで、こういう構造をしていました。

```bash
#!/usr/bin/env bash
set -euo pipefail

tool_input="${CLAUDE_TOOL_INPUT:-}"
if [ -z "$tool_input" ] && [ ! -t 0 ]; then
  tool_input="$(cat)"
fi

command="${CLAUDE_BASH_COMMAND:-}"
if [ -z "$command" ] && [ -n "$tool_input" ]; then
  if command -v node >/dev/null 2>&1; then
    command="$(printf '%s' "$tool_input" | node -e '...JSON.parse して data.command を取り出す...')"
  fi
  if [ -z "$command" ]; then
    command="$(printf '%s' "$tool_input" | sed -n '...正規表現で "command" の値を拾う...')"
  fi
fi

if [ -z "$command" ]; then
  exit 0          # ← ここ
fi

# ここから危険パターンの照合（rm -rf, git push --force, ...）
```

危険パターンの配列も、pipe-to-shell の検出も、この下にあります。作り込んであるのはそこです。

**しかし、その手前に `command` が空なら `exit 0` する行があります。**

「検査するコマンドが無いなら、止める理由もない」という判断です。単体では自然に見えます。問題は、**`command` が空になる理由が「コマンドが無い」だけではない**ことでした。

抽出に失敗しても、空になります。そして空になれば `exit 0` で通ります。

### 抽出が失敗していた理由

JSON からコマンドを取り出す部分は、こう書かれていました。

```js
try {
  const data = JSON.parse(input);
  if (data && typeof data.command === "string") {
    process.stdout.write(data.command);
  }
} catch (e) {}
```

`data.command` を見ています。

一方、PreToolUse が渡してくるペイロードは、コマンドが 1 階層深いところにあります。

```json
{ "tool_name": "Bash", "tool_input": { "command": "rm -rf /" } }
```

`data.command` は `undefined` です。`typeof` の条件を通らないので、何も書き出さずに終わります。例外も投げません。**エラーではなく、静かに空文字が返ります。**

`catch (e) {}` も効いています。JSON が壊れていた場合も、ここで握りつぶされて空文字になります。

フォールバックの `sed` は、この記事では詳しく触れません。結論だけ書くと、正規表現のエスケープが二重になっていてグループとして機能しておらず、こちらも空を返していました。**フォールバックが壊れていることに気づけなかったのは、本命の経路が「失敗を返さない」設計だったからです。**

## 実測：同じペイロードを両方の実装に流す

修正前と修正後の hook に、同じ 6 パターンを流しました。値はすべて実行結果です。

| 入力 | 修正前 | 修正後 |
| --- | --- | --- |
| `{"tool_input":{"command":"rm -rf /"}}`（実際の形） | **0（素通し）** | 2 |
| `{"command":"rm -rf /"}`（フラットな形） | 2 | 2 |
| 壊れた JSON（閉じ括弧なし） | **0** | 2 |
| JSON ですらない文字列 | **0** | 2 |
| `command` が配列（型違い） | **0** | 2 |
| `{"tool_input":{"command":"ls -la"}}`（安全なコマンド） | 0 | 0 |

さらに、`node` が PATH に無い環境でも試しました。

| 入力 | 修正前 | 修正後 |
| --- | --- | --- |
| `{"command":"rm -rf /"}` / node 不在 | **0** | 2 |

修正前がブロックできていたのは、**6 パターン中 1 つだけ**でした。しかもそれは、実際には届かない形です。

導入時の動作確認は「エージェントに危険コマンドを頼んでブロックされるか見る」というものでした。これは 1 行目のケースにあたります。当時はブロックされたのに、後の検証では素通ししている——ペイロードの形か環境が途中で変わったのだと思いますが、**いつ変わったのかを特定する記録は残っていません**。手で 1 回確かめる方式には、変わったことに気づく手段がありませんでした。

## jq で書いても、経路は残る

シェルで書くなら `jq` を使うほうが素直です。よく見る書き方はこれです。

```bash
command="$(printf '%s' "$input" | jq -r '.tool_input.command // ""')"
if [ -z "$command" ]; then exit 0; fi
```

`.tool_input.command` を見ているので、**先ほどの「1 階層深い」問題は起きません**。正常なペイロードでは正しくブロックできます。

ただし、この形にも通る道が残ります。実行して確かめました。

| 入力 | exit code | ツールは |
| --- | --- | --- |
| `{"tool_input":{"command":"rm -rf /"}}` | 2 | 止まる |
| 壊れた JSON | **5** | **進む**（2 以外の非ゼロ） |
| JSON でない文字列 | **5** | **進む** |
| `command` が配列 | **0** | **進む** |

`set -euo pipefail` を置いてあるので、`jq` がパースに失敗するとスクリプトはそこで死にます。終了コードは `5` です。Unix 的には「失敗した」ですが、PreToolUse にとっては**ブロックではありません**。

型違いのケースはもっと静かです。`// ""` は null と false にしか効かないので、配列はそのまま通ります。文字列比較で `rm -rf` に一致せず、`exit 0` になります。

つまり `jq` に替えても、**「抽出できなかったときに何をするか」を決めていなければ、素通しの経路は残ります**。抽出方法の問題ではなく、失敗時の方針の問題でした。

## 直し方：抽出できなければ止める

方針を先に決めました。

1. 検査対象が**そもそも無い**場合のみ素通しする
2. 入力はあるのに command を取り出せなかった場合は**止める**（fail-closed）

この 2 つを分けるために、「空文字だった」と「抽出に失敗した」を別々に持つようにしました。

```bash
command="${CLAUDE_BASH_COMMAND:-}"
extracted=0
if [ -n "$command" ]; then
  extracted=1
fi

if [ "$extracted" -eq 0 ] && [ -n "$tool_input" ]; then
  if command -v node >/dev/null 2>&1; then
    node_status=0
    command="$(printf '%s' "$tool_input" | node -e '
const fs = require("fs");
try {
  const data = JSON.parse(fs.readFileSync(0, "utf8"));
  const c =
    data && typeof data.command === "string"
      ? data.command
      : data && data.tool_input && typeof data.tool_input.command === "string"
        ? data.tool_input.command
        : null;
  if (c === null) process.exit(3);
  process.stdout.write(c);
} catch (e) {
  process.exit(3);
}
')" || node_status=$?
    if [ "$node_status" -eq 0 ]; then
      # 空文字列の command も「抽出成功」として扱う（検査対象が空なだけ）
      extracted=1
    fi
  fi

  # ...（node 不在時のフォールバック）...

  if [ "$extracted" -eq 0 ]; then
    echo "[safety] Blocked: tool_input からコマンドを抽出できませんでした（fail-closed）。" >&2
    exit 2
  fi
fi
```

変えたのは 3 点です。

**抽出できなかったことを、終了コードで伝える。** `catch` で握りつぶさず `process.exit(3)` で返します。呼び出し側は `|| node_status=$?` で受け取ります。値が非ゼロなら「取り出せなかった」と判断できます。

**空文字と抽出失敗を区別する。** `extracted` フラグを別に持ちます。`command` が空文字でも、抽出そのものが成功していれば `extracted=1` です。「検査対象が空なだけ」と「検査できなかった」は違います。

**両方の形を見る。** `data.command` と `data.tool_input.command` の両方を試します。片方しか見ていなかったのが、そもそもの発端でした。

そのうえで、抽出に失敗したら `exit 2` で止めます。

### フォールバックは「使わない」という選択もある

`node` が無い環境用に `sed` のフォールバックを残しましたが、限界を明示して条件付きにしました。

```bash
    # 【既知の限界】この正規表現は JSON のエスケープ（\" や \\）を解釈できず、
    # 値の途中で切れてしまう。誤った部分文字列で検査すると危険なため、
    # tool_input にバックスラッシュが含まれる場合はフォールバックを使わず
    # fail-closed する
    case "$tool_input" in
      *\\*) : ;;
      *)
        command="$(printf '%s' "$tool_input" | sed -n 's/.*"command"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')"
        ...
```

正規表現で JSON を読むと、エスケープされた引用符のところで値が切れます。**切れた部分文字列で危険パターンを照合すると、危険な部分が落ちた状態で「安全」と判定されかねません。**

不完全に検査するくらいなら、検査しないことを認めて止めるほうが安全でした。バックスラッシュを含む入力ではフォールバックを使わず、fail-closed の経路に落とします。

## 副作用：止めすぎる側にも倒れる

fail-closed にすると、今度は誤ってブロックする側の問題が出ます。

実際、この修正の直後に worktree 環境での誤ブロックが起きました。修正の一環として `main` / `develop` への直接 push を hook 層でもブロックするようにしたのですが、その判定が worktree で意図せず発火していました。これは実環境で確認して解消しています。

fail-open と fail-closed は、どちらかが常に正しいわけではありません。**間違えたときにどちらへ倒れるかを選ぶ**という話です。危険コマンドの遮断では、止めすぎるほうが復旧しやすいと判断しました。止めすぎた場合は気づけますが、素通しは気づけないからです。

そのうえで、誤ブロックを減らす作業は別途必要になります。実装後にテストを 29 件用意し、block 側と pass 側の両方を実ペイロード形状で検証しています。**片側だけのテストでは、この修正は完成しません。**

## 自分の hook を確かめる

特別な道具は要りません。hook スクリプトに標準入力からペイロードを流して、終了コードを見るだけです。

```bash
# 実際に届く形。ブロックされるべき
printf '%s' '{"tool_name":"Bash","tool_input":{"command":"rm -rf /"}}' \
  | ./your-hook.sh; echo "exit=$?"

# 壊れた JSON。検査できないので、止めるべき
printf '%s' '{"tool_input":{"command":"rm -rf /"' \
  | ./your-hook.sh; echo "exit=$?"

# 型が違う。同上
printf '%s' '{"tool_input":{"command":["rm","-rf","/"]}}' \
  | ./your-hook.sh; echo "exit=$?"

# 安全なコマンド。通るべき
printf '%s' '{"tool_input":{"command":"ls -la"}}' \
  | ./your-hook.sh; echo "exit=$?"
```

見るのは `exit=2` かどうかです。`0` はもちろん、`1` や `5` も**通ります**。

依存コマンドを隠して試すこともできます。

```bash
mkdir -p /tmp/emptybin
PATH="/tmp/emptybin:/usr/bin:/bin" ./your-hook.sh < payload.json; echo "exit=$?"
```

`jq` や `node` に依存している hook は、それが無い環境で何を返すかを一度見ておく価値があります。

## おわりに

危険コマンドを止める hook を書くとき、時間をかけるのは危険パターンの列挙です。`rm -rf` を入れ、`git push --force` を入れ、pipe-to-shell を検出する。そこは実際に作り込んでありました。

素通ししていたのは、そのどれでもありません。**パターン照合に到達する手前**でした。

hook の安全性には層があります。

1. パターンが網羅されているか
2. パターン照合まで到達しているか
3. 到達できなかったとき、どちらへ倒れるか

記事も設定例も、多くは 1 を扱います。2 と 3 は、自分で確かめるまで分かりません。そして 2 で落ちている hook は、`hook error` の通知すら出さずに `exit 0` を返すことがあります。**動いているように見えます。**

`exit 2` 以外はブロックではない、という仕様を思い出すたびに、書いたガードが本当に止めているのかを一度流して確かめるようにしています。

---

## 関連記事

- [品質ゲートは効かなかったのではなく、「呼ばれたか」を測れていなかった](https://zenn.dev/minewo/articles/ai-review-gate-not-called)
- [AIエージェントの事故・未遂を、次のガードレールに変える — 実運用3ケースから学んだこと](https://zenn.dev/minewo/articles/proceed-driven-agent-session-log)

## 参考

- Claude Code Docs「Hooks リファレンス」— exit code の意味（2 のみがブロック、その他の非ゼロは非ブロッキングエラー）
  - https://code.claude.com/docs/ja/hooks
