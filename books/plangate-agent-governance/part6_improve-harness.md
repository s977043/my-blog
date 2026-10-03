# 第6部 Harness自体を改善する

ここまで、Plan / Gate / Hook / Evidence / Handoffを使ってAIへ仕事を任せる境界を作ってきました。

しかし、もう一段厄介な問いがあります。

> **そのHarness自体が、本当に想定どおり機能していると、どう確かめるのか。**

Guardが存在する。テストがgreenになる。doctorが「registered」と表示する。

それだけでは十分ではありません。

PlanGate自身でも、

- greenなのにpluginが実際にはロードされていない
- Guardがあるのにworktree経路では素通りする
- 危険操作を止めるGuardが安全操作まで止める
- read-only検査のつもりがrepositoryを書き換える
- allowlist同士は一致しているのに、実体とのズレを検出できない

といった失敗が起きました。

この部では、それらを材料に、

~~~text
Detect
→ Reproduce
→ Fix
→ Regression Guard
→ Evaluate
~~~

というHarness改善ループを考えます。

ポイントは、Harnessもsoftwareだということです。

> **Harnessを信頼するのではなく、Harnessの主張もEvidenceで検証する。**
