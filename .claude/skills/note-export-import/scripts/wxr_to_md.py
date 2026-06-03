#!/usr/bin/env python3
"""note.com公式エクスポート(WXR + assets)をローカル編集用Markdownに展開する。

使い方:
    python3 wxr_to_md.py <zip_or_dir> [--out articles_note/]

処理内容:
    1. 入力がZIPなら解凍、ディレクトリならそのまま使う
    2. <articles_note>/export/YYYY-MM-DD/ にZIPがまだなければ原本をコピー
    3. assets/ を <articles_note>/assets/ に上書き反映
    4. <item> を wp:status で振り分け、published/ drafts/ に <guid>.md を出力
"""
from __future__ import annotations
import argparse
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile
from datetime import date
from pathlib import Path
from xml.etree import ElementTree as ET

try:
    from markdownify import markdownify as md
except ImportError:
    sys.stderr.write("pip install --break-system-packages markdownify\n")
    sys.exit(1)

NS = {
    "content": "http://purl.org/rss/1.0/modules/content/",
    "wp": "http://wordpress.org/export/1.2/",
}


def rewrite_asset_paths(html: str) -> str:
    return re.sub(r'(["\'(])/assets/', r'\1../assets/', html)


def clean_md(text: str) -> str:
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = "\n".join(line.rstrip() for line in text.splitlines())
    return text.strip() + "\n"


def extract_if_zip(src: Path, workdir: Path) -> Path:
    if src.is_dir():
        return src
    if src.suffix.lower() == ".zip":
        target = workdir / src.stem
        target.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(src) as zf:
            zf.extractall(target)
        return target
    raise SystemExit(f"Unsupported input: {src}")


def find_wxr(root: Path) -> Path:
    candidates = list(root.rglob("note-*.xml")) or list(root.rglob("*.xml"))
    if not candidates:
        raise SystemExit(f"WXR not found in {root}")
    return candidates[0]


def convert(xml_path: Path, assets_src: Path, out_root: Path) -> tuple[int, int]:
    pub_dir = out_root / "published"
    draft_dir = out_root / "drafts"
    assets_dst = out_root / "assets"
    pub_dir.mkdir(parents=True, exist_ok=True)
    draft_dir.mkdir(parents=True, exist_ok=True)
    assets_dst.mkdir(parents=True, exist_ok=True)

    if assets_src.exists():
        for f in assets_src.iterdir():
            if f.is_file() and not f.name.startswith("."):
                shutil.copy2(f, assets_dst / f.name)

    pub = draft = 0
    tree = ET.parse(xml_path)
    for item in tree.getroot().find("channel").findall("item"):
        title = (item.findtext("title", "") or "").strip() or "(untitled)"
        link = (item.findtext("link", "") or "").strip()
        guid = (item.findtext("guid", "") or "").strip()
        pub_date = (item.findtext("pubDate", "") or "").strip()
        status_el = item.find("wp:status", NS)
        status = status_el.text if status_el is not None else "draft"
        content_el = item.find("content:encoded", NS)
        html = (content_el.text or "") if content_el is not None else ""

        html = rewrite_asset_paths(html)
        body = clean_md(md(html, heading_style="ATX", bullets="-", code_language="", strip=["script", "style"]))
        header = f"# {title}\n\n> 出典: {link}  \n> 公開状態: {status}  \n> 更新: {pub_date}\n\n"
        target_dir = pub_dir if status == "publish" else draft_dir
        (target_dir / f"{guid}.md").write_text(header + body)
        if status == "publish":
            pub += 1
        else:
            draft += 1
    return pub, draft


def archive_zip(src: Path, out_root: Path) -> None:
    if not (src.is_file() and src.suffix.lower() == ".zip"):
        return
    dated = out_root / "export" / date.today().isoformat()
    dated.mkdir(parents=True, exist_ok=True)
    dst = dated / src.name
    if not dst.exists():
        shutil.copy2(src, dst)
        print(f"archived ZIP → {dst.relative_to(out_root)}")


def check_local_regression(out_root: Path, force: bool) -> None:
    """取り込みは published/ drafts/ を server 状態で上書き再生成する。
    これらに未コミットのローカル編集があると、取り込みで巻き戻る（AGENT_LEARNINGS 2026-04-26）。
    git 管理下なら取り込み前に dirty を検出し、上書き対象を警告する。"""
    targets = [str(out_root / "published"), str(out_root / "drafts")]
    try:
        res = subprocess.run(
            ["git", "status", "--short", "--", *targets],
            capture_output=True, text=True, check=True,
        )
    except (subprocess.CalledProcessError, FileNotFoundError):
        return  # git 管理外 / git 不在なら素通り
    dirty = [ln for ln in res.stdout.splitlines() if ln.strip()]
    if not dirty:
        return

    sys.stderr.write(
        "\n[wxr_to_md] WARN: published/ drafts/ に未コミットのローカル変更があります。\n"
        "  取り込みは server 状態でこれらを上書き再生成するため、未反映の編集が巻き戻ります:\n"
    )
    for ln in dirty:
        sys.stderr.write(f"    {ln}\n")
    sys.stderr.write(
        "  対処: 先に commit/stash するか、編集が new/ にあるべきか確認してください。\n"
        "  意図して上書きする場合は --force を付けて再実行してください。\n\n"
    )
    if not force:
        sys.exit(1)
    sys.stderr.write("[wxr_to_md] --force 指定のため続行します。\n")


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("src", type=Path, help="ZIP or extracted dir")
    ap.add_argument("--out", type=Path, default=Path("articles_note"), help="articles_note/ root")
    ap.add_argument(
        "--force", action="store_true",
        help="published/ drafts/ に未コミット変更があっても取り込みを強行する",
    )
    args = ap.parse_args()

    check_local_regression(args.out, args.force)

    with tempfile.TemporaryDirectory() as tmp:
        workdir = Path(tmp)
        root = extract_if_zip(args.src, workdir)
        xml = find_wxr(root)
        assets_src = next((root / p for p in ("assets",) if (root / p).exists()), root)
        archive_zip(args.src, args.out)
        pub, draft = convert(xml, assets_src, args.out)
        print(f"published: {pub} / drafts: {draft}")


if __name__ == "__main__":
    main()
