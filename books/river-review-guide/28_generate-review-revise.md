# generate → review → reviseをどう収束させるか

River Reviewはgenerate → review → reviseループの **review stage** として組み込めます。

返すのは、Finding / decision / suggestedLoopSignal / coverageなどの判定材料です。

一方で、次をRiver Review自身は所有しません。

- 何回繰り返すか
- いつ停止するか
- いつ人へエスカレーションするか
- いつmergeするか

これらはcaller側の責務です。

現行Loop Convergence Contractでは、`REVISE_REQUIRED` / `CONVERGED` / `ESCALATE_HUMAN` などのsignalを提供し、callerが決定論的に次の行動を選べるようにしています。
