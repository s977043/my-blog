# Book Plan

## Iteration Log

### Loop 1 — Reader navigation / positioning

#### 検討

- 18章の論点境界は維持する
- Zenn目次では章がフラットに見えるため、7つのPartを独立ページとして追加する
- 既存Bookとの違いを「はじめに」で最初に宣言する
- 最後に中心主張へ戻る「おわりに」を追加する

#### Review

- Reader: PlanGateを知らない読者が、いきなり抽象概念へ入る前に読書目的を把握できる
- Editorial: Why -> What -> Before -> Execute -> Scale -> Improve -> Adopt の位置が目次で見える
- Technical: 既存Bookを置換せず、Plan前後まで扱う別Bookだと明確になった

#### 対応

- `00_introduction.md` を追加
- Part 1〜7 の区切りページを追加
- `99_afterword.md` を追加
- `config.yaml` の章順を更新

#### Post Review

- PASS: 既存Bookとのポジショニング衝突は解消
- PASS: 第4コンテンツ章までにPlanGate全体像へ到達する
- NEXT: 各章の抽象度に差があり、「具体例がある章」と「概念だけの章」が混在しているため、Loop 2でEvidence設計を揃える


### Loop 2 — Evidence traceability / concrete failures

#### 検討

- 抽象概念だけで章を成立させず、PlanGateのIssue / PR / 再現結果へtraceできる構成にする
- 「実例」は成功談だけでなく、Gateが外れた・検出器が誤判定した・greenが嘘だった失敗を優先する
- Observed / Verified / Interpretationを章内で混ぜない

#### Review

- Reader: 概念が「作者の思想」だけでなく、何が起きてその設計になったかで理解できる
- Editorial: 01 / 08 / 10 / 13 / 15 / 16が具体例を軸に相互接続できる
- Technical: Issue / PR番号を固定し、後から現在実装との差分を再確認できる

#### 対応

- 主要8章へ `Primary Evidence` を追加
- #351 / #1277 / #1326 / #1169 / #1085 / #1173 / #1396 / #1411 / #1402 を一次情報として割り当て
- Evidence typeを Observed / Verified で明示

#### Post Review

- PASS: 各Partに最低1つ具体的な一次情報が入った
- PASS: False Green章が抽象的なEval論ではなく、複数の実事故クラスを比較できる構造になった
- NEXT: 一次情報は揃ったが、章同士の責務境界に一部重複がある。Loop 3で重複削減とReader Journeyを最終調整する


### Loop 3 — Responsibility boundary / de-duplication

#### 検討

- 新Bookが既存 `plangate-guide` の「良いPlanの書き方」を再演しないよう責務を固定する
- Concept章とPlanGate具体化章の二段構造は維持する
- 読者が「全部導入しないと意味がない」と誤解しないよう、When NOT to useと段階導入を強化する
- jargonは概念の名前として使うが、最初に日本語で責務を説明する

#### Review

- Reader: 既存Bookを読んでいなくても理解できるが、Plan記法の詳細へ脱線しない
- Editorial: Principle -> PlanGate implementation の反復になり、章の重複ではなく「抽象→具体」の役割差が明確
- Technical: Governance costもtrade-offとして扱い、最大構成をbest practiceとして一般化しない

#### 対応

- 04章へ「PlanGateがやらないこと」を具体化
- 05章を配布形態ではなく責務分解として再定義
- 07 / 18章に既存Bookとのnon-duplication boundaryを追加
- 11 / 16 / 17章のタイトルと論点をreader problem中心へ変更
- Levelを上げる条件とWhen NOT to useを明文化

#### Post Review

- PASS: 既存Book = Plan作成のHow、新Book = Governance設計のWhy/Where/Boundary で分離できた
- PASS: 全18章に固有の役割があり、統合すると失われる論点がある
- PASS: 「全部入りPlanGate推奨」という誤読を抑えた
- PASS: 本文執筆へ進める構成品質に到達
- REMAINING: 各章本文の執筆時に、Issueの当時仕様と現行v8.23+仕様を再照合する


### Draft Loop 1 — Part I first full draft

#### 検討

- 第1部はPlanGateの機能紹介を急がず、「判断の失敗」から入る
- #351の1,697ファイル事例を第1章の主シーンにする
- 第2章でArtifactとEvidenceを明確に分ける
- 第3章でVerification / Review / Judgmentを責務として分離し、第2部の全体フローへ接続する

#### Review

- Reader: 抽象的なGovernance論から始めず、具体的な失敗から読める
- Editorial: 01 -> 02 -> 03が「なぜ / 何を見る / どう判断する」で連続する
- Technical: #351と現行README / philosophyの主張に限定し、一般的な効果を過度に断定していない

#### 対応

- 01〜03章を全文ドラフト化
- 旧Draft placeholder / Primary Evidenceメモを本文へ統合
- 各章末から次章への接続を追加

#### Post Review

- PASS: 第1部だけで中心問題が理解できる
- ISSUE: 「信頼する」という語が強く、Artifact自体を無条件に信頼するようにも読める
- ISSUE: 第3章のHuman Judgmentが「何でも人が決める」に見える余地がある
- NEXT: Loop 2でtrustの表現とautomation/human boundaryを精密化する


### Draft Loop 2 — Trust wording / authority boundary

#### 検討

- 「Artifactを信頼する」を slogan のままにせず、「判断根拠を自己申告から外部確認可能な材料へ移す」と定義する
- Artifact と Evidence の関係を「器 / 主張を支える材料」に分ける
- Judgmentを同期Human approvalと同義にしない
- AutomationできるVerification / Reviewと、Authorityの所在を分ける

#### Review

- Reader: Artifact自体のfalse greenまで後半へ自然につながる
- Editorial: 第2章末の問いが第3章へ直結し、重複が減った
- Technical: 「人間が全部見る」ではなく、risk-based automationとAuthorityの明示というPlanGateの現在方向に整合する

#### 対応

- 02章タイトルを「判断根拠をAgentの自己申告からArtifactとEvidenceへ移す」へ変更
- Artifact / Evidence / Judgmentの定義を精密化
- 03章に「Judgmentは人が全部クリックする意味ではない」を追加
- Autonomy / Authorityへの予告を追加

#### Post Review

- PASS: trustという語の誤解を抑えた
- PASS: Human Judgmentとautomationが対立しない説明になった
- ISSUE: 第1部全体で英語ラベルがまだ多く、初見読者の認知負荷が高い
- ISSUE: 第1章の冒頭は強いが、01〜03章を通した「3つの問い」のまとめがない
- NEXT: Loop 3で用語密度と第1部の読了感を調整する


### Draft Loop 3 — First-time reader / terminology load

#### 検討

- 第1部を「3つの問い」で始め、章ごとの役割を先に渡す
- 英語用語は日本語の責務を説明した後にラベルとして導入する
- #351を一般的なAI性能の証明として使わず、PlanGateの設計変更につながった観測事例として限定する
- 03章の結論でも3つの問いへ戻り、第1部を閉じる

#### Review

- First-time engineer: PlanGate固有語を知らなくても読み進められる
- Tech Lead / EM: 「何を根拠に / 何を確認し / 誰が決めるか」の3点を自分の開発プロセスへ転用しやすい
- Skeptical OSS reader: #351の単一事例を一般化しておらず、Observed factとInterpretationの境界が明確
- Editorial: 01の具体例 → 02の判断材料 → 03の責務分離が一本の導線になった

#### 対応

- Part 1導入へ3つの問いを追加
- Artifact / Evidence / Verification / Judgment / Autonomy / Authorityを日本語先行に変更
- 01章へ単一事例の一般化を避ける注記を追加
- 03章末を3つの問いで再整理

#### Post Review

- PASS: 第1部のReader Journeyが成立
- PASS: 用語の認知負荷を下げつつ、後続章で使う英語ラベルも導入できた
- PASS: 事実 / 設計解釈 / 一般論の境界が明確
- PASS: 第1部（01〜03章）は本文初稿として次Partへ進める状態
- REMAINING: 公開前には全Book横断で表記揺れと現行PlanGate versionとの差分を再監査する


### Part II Draft Loop 1 — Full draft / current architecture alignment

#### 検討

- 第4章で最初にPlanGate全体フローを見せ、「できる」と「進めてよい」を分離する
- 第5章はPlugin分類ではなく、Workflow / Skill / Agent / Gate / Artifact / Hookの責務分解として書く
- 第6章は「単一ファイルを正本にする」ではなく、関心ごとの既存SSoTとfresh-context checkpointを説明する
- v8.23のContext Lifecycleと現行Glossaryを一次情報として再照合する

#### Review

- Reader: 第1部の抽象概念が、第4章で具体的なPlanGate flowへ接続する
- Editorial: 04=全体地図、05=構成要素、06=状態管理と役割が重ならない
- Technical: C-3' / C-4 Human-owned / Context Lifecycle / RunState ownershipなど現行仕様との矛盾を避けている

#### 対応

- 04〜06章を全文ドラフト化
- C-3 / C-4に加え、C-3'は限定経路として注記
- Plugin導入 != Governance成立を明記
- Context Lifecycleの既存SSoT表とfresh-context方針を第6章へ反映

#### Post Review

- PASS: 第2部だけでPlanGateの全体像と構成要素を理解できる
- ISSUE: 第5章で構成要素が6つ連続し、機能カタログに見える箇所がある
- ISSUE: 第6章はv8.23固有のArtifact名が増え、初心者には実装詳細が早すぎる
- NEXT: Loop 2で「3つの層」へ再整理し、詳細名を本文と補足に分離する


### Part II Draft Loop 2 — Concept compression / beginner load

#### 検討

- 05章の6要素列挙を「仕事 / 状態 / 制御」の3層へ圧縮する
- GateとHookを同義にせず、Gate=条件 / Hook=実行時検査の一手段とする
- 06章はv8.23の具体ファイル名より先に Plan / Current State / Evidence / Handoff の4概念を置く
- 実装詳細は「現行PlanGateでは」の補足へ下げる

#### Review

- First-time reader: 覚える単位が6要素から3層へ減り、全体像を保持しやすい
- Editorial: 05章が機能カタログではなくHarnessの構造説明になった
- Technical: HookをGateそのものとして扱わず、Context Lifecycleの所有権も重複SSoTを作らない形で説明できている

#### 対応

- 05章を3層モデルへ再構成
- 06章冒頭を4つの状態（Plan / Current State / Evidence / Handoff）へ簡略化
- v8.23固有名は実装補足へ移動
- 既存Bookへ委譲するPlan How-to境界を再確認

#### Post Review

- PASS: 初見読者の用語負荷を低減
- PASS: Governance Harnessの構成を一枚の表で理解できる
- ISSUE: 04〜06章は概念説明が中心で、実際の1タスクがどう流れるかの具体像がまだ弱い
- ISSUE: 「Governance Harness」がPlanGate自身の自己定義なのか一般名称なのか、冒頭でさらに明示した方がよい
- NEXT: Loop 3で最小の具体例と主張境界を追加する


### Part II Draft Loop 3 — Concrete walkthrough / claim boundary

#### 検討

- 04〜06章を同じ架空タスクでつなぎ、概念を実際のflowへ落とす
- Governance HarnessはPlanGate自身のself-positioningであり、標準カテゴリ準拠の主張ではないと明記する
- Artifactの追加コストもtrade-offとして扱う
- 「Gateが多いほど良い」ではなく、riskに見合う境界を置くという結論へ寄せる

#### Review

- First-time engineer: 1つのタスクを追うことでPlan / Review / Gate / Evidence / Handoffの関係を具体的に理解できる
- Skeptical OSS reader: Governance Harnessを一般標準として権威づけず、PlanGate固有の設計解釈として読める
- EM / Tech Lead: ceremonyを最大化する話ではなく、stop conditionとauthorityを設計する話として転用できる
- Maintainer: ultra-light / Mode / Context Lifecycleと矛盾せず、現行仕様の詳細を過剰一般化していない

#### 対応

- 04章に注文一覧APIの最小walkthroughを追加
- 05章で同じ例を「仕事 / 状態 / 制御」の3層へ写像
- 06章でsession interruptionからの再開例へ接続
- Governance Harnessのclaim boundaryを明記
- Artifact / Governance ceremony自体のコストを追加

#### Post Review

- PASS: 04=Flow、05=Architecture、06=Stateという章責務が明確
- PASS: 抽象語が同じ具体例へ接続され、読者が概念を保持しやすい
- PASS: 最大構成をbest practiceとして押し付けていない
- PASS: 現行PlanGate v8.23のC-3'/C-4、Context Lifecycle、Mode思想と整合
- PASS: 第2部（04〜06章）は本文初稿として次Partへ進める状態
- REMAINING: 公開前にPlanGate最新releaseへ再照合し、固有ファイル名・hook数・mode仕様など変動しやすい部分を更新する


### Part III Draft Loop 1 — Plan as judgment input / evidence / approval

#### 検討

- 07章は既存BookのPlan How-toを再演せず、PlanをReview / Approval / Verificationの入力として説明する
- 08章は「よく考える」より、判断を変えうるUnknownへCheapest Useful Verificationを当てる原則として書く
- 09章はReviewとApprovalを分け、現行C-3 / Autonomous APPROVE / C-3' / Human-owned例外を正確に扱う
- 承認後にPlanの意味が変わればApprovalも再評価対象になる、という一本の因果でつなぐ

#### Review

- Reader: 07→08→09が「境界を作る→前提を確認する→実行権限を渡す」で理解しやすい
- Editorial: 既存Bookの記法・テンプレ解説と重複せず、新BookのGovernance軸を維持
- Technical: plan_hash binding、三値C-3、human-presence best-effort、risk-based autonomyを現行公開仕様に合わせた

#### 対応

- 07〜09章を全文ドラフト化
- Part IIの注文一覧API例を引き継いで3章を接続
- #351を08章の主要Observed caseとして本文化
- 09章でC-1 / C-2 / C-3の責務差とApproval Authorityを明示

#### Post Review

- PASS: 第3部の因果が成立
- ISSUE: 07章のPlan / todo / test-cases説明が既存Bookとやや重複して見える
- ISSUE: 08章のCheapest Useful Verificationが著者独自の一般用語に見える可能性がある
- ISSUE: 09章はC-3系の例外説明が多く、中心主張が埋もれやすい
- NEXT: Loop 2で重複削減・用語境界・Approval章の情報階層を調整する


### Part III Draft Loop 2 — De-duplication / terminology / approval hierarchy

#### 検討

- 07章から既存Bookと重なるPlan/todo/test-casesのHow-toを削り、Governance上の役割だけ残す
- Cheapest Useful Verificationを公式用語のように見せず、本書内ラベルとして定義する
- 09章はC-3例外一覧を主役にせず、Review != Execution Authorityを先に置く
- 現行のrisk-based Authorityは実装例として扱い、変動しうる個別条件を本質化しない

#### Review

- Reader: 「良いPlanを書く章」ではなく「Planを判断対象にする章」として差別化できた
- Editorial: 08章の造語感を抑え、原則→例→trade-offの順序が明確
- Technical: C-1/C-2=Review、C-3=Authorityという責務境界が前面に出た

#### 対応

- 07章のtodo/test-cases説明を最小化し既存Bookへ委譲
- 08章でCheapest Useful Verificationのclaim boundaryを明示
- 09章をReview / Authorityの比較表とrisk-based Authority Policy中心に再構成

#### Post Review

- PASS: 既存Bookとの重複を十分に削減
- PASS: 独自ラベルとPlanGate公式用語の境界が明確
- PASS: Approval章の中心主張が例外仕様に埋もれなくなった
- ISSUE: 第3部全体で「止まる」説明が強く、Gateが速度を落とす印象が残る
- ISSUE: Approval Boundaryへ戻る条件を、読者が自分の環境へ持ち帰れる判定軸としてまとめたい
- NEXT: Loop 3で「止めるためではなく安全に任せるため」の意味と、re-plan triggerを整理する


### Part III Draft Loop 3 — Safe delegation / re-plan triggers

#### 検討

- 「止める仕組み」ではなく「止まる条件を決めることで、その間を任せる仕組み」として第3部を再定義する
- Planは確認箇所を減らす境界、Evidenceは安全に進み続ける材料でもあると補強する
- Approvalへ戻る条件を、Scope / Acceptance / Risk / Architecture / Authority / Evidenceの汎用軸で整理する
- 些細な変更まで再承認する運用を避け、承認の意味が変わるときだけ戻る原則を置く

#### Review

- Engineer: Gateが待ち行列ではなく、委譲範囲を明確にする仕組みとして読める
- EM / Tech Lead: re-plan triggerをチームPolicyへ転用できる
- Editorial: 第3部のPlan / Evidence / Approvalが「安全な委譲」という一つの目的へ収束した
- Technical: plan_hash等の機械的検出と、意味的な再判断条件を混同していない

#### 対応

- Part III導入をsafe delegation中心に刷新
- 07章へ「境界が実装中の確認を減らす」を追加
- 08章へEvidenceが継続実行の根拠にもなることを追加
- 09章へre-plan trigger 6軸と「承認した意味が変わるとき戻る」を追加

#### Post Review

- PASS: 「止めるためのGate」から「任せるための境界」へ意味づけを修正
- PASS: 読者が自分の開発フローへ持ち帰れる判断軸になった
- PASS: 07=Boundary、08=Evidence、09=Authorityの章責務が明確
- PASS: 第3部（07〜09章）は本文初稿として次Partへ進める状態
- REMAINING: 公開前に現行PlanGate releaseと照合し、Autonomous APPROVE / C-3' / mode条件など変動しやすい実装詳細を更新する


### Part IV Draft Loop 1 — Enforcement / Fresh Evidence / Authority

#### 検討

- 10章は「Hookがある=守れている」とせず、matcher / runtime / CLI / wiringを含む実効強制として扱う
- #1277をFalse Negative、#1326をFalse Positiveの具体例として対比する
- 11章は完了宣言をcurrent artifactへのClaimとして扱い、Fresh Evidenceへ結びつける
- 12章はAutonomyとAuthorityを別軸にし、MERGE_READY != MERGEDを責任境界の具体例として使う

#### Review

- Reader: 承認後の安全性を「Hookを増やすこと」ではなく、Enforcement→Evidence→Authorityの流れで理解できる
- Technical: 現行hook-enforcementの未防御経路、quality-command stale判定、Core Contract、ai-loop V2 taxonomyと整合
- Skeptical OSS reader: PlanGate自身のHook gapとfalse positiveを隠さず、mechanical enforcementを絶対視していない
- Editorial: 10→11→12が「越境を防ぐ→完了を証明する→決定権を分ける」で接続する

#### 対応

- Part IVと10〜12章を全文ドラフト化
- 10章へ#1277 / #1326とpositive/negative controlを統合
- 11章へstale evidence / quality command evidence / verify-then-reportを統合
- 12章へrisk-based Autonomy / AuthorityとMERGE_READY境界を統合

#### Post Review

- PASS: 技術的な実効性を過大評価せず説明できた
- ISSUE: 10章は現行Hookの欠落を詳しく書いたため、PlanGateの弱点列挙に見える可能性がある
- ISSUE: 11章のFresh / Relevant / Reproducibleは本書側の整理であり、公式三要件のように見せない方がよい
- ISSUE: 12章はHuman-ownedの説明が多く、自律化の価値をさらに前面に出せる
- NEXT: Loop 2で「失敗から何を設計原則にしたか」を強化し、主張境界を整理する


### Part IV Draft Loop 2 — Failure-to-principle / evidence claim boundary / flow efficiency

#### 検討

- Hook gapを弱点一覧で終わらせず、mechanical enforcementだから観測・再現・回帰防止できるという設計原則へつなぐ
- Guard品質を「blockの強さ」ではなく、dangerousを止めsafeを通す低摩擦境界として整理する
- Fresh / Relevant / ReproducibleをPlanGate公式要件ではなく、本書内のEvidence読解観点と明示する
- Autonomyの価値を、Human-owned削減ではなくHuman waiting削減 / flow efficiencyとして前面に出す

#### Review

- Reader: PlanGate自身のfailureを隠さず、それがなぜHarness改善に使えるか理解できる
- Editorial: 10章が失敗事例集ではなくEnforcement Designの章になった
- Technical: Evidence三観点のclaim boundaryが明確になり、公式contractとの混同を回避
- EM / Tech Lead: AutonomyをAgent稼働率ではなくflow efficiencyで評価する視点が追加された

#### 対応

- 10章へ「失敗をregression testへ変えられることがmechanical enforcementの価値」を追加
- Guard摩擦 / false positiveを品質軸として明文化
- 11章でFresh / Relevant / Reproducibleを本書内チェック観点へ限定
- 11章にEvidenceが人間の二重確認を減らす側面を追加
- 12章でHuman waiting削減とHuman-owned boundary最小化を強化

#### Post Review

- PASS: failure disclosureとPlanGate価値が両立
- PASS: Evidenceの主張境界が明確
- PASS: Autonomyを「Humanを消すこと」ではなくflowを進める能力として説明できた
- ISSUE: 10〜12章を通した「実装中にいつ止まるべきか」が散在している
- ISSUE: 12章のrisk tableは分かりやすいが、読者が自分のsystemへ転用するためのstop/escalate原則を一枚にまとめたい
- NEXT: Loop 3でExecution中のStop / Continue / Escalate policyを統合する


### Part IV Draft Loop 3 — Continue / Stop / Escalate policy

#### 検討

- Execution中の判断をContinue / Stop / Escalateの3分類へ統合する
- Hookは機械判定可能なStop、VerificationはContinue条件の更新、Authority PolicyはEscalate先の決定として責務を分ける
- Verification FAILを即Humanにせず、Planが有効ならAI repairを継続できることを明示する
- 第3部のre-plan triggerと第4部のruntime decisionを接続する

#### Review

- Engineer: 実装中に「続ける / 止める / 戻す」を判断する実用的なPolicyとして持ち帰れる
- EM / Tech Lead: Human involvementをEscalateされた意味的変更へ集中させる設計になった
- Technical: Core ContractのStop rules、root cause repair、scope deviation stopと整合
- Editorial: 10=Stop、11=Continue Evidence、12=Escalate Authorityという役割が明確

#### 対応

- Part IV導入へContinue / Stop / Escalate表を追加
- 10章にHookが担当するStop条件の境界を追加
- 11章にVerification PASS/FAILからContinue/Re-planへ分岐する説明を追加
- 12章にExecution Policy表と具体例を追加
- Part IIIのre-plan triggerとの接続を明記

#### Post Review

- PASS: 第4部全体が一つのExecution Policyとして読める
- PASS: Hook / Verification / Authorityの責務重複が解消
- PASS: AIの自律性を保ちつつHuman Judgmentへ戻る条件が明確
- PASS: 第4部（10〜12章）は本文初稿として次Partへ進める状態
- REMAINING: 公開前にhook wiring / Codex parity / ai-loop V2 taxonomyの現行release差分を再監査する


### Part V Draft Loop 1 — Context / independent review / Delivery boundary

#### 検討

- 13章は会話履歴の持ち越しではなくcanonical state + evidence checkpointを中心にする
- Intent Context Packageの context_ref / snapshot_ref をsemantic identity / exact audit identityとして説明する
- 14章は「別Agent = 独立レビュー」ではなく、Role / Context / Evidence / Authorityの分離として書く
- 15章はPR_CREATED != MERGE_READY、MERGE_READY != MERGEDの二段境界を中心にする
- v8.23.0はChangelog上TBDのため、current main / v8.23.0 candidateとして表記する

#### Review

- Reader: 13→14→15が「状態を渡す→独立して確かめる→PR後も収束させる」で連続する
- Technical: Context Lifecycle / Dynamic Context Engine / Review Principles / V2 taxonomy / Core Contractと整合
- Editorial: Agent数やmodel diversityを主役にせず、boundary設計を主役にできている
- Evidence: PR #1396 / #1411 / #1402相当の実装はcurrent main / changelogの公開情報へtraceできる

#### 対応

- Part Vと13〜15章を全文ドラフト化
- 13章へcontract/dynamic context、fresh-context trigger、handoff APIを統合
- 14章へreview context isolation、C-2 lane分離、adversarial roundを統合
- 15章へPR_CONVERGING / MERGE_READY / stop reason / owner separationを統合
- v8.23.0のrelease statusをTBDとして明示

#### Post Review

- PASS: 第5部のReader Journeyが成立
- ISSUE: 13章はContext Engine / Lifecycle / Intent Packageの3概念が入り、やや実装詳細が多い
- ISSUE: 14章の「独立性」は概念的で、読者が実際に何を渡す/渡さないかを即使える形にしたい
- ISSUE: 15章はV2 taxonomyの説明が多く、Deliveryの具体的な1ループをもう少し前面に出せる
- NEXT: Loop 2でContextの概念圧縮、Review Package contract、Delivery walkthroughを強化する


### Part V Draft Loop 2 — Concept compression / Review Package / Delivery walkthrough

#### 検討

- Context関連の実装名を、Contract / Current State / Handoffの3問へ圧縮する
- Reviewer independenceをReview Packageのinput contractとして具体化する
- Deliveryはtaxonomy説明より先にPR_CREATED→repair→reverify→MERGE_READYの1 loopを見せる
- state machine導入を目的化せず、収束条件を先に決める

#### Review

- First-time engineer: Context Engine / Intent Package / Lifecycleの違いを全部覚えなくても13章を理解できる
- Reviewer designer: 「渡す / 渡さない」が明確で実運用へ転用できる
- EM / Tech Lead: Delivery automationをenum導入からではなく収束条件から設計できる
- Technical: raw reasoning非継承、fresh evidence、re-plan trigger、MERGE_READY境界が前章までのcontractと一貫

#### 対応

- 13章へContextを3つの問いに圧縮する表と「再開可能性」判定を追加
- 14章へReview Package contractと独立性5問を追加
- 15章へ具体的なPR後Delivery walkthroughを追加
- 15章でstate machineより収束条件を優先する説明を追加

#### Post Review

- PASS: 実装詳細の認知負荷を下げた
- PASS: Review independenceが実行可能なcontractになった
- PASS: MERGE_READYまでのloopが具体的に見える
- ISSUE: 第5部全体で「複数Agentを使うこと自体の価値/不要なケース」が薄い
- ISSUE: Handoff / Review / Deliveryそれぞれでidentity（どのPlan/diff/Evidenceか）の重要性を横断原則としてまとめたい
- NEXT: Loop 3でmulti-agentを必要時だけ使う原則とIdentity Bindingを統合する


### Part V Draft Loop 3 — Minimal topology / Identity Binding / ownership

#### 検討

- Multi-agentを目的化せず、responsibility separation benefit > coordination costのときだけ増やす
- Handoff / Review / Deliveryを横断するIdentity Bindingを明示する
- task / plan / context snapshot / implementation / evidence / review targetのidentityを区別する
- 複数Agent数より先にstate / evidence / decision / authority ownershipを決める

#### Review

- Engineer: small taskでは単一Agentでよいという逃げ道が明確で、過剰設計を避けられる
- EM / Tech Lead: Agent topologyをrisk / coordination complexityで選ぶ判断軸が得られる
- Technical: context_ref / snapshot_ref / plan_hash / commit identity / Fresh Evidenceの既存設計が横断原則として接続
- Reviewer: fresh contextだけでなくreviewed target identityの一致まで確認する構造になった
- Delivery: old-head CI / old reviewを現在HEADのgreenとして扱わない説明が入った

#### 対応

- Part V導入へ「Agentを増やす条件」とIdentity Binding表を追加
- 13章へstate + identityをhandoffする原則を追加
- 14章へmulti-agent不要ケースとreview target bindingを追加
- 15章へhead/evidence/review identity reconcileとownership-first原則を追加

#### Post Review

- PASS: Multi-agentを過剰推奨せず、必要性ベースのtopologyになった
- PASS: Context / Review / DeliveryをIdentity Bindingで横断接続できた
- PASS: Agent topologyよりownership topologyを先に決める原則が明確
- PASS: 第5部（13〜15章）は本文初稿として次Partへ進める状態
- REMAINING: v8.23.0はTBDのため、公開前にrelease状態とai-loop V2 runtimeの最新canonを必ず再照合する


### Part VI Draft Loop 1 — False Green taxonomy / evaluation trust boundary

#### 検討

- False Greenを「greenだが守りたいClaimを測れていない状態」と定義する
- #1085 / #1173 / #1277 / #1326 / #1169を、異なるfailure classとして比較する
- Harness改善をDetect → Reproduce → Fix → Regression Guardへ落とす
- Verifier/Eval改善はCandidate自身のPASSで採用せず、Evaluation Trust Boundaryへ接続する
- ai-loop V2 RatchetのProduction promotionはHuman-ownedであることを維持する

#### Review

- Reader: 5事例を「PlanGateのバグ一覧」ではなく、測定Claimと実挙動のズレとして理解できる
- Technical: current mainのEvaluation Trust Boundary / Ratchet Traceabilityと整合
- Skeptical OSS reader: PlanGate自身の失敗を一次情報として開示し、成功談だけで設計原則を正当化していない
- Editorial: 第10章のHook failureはExecution側、本章はHarnessをどう評価・改善するかに責務を分離できている

#### 対応

- Part VIと16章を全文ドラフト化
- 5つのObserved failureを比較表へ統合
- positive / negative control、INCONCLUSIVE、pre-registrationを本文化
- Candidate cannot modify the authority that judges the candidateをHarness改善の中心原則へ接続
- RatchetのFailure→Candidate→Evaluation→Promotionを導入

#### Post Review

- PASS: 第6部の中心主張が成立
- ISSUE: 5事例すべてを順に詳述しており、前半がやや長く感じる
- ISSUE: False Greenの「クラス」と個別issueが1対1に見え、汎用的な再利用性をもう一段上げたい
- ISSUE: Eval Trust Boundaryの後半がV2固有語に寄り、読者が自分のHarnessへ持ち帰る最小形が弱い
- NEXT: Loop 2でfailure classを4つの汎用パターンへ圧縮し、最小Eval Contractを提示する


### Part VI Draft Loop 2 — Generic failure classes / minimal Eval Contract

#### 検討

- 5つのIssueを個別順に並べず、Proxy / Coverage / Classifier / Observerの4パターンへ一般化する
- HarnessManifestのactivation 6段階を使い「存在 ≠ 効いた」を具体化する
- 読者が自分のHarnessへ持ち帰れる最小Eval ContractをClaim / Identity / Oracle / Controls / Coverage / Promotionで定義する
- Evaluation Trust BoundaryのV2固有語は、評価対象と評価Authorityを分離する原則へ圧縮する

#### Review

- First-time engineer: 個別Issueを覚えなくても4つのfailure patternで自分の検査を見直せる
- Eval designer: greenの意味をClaimとOracleから定義する実務的な入口ができた
- Technical: HarnessManifest activation、Evaluation Trust Boundary、Ratchet Traceabilityとの接続が明確
- Editorial: 前半の事例説明を圧縮し、後半の改善方法へ早く到達する

#### 対応

- 16章を4つのFalse Greenパターンで全面再構成
- #1173 / #1277をCoverage Greenとして統合
- Runtime Activation 6段階をProxy Greenの一般化へ利用
- 最小Eval Contract 6項目を追加
- V2固有のEval設計を一般原則→PlanGate実装例の順へ変更

#### Post Review

- PASS: issue集から再利用可能なEval章へ変わった
- PASS: 「greenの意味を先に定義する」が章の中心になった
- ISSUE: regression fixtureを増やし続けるとtest suiteが過去事故の墓場になるリスクに触れていない
- ISSUE: Harness改善の成功を「fixtureが通った」だけで終えず、実運用で再発率を見る流れを追加したい
- NEXT: Loop 3でregression suiteの保守とrecurrence measurementを加え、改善loopを閉じる


### Part VI Draft Loop 3 — Regression maintenance / held-out Eval / recurrence

#### 検討

- incidentごとにfixtureを増やすだけではなく、failure class / invariantへ統合する
- known fixtureだけに最適化するEval overfittingを避けるため、sealed / held-out fixtureの意味を説明する
- Harness改善でもCreate Lastを使い、Skill / Agent / Hookの無制限増殖を避ける
- Promotion後にproduction recurrenceを観測し、改善loopを閉じる
- 観測できない prevented count は作らず、同一classifier条件でsame-pattern recurrenceを測る

#### Review

- Harness maintainer: regression suite自体がinstruction/test debtになるリスクを扱えている
- Eval engineer: known-badで開発し、held-outでpromotionを評価する分離が明確
- EM / Tech Lead: 新component追加より既存invariant改善を優先する判断軸を持ち帰れる
- Evidence reviewer: 「防げたはず」のcounterfactualではなく、観測可能なrecurrenceだけを扱っている
- Editorial: Detect→Eval→Promotion→Production observationまで改善loopが閉じた

#### 対応

- Part VIへ「改善のたびに新しいGuardを増やさない」を追加
- 16章へRegression suite maintenanceを追加
- sealed / held-out fixtureによるEval overfitting対策を追加
- RatchetのCreate Last順序を一般原則として追加
- same-pattern recurrence rateとclosed improvement loopを追加

#### Post Review

- PASS: False Green検出から継続的Harness改善まで一章で完結
- PASS: 「テストを増やすほど良い」という誤読を抑えた
- PASS: Candidate / Evaluation / Promotion / Production observationのAuthority境界が明確
- PASS: 第6部（16章）は本文初稿として次Partへ進める状態
- REMAINING: ai-loop V2 / Ratchetはcurrent mainの進行中設計を含むため、公開前にcanonとrelease状態を再照合する


### Part VII Draft Loop 1 — Current staged adoption / first governance loop

#### 検討

- 初期Book案のLevel 1〜5を現行正本に合わせ、CLI導入後はPhase 0〜3、plugin-onlyはLevel 0として説明する
- 公式Phase 0（ultra-light / gateなし）と、本書で体験する最小Governance Loopを混同しない
- 全面導入ではなくcoexistence / partial adoptionを正規の選択肢として扱う
- 18章はPlan記法のHow-toではなくBoundary→Evidence→Approval→Execution→Verification→Judgmentを一周する章にする

#### Review

- Reader: 最初からC-3 / Hook / multi-agentを全部入れなくてよいことが明確
- Technical: current staged-adoption-guide / plugin-only-adoption / coexistence-guideと整合
- Editorial: 第7部がBook全体の概念を「導入判断」と「1タスク」に収束させている
- Maintenance: when-not-to-useの旧Level 1→5表記と現行Phase 0〜3の差を隠さず注記した

#### 対応

- Part VIIと17〜18章を全文ドラフト化
- 17章をPhase 0〜3 + plugin-only Level 0へ更新
- warning→blockをAuthority変更として説明
- 部分導入と非採用を明示
- 18章に公式Phase 0と最小Governance Loopの二段導線を追加

#### Post Review

- PASS: 現行導入正本とBookの導線が整合
- ISSUE: 17章は公式Phase説明と本書独自の導入判断が混ざり、やや長い
- ISSUE: when-not-to-useの固定的な「3人以上 / 3ヶ月以上」等の条件を本書でどう扱うかを明示した方がよい
- ISSUE: 18章は概念一周として良いが、読了後に「明日どこから始めるか」のチェックリストがあると強い
- NEXT: Loop 2で公式仕様 / 本書の判断原則を分離し、導入チェックリストを追加する


### Part VII Draft Loop 2 — Phase/Mode separation / official vs book guidance

#### 検討

- Phaseを導入成熟度、Modeをtask risk / 運用強度として別軸にする
- 現行PlanGate公式仕様と、本書がそこから導く判断原則を明示的に分離する
- 18章の最小Governance Loopを公式Phaseの追加定義に見せない
- 最初の1周で「導入しないもの」もScopeとして決める

#### Review

- Reader: Phase 3導入済み = 全taskを重く回す、という誤読を防げる
- Technical: staged-adoption-guideの「習熟度初期値」とmode-classificationのtask強度という別軸に整合
- Editorial: official factsとbook interpretationの境界が明確になった
- Adoption: 最初のtaskでmulti-agent / strict hooks / metrics / evalを先回り導入しない理由が明確

#### 対応

- 17章へPhase vs Modeを追加
- 17章へ「公式仕様 / 本書の判断原則」区分を追加
- 18章へ「本書の演習であり公式Phase名ではない」を追加
- 18章へ最初の1周で追加しない機能を明記

#### Post Review

- PASS: 現行仕様と本書独自の整理を混同しなくなった
- PASS: 過剰導入を避けるReader Guidanceが強化された
- ISSUE: 第7部の終わりとして、導入後に「続ける / 強める / 弱める / やめる」を判断する出口条件がまだ弱い
- ISSUE: Book全体の中心主張「信頼しなくても任せられる環境」へ最後に明確に戻したい
- NEXT: Loop 3でadoption outcome reviewとBook central claimへの着地を追加する


### Part VII Draft Loop 3 — Adoption outcome review / central claim

#### 検討

- 導入を「強める」一方向にせず、Keep / Strengthen / Simplify / Removeで見直す
- 責務が既存CIやworkflowへ移ったら、PlanGate側の重複Gateを削除できるようにする
- 第18章の最後をBook全体のCentral Claimへ戻す
- 1タスク完走の成功条件を「AIを信頼できた」ではなく「自己申告に依存せず任せられた」に置く

#### Review

- Engineer: Governance debtを増やし続けず、弱める / 外す判断も正規化できる
- EM / Tech Lead: Boundaryの価値と維持コストを継続的に見直す運用へつながる
- Editorial: 最終章が導入手順だけで終わらず、BookのWhyへ戻る
- Central Claim: Artifact / Evidence / Boundary / Authorityが「信頼しなくても任せられる環境」という一本の主張へ収束した

#### 対応

- Part VIIにKeep / Strengthen / Simplify / Removeを追加
- 17章へ導入後の4方向レビューを追加
- 18章へ「この1周で確認したかったこと」を追加
- BookのCentral Claimを最終章で再提示

#### Post Review

- PASS: 段階導入が機能追加ロードマップではなくGovernance調整ループになった
- PASS: 導入 / 強化 / 簡略化 / 撤去が同じ判断体系で扱える
- PASS: 17=Adoption Policy、18=Minimum Governance Loopの責務が明確
- PASS: 第7部（17〜18章）は本文初稿として完了
- REMAINING: 付録 / おわりにの本文化、全Book横断の用語・version・source監査を行う


### Appendix/Closing Loop 1 — Reference usability / central-claim closure

#### 検討

- A1は本文再説明ではなく、略号と混同しやすい対概念を引けるreferenceにする
- A2は失敗名の羅列ではなく、症状 / なぜ危険 / 戻り方でtroubleshooting化する
- Afterwordは古いLevel 1表記を削除し、Book Central Claimへ戻る
- introduction / BOOK_PLANに残る旧Level 1〜5を現行Phase 0〜3 / plugin-only Level 0へ整合する

#### Review

- Reader: 本文読了後、C-X / V-X / Mode / Phase / MERGE_READY等を単独で引ける
- Editorial: A2が本文の縮約ではなく「困ったときに戻る」付録になった
- Technical: current Glossary / mode-classification / responsibility classesと大枠整合
- Closing: おわりにが機能紹介ではなく「信頼しなくても任せられる環境」という中心主張へ収束

#### 対応

- A1を全文ドラフト化
- A2を18個のpitfall + recoveryへ展開
- 99_afterwordを全面改稿
- 00_introductionの段階導入表記を更新
- BOOK_PLANのPart VII / DoDに残る旧Level体系を更新

#### Post Review

- PASS: Draft placeholderを実用referenceへ置換
- ISSUE: A1に公式用語と本書独自用語が同居するため、一目で区別できる表示が欲しい
- ISSUE: A2が18項目あり長いため、failure class別の索引があると使いやすい
- ISSUE: Afterwordは良いが、18章と「最初は小さく」の説明が一部重複する
- NEXT: Loop 2でofficial/book label、pitfall index、closingの重複削減を行う


### Appendix/Closing Loop 2 — Official vs Book model / lookup UX

#### 検討

- A1でPlanGate公式用語と本書独自の説明モデルを明示的に分ける
- A2は18項目をfailure classから探せる索引を置く
- AfterwordでPlanGateを唯一解として見せず、責務を満たす別実装も正規化する

#### Review

- Technical writer: Book modelを公式仕様として誤引用するリスクが下がる
- Reader: pitfallを通読せず症状から引ける
- Skeptical reader: PlanGate adoptionそのものを結論にせず、Boundary / Evidence / Authorityの説明可能性を価値に置けている
- Editorial: 最終章とAfterwordの「小さく始める」重複を増やさず、思想の着地に集中できた

#### 対応

- A1へOfficial / Book modelの凡例を追加
- 主要Official headingへlabelを追加
- Book独自モデルへlabelを追加
- A2へfailure class別索引を追加
- Afterwordへ「PlanGateは一実装であり唯一解ではない」を追加

#### Post Review

- PASS: 用語のprovenanceが明確
- PASS: 付録のlookup usabilityが改善
- PASS: product advocacyではなく設計原則として閉じられた
- ISSUE: Book全体の完了判定として、Draft placeholder / stale Level表記 / current source表記を横断確認する必要がある
- NEXT: Loop 3でappendix/closingだけでなくBook-wide consistency checkを行い、残る小さな不整合を修正する


### Appendix/Closing Loop 3 — Book-wide consistency / structure completion

#### 検討

- 公開対象全ファイルを横断してDraft placeholder / stale adoption terminology / release overclaimを検査する
- BOOK_PLANのiteration logは当時の判断記録として維持し、現在のNarrative / chapter responsibilityだけ最新化する
- IntroductionのHook表現を、mechanical enforcementを絶対視しない本文と揃える
- 構成DoDを実際の本文状態に合わせて完了判定する

#### Review

- Book-wide scan: 公開対象にDraft placeholderなし
- Adoption: Level 1→5は17章の「旧表記」説明以外では公開本文に残っていない
- Release claim: v8.23.0はcurrent main / candidateとして扱い、released断定をしていない
- Vocabulary: Verification / Review / Judgment、Autonomy / Authority、Artifact / Evidenceの責務分離を維持
- Editorial: Introduction → 7 Parts → Appendix → Afterwordが同じCentral Claimへ収束

#### 対応

- IntroductionのHook表現を「機械判定できる境界を実行時検査へ移す」へ精密化
- BOOK_PLANのNarrativeと02章表記を現行本文へ同期
- Book StructureのDefinition of Doneを完了へ更新

#### Post Review

- PASS: 付録 / おわりにを含む全公開章の初稿が揃った
- PASS: 現行導入体系と旧表記の境界が明確
- PASS: product feature catalogではなくJudgment Boundary設計のBookとして一貫
- PASS: Appendix/Closingの3-loop review完了
- REMAINING: 公開前の最終工程として、PlanGate current mainのsource/version再監査、表記揺れ、リンク、Zenn renderを横断確認する


### Publication Review Loop 1 — Current source / release-state audit

#### 検討

- PlanGate current mainとGitHub Releasesを再照合し、release事実とmain上の未リリース差分を分ける
- README / staged-adoption-guide / plugin-only-adoptionに併存するLevel / Phase表記を一方へ無理に統一しない
- 本書は導入手順にPhase 0〜3、機能範囲の説明にREADME Level 1〜5を使い分ける
- v8.23系のContext / V2機能はrelease済みと断定せずcurrent mainの差分として扱う

#### Review

- Release source: GitHub Releases Latest = v8.22.0
- Main README: v8.23.0をLatestと記載
- Generated changelog page: v8.23.0 - TBD
- Adoption docs: README Level 1〜5 / staged guide Phase 0〜3 / plugin-only Level 0が併存
- Conclusion: upstream source自体に不整合があるため、Book側で一方を事実として上書きしない

#### 対応

- 13 / 15章のv8.23表現をcurrent main未リリース差分へ修正
- 17章を「2つの導入軸を読み分ける」へ再構成
- A1のPhase説明をLevel / Phase / Modeの3軸へ更新
- Introduction / BOOK_PLANを現行整理へ同期

#### Post Review

- PASS: release済み / main実装の混同を解消
- PASS: 公開docs間の用語差を隠さず説明
- ISSUE: 本文の外部URL表記・章間表記揺れ・古いsource labelを全章横断で確認する必要がある
- NEXT: Loop 2でsource / wording / cross-reference consistencyを監査する


### Publication Review Loop 2 — Source / wording / cross-reference consistency

#### 検討

- Book内で引用しているPlanGate docs / issue参照を横断抽出して存在確認する
- release状態とcurrent main仕様の基準日をIntroductionで明示する
- v8.23をversion labelとして不用意に本文へ埋め込まない
- A1のOfficial用語は現行GlossaryのHuman C-3 / C-3'分離に合わせる

#### Review

- PlanGate blob/main参照20件: 20/20 existence確認
- Issue参照6件: 本文で使用している#351 / #1085 / #1169 / #1173 / #1277 / #1326を再確認済み
- 06章: v8.23 release断定が残っていた
- A1: C-3をHuman-ownedと明示した方が現行Glossaryに忠実
- Introduction: source baselineがなかったため、upstream不整合の扱いが各章へ分散していた

#### 対応

- Introductionへ2026-10-03 source baselineを追加
- release statusはGitHub Releases Latest=v8.22.0を優先すると明記
- 06章の「PlanGate v8.23」をcurrent mainへ修正
- A1をHuman C-3 / C-3'の分離へ精密化
- Level / Phase見出しを両方の公式表現を含む形へ修正

#### Post Review

- PASS: 参照先の存在確認が完了
- PASS: release / main / docs inconsistencyの扱いをBook全体で統一
- PASS: C-3 / C-3' / C-4のAuthority境界が現行Glossaryと整合
- ISSUE: Zenn構造としてconfig chaptersと実ファイルの一致、Markdown構造、CI結果を最終確認する必要がある
- NEXT: Loop 3でpublication artifact / CI / rendering-riskを検証する


### Publication Review Loop 3 — Zenn structure / CI / PR readiness

#### 検討

- config.yamlのchaptersと実ファイルが1:1で一致するか確認する
- 全公開MarkdownでH1数 / code fence / Draft placeholderを機械確認する
- repository CIがBook追加を含むcontent checksを通過するか確認する
- PR metadataが「scaffold」段階のまま残っていないか確認する

#### Review

- config chapters: 29 entries
- publishable Markdown: 29 files + BOOK_PLAN.md
- config missing chapter: 0
- config外の公開Markdown: 0
- 全29章: H1=1 / code fence整合 / Draft placeholderなし
- PR変更範囲: books/plangate-agent-governance/ 配下のみ
- CI: completed / success
- CI内容: list:books / internal-links / title / content harness等を含む npm run check が実行対象
- PR title/body: scaffold時点の説明が残っており現在状態と不一致

#### 対応

- PR titleを完成したBook追加を表す名称へ更新
- PR bodyを7部18章 + 付録 + source baseline + 3-loop final reviewの現在状態へ更新
- Draft PR / published:falseは維持し、公開操作は行わない

#### Post Review

- PASS: configとchapter実体が一致
- PASS: Markdown構造にblocking issueなし
- PASS: repository CI success
- PASS: 既存plangate-guideへの変更なし
- PASS: 公開前3-loop review完了
- REMAINING: 実ブラウザ上のZenn visual previewは未実施。公開判断前に必要ならpreviewでレイアウトのみ最終確認する


### Visual/Render Review Loop 1 — Long chapter navigation / table width

#### 検討

- browser previewが実行できないため、chapter length / heading density / table width / long-line riskを静的に監査する
- 最長16章を分割せず、章内navigationで認知負荷を下げる
- mobileで横スクロールしやすい多列tableを、情報量を落とさず2列へ圧縮する

#### Review

- 16章: 約10.4k chars / 19 H2でBook内最長
- 17章: table rows 23
- A1: table rows 42
- 全章H1 / fence構造自体は正常
- 長文章の問題は内容不足ではなく現在地を失いやすいこと

#### 対応

- 16章冒頭へ「この章の地図」を追加し、前半 / 中盤 / 後半の読み方を明示
- 17章の導入表を3列→2列へ圧縮
- A1のC-X表を3列→2列へ圧縮

#### Post Review

- PASS: 最長章でreader orientationが改善
- PASS: mobile横幅リスクを減らした
- ISSUE: Part dividerの情報量にばらつきがあり、目次上で役割が見えにくい可能性がある
- NEXT: Loop 2でPart dividerと章末bridgeの視認性をレビューする


### Visual/Render Review Loop 2 — Part navigation / chapter bridges

#### 検討

- Part dividerの情報密度と役割を比較する
- 18本文章の末尾に次章へのbridgeがあるか確認する
- 導入用語をLevel / Phaseへ過度に寄せず、Bookの概念語へ戻す

#### Review

- 18/18本文章: 次章または付録へのbridgeあり
- Part I / III / IV / V / VI / VII: 部の問い・地図が明確
- Part II: 2文のみで、04 / 05 / 06の章責務が目次上から見えにくい
- 16章末: 「必要なLevel」が17章で整理したLevel / Phaseの二軸とやや衝突

#### 対応

- Part IIへFlow / Architecture / Stateの3章マップを追加
- 16章末を「必要なBoundaryと運用範囲から段階導入」へ修正

#### Post Review

- PASS: 全7 Partで「この部で何を理解するか」が見える
- PASS: 全18章のtransitionが連続
- PASS: Level / Phaseの用語差が章間bridgeへ漏れなくなった
- ISSUE: 最終render-riskとして表の列数、長章ナビ、config/CIを再確認する
- NEXT: Loop 3で静的render-riskを再計測し、CIまで閉じる


## Positioning

既存の `books/plangate-guide/` は残す。

- 既存 Book: **AI にコードを書かせる前に、計画で判断を終えておくための実践ガイド**
- 新 Book: **AI エージェントへ仕事を任せるために、判断境界・証拠・状態・権限をどう設計するか**

既存 Book を新版へ置換しない。読者課題が異なる別 Book として育てる。

## Central Claim

> AIエージェントを信頼できるようにするのではなく、信頼しなくても仕事を任せられる環境をつくる。

PlanGate はそのために、Plan / Review / Approval / Execution / Verification / Handoff / Human Judgment を成果物とゲートとして明示する。

## Reader

主読者:

- Claude Code / Codex / Cursor などを日常的に使うエンジニア
- AIコーディングを個人利用からチーム開発へ広げたい Tech Lead / EM
- 自律性を上げたいが、品質・責任・監査可能性を失いたくない人

前提:

- AIコーディングの基本操作は知っている
- PlanGate は知らなくても読める
- Scrum / TDD / SDD の専門知識は必須にしない

## Cross-Book Responsibility Contract

### Existing: `plangate-guide`

主担当:

- Why / Scope / Acceptance Criteriaをどう書くか
- 設計案比較、Mode、test-casesをどう作るか
- Planをどうレビューし、最初の1タスクを回すか

### New: `plangate-agent-governance`

主担当:

- なぜPlanがApprovalの入力になるのか
- Gate / Hook / Verification / Evidenceの責務分離
- Autonomy / Authority / Human Judgment
- Context / Handoff / multi-agent independence
- Delivery / MERGE_READY
- Harness Eval / False Green
- 段階導入とGovernance cost

新Book内でPlanのHow-toが必要になった場合は、概念理解に必要な最小限だけ説明する。

## Vocabulary Contract

- 初出では日本語の責務を先に説明し、その後に英語ラベルを置く
- `Verification / Review / Judgment` は同義語として混ぜない
- `Autonomy / Authority` は別軸として扱う
- `Artifact / Evidence` は「存在するもの」と「主張を支える証拠」を区別する
- PlanGate固有略号（C-X / V-X / WF-X / EH-X）は必要になる章まで出さない
- 用語を増やすこと自体を価値にしない

## Reader Transformation

Before:

- AI が賢ければ任せられると考える
- Review / Verification / Approval を同じものとして扱う
- 会話履歴を状態の正本にする
- 「完了しました」をそのまま受け取る
- 自律性を上げるほど人間の関与を消す方向に考える

After:

- Agent ではなく Artifact / Evidence / Boundary を設計対象として見る
- Verification / Review / Judgment を分離する
- Canonical Artifact と Fresh Context で状態を受け渡す
- Fresh Evidence で完了を判定する
- Autonomy と Authority を分け、人間の判断点を意図的に残す

## Narrative

```text
AIが速くなった
  ↓
判断がボトルネックになった
  ↓
判断根拠をAgentの自己申告からArtifact/Evidenceへ移す
  ↓
正しく作れたかと、作ってよいかは別
  ↓
PlanGate = Judgment Boundary を持つ Governance Harness
  ↓
Plan / Gate / Execution / Verification / Handoff
  ↓
Context と複数Agentへ拡張
  ↓
Delivery / Eval / False Green
  ↓
段階導入して自分の開発へ持ち込む
```

## Evidence Traceability Matrix

| Chapter | Primary evidence | What it proves |
| --- | --- | --- |
| 01 | PlanGate #351 | AIの推定とプロジェクト固有の実数が大きくずれる |
| 08 | PlanGate #351 | 推測を実測へ切り替える必要性 |
| 09 | README / docs | ReviewとApprovalを別の境界として扱う |
| 10 | #1277 / #1326 | Guardは存在だけでなく実際の入力空間で検証が必要 |
| 11 | README / #1402 | 完了判定にはfreshなverification evidenceが必要 |
| 13 | #1396 / #1411 | Contextをsemantic state / snapshot / fresh contextとして受け渡す |
| 15 | #1402 | DeliveryのAI責務終点をMERGE_READYとして定義できる |
| 16 | #1085 / #1169 / #1173 / #1277 / #1326 | greenや「guardあり」が実挙動の証明にならない |

## Evidence Boundary

### 主な一次情報

- `s977043/PlanGate` の README / docs / issue / release / 実装
- PlanGate 自身で再現・計測した failure / fix
- 必要に応じて公式ドキュメント（OpenAI / Anthropic / GitHub など）

### 書き分け

- **Observed**: PlanGate の実運用で実際に起きたこと
- **Verified**: コード、テスト、Issue、公式文書で確認できること
- **Interpretation**: 著者がそこから導いた設計上の解釈

効果を一般化しない。PlanGate の設計判断と、業界一般の原則を混同しない。

## Chapter Contract

各章は原則として次を持つ。

1. Reader Problem
2. Concrete Failure / Scenario
3. Concept
4. PlanGate での具体化
5. Trade-off / Limitation
6. Takeaway
7. 次章への接続

抽象論だけで終えない。最低1つは公開一次情報または再現可能な具体例を置く。

## Part I — なぜ判断境界が必要か

### 01 判断がボトルネックになった

Goal:
AI の高速化により「書けるか」ではなく「任せてよいか」が問題になることを示す。

Primary example:
規模 M と見積もられた作業が実測 1,697 ファイルだった事例。

Takeaway:
実装前判断の失敗は、コード品質だけでは防げない。

### 02 判断根拠をAIの自己申告から成果物と証拠へ移す

Goal:
Agent の自己申告ではなく外部から確認可能な成果物を判断材料にする。

Key model:
`Agent -> Artifact -> Evidence -> Judgment`

### 03 Verification / Review / Judgmentを分ける

Goal:
「動いた」「問題がない」「採用してよい」を別責務として理解する。

Key model:
`Verification != Review != Judgment`

## Part II — PlanGateの全体像

### 04 PlanGateの全体フロー

Goal:
詳細へ入る前に全体の地図を渡す。

Flow:
Requirement -> Plan -> Review -> Approval -> Execution -> Verification -> PR -> Human Judgment

### 05 Governance Harnessとして考える

Goal:
Plugin / Framework / Workflow のどれか一語へ押し込まず、PlanGate の設計対象を説明する。

Define:
Workflow / Skill / Agent / Gate / Artifact / Hook の責務境界。

### 06 Artifactを正本にする

Goal:
会話ではなく成果物を state の canonical source にする理由を説明する。

Artifacts:
pbi-input / plan / todo / test-cases / status / handoff / evidence。

## Part III — 実装前に品質を作る

### 07 RequirementからPlanを作る

Goal:
Why / Scope / Acceptance Criteria / Non-goals / Unknowns を実装前に固定する。

### 08 推測よりEvidenceを取りに行く

Goal:
未確認の前提を、検索・コード・テスト・ログなどの Cheapest Useful Verification で解消する。

Primary examples:
件数実測、存在しないファイル/関数を前提にしたPlan。

### 09 Approval Boundaryを置く

Goal:
Plan が存在することと、実行許可があることを分ける。

Focus:
C-1 / C-2 / C-3 と APPROVE / CONDITIONAL / REJECT。

## Part IV — 承認後を安全に自律化する

### 10 Hookでお願いを制約へ変える

Goal:
Prompt rule と mechanical enforcement の違いを示す。

Primary examples:
approval guard / scope guard / destructive operation guard。

### 11 Fresh Evidenceで完了を判定する

Goal:
「完了しました」を完了条件にしない。

Focus:
L-0 / V-1〜V-4 / fresh verification evidence。

### 12 AutonomyとAuthorityを分ける

Goal:
AIが自律実行できる範囲と、最終決定権を分ける。

Key model:
`Autonomy != Authority`

Boundary:
MERGE_READY は AI、MERGED は Human。

## Part V — 長時間・複数Agentへ拡張する

### 13 Contextを会話からArtifactへ移す

Goal:
Long session / model switch / worker switch でも判断基準を再現できる状態を作る。

Focus:
Intent Context Package / checkpoint / fresh context。

### 14 独立レビューを本当に独立させる

Goal:
Reviewer が Builder と同じ会話文脈を引きずる問題を扱う。

Focus:
Planner / Builder / Verifier / Reviewer / Human の責務分離。

### 15 DeliveryをMERGE_READYまで収束させる

Goal:
PR 作成後の CI / review repair を含め、AI の責務終点を定義する。

Boundary:
NO MERGE BY AI。

## Part VI — Harness自体を改善する

### 16 EvalとFalse Green

Goal:
「テストが緑 = 守れている」を疑う。

Primary examples:
- linked worktree で approval boundary が外れた
- 文字列判定による誤検知
- plugin registration の false green
- 誤起動で危険な gh/git が spawn された経路

Focus:
観測 -> 再現 -> 修正 -> regression guard。

## Part VII — 導入する

### 17 2つの導入軸を読み分ける

Goal:
全部入りを要求しない。

Current public docs:
- README: Level 1〜5（採用する機能範囲）
- staged-adoption-guide: Phase 0〜3（導入・習熟ロードマップ）
- plugin-only-adoption: Level 0（CLIなしの入口）

Book principle:
Level / Phase / Modeを混同せず、観測したfailureに応じて必要なBoundaryだけ強化し、不要ならSimplify / Removeする。

### 18 1タスクを最後まで回す

Goal:
読者が最小構成で実際に試せるところまで落とす。

Use:
小さな standard 未満のタスクを題材に、入力 -> plan -> approval -> execution -> verification -> handoff を通す。

## Appendices

### A1 用語集

C-X / V-X / WF-X / EH-X / Mode / Hardening Override / MERGE_READY。

### A2 よくある失敗

導入時の誤解、Hook未配線、重すぎるMode、self-reviewの過信、前提崩壊後の継続、scope外修正など。

## Existing Book Reuse Map

| Existing chapter | Reuse in new Book |
| --- | --- |
| 01_decide-before-code | 01 / 08 |
| 02_three-lenses | 07 導入の背景 |
| 03_why-scope-acceptance | 07 |
| 04_design-size-testing | 07 / 08 |
| 05_measure-assumptions | 08 |
| 06_boundaries-and-stops | 09 / 10 |
| 07_verification-first | 11 |
| 08_plan-review | 09 |
| 09_start-your-plan | 18 |
| 10_plugin-cycle | 17 / 18 |
| a1_pitfalls | A2 |

既存本文をコピーして終わらせない。新しい中心主張に必要な部分だけ再構成する。

## Definition of Done for Book Structure

- [x] 既存 Book と reader problem が重複していない
- [x] 第4章までに PlanGate 全体像が見える
- [x] 各部に最低1つ PlanGate の公開一次事例がある
- [x] Verification / Review / Judgment の責務が混ざっていない
- [x] Autonomy / Authority の境界が明記されている
- [x] Context / Handoff / MERGE_READY が後付け付録ではなく本編に入っている
- [x] Level / Phase / Modeを区別して段階導入できる
- [x] PlanGate を使わない方がよいケースも本文か付録で明記する
