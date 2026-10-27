// AGENT_LEARNINGS.md とアーカイブ（docs/agent-learnings/archive/*.md）を読む 2 本のチェッカー
// （check-learnings-index.js / report-learnings-promotion.js）で共有する定義。

const fs = require("fs");
const path = require("path");

const ARCHIVE_DIR = path.join("docs", "agent-learnings", "archive");
const DATE = "\\d{4}-\\d{2}-\\d{2}";
// エントリ見出し `### YYYY-MM-DD —`。日付は 1 番目のキャプチャ。
const ENTRY_HEADING_RE = new RegExp(`^### (${DATE})\\s`);

// アーカイブの .md を名前順に読む。ディレクトリが無ければ空。
// 読めないときはパスと原因を載せた Error を投げる（呼び出し側で FAIL にする）。
function readArchives(root, fsImpl = fs) {
  const dir = path.join(root, ARCHIVE_DIR);
  if (!fsImpl.existsSync(dir)) return [];
  let names;
  try {
    names = fsImpl.readdirSync(dir);
  } catch (e) {
    throw new Error(`アーカイブを一覧できない: ${ARCHIVE_DIR}（${e.message}）`);
  }
  return names
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => {
      const file = path.join(ARCHIVE_DIR, f);
      try {
        return { file, content: fsImpl.readFileSync(path.join(dir, f), "utf8") };
      } catch (e) {
        throw new Error(`アーカイブを読めない: ${file}（${e.message}）`);
      }
    });
}

module.exports = { ARCHIVE_DIR, DATE, ENTRY_HEADING_RE, readArchives };
