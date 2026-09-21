# Talk Design System

登壇資料を「読ませる文書」ではなく、話者の説明と同期して聴衆の注意を導く視覚インターフェースとして設計する。

## Philosophy

基本原則は **1 slide = 1 attention target**。

1枚に複数の要素があってもよい。ただし、その瞬間に聴衆が注目すべき対象は1つにする。
要素を増やして情報量を維持するより、削る・分ける・段階表示することを優先する。

## Quality Axes

登壇資料は次の6軸で評価する。

### Focus

- 今どこを見るべきかが明確
- 1枚の主要なattention targetが1つ
- 章名だけの見出しより、そのページの意味が伝わる見出しを優先

### Flow

- 前のスライドを受けて次へ進む
- 問い→答え、原因→結果、Before→Afterなどの因果が追える
- 最後のTakeawayが冒頭の問題へ戻る

### Hierarchy

- Title → Primary Visual / Key Phrase → Secondary Information の順に視線が流れる
- すべてを同じ強さで見せない
- 強調は「重要だから」ではなく「今見てほしいから」使う

### Legibility

- 投影環境で読める大きさを優先
- 収まらない場合に文字を小さくして解決しない
- コントラスト、余白、要素間隔を確保する
- 図中文字は本文より小さくなりやすいため特に注意する

### Truthfulness

- 図、数値、コード、引用が説明対象と一致する
- official_fact / team_practice / author_interpretation / unverified を混同しない
- 視覚的な単純化で技術的な意味を変えない

### Speakability

- Slideは話すためのcueとして機能する
- Slide本文とSpeaker Notesを同じ文章にしない
- transition、間、Cut Listを設計する
- 実際のリハーサル時間を最終判断へ反映する

## Visual Hierarchy

各スライドでは、Primaryを1つだけ決める。

- Big Statement: 一文
- Big Number: 一つの数値
- Diagram: 一つの構造
- Code Focus: 一つの箇所
- Screenshot: 一つの操作または結果
- Comparison: 一つの差
- Question: 一つの問い

Secondary informationはPrimaryの理解を補助する範囲に留める。

## Typography

絶対値を普遍的な正解として固定しない。会場、投影距離、配信環境に合わせて調整する。

ただし以下を原則とする。

- 小さくして収めない
- 図中文字は投影時の実寸を確認する
- 長い説明はSpeaker Notesへ移す
- 1語だけ次行へ落ちる不自然な折り返しを残さない
- decorative fontより可読性を優先する

## Spacing / Whitespace

余白は「余った領域」ではなく構成要素として扱う。

- 主要要素の周囲に呼吸できる空間を残す
- 要素間の距離でグルーピングを示す
- 内容が少ないことを理由に中央へ無理に寄せない
- 過密なら余白を削らず、内容を削るか分割する

## Color / Contrast

- 色だけで意味を伝えない
- 主役以外を弱めて階層を作る
- Accentは数を増やしすぎない
- 背景と本文、図中ラベルのコントラストを投影結果で確認する
- ブランド色を使う場合も可読性を優先して用途別に調整する

## Slide Families

Story上の役割に応じて選ぶ。

- Hook
- Question
- Big Statement
- Big Number
- Evidence
- Example
- Quote
- Before / After
- Comparison
- Progressive Diagram
- Architecture / Model
- Code Focus
- Screenshot / Demo
- Transition
- Takeaway
- Closing

同じ型を続けないこと自体を目的にしない。話の役割が変わるときに表現形式も変える。

## Figures

- 図が主役か、文章が主役かを先に決める
- 図が主役なら文章を見出しと短い導入に絞る
- 箱の中は短い名前・ラベルを基本とする
- 「タイトル + サブ説明」を全箱へ入れない
- 実在する境界と説明上のグルーピングを混同しない
- 矢印は実際の責務・呼び出し方向と一致させる
- 要素を小さくして1枚へ詰め込まない

## Progressive Disclosure

複雑な構造は完成図を最初から見せず、聴衆の視線を増やす順序で段階表示する。

候補:

- 状態遷移
- Before / After
- 原因→結果
- 3要素以上のモデル
- Architectureの責務追加
- Queue / Bottleneckの発生

同じ図を複数スライドで再利用してよい。各段階でattention targetが変わることを確認する。

## Code

- 全ファイルを貼らない
- 説明対象だけ残す
- 1 slideの注目箇所は原則1つ
- 差分、重要行、短い例を優先
- 収まらないコードを文字縮小で解決しない
- 詳細はappendixや配布資料へ逃がす

## Screenshot / Demo

- UI全体ではなく説明対象が分かる構図を優先
- 小さすぎるスクリーンショットを置かない
- 実製品・実リポジトリの紹介では意味のない代替イラストを使わない
- デモ失敗時にもcore thesisが崩れない構成にする

## Accessibility

- 色以外のラベル・形・位置でも意味を区別する
- descriptiveな見出しを使う
- 重要な図の意味はSpeaker Notesにも説明を書く
- 視覚だけで伝わる重要情報を放置しない
- 配布時に再利用可能なテキスト情報を残す

## Speaker / Slide Separation

Deck:
- その瞬間に見てほしい情報
- attention target
- visual evidence
- 短いkey phrase

Speaker Notes:
- 背景
- 説明
- transition
- visual description
- 注意点
- do_not_say
- 補足事例

## Rhythm

デッキ全体で認知負荷を一定にしすぎない。

- 高密度の技術スライドの後に、短いstatementやtransitionを置く
- Diagramが続く場合も、各ページでattention targetを変える
- Sectionの切り替わりでは視覚的にも呼吸を作る
- Closing直前に新しい大論点を追加しない

## Avoid

- 記事本文の箇条書き化
- 長文paragraph
- 装飾目的だけのAI画像
- 意味のないアイコン
- 3D装飾の乱用
- 過度なgradient
- 3 columns以上を安易に使う
- 図中の説明文
- tiny footnote
- Speaker Notesの文章をそのまま表示
- 収まらないためのfont縮小

## Machine-checkable Constraints

各登壇の `design.md` にJSONとして実値を置く。

推奨初期値:

```json
{
  "aspectRatio": "16:9",
  "maxColumns": 2,
  "maxBullets": 5,
  "maxCodeLines": 12,
  "minFigureFontPt": 16,
  "requireAttentionTarget": true,
  "requireRenderVerification": true,
  "requireRehearsalVerification": true
}
```

これらは普遍的な標準ではなく、このリポジトリの初期heuristic。
例外が必要なら `talks/<slug>/design.md` に理由を記録する。

## Verification Layers

### Source Verification

Markdownソースから検査できるもの。

- required artifacts
- slide metadata
- attention target
- time budget
- bullet / code density
- Talk Contract drift
- Visual Contract存在

### Render Verification

実レンダリング後に確認するもの。

- clipping
- overflow
- actual font size
- margin
- contrast
- SVG / image fit
- missing visual elements

### Human Visual Review

機械検査だけでは判断しづらいもの。

- 視線誘導
- 不自然な密度
- 意味の伝わり方
- スライド間のリズム
- 図の理解しやすさ

### Rehearsal Verification

実際に話して確認するもの。

- 実測時間
- transitionの自然さ
- 説明と視線の同期
- Cut Listの実用性
- 聴衆が迷う箇所

`READY` はSourceだけで判断しない。必要なRender / Rehearsalが未実施なら `UNVERIFIED` とする。
