export const meta = {
  name: 'ultracode-quality-check',
  description: 'Exhaustive multi-agent quality check: per-target review + static media-risk scan + external link verification + adversarial filtering. Reusable across articles/books.',
  whenToUse: 'When you want an exhaustive, convergence-aware quality gate on a set of Markdown targets (Zenn/Qiita articles or a Zenn book) before publishing. Catches real bugs that single-pass reviews miss, while adversarially rejecting padding.',
  phases: [
    { title: 'StaticScan', detail: 'media-specific & link pitfalls by grep (catches what text review misses)' },
    { title: 'Review', detail: 'per-target deep review grounded in the implementation source' },
    { title: 'Links', detail: 'external link liveness' },
    { title: 'Verify', detail: 'adversarially filter proposed improvements to real value only' },
    { title: 'Synthesize', detail: 'consolidate blockers / confirmed improvements / risks' },
  ],
}

// ── args（呼び出し時に渡す） ───────────────────────────────────────────────
//  {
//    targets: ["books/plangate-guide/03_plan.md", ...]   // 必須: レビュー対象の .md 群
//    implRepo: "/Users/user/Documents/GitHub/plangate"   // 任意: 事実照合の正本(コード/スキーマ/docs)
//    platform: "zenn" | "qiita" | "zenn-book"            // 任意: 媒体(静的リスクの判定に使用)。既定 "zenn"
//    links: ["https://...", ...]                          // 任意: 実在確認する外部リンク
//    claim: "本書の主張/前提"                              // 任意: レビュー時に渡す文脈
//  }
const cfg = args || {}
const TARGETS = Array.isArray(cfg.targets) ? cfg.targets : []
const IMPL = cfg.implRepo ? `（事実照合の正本: ${cfg.implRepo}。コード/スキーマ/docs と必ず突き合わせる）` : '（実装の正本が与えられていない場合は、照合不能な指摘を低信頼として扱う）'
const PLATFORM = cfg.platform || 'zenn'
const LINKS = Array.isArray(cfg.links) ? cfg.links : []
const CLAIM = cfg.claim ? `対象の主張/前提: ${cfg.claim}` : ''

if (!TARGETS.length) {
  return { error: 'args.targets（レビュー対象の .md パス配列）が未指定です。例: {targets:["articles/foo.md"], implRepo:"/path/to/impl", platform:"zenn"}' }
}

// 媒体ごとの「静的に検出できる落とし穴」。文章レビューでは出ない媒体仕様バグを grep で先回りする。
const PLATFORM_PITFALLS = {
  'zenn': [
    'markdown 画像での SVG 参照（![](*.svg)）— Zenn は SVG を表示しない。mermaid か PNG/JPEG/WebP/GIF に',
    'Book/記事間の相対パスリンク（](../ や ](./ や *.md）— 公開サイトで 404。Zenn フル URL に',
    'frontmatter の published / title / topics(5個以内) / emoji の妥当性',
  ],
  'zenn-book': [
    'markdown 画像での SVG 参照（![](*.svg)）— Zenn は SVG を表示しない。mermaid 化推奨',
    'chapters に無い .md が book ディレクトリに混在（preview に「無題」表示）',
    'Book→記事リンクの相対パス（公開サイトで 404）→ フル URL に',
    'config.yaml の published/price/topics(5)/chapters とファイル名の一致、cover の比率(1:1.4=500x700)・破損(終端ffd9)',
  ],
  'qiita': [
    'frontmatter: tags(5個以内) / private / id / ignorePublish の妥当性',
    'Zenn 固有記法（:::message 等）の残存 — Qiita は :::note',
    'コードブロックの言語指定漏れ / コピペで動かないサンプル（重複宣言など）',
  ],
}
const pitfalls = (PLATFORM_PITFALLS[PLATFORM] || PLATFORM_PITFALLS['zenn']).map((p,i)=>`${i+1}. ${p}`).join('\n')

const STATIC_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['findings'],
  properties: {
    findings: { type: 'array', items: {
      type: 'object', additionalProperties: false,
      required: ['file','issue','severity'],
      properties: {
        file: { type: 'string' },
        issue: { type: 'string', description: '静的に検出した媒体/リンクの問題（実際のパス・行を引用）' },
        severity: { type: 'string', enum: ['blocker','warn'] },
      }
    }}
  }
}

const REVIEW_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['target','blockers','improvements','verdict'],
  properties: {
    target: { type: 'string' },
    blockers: { type: 'array', items: { type: 'string' }, description: '出版を止める/読者を誤らせる問題。なければ空' },
    improvements: { type: 'array', items: {
      type: 'object', additionalProperties: false,
      required: ['desc','value','accurate'],
      properties: {
        desc: { type: 'string' },
        value: { type: 'string', enum: ['high','low'] },
        accurate: { type: 'boolean' },
      }
    }},
    verdict: { type: 'string', enum: ['publish-ready','needs-fix'] },
  }
}

const LINK_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['results'],
  properties: { results: { type: 'array', items: {
    type: 'object', additionalProperties: false, required: ['url','ok','note'],
    properties: { url:{type:'string'}, ok:{type:'boolean'}, note:{type:'string'} }
  }}}
}

const VERDICT_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['desc','isRealImprovement','reason'],
  properties: {
    desc: { type: 'string' },
    isRealImprovement: { type: 'boolean' },
    reason: { type: 'string' },
  }
}

// ── Phase 1: 静的媒体リスクスキャン（文章レビューの盲点を埋める）────────────
phase('StaticScan')
const staticScan = await agent(
  `次の Markdown 群を、媒体「${PLATFORM}」固有の落とし穴について静的に点検する（grep / Read で実ファイルを確認し、推測でなく実際の行を引用）。\n`+
  `対象:\n${TARGETS.map(t=>'- '+t).join('\n')}\n\n`+
  `点検する落とし穴:\n${pitfalls}\n\n`+
  `見つかった問題を severity(blocker/warn) 付きで返す。問題なしなら findings は空配列。`,
  { label: 'static-scan', phase: 'StaticScan', schema: STATIC_SCHEMA }
)

// ── Phase 2: 対象ごとの精読レビュー（実装正本と照合）──────────────────────
phase('Review')
const reviews = (await parallel(TARGETS.map(t => () =>
  agent(
    `Markdown「${t}」を出版前に厳しくレビューする。${IMPL} ${CLAIM}\n`+
    `(1) 出版を止める/読者を誤らせる blockers、(2) 入れれば明確に価値が上がる improvements のみ。好み・水増しは value=low。`+
    `各 improvement は実装と照合して accurate を判定。些細な「改善のための改善」は出さない。他対象との整合(用語/番号/挙動)も見る。`,
    { label: `review:${t.split('/').pop()}`, phase: 'Review', schema: REVIEW_SCHEMA }
  )
))).filter(Boolean)

// ── Phase 3: 外部リンク実在確認（任意）──────────────────────────────────
phase('Links')
let links = { results: [] }
if (LINKS.length) {
  links = await agent(
    `次のURLが実在・到達可能か検証する。可能なら WebFetch で取得を試み、404/リンク切れを ok/note で返す。\nURL:\n${LINKS.map(u=>'- '+u).join('\n')}`,
    { label: 'link-check', phase: 'Links', schema: LINK_SCHEMA }
  )
}

// ── Phase 4: 改善提案の敵対的検証（水増しを却下）────────────────────────
const candidates = reviews.flatMap(r =>
  (r.improvements||[]).filter(i => i.value === 'high' && i.accurate).map(i => ({ target: r.target, desc: i.desc }))
)
phase('Verify')
const verified = (await parallel(candidates.map(c => () =>
  agent(
    `改善提案を敵対的に検証する。提案:「${c.desc}」(対象: ${c.target})。${IMPL}\n`+
    `この対象は既に複数回レビュー済みである前提で、提案が【本当に】読者価値を明確に上げる実改善か、それとも水増し/好み/方針違反かを判定する。`+
    `デフォルトは isRealImprovement=false（疑わしきは却下）。実装と照合して正確かつ明確な価値がある場合のみ true。`,
    { label: `verify:${c.target.split('/').pop()}`, phase: 'Verify', schema: VERDICT_SCHEMA }
  ).then(v => ({ ...c, ...v }))
))).filter(Boolean)

// ── Phase 5: 統合 ──────────────────────────────────────────────────────
phase('Synthesize')
const staticBlockers = (staticScan?.findings||[]).filter(f => f.severity === 'blocker')
const staticWarns = (staticScan?.findings||[]).filter(f => f.severity === 'warn')
const blockers = reviews.flatMap(r => (r.blockers||[]).map(b => ({ target: r.target, blocker: b })))
const confirmed = verified.filter(v => v.isRealImprovement)
const brokenLinks = (links.results||[]).filter(l => !l.ok)

return {
  summary: {
    targets: TARGETS.length,
    publishReady: reviews.filter(r => r.verdict === 'publish-ready').length,
    staticBlockers: staticBlockers.length,
    reviewBlockers: blockers.length,
    brokenLinks: brokenLinks.length,
    confirmedImprovements: confirmed.length,
    rejectedImprovements: verified.length - confirmed.length,
    goNoGo: (staticBlockers.length + blockers.length + brokenLinks.length) === 0 ? 'GO候補（要人手の実レンダリング確認）' : 'NO-GO（下記blocker解消が必要）',
  },
  staticBlockers, staticWarns,
  blockers, brokenLinks,
  confirmedImprovements: confirmed.map(v => ({ target: v.target, desc: v.desc, reason: v.reason })),
  rejectedImprovements: verified.filter(v => !v.isRealImprovement).map(v => ({ target: v.target, desc: v.desc })),
  perTarget: reviews.map(r => ({ target: r.target, verdict: r.verdict, blockers: r.blockers.length })),
  note: 'このフローは「文章＋静的＋リンク＋敵対的検証」までを自動化する。媒体での実表示（mermaid 描画・cover・画像）は別途 Playwright 等で実レンダリング確認すること（エージェントは描画結果を見ない）。',
}
