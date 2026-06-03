#!/usr/bin/env node
// Lint: 公開可能状態（ignorePublish: false）の Qiita 記事に、内部運用専用の
// HTML コメント（公開当日チェックリスト等）が残っていないか検査する。
//
// なぜ必要か:
//   Qiita 記事には「公開当日チェックリスト」HTML コメント（社内運用語・手順メモ）を
//   置く運用がある。これは公開前に手動削除する前提だが、ignorePublish を false に
//   切り替える際に消し忘れると、公開記事の編集画面に内部情報が残る（情報流出）。
//   2026-05 のセッションで scope-creep 公開準備のたびに手作業で除去しており、
//   機械ガードがなかった。本 lint で公開可能ファイルの残存を fatal 検出する。
//
// 挙動:
//   - 対象: Qiita/public/**/*.md のうち公開対象（frontmatter `ignorePublish: false` または
//     ignorePublish 行が無い記事。qiita-cli は ignorePublish 未指定を「公開対象」と扱うため）
//   - ignorePublish 行が無い記事は検査対象に含めたうえで「フィールド欠落」を WARN する
//   - 検出: `<!-- ... -->` ブロック内に内部運用マーカー（scripts/config/qiita-internal-markers.json）
//   - 検出時は FAIL(exit 1)。情報流出に直結するため非 fatal にしない
//   - ignorePublish: true（下書き）のファイルはコメント残存を許容（対象外）
//
// 関連: AGENT_LEARNINGS.md 2026-05-18「Qiita 公開準備の hygiene」

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');
const TARGET_DIR = path.join(REPO_ROOT, 'Qiita', 'public');

const MARKERS_CONFIG = path.join(__dirname, 'config', 'qiita-internal-markers.json');
const INTERNAL_MARKERS = JSON.parse(fs.readFileSync(MARKERS_CONFIG, 'utf8')).markers;

function collectMarkdown(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...collectMarkdown(full));
    else if (ent.isFile() && ent.name.endsWith('.md')) out.push(full);
  }
  return out;
}

/** frontmatter の ignorePublish の値を返す（true/false/null） */
function readIgnorePublish(content) {
  const fm = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) return null;
  const m = fm[1].match(/^ignorePublish:\s*(true|false)\s*$/m);
  return m ? m[1] === 'true' : null;
}

/** HTML コメントブロックを抽出 */
function htmlComments(content) {
  return content.match(/<!--[\s\S]*?-->/g) || [];
}

function main() {
  const files = collectMarkdown(TARGET_DIR);
  const violations = [];
  const missingField = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const ip = readIgnorePublish(content); // true | false | null(欠落)
    if (ip === true) continue; // 下書きは対象外
    if (ip === null) missingField.push(path.relative(REPO_ROOT, file)); // 公開対象として検査しつつ欠落を WARN
    for (const block of htmlComments(content)) {
      const hit = INTERNAL_MARKERS.find((mk) => block.includes(mk));
      if (hit) {
        violations.push({ file: path.relative(REPO_ROOT, file), marker: hit });
        break;
      }
    }
  }

  if (missingField.length > 0) {
    console.warn(
      `[check:qiita-publish-hygiene] WARN: ignorePublish 未指定の記事 ${missingField.length} 件（公開対象として検査済み。意図を明示するため frontmatter に ignorePublish を追記推奨）`,
    );
    missingField.slice(0, 20).forEach((f) => console.warn(`  ${f}`));
  }

  if (violations.length === 0) {
    console.log('[check:qiita-publish-hygiene] OK: 公開対象 Qiita 記事に内部運用コメントの残存なし');
    return;
  }

  console.error('[check:qiita-publish-hygiene] FAIL: 公開対象記事に内部運用 HTML コメントが残存');
  console.error('  ignorePublish:false の記事に内部メモが残ると公開記事へ情報流出します。公開前に削除してください。');
  console.error('  参照: AGENT_LEARNINGS.md 2026-05-18「Qiita 公開準備の hygiene」');
  console.error('');
  for (const v of violations) {
    console.error(`  ${v.file}  （検出マーカー: "${v.marker}"）`);
  }
  process.exit(1);
}

main();
