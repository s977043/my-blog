#!/usr/bin/env python3
"""
export_to_obsidian.py
my-blog の Zenn / Qiita / note 記事を Obsidian Vault (ai-second-brain) へ集約する。

2026-06-15 の Vault 再編成（origin/main 採用・スペース区切り PARA 構成）に追従:
- 出力先: <vault>/05 Content/blog/{zenn,qiita,note}/*.md
- 添付:   <vault>/Attachments/（.obsidian の attachmentFolderPath 準拠）
- 画像リンクは blog/<platform>/ から見た ../../../Attachments に張り替え

Usage:
    python scripts/export_to_obsidian.py
    python scripts/export_to_obsidian.py --vault /path/to/ai-second-brain
"""

import argparse
import re
import shutil
import yaml
from pathlib import Path

REPO = Path("/home/minewo/github/my-blog")
DEFAULT_VAULT = Path("/home/minewo/github/ai-second-brain")
REL_ATTACH = "../../../Attachments"


def ensure(p: Path):
    p.mkdir(parents=True, exist_ok=True)


def write(p: Path, content: str):
    ensure(p.parent)
    p.write_text(content, encoding="utf-8")


def parse_fm(content: str):
    if content.startswith("---"):
        parts = content.split("---", 2)
        if len(parts) >= 3:
            try:
                return yaml.safe_load(parts[1]) or {}, parts[2].lstrip("\n")
            except Exception:
                pass
    return {}, content


def dump_fm(fm: dict, body: str) -> str:
    if not fm:
        return body
    s = yaml.dump(fm, allow_unicode=True, sort_keys=False, default_flow_style=False)
    return f"---\n{s}---\n\n{body}"


def convert_callouts(body: str) -> str:
    body = re.sub(r":::message alert\s*\n(.*?)\n:::", r"> [!warning]\n> \1", body, flags=re.DOTALL)
    body = re.sub(r":::message\s*\n(.*?)\n:::", r"> [!info]\n> \1", body, flags=re.DOTALL)
    return body


def process_note(content: str, slug: str, state: str):
    fm, body = parse_fm(content)
    tm = re.search(r"^# (.+)", body, re.MULTILINE)
    if tm:
        fm.setdefault("title", tm.group(1).strip())
    meta = [l for l in body.splitlines() if l.startswith("> ")]
    ext = {}
    for l in meta:
        m = re.match(r"> ([^:]+): (.+)", l)
        if m:
            k, v = m.group(1).strip(), m.group(2).strip()
            if "出典" in k or "url" in k.lower():
                ext["original_url"] = v
            elif "公開状態" in k or "区分" in k:
                ext["state"] = v
            elif "更新" in k:
                ext["updated_at"] = v
    if ext:
        fm.update(ext)
        fm.setdefault("platform", "note")
        fm.setdefault("tags", ["note", ext.get("state", state).lower()])
        for l in meta:
            body = body.replace(l + "\n", "", 1)
    else:
        fm.setdefault("platform", "note")
        fm.setdefault("tags", ["note", state])
    body = re.sub(r"^# .+\n", "", body, count=1).lstrip()
    return fm, body


def process_images(body: str, platform: str, slug: str, source_dir: Path, attach_dir: Path) -> str:
    def rep(m):
        orig = m.group(1)
        if not orig.startswith(("../images/", "../assets/", "images/", "assets/")):
            return m.group(0)
        fn = Path(orig).name
        newfn = f"{platform}_{slug}_{fn}"
        for cand in [source_dir / orig.lstrip("./"), source_dir.parent / orig.lstrip("./")]:
            if cand.exists():
                ensure(attach_dir)
                shutil.copy2(cand, attach_dir / newfn)
                return f"![{fn}]({REL_ATTACH}/{newfn})"
        return m.group(0)

    return re.sub(r"!\[[^\]]*\]\(([^)]+)\)", rep, body)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--vault", type=Path, default=DEFAULT_VAULT,
                        help="Obsidian Vault のルート（ai-second-brain）")
    args = parser.parse_args()

    out = args.vault / "05 Content" / "blog"
    attach = args.vault / "Attachments"
    zenn, qiita, note = REPO / "articles", REPO / "Qiita" / "public", REPO / "articles_note"
    nz = nq = nn = 0

    for md in zenn.glob("*.md"):
        fm, body = parse_fm(md.read_text(encoding="utf-8"))
        fm.setdefault("platform", "zenn")
        if "topics" in fm:
            fm["tags"] = fm.pop("topics")
        fm["original_url"] = f"https://zenn.dev/minewo/articles/{md.stem}"
        body = process_images(convert_callouts(body), "zenn", md.stem, zenn, attach)
        write(out / "zenn" / f"{md.stem}.md", dump_fm(fm, body))
        nz += 1

    for md in qiita.glob("*.md"):
        fm, body = parse_fm(md.read_text(encoding="utf-8"))
        fm.setdefault("platform", "qiita")
        if fm.get("id"):
            fm["original_url"] = f"https://qiita.com/s977043/items/{fm['id']}"
        body = process_images(body, "qiita", md.stem, qiita, attach)
        write(out / "qiita" / f"{md.stem}.md", dump_fm(fm, body))
        nq += 1

    for state in ["published", "drafts", "new"]:
        sp = note / state
        if not sp.exists():
            continue
        for md in sp.glob("*.md"):
            fm, body = process_note(md.read_text(encoding="utf-8"), md.stem, state)
            body = process_images(body, "note", md.stem, sp, attach)
            write(out / "note" / f"{md.stem}.md", dump_fm(fm, body))
            nn += 1

    print(f"✅ Exported zenn={nz} qiita={nq} note={nn} -> {out}")


if __name__ == "__main__":
    main()
