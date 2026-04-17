#!/usr/bin/env python3
"""Markdown(単一記事) → note インポート用WXR XML を生成する。

使い方:
    python3 md_to_wxr.py articles_note/new/<slug>.md [--out articles_note/build/<slug>.xml]
    python3 md_to_wxr.py articles_note/new/                # ディレクトリを指定すると全MDを一括変換
    python3 md_to_wxr.py ... --base-url https://raw.githubusercontent.com/OWNER/REPO/main/articles_note/assets/

処理内容:
    - 先頭 "# タイトル" を title に、それ以降を本文として扱う
    - "> 出典:" "> 公開状態:" 等のメタ行は本文から除外
    - Markdown → HTML を python-markdown で変換
    - WXR 1ファイル=1記事 を出力（複数指定時はまとめたWXRを1本生成）
    - --base-url 指定時: `../assets/<file>` `assets/<file>` の画像参照を
      `<base_url>/<file>` に書き換えて note に自動取り込みできる形にする
    - --base-url 未指定時: ローカル画像パスは残したまま警告のみ

note制約:
    - インポートは新規下書きとして取り込まれる
    - 画像は <img src="https://..."> (JPEG/PNG/GIF) でないと自動取り込みされない
"""
from __future__ import annotations
import argparse
import re
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from xml.sax.saxutils import escape

try:
    import markdown as md
except ImportError:
    sys.stderr.write("pip install --break-system-packages markdown\n")
    sys.exit(1)

META_LINE_RE = re.compile(r"^>\s*(?:出典|公開状態|更新|区分)\s*[:：][^\n]*\n?", re.MULTILINE)
LOCAL_IMG_RE = re.compile(r'!\[[^\]]*\]\((?!https?://|data:)[^)]+\)')
ASSET_IMG_RE = re.compile(r'(!\[[^\]]*\]\()(?:\.\./)?assets/([^)]+)\)')


def split_front(text: str) -> tuple[str, str]:
    lines = text.splitlines()
    title = ""
    start = 0
    for i, line in enumerate(lines):
        if line.startswith("# "):
            title = line[2:].strip()
            start = i + 1
            break
    body = "\n".join(lines[start:])
    body = META_LINE_RE.sub("", body)
    body = re.sub(r"\n{3,}", "\n\n", body).strip()
    return title, body


def warn_local_images(path: Path, body: str) -> None:
    hits = LOCAL_IMG_RE.findall(body)
    if hits:
        sys.stderr.write(f"[warn] {path.name}: ローカル画像 {len(hits)}件あり。--base-url で絶対URLに書き換えるか、インポート後にnoteエディタで貼り直してください:\n")
        for h in hits[:5]:
            sys.stderr.write(f"   - {h}\n")
        if len(hits) > 5:
            sys.stderr.write(f"   ...他 {len(hits)-5} 件\n")


def rewrite_assets_to_url(body: str, base_url: str) -> tuple[str, int]:
    base = base_url.rstrip("/") + "/"
    count = [0]
    def sub(m):
        count[0] += 1
        return f"{m.group(1)}{base}{m.group(2)})"
    return ASSET_IMG_RE.sub(sub, body), count[0]


def render_item(md_path: Path, base_url: str | None = None) -> str:
    """note公式エクスポートと同形式の<item>を出力。余計なwp:*要素は付けない。"""
    text = md_path.read_text()
    title, body_md = split_front(text)
    if not title:
        title = md_path.stem
    if base_url:
        body_md, rewritten = rewrite_assets_to_url(body_md, base_url)
        if rewritten:
            sys.stderr.write(f"[ok] {md_path.name}: {rewritten}件の画像パスを {base_url} に書き換え\n")
    warn_local_images(md_path, body_md)
    # CDATA衝突防止: ]]> を分割
    html = md.markdown(body_md, extensions=["fenced_code", "tables", "sane_lists"]).replace("]]>", "]]]]><![CDATA[>")
    guid = f"l{uuid.uuid4().hex[:12]}"
    link = f"https://note.com/mine_unilabo/n/{guid}"
    return (
        "<item>"
        f"<title><![CDATA[{title}]]></title>"
        f"<link>{link}</link>"
        f"<dc:creator><![CDATA[みね]]></dc:creator>"
        f'<guid isPermaLink="false">{guid}</guid>'
        "<description></description>"
        f"<content:encoded><![CDATA[{html}]]></content:encoded>"
        "</item>"
    )


WRAPPER_HEAD = (
    '<?xml version="1.0" encoding="UTF-8"?>'
    '<rss version="2.0"'
    ' xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/"'
    ' xmlns:content="http://purl.org/rss/1.0/modules/content/"'
    ' xmlns:wfw="http://wellformedweb.org/CommentAPI/"'
    ' xmlns:dc="http://purl.org/dc/elements/1.1/"'
    ' xmlns:wp="http://wordpress.org/export/1.2/">'
    '<channel>'
    '<title>みね</title>'
    '<link>https://note.com/mine_unilabo</link>'
    '<description></description>'
    '<pubDate>{pubdate}</pubDate>'
    '<language>ja</language>'
    '<wp:wxr_version>1.2</wp:wxr_version>'
    '<wp:base_site_url>https://note.com/mine_unilabo</wp:base_site_url>'
    '<wp:base_blog_url>https://note.com/mine_unilabo</wp:base_blog_url>'
    '<wp:author>'
    '<wp:author_id>1</wp:author_id>'
    '<wp:author_login><![CDATA[mine_unilabo]]></wp:author_login>'
    '<wp:author_email><![CDATA[note-export@example.com]]></wp:author_email>'
    '<wp:author_display_name><![CDATA[mine_unilabo]]></wp:author_display_name>'
    '<wp:author_first_name><![CDATA[]]></wp:author_first_name>'
    '<wp:author_last_name><![CDATA[]]></wp:author_last_name>'
    '</wp:author>'
    '<generator>note.com</generator>'
)
WRAPPER_TAIL = "</channel></rss>"


def collect_inputs(src: Path) -> list[Path]:
    if src.is_dir():
        return sorted(src.glob("*.md"))
    return [src]


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("src", type=Path, help="MDファイルまたはディレクトリ")
    ap.add_argument("--out", type=Path, help="出力先WXR (省略時: articles_note/build/import-<slug>-YYYYMMDD-HHMM.xml)")
    ap.add_argument("--base-url", help="assets/ 参照を絶対URLに書き換える (例: https://raw.githubusercontent.com/OWNER/REPO/main/articles_note/assets)")
    args = ap.parse_args()

    inputs = collect_inputs(args.src)
    if not inputs:
        raise SystemExit(f"No .md found under {args.src}")

    items = "".join(render_item(p, args.base_url) for p in inputs)
    pubdate = datetime.now(timezone(timedelta(hours=9))).strftime("%a, %d %b %Y %H:%M:%S +0900")
    xml = WRAPPER_HEAD.format(pubdate=pubdate) + items + WRAPPER_TAIL

    if args.out:
        out = args.out
    else:
        slug = args.src.stem if args.src.is_file() else args.src.name.strip("/") or "batch"
        ts = datetime.now().strftime("%Y%m%d-%H%M")
        out = Path("articles_note/build") / f"import-{slug}-{ts}.xml"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(xml)
    print(f"wrote {out}  ({len(inputs)} item(s))")


if __name__ == "__main__":
    main()
