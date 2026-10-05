# 深掘りインタビューの手法

`/reader-review` の「深掘り（任意）」（`.claude/commands/reader-review.md`）で使う、模擬ペルソナインタビューの根拠と原則。週次の軽いレビューが「どこで読むのをやめるか」を探すのに対し、深掘りは 1 本の記事について「誰にどんな価値を出しているか」「何が価値を下げているか」「次に何をするか」を仮説として出す。

2026-10-02 にユーザーインタビュー手法と LLM による模擬ユーザーの研究を調べ、この運用に必要なものに絞って残した。出典は調査時に開いた URL で、原典の本文を開けなかったものは「二次情報」と書いた。

## 結論

- **意見・未来の意図・褒め言葉は証拠にしない**。過去の具体的な 1 回の出来事と、行動・コミットメント（誰に何を送るか、明日何を変えるか）を聞く
- 記事の理解は「分かったか」で測らない。**タスクを持たせて記事から探させ、自分の言葉で言い直させる**
- LLM の模擬読者は平均化し、好意的すぎ、何でも大事と言う。**模擬の回答は仮説で、記事の価値の判定根拠にしない**。来訪動機・離脱点・持ち帰りは実データで裏を取る
- 指摘は確かさで A / B / C に分け、C には「次に見る実データ」を必ず添える

## 1. 吸収する原則

| 原則 | 運用での使い方 | 出典 |
| --- | --- | --- |
| 相手の生活の話をし、過去の具体を聞き、聞く量を増やす。褒め言葉・一般論・機能要望は悪いデータ | 「役に立った」「読みたい」はスコアに入れない。「○○の章があれば」と要望の形で出た答えは、裏の困りごとを聞き返す | The Mom Test（Rob Fitzpatrick）: https://learningleader.com/robfitzpatrick/ 、https://www.momtestbook.com/teachers （悪いデータの 3 類型とコミットメントの扱いは二次情報。書籍本文は未確認） |
| 乗り換えまでを時系列で再構成し、Push / Pull / Anxiety / Habit を直接聞かず出来事から聞き取る | 手順 1（来る前）を「最後に困ったとき、何をしたか。次に何が起きたか。今のやり方を変えなかった理由は」で聞く | JTBD switch interview: https://jobstobedone.org/switch-interview/ 、https://jobstobedone.org/radio/unpacking-the-progress-making-forces-diagram/ |
| 研究の問いと、インタビューの問いを分ける。人は文脈なしの直接の問いに正確に答えられない。"Tell me about the last time you…" | 「この記事の価値は？」を聞かず、来る前の 1 回の出来事と、タスクの遂行で測る | Teresa Torres: https://www.producttalk.org/2024/04/story-based-customer-interviews/ 、https://www.producttalk.org/2022/04/best-customer-interview-questions/ |
| LLM のインタビューコーチは同じ質問への判定が揺れ、観点ごとに呼び出しを分けると観点間で矛盾した | 判定の観点を固定したルーブリックにし、1 本の記事の整理は 1 回でまとめる | https://www.producttalk.org/customer-interview-coach/ |
| 終わり際に相手が話し出す（door-knob phenomenon）。対比（手段・他人・時間）で枠組みを掘る | 最後に「言いそびれたこと」を聞く。不足は「最後に読んだ別の記事とどこが違ったか」で聞く | Steve Portigal: https://portigal.com/seventeen-types-of-interviewing-questions/ 、https://www.uxmatters.com/mt/archives/2013/08/interviewing-steve-portigal-about-interviewing-users.php |
| 自己申告は記憶と社会的望ましさで偏るので観察データと組み合わせる。誘導質問（答えの示唆、相手の言葉の言い換え、感情の決めつけ）を避ける | 「信頼できましたか」と聞かず「疑った記述を 1 つ挙げて」と聞く。離脱点は観察データで裏を取る | NN/G: https://www.nngroup.com/articles/user-interviews/ 、https://www.nngroup.com/articles/leading-questions/ |
| 認知的インタビューの probe（理解・言い換え・確信度・想起・一般） | 節を読み終えたら「主張を記事を見ずに 1 文で」「『○○』はどういう意味だと思ったか」「その理解はどれくらい確かか」「読みにくかった箇所は」 | Gordon Willis, Cognitive Interviewing: https://www.hkr.se/contentassets/9ed7b1b3997e4bf4baa8d4eceed5cd87/gordonwillis.pdf/ |
| コンテンツは現実的な開いたタスクで測る。5 秒テストは「何の・誰向けか」を取る。見出しで節を読むか決める（layer-cake） | 冒頭はタイトルとリードだけで「何の記事で誰向けか、読み進めるか」を聞く。見出しだけ見せて「どの節を読むか・飛ばすか」を聞く | NN/G: https://www.nngroup.com/articles/testing-content-websites/ 、https://www.nngroup.com/articles/testing-visual-design/ 、https://www.nngroup.com/articles/layer-cake-pattern-scanning/ 、https://www.nngroup.com/articles/thinking-aloud-the-1-usability-tool/ |
| ユーザーニーズを「As a… I need to… So that…」と受け入れ基準で書く。根拠は既存のアクセス解析や問い合わせから集める | ペルソナを属性ではなくジョブで定義する | GOV.UK: https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/plan-manage-content/identify-user-needs/ |
| 読後にもう一度検索する必要があるか。一次の経験と深さが示されているか | 「読んだ後、何で検索し直すか」「筆者が実際にやった記述と一般論を分けて」 | Google Search Central: https://developers.google.com/search/docs/fundamentals/creating-helpful-content |

## 2. 模擬インタビューの限界

| 偏り | 研究での観察 | 出典 |
| --- | --- | --- |
| 好意的すぎる・何でも大事 | 合成ユーザーは全コースを修了したと答えた（実際は 7 中 3 で中断）。7 要素をすべて同等に重要と答えた（"Synthetic users seem to care about everything"） | NN/G "Synthetic Users": https://www.nngroup.com/articles/synthetic-users/ |
| 平均化・分散が小さい | 平均値は調査とほぼ同じだが "less variation in responses than in the real surveys"。言い回しの小さな違いで分布が変わり、3 か月で結果が有意に変化した | Bisbee ら（Political Analysis 2024）: https://ideas.repec.org/a/cup/polals/v32y2024i4p401-416_2.html 、NN/G のレビュー: https://www.nngroup.com/articles/ai-simulations-studies/ |
| 集団の描き方が平板 | "LLMs are likely to both misportray and flatten the representations of demographic groups" | Wang, Morgenstern, Dickerson: https://arxiv.org/abs/2402.01908 |
| 前向きな平均像へ収束 | "converge toward a positive average person, exhibiting hyper-activity, persona homogenization, and a utopian bias" | Chen ら（OmniBehavior）: https://arxiv.org/abs/2604.08362 |
| 迎合 | 相手の見解に合う応答ほど好まれ、RLHF の学習信号自体から迎合が生じる | Sharma ら: https://arxiv.org/abs/2310.13548 |
| 書き手の確証バイアス | 誰を模擬するかを研究者が決められるため、期待どおりの答えしか出ない（"you will not learn anything because you already have expectations"） | Kapania ら "Simulacrum of Stories": https://arxiv.org/html/2409.19430 |
| 素材の有無で精度が変わる | 本人の 2 時間インタビューを与えた個人エージェントは再回答一貫性比 83%、属性だけのベースラインは 74%。実在の回答者の背景で条件付けると集団の回答パターンを再現しやすい | Park ら: https://arxiv.org/abs/2411.10109 、Argyle ら: https://arxiv.org/abs/2209.06899 |

ここから運用で守ること:

1. 用途は仮説づくりと、次に見る実データの決定に限る
2. ペルソナには実在の読者の痕跡（検索語、X の紹介文、コメント）を素材として渡す。属性だけで作らない
3. 意見が割れるようにペルソナを組み、全員の称賛は失敗のシグナルとして扱う
4. ペルソナは互いの回答を見ない別々のサブエージェントで動かし、書き手の意図やレビュー観点を渡さない
5. 「途中でやめる」「分からない」「興味がない」を正しい回答として明示する
6. 揺れが疑わしい問いは言い換えて 2 回聞き、安定しない回答は採用しない

### 指摘の確かさ（A / B / C）

| 段 | 意味 | 例 |
| --- | --- | --- |
| **A** | 実データの裏付けがある（GA4・Search Console・ダッシュボード・いいね・X の投稿・リンクの有無など、取得した値やリポジトリで確かめた事実） | 平均エンゲージメント時間が全体平均より短い、関連記事からの張り返しが無い |
| **B** | 本文の文字から確かめられる（誰が読んでも同じ箇所を指せる） | 表記の不一致、リンクの欠落、説明なしの固有名、見出しと本文の食い違い |
| **C** | 模擬の回答だけが根拠 | 来訪動機、離脱点、共有したい段落、欲しい内容 |

C の指摘には「次に見る実データ」を必ず添える。A と B は記事の修正判断に使ってよいが、C は実データで裏が取れるまで判断材料にしない。

## 3. 実データで裏を取る対応表

| 模擬で得たもの | 模擬の確かさ | 裏を取る実データ |
| --- | --- | --- |
| 来訪動機・検索語 | 低（創作されやすい） | Search Console の検索クエリ、GA4 の参照元、X の紹介文 |
| 第一印象（何の・誰向けの記事か） | 中 | X の紹介文・コメントで記事がどう要約されているか |
| 用語の誤解・言い換えのずれ | 中〜高（本文の文字から生じる） | 本文で確かめれば B に上がる。実読者に言い換えの probe を 1 問だけ聞く |
| 離脱点 | 低（模擬は読み切りがち） | 読了率・スクロール深度・平均エンゲージメント時間 |
| 持ち帰り・共有する段落 | 低 | X やコメントで実際に引用・スクリーンショットされた段落、いいね・ストック・ブックマーク |
| 足りないもの | 中（仮説として） | 読後の検索語、質問コメント |
| 信頼を損なう記述 | 中 | 公式ドキュメントとの突合（`article-domain-review` の範囲） |

媒体ごとに取れる値が違う（note は PV・スキ、Qiita はいいね・ストック、izanami は現時点で取得手段なし）。取れない値は「データなし」と書き、推測で埋めない。

## 4. 参考にした公開 skill

| リポジトリ | 取り入れたこと |
| --- | --- |
| https://github.com/theletterf/impersonaid | ペルソナに具体的なタスクを持たせて文書を読ませる形（手順 3）。作者自身が「本物の調査の代わりにならない」と明記している点も同じ立場で扱う |
| https://github.com/takechanman1228/claude-persona | ペルソナごとに別コンテキストで実行し、ペルソナ間の影響とプロジェクト文脈の混入を防ぐ（手順 0） |
| https://github.com/47096/persona | 意見が割れるようにペルソナを設計し、全員の熱意を失敗のシグナルとして扱う。「拒否」「分からない」も有効なデータとして数える。結果に仮説水準である旨の注記を付ける |
| https://github.com/datht-work/PersonaTwin-skill | 未来形の約束（"I would use this"）を反パターンとして扱う。現状維持の理由を必ず言わせる（手順 1 の Habit） |
| https://github.com/coreyhaines31/marketingskills/blob/main/skills/customer-research/SKILL.md | 統合の型（ジョブ・痛み・きっかけ・望む結果・言葉・検討した代替）。整理の「価値の仮説」の切り口に使う |
