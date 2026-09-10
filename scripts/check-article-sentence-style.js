#!/usr/bin/env node
/**
 * check:article-sentence-style
 *
 * 敬体（ですます）と常体（言い切り）の混在を章単位で検出する。
 *
 * ■ なぜ必要か
 *   AGENTS.md §表現規約 は「敬体／常体の混在は章単位のみ許容」と定めているが、
 *   機械的な検証が無く、実際に広報レビューで「語尾が違うのが気になる」と
 *   指摘を受けた（2026-09-10、PRONI 公式 SDD 記事）。
 *
 * ■ 判定
 *   章（## / ###）ごとに文末を数え、常体率が STYLE_MIN 以上 0.5 未満なら WARN。
 *   - 0%           … 敬体で統一されている。通す
 *   - 50% 以上     … その章は常体で書いている。規約が許容する「章単位」。通す
 *   - 1〜49%       … 混在。うち STYLE_MIN 以上を WARN（下限未満はノイズとして通す）
 *
 * ■ 対象（未公開の記事のみ）
 *   - articles/*.md のうち published: false
 *   - articles_note/new/*.md
 *   - Qiita/public/*.md のうち ignorePublish: true
 *   公開済みの資産は対象にしない。既存 85 記事を対象にすると 241 章が WARN になり
 *   signal/noise を壊す（AGENT_LEARNINGS.md 2026-09-06 の学び）。
 *
 * ■ 既知の検出漏れ（self-test で固定してある）
 *   1. 太字で終わる行。`**……が違う。**` は行末が `**` なので、素朴に「。で終わる行」
 *      だけ見ると落ちる。実際にレビューが最初に指摘した2文がこれだった
 *   2. 行頭 `**`。箇条書きマーカー `*` と同一視すると、強調した言い切りが全滅する
 *   どちらも「一番指摘されやすい文」を構造的に見逃すので、必ず先に強調記号を除く。
 *
 * ■ 既知の限界（未対応。WARN を読む側が判断する）
 *   - **述語のない名詞列挙を常体として数える**。「仕様、Test、Domain Design。」のような
 *     体言止めの列挙が常体1件になる（2026-09-10、agent-harness-engineering-note で観測）。
 *     体言止めは意図的な文体であることが多く、自動判別が難しいため数え方を変えていない。
 *   - 章まるごと体言止めや短文連打で締める記事は、常体率が閾値に届いて WARN が残る。
 *     AGENTS.md は「敬体／常体の混在は章単位のみ許容」としており、**章単位で選んだ常体は
 *     規約違反ではない**。WARN が出ても、意図的なら直さないのが正しい。
 */

const fs = require("fs");
const path = require("path");

const LABEL = "[check:article-sentence-style]";
const ROOT = path.resolve(__dirname, "..");
const STYLE_MIN = 0.2; // 常体率の下限。20% 未満はノイズとして通す
const MIN_SENTENCES = 3; // 章あたりの最小文数。短すぎる章は比率が暴れる
const EXIT_ON_WARN = false; // WARN 止まり（段階導入）

const KEITAI =
  /(です|ます|ました|ません|でしょう|ください|ましょう|でした|ですね|ですが|ますが)$/;
/**
 * 文末の括弧を落としてから文体を見る。
 * 「……公開しています（Loop engineering）。」のように、敬体の直後へ補足の括弧が付く形が
 * 実データに多く、これを常体と誤判定していた（2026-09-10 実測で誤検出 5 件）。
 */
function stripTrailingParen(core) {
  let s = core;
  for (let i = 0; i < 3; i += 1) {
    const next = s.replace(/[（(][^（()）]*[)）]$/, "").trimEnd();
    if (next === s) break;
    s = next;
  }
  return s;
}
const SKIP_TAIL = /(か|ね|よ|な)$/; // 疑問・呼びかけ・詠嘆は文体判定から外す

/** 行から Markdown の装飾を落とす。強調を先に消さないと文末が取れない */
function stripInline(line) {
  return line
    .replace(/`[^`]*`/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\*\*/g, "")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1$2");
}

/** 本文として数えない行か。マーカーは「記号 + 空白」のみ（行頭 ** を巻き込まない） */
function isSkippableLine(line) {
  return (
    !line.trim() ||
    /^\s*(#{1,6}\s|>\s|\|)/.test(line) ||
    /^\s*([-*+]\s|\d+\.\s)/.test(line) ||
    /^\s*(---|===)\s*$/.test(line)
  );
}

/** 本文を章ごとに集計する。純関数。self-test はここを叩く */
function analyze(text) {
  const sections = [];
  let current = { title: "(冒頭)", line: 1, kei: 0, jou: 0, samples: [] };
  let inBlock = false;

  text.split("\n").forEach((line, idx) => {
    const lineNo = idx + 1;
    if (/^(```|~~~)/.test(line)) {
      inBlock = !inBlock;
      return;
    }
    if (inBlock) return;

    const heading = line.match(/^(#{2,3})\s+(.+)$/);
    if (heading) {
      sections.push(current);
      current = {
        title: heading[2].trim(),
        line: lineNo,
        kei: 0,
        jou: 0,
        samples: [],
      };
      return;
    }
    if (isSkippableLine(line)) return;

    const stripped = stripInline(line);
    stripped
      .split(/(?<=。)/)
      .map((s) => s.trim())
      .filter((s) => s.endsWith("。"))
      .forEach((sentence) => {
        const core = stripTrailingParen(sentence.slice(0, -1));
        if (SKIP_TAIL.test(core)) return;
        if (KEITAI.test(core)) {
          current.kei += 1;
        } else {
          current.jou += 1;
          current.samples.push({ line: lineNo, text: sentence.slice(-40) });
        }
      });
  });
  sections.push(current);

  return sections
    .map((s) => {
      const total = s.kei + s.jou;
      return { ...s, total, ratio: total ? s.jou / total : 0 };
    })
    .filter((s) => s.total > 0);
}

function warnings(sections) {
  return sections.filter(
    (s) =>
      s.total >= MIN_SENTENCES && s.ratio >= STYLE_MIN && s.ratio < 0.5,
  );
}

// ---------- 対象ファイルの収集 ----------

function listDir(rel) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) return [];
  return fs
    .readdirSync(abs)
    .filter((f) => f.endsWith(".md"))
    .map((f) => path.posix.join(rel, f));
}

function frontMatterSays(relPath, pattern) {
  const head = fs.readFileSync(path.join(ROOT, relPath), "utf8").slice(0, 800);
  return pattern.test(head);
}

function collectTargets() {
  const zenn = listDir("articles").filter((p) =>
    frontMatterSays(p, /^published:\s*false\s*$/m),
  );
  const qiita = listDir("Qiita/public").filter((p) =>
    frontMatterSays(p, /^ignorePublish:\s*true\s*$/m),
  );
  const note = listDir("articles_note/new");
  return [...zenn, ...qiita, ...note].sort();
}

// ---------- self-test ----------

function selfTest() {
  let pass = 0;
  let fail = 0;
  const eq = (name, actual, expected) => {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    console.log(`  ${ok ? "ok  " : "FAIL"} ${name}${ok ? "" : ` (期待 ${JSON.stringify(expected)} / 実際 ${JSON.stringify(actual)})`}`);
    ok ? pass++ : fail++;
  };

  // 回帰1: 太字で終わる行。素朴実装だと行末が ** なので落ちる
  const bold = analyze(
    "## 章\n\nこれは敬体です。\n\n**先に明らかにすべきものが違う。**\n\nこれも敬体です。\n",
  );
  eq("太字で終わる常体を検出する", bold[0].jou, 1);

  // 回帰2: 行頭 **。箇条書きマーカーと誤判定すると全滅する
  const leading = analyze("## 章\n\n**そのまま当てていた。**\n\n敬体の文です。\n");
  eq("行頭の ** を箇条書きと誤判定しない", leading[0].jou, 1);

  // 箇条書きは本当に除外する
  const bullet = analyze("## 章\n\n- 箇条書きは数えない。\n\n敬体の文です。\n");
  eq("箇条書き（- + 空白）は除外する", bullet[0].jou, 0);

  // コードブロック内は数えない
  const code = analyze("## 章\n\n```text\nこれは常体だ。\n```\n\n敬体の文です。\n");
  eq("コードブロック内は数えない", code[0].jou, 0);

  // 章で統一されていれば通す
  const unified = analyze("## 章\n\n第一の文だ。\n\n第二の文だ。\n\n第三の文だ。\n");
  eq("常体で統一された章は WARN にしない", warnings(unified).length, 0);

  const allKeitai = analyze("## 章\n\n第一です。\n\n第二です。\n\n第三です。\n");
  eq("敬体で統一された章は WARN にしない", warnings(allKeitai).length, 0);

  // 混在は WARN
  const mixed = analyze(
    "## 章\n\n第一です。\n\n第二です。\n\n第三です。\n\n第四が違う。\n",
  );
  eq("常体率 25% の章は WARN", warnings(mixed).length, 1);

  // 下限未満は通す
  const rare = analyze(
    "## 章\n\n" + "敬体です。\n\n".repeat(9) + "一つだけ違う。\n",
  );
  eq("常体率 10% は下限未満なので通す", warnings(rare).length, 0);

  // 短い章は比率が暴れるので通す
  const tiny = analyze("## 章\n\n敬体です。\n\n違う。\n");
  eq("文数が閾値未満の章は通す", warnings(tiny).length, 0);

  // 疑問形は文体判定から外す
  const question = analyze("## 章\n\n敬体です。\n\n敬体です。\n\nそうだろうか。\n");
  eq("疑問形は常体に数えない", question[0].jou, 0);

  // 見出しで章が分かれる
  const twoSecs = analyze("## A\n\n敬体です。\n\n## B\n\n違う。\n");
  eq("章が2つに分かれる", twoSecs.length, 2);

  // 回帰3: 文末の補足括弧。敬体の直後に（…）が付く形を常体と誤判定していた
  const paren = analyze(
    "## 章\n\n公開しています（Loop engineering）。\n\n敬体です。\n",
  );
  eq("文末の補足括弧を落としてから判定する", paren[0].jou, 0);

  const nestedParen = analyze(
    "## 章\n\n分けて管理しています（個々の呼称は本題ではないので省きます）。\n\n敬体です。\n",
  );
  eq("括弧内に句点があっても敬体と判定する", nestedParen[0].jou, 0);

  // 括弧を落としても常体なら、きちんと常体のまま
  const parenJoutai = analyze("## 章\n\n対象が違う（前述）。\n\n敬体です。\n");
  eq("括弧を落として常体なら常体のまま", parenJoutai[0].jou, 1);

  console.log(`\n${LABEL} self-test ${fail === 0 ? "OK" : "FAILED"}: ${pass}/${pass + fail}`);
  process.exit(fail === 0 ? 0 : 1);
}

// ---------- main ----------

function main() {
  const args = process.argv.slice(2);
  if (args.includes("--self-test")) return selfTest();

  const explicit = args.filter((a) => !a.startsWith("--"));
  const targets = explicit.length ? explicit : collectTargets();

  if (!targets.length) {
    console.log(`${LABEL} skip: 対象となる未公開記事がありません`);
    return;
  }

  let warned = 0;
  let sectionCount = 0;
  for (const rel of targets) {
    const abs = path.isAbsolute(rel) ? rel : path.join(ROOT, rel);
    if (!fs.existsSync(abs)) {
      console.log(`${LABEL} skip: ${rel} が見つかりません`);
      continue;
    }
    const sections = analyze(fs.readFileSync(abs, "utf8"));
    const hits = warnings(sections);
    sectionCount += sections.length;
    if (!hits.length) continue;
    warned += hits.length;
    console.log(`${LABEL} WARN ${rel}`);
    for (const s of hits) {
      console.log(
        `  L${s.line} 「${s.title}」 敬体 ${s.kei} / 常体 ${s.jou}（常体率 ${Math.round(s.ratio * 100)}%）`,
      );
      for (const sample of s.samples.slice(0, 3)) {
        console.log(`      L${sample.line}  …${sample.text}`);
      }
      if (s.samples.length > 3) {
        console.log(`      （ほか ${s.samples.length - 3} 件）`);
      }
    }
  }

  if (warned) {
    console.log(
      `${LABEL} WARN only: ${targets.length} 記事 / ${sectionCount} 章のうち ${warned} 章で敬体と常体が混在（章単位で揃えるか、章ごと常体にする）`,
    );
    if (EXIT_ON_WARN) process.exit(1);
  } else {
    console.log(
      `${LABEL} OK: 文体の混在なし（対象 ${targets.length} 記事 / ${sectionCount} 章）`,
    );
  }
}

main();
