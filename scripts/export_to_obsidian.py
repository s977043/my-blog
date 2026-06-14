#!/usr/bin/env python3
"""
export_to_obsidian.py
Zenn / Qiita / note の記事を Obsidian Vault 向けに変換・集約するスクリプト

Usage:
    python scripts/export_to_obsidian.py
    python scripts/export_to_obsidian.py --output /path/to/custom_vault
"""

import argparse
import re
import shutil
import yaml
from pathlib import Path

def ensure_dir(path: Path):
    path.mkdir(parents=True, exist_ok=True)

def safe_write(path: Path, content: str):
    ensure_dir(path.parent)
    path.write_text(content, encoding="utf-8")

def parse_frontmatter(content: str):
    if content.startswith("---"):
        parts = content.split("---", 2)
        if len(parts) >= 3:
            try:
                fm = yaml.safe_load(parts[1]) or {}
                body = parts[2].lstrip("\n")
                return fm, body
            except:
                pass
    return {}, content

def dump_frontmatter(fm: dict, body: str) -> str:
    if not fm:
        return body
    fm_str = yaml.dump(fm, allow_unicode=True, sort_keys=False, default_flow_style=False)
    return f"---\n{fm_str}---\n\n{body}"

def convert_zenn_callouts(body: str) -> str:
    body = re.sub(r":::message\s*\n(.*?)\n:::", r"> [!info]\n> \1", body, flags=re.DOTALL)
    body = re.sub(r":::message alert\s*\n(.*?)\n:::", r"> [!warning]\n> \1", body, flags=re.DOTALL)
    return body

def process_note_article(content: str, slug: str, state: str):
    fm, body = parse_frontmatter(content)

    title_match = re.search(r"^# (.+)", body, re.MULTILINE)
    if title_match:
        fm.setdefault("title", title_match.group(1).strip())

    meta_lines = [line for line in body.splitlines() if line.startswith("> ")]
    extracted = {}
    for line in meta_lines:
        m = re.match(r"> ([^:]+): (.+)", line)
        if m:
            key, value = m.group(1).strip(), m.group(2).strip()
            if "出典" in key or "url" in key.lower():
                extracted["original_url"] = value
            elif "公開状態" in key or "区分" in key:
                extracted["state"] = value
            elif "更新" in key:
                extracted["updated_at"] = value

    if extracted:
        fm.update(extracted)
        fm.setdefault("platform", "note")
        state_value = extracted.get("state", state)
        fm.setdefault("tags", ["note", state_value.lower()])
        for line in meta_lines:
            body = body.replace(line + "\n", "", 1)
    else:
        fm.setdefault("platform", "note")
        fm.setdefault("tags", ["note", state])

    body = re.sub(r"^# .+\n", "", body, count=1).lstrip()
    return fm, body

def process_images(body: str, platform: str, slug: str, source_dir: Path, attachments_dir: Path) -> str:
    def replacer(match):
        original_path = match.group(1)
        if not original_path.startswith(("../images/", "../assets/", "images/", "assets/")):
            return match.group(0)
        filename = Path(original_path).name
        new_filename = f"{platform}_{slug}_{filename}"
        dest = attachments_dir / new_filename
        for cand in [source_dir / original_path.lstrip("./"), source_dir.parent / original_path.lstrip("./")]:
            if cand.exists():
                ensure_dir(attachments_dir)
                shutil.copy2(cand, dest)
                return f"![{filename}](../attachments/{new_filename})"
        return match.group(0)

    return re.sub(r"!\[[^\]]*\]\(([^)]+)\)", replacer, body)

def add_to_gitignore(repo_root: Path):
    gitignore = repo_root / ".gitignore"
    entry = "obsidian_vault/"
    if gitignore.exists() and entry not in gitignore.read_text(encoding="utf-8"):
        with open(gitignore, "a", encoding="utf-8") as f:
            f.write(f"\n{entry}\n")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=Path("/home/minewo/github/my-blog/obsidian_vault"))
    args = parser.parse_args()

    repo_root = Path("/home/minewo/github/my-blog")
    output_dir = args.output
    attachments_dir = output_dir / "attachments"

    sources = {
        "zenn": repo_root / "articles",
        "qiita": repo_root / "Qiita" / "public",
        "note": repo_root / "articles_note",
    }

    ensure_dir(output_dir)
    ensure_dir(attachments_dir)

    # Zenn
    for md in sources["zenn"].glob("*.md"):
        fm, body = parse_frontmatter(md.read_text(encoding="utf-8"))
        fm.setdefault("platform", "zenn")
        if "topics" in fm:
            fm["tags"] = fm.pop("topics")
        fm["original_url"] = f"https://zenn.dev/minewo/articles/{md.stem}"
        body = convert_zenn_callouts(body)
        body = process_images(body, "zenn", md.stem, sources["zenn"], attachments_dir)
        safe_write(output_dir / "Zenn" / f"{md.stem}.md", dump_frontmatter(fm, body))

    # Qiita
    for md in sources["qiita"].glob("*.md"):
        fm, body = parse_frontmatter(md.read_text(encoding="utf-8"))
        fm.setdefault("platform", "qiita")
        if "id" in fm:
            fm["original_url"] = f"https://qiita.com/minewo/items/{fm['id']}"
        body = process_images(body, "qiita", md.stem, sources["qiita"], attachments_dir)
        safe_write(output_dir / "Qiita" / f"{md.stem}.md", dump_frontmatter(fm, body))

    # Note
    for state in ["published", "drafts", "new"]:
        state_path = sources["note"] / state
        if not state_path.exists():
            continue
        for md in state_path.glob("*.md"):
            fm, body = process_note_article(md.read_text(encoding="utf-8"), md.stem, state)
            body = process_images(body, "note", md.stem, state_path, attachments_dir)
            safe_write(output_dir / "Note" / f"{md.stem}.md", dump_frontmatter(fm, body))

    add_to_gitignore(repo_root)
    print(f"✅ Export completed to: {output_dir}")

if __name__ == "__main__":
    main()