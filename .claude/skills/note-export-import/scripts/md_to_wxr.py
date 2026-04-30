#!/usr/bin/env python3
"""Markdown(単一/複数記事) → note インポート用WXR XML を生成する。

使い方:
    python3 md_to_wxr.py articles_note/new/<slug>.md [--out articles_note/build/<slug>.xml]
    python3 md_to_wxr.py articles_note/new/                # ディレクトリ指定で全MDを1本のWXRに束ねる
    python3 md_to_wxr.py articles_note/new/ articles_note/drafts/n2ef833cbece8.md  # 複数ソースをまとめて1本に
    python3 md_to_wxr.py ... --base-url https://raw.githubusercontent.com/OWNER/REPO/main/articles_note/assets/

処理内容:
    - 先頭 "# タイトル" を title に、それ以降を本文として扱う
    - "> 出典:" "> 公開状態:" 等のメタ行は本文から除外
    - Markdown → HTML を python-markdown で変換（nl2br拡張で改行を <br> に変換）
    - すべてのブロック要素（p/h2/h3/ul/ol/figure/pre/blockquote）に UUID v4 の name/id を付与
    - <li>タグの中身を <p name=UUID id=UUID> でラップ（note公式形式準拠）
    - 外部リンクに target="_blank" rel="nofollow noopener" を付与
    - <img/>, <br/>, <hr/> を HTML5 ボイド形式に統一
    - WXR 1ファイル=1記事 を出力（複数指定時はまとめたWXRを1本生成）
    - --base-url 指定時: `../assets/<file>` `assets/<file>` の画像参照を絶対URLに書き換え

note制約:
    - インポートは新規下書きとして取り込まれる
    - 画像は <img src="https://..."> (JPEG/PNG/GIF) でないと自動取り込みされない
    - 公式エクスポート WXR の HTML パターンに揃えないと改行・空行が崩れる
"""
from __future__ import annotations
import argparse
import re
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import quote

DISPLAY_NAME = "みね"
LOGIN_ID = "mine_unilabo"

try:
    import markdown as md
except ImportError:
    sys.stderr.write("pip install --break-system-packages markdown\n")
    sys.exit(1)

META_LINE_RE = re.compile(r"^>\s*(?:出典|公開状態|更新|区分)\s*[:：][^\n]*\n?", re.MULTILINE)
LOCAL_IMG_RE = re.compile(r'!\[[^\]]*\]\((?!https?://|data:)[^)]+\)')
ASSET_IMG_RE = re.compile(r'(!\[[^\]]*\]\()(?:\.\./)?assets/([^)]+)\)')

# python-markdown は <p><img alt="..." src="..." /></p> を生成する
IMG_IN_P_RE = re.compile(r'<p>\s*<img\s+(?:alt="[^"]*"\s+)?src="([^"]+)"\s*/?>\s*</p>')

# HTML5 ボイド要素を自己終端 / なしに統一
VOID_SELFCLOSE_RE = re.compile(r'<(br|hr|img)([^>]*?)\s*/>')


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


def normalize_void_elements(html: str) -> str:
    """<br/>, <hr/>, <img.../> を HTML5 ボイド形式 <br>, <hr>, <img...> に変換。"""
    return VOID_SELFCLOSE_RE.sub(lambda m: f'<{m.group(1)}{m.group(2).rstrip()}>', html)


def wrap_images_in_figure(html: str) -> str:
    """<p><img .../></p> を note公式形式に変換。

    <figure name="UUID" id="UUID"><img src="..."><figcaption></figcaption></figure>
    """
    def replace(m):
        src = m.group(1)
        u = str(uuid.uuid4())
        return f'<figure name="{u}" id="{u}"><img src="{src}"><figcaption></figcaption></figure>'
    return IMG_IN_P_RE.sub(replace, html)


def add_uuid_to_blocks(html: str) -> str:
    """ブロック要素 (p, h2, h3, ul, ol, pre, blockquote) に name/id (UUID v4) を付与。

    既に name 属性を持つ要素はスキップ（figure は wrap_images_in_figure で付与済み）。
    """
    pattern = re.compile(r'<(p|h2|h3|ul|ol|pre|blockquote)(\s[^>]*)?>')
    def add(m):
        tag = m.group(1)
        attrs = m.group(2) or ''
        # 既に name 属性を持つ場合はスキップ
        if re.search(r'\bname\s*=', attrs):
            return m.group(0)
        u = str(uuid.uuid4())
        return f'<{tag} name="{u}" id="{u}"{attrs}>'
    return pattern.sub(add, html)


def wrap_li_content(html: str) -> str:
    """<li>テキスト</li> を <li><p name=UUID id=UUID>テキスト</p></li> に変換（note公式形式）。

    既に <p> でラップされている <li><p>...</p></li> はスキップ。
    ネストリスト (<li><ul>...</ul></li>) は中身がブロック要素なのでスキップ。
    """
    li_pattern = re.compile(r'<li>(.*?)</li>', re.DOTALL)
    def wrap(m):
        inner = m.group(1).strip()
        # 既に <p> でラップ済み or ネストリスト or 空 → スキップ
        if not inner or inner.startswith('<p ') or inner.startswith('<p>') or inner.startswith('<ul') or inner.startswith('<ol'):
            return m.group(0)
        u = str(uuid.uuid4())
        return f'<li><p name="{u}" id="{u}">{inner}</p></li>'
    return li_pattern.sub(wrap, html)


def add_external_link_attrs(html: str) -> str:
    """外部リンク <a href="https://..."> に target="_blank" rel="nofollow noopener" を付与。

    既に target/rel を持つリンクはスキップ。
    """
    a_pattern = re.compile(r'<a\s+href="(https?://[^"]+)"([^>]*)>')
    def add(m):
        url = m.group(1)
        rest = m.group(2)
        if 'target=' in rest or 'rel=' in rest:
            return m.group(0)
        return f'<a href="{url}"{rest} target="_blank" rel="nofollow noopener">'
    return a_pattern.sub(add, html)


def strip_code_class(html: str) -> str:
    """<code class="language-X"> から class 属性を削除（note公式は無属性）。"""
    return re.sub(r'<code\s+class="[^"]*">', '<code>', html)


def collapse_block_whitespace(html: str) -> str:
    """ブロック要素間の改行・余分な空白を除去（note公式形式: ブロックは密結合）。"""
    # ブロックタグ間の \n を削除
    block_tags = r'(?:p|h2|h3|h4|h5|ul|ol|li|pre|figure|blockquote|hr|table|thead|tbody|tr)'
    # </X>\n<Y> → </X><Y>
    html = re.sub(rf'(</{block_tags}>)\s*\n\s*(<{block_tags}\b)', r'\1\2', html)
    # <X>\n<Y> （開始タグ間: <ul>\n<li> など） → <X><Y>
    html = re.sub(rf'(<{block_tags}\b[^>]*>)\s*\n\s*(<{block_tags}\b)', r'\1\2', html)
    # </X>\n<hr> や <hr>\n<Y> も処理
    html = re.sub(r'(</[a-z]+>)\s*\n\s*(<hr\b)', r'\1\2', html)
    html = re.sub(r'(<hr\b[^>]*>)\s*\n\s*(<)', r'\1\2', html)
    return html


def transform_html_to_note_format(raw_html: str) -> str:
    """python-markdown 出力 HTML を note 公式形式に変換するパイプライン。"""
    html = raw_html
    html = wrap_images_in_figure(html)         # <p><img/></p> → <figure>
    html = normalize_void_elements(html)       # <br/> → <br>, <img/> → <img>
    html = strip_code_class(html)              # <code class="language-X"> → <code>
    html = wrap_li_content(html)               # <li>X</li> → <li><p>X</p></li>
    html = add_uuid_to_blocks(html)            # p/h2/h3/ul/ol/pre/blockquote に UUID
    html = add_external_link_attrs(html)       # 外部 <a> に target/rel
    html = collapse_block_whitespace(html)     # ブロック間改行を除去
    return html


def render_item(md_path: Path, post_id: int, base_url: str | None = None) -> str:
    """note公式エクスポート形式に準拠した<item>を出力。

    note importer は WordPress WXR の post メタデータを必要とするため、
    `wp:post_id` `wp:post_type` `wp:status` を含む item 側 wp:* 群を揃える。
    これらが欠落すると note 側インポートが失敗する（実測: 2026-04-18）。

    HTML 部分は note 公式エクスポートの形式に準拠（2026-04-30 解析）:
    - すべてのブロック要素に UUID v4 の name/id 属性
    - 段落内の改行は <br>（python-markdown nl2br 拡張）
    - <li>X</li> は <li><p name=UUID id=UUID>X</p></li> で二重ラップ
    - 外部リンクは target="_blank" rel="nofollow noopener"
    - ボイド要素は HTML5 形式（<br>, <img>, <hr>）
    - ブロック間に改行・空白なし

    author フィールドの対応:
    - `<dc:creator>` (item) = 表示名 (`みね`)
    - `<wp:author_display_name>` (channel) = login ID
    """
    text = md_path.read_text()
    title, body_md = split_front(text)
    if not title:
        title = md_path.stem
    if base_url:
        body_md, rewritten = rewrite_assets_to_url(body_md, base_url)
        if rewritten:
            sys.stderr.write(f"[ok] {md_path.name}: {rewritten}件の画像パスを {base_url} に書き換え\n")
    warn_local_images(md_path, body_md)
    cdata_guard = lambda s: s.replace("]]>", "]]]]><![CDATA[>")
    # nl2br: \n を <br> に変換（段落内の改行を note 上で正しく表現）
    raw_html = md.markdown(body_md, extensions=["fenced_code", "tables", "sane_lists", "nl2br"])
    html = cdata_guard(transform_html_to_note_format(raw_html))
    title_xml = cdata_guard(title)
    guid = f"l{uuid.uuid4().hex[:12]}"
    link = f"https://note.com/{LOGIN_ID}/n/{guid}"
    now_jst = datetime.now(timezone(timedelta(hours=9)))
    now_utc = now_jst.astimezone(timezone.utc)
    post_date = now_jst.strftime("%Y-%m-%d %H:%M:%S")
    post_date_gmt = now_utc.strftime("%Y-%m-%d %H:%M:%S")
    post_name = quote(title, safe="")
    return (
        "<item>"
        f"<title><![CDATA[{title_xml}]]></title>"
        f"<link>{link}</link>"
        f"<dc:creator><![CDATA[{DISPLAY_NAME}]]></dc:creator>"
        f'<guid isPermaLink="false">{guid}</guid>'
        "<description></description>"
        f"<content:encoded><![CDATA[{html}]]></content:encoded>"
        "<excerpt:encoded><![CDATA[]]></excerpt:encoded>"
        f"<wp:post_id>{post_id}</wp:post_id>"
        f"<wp:post_date>{post_date}</wp:post_date>"
        f"<wp:post_date_gmt>{post_date_gmt}</wp:post_date_gmt>"
        f"<wp:post_modified>{post_date}</wp:post_modified>"
        f"<wp:post_modified_gmt>{post_date_gmt}</wp:post_modified_gmt>"
        "<wp:comment_status><![CDATA[open]]></wp:comment_status>"
        "<wp:ping_status><![CDATA[open]]></wp:ping_status>"
        f"<wp:post_name><![CDATA[{post_name}]]></wp:post_name>"
        "<wp:status><![CDATA[publish]]></wp:status>"
        "<wp:post_parent>0</wp:post_parent>"
        "<wp:menu_order>0</wp:menu_order>"
        "<wp:post_type><![CDATA[post]]></wp:post_type>"
        "<wp:post_password><![CDATA[]]></wp:post_password>"
        "<wp:is_sticky>0</wp:is_sticky>"
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
    f'<title>{DISPLAY_NAME}</title>'
    f'<link>https://note.com/{LOGIN_ID}</link>'
    '<description></description>'
    '<pubDate>{pubdate}</pubDate>'
    '<language>ja</language>'
    '<wp:wxr_version>1.2</wp:wxr_version>'
    f'<wp:base_site_url>https://note.com/{LOGIN_ID}</wp:base_site_url>'
    f'<wp:base_blog_url>https://note.com/{LOGIN_ID}</wp:base_blog_url>'
    '<wp:author>'
    '<wp:author_id>1</wp:author_id>'
    f'<wp:author_login><![CDATA[{LOGIN_ID}]]></wp:author_login>'
    '<wp:author_email><![CDATA[note-export@example.com]]></wp:author_email>'
    # note公式では wp:author_display_name に login ID が入る（表示名ではない）。
    # 2026-04-18 のインポート失敗で判明。AGENT_LEARNINGS.md 2026-04-18 エントリ参照。
    f'<wp:author_display_name><![CDATA[{LOGIN_ID}]]></wp:author_display_name>'
    '<wp:author_first_name><![CDATA[]]></wp:author_first_name>'
    '<wp:author_last_name><![CDATA[]]></wp:author_last_name>'
    '</wp:author>'
    '<generator>note.com</generator>'
)
WRAPPER_TAIL = "</channel></rss>"


def collect_inputs(srcs: list[Path]) -> list[Path]:
    """複数のソースパス（ファイル/ディレクトリ）から .md ファイルを収集して重複排除。"""
    seen: set[Path] = set()
    result: list[Path] = []
    for src in srcs:
        if src.is_dir():
            for p in sorted(src.glob("*.md")):
                rp = p.resolve()
                if rp not in seen:
                    seen.add(rp)
                    result.append(p)
        else:
            rp = src.resolve()
            if rp not in seen:
                seen.add(rp)
                result.append(src)
    return result


def derive_default_outname(srcs: list[Path]) -> str:
    """出力ファイル名のスラッグを推定する。

    - 単一ファイル: そのファイル名（stem）
    - 単一ディレクトリ: ディレクトリ名（例: new, drafts）
    - 複数: "bundle"
    """
    if len(srcs) == 1:
        s = srcs[0]
        return s.stem if s.is_file() else (s.name.strip("/") or "batch")
    return "bundle"


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "src",
        type=Path,
        nargs="+",
        help="MDファイルまたはディレクトリ（複数指定可、すべて1本のWXRに束ねて出力）",
    )
    ap.add_argument("--out", type=Path, help="出力先WXR (省略時: articles_note/build/import-<slug>-YYYYMMDD-HHMM.xml)")
    ap.add_argument("--base-url", help="assets/ 参照を絶対URLに書き換える (例: https://raw.githubusercontent.com/OWNER/REPO/main/articles_note/assets)")
    args = ap.parse_args()

    inputs = collect_inputs(args.src)
    if not inputs:
        srcs_str = ", ".join(str(s) for s in args.src)
        raise SystemExit(f"No .md found under {srcs_str}")

    items = "".join(render_item(p, i + 1, args.base_url) for i, p in enumerate(inputs))
    pubdate = datetime.now(timezone(timedelta(hours=9))).strftime("%a, %d %b %Y %H:%M:%S +0900")
    xml = WRAPPER_HEAD.format(pubdate=pubdate) + items + WRAPPER_TAIL

    if args.out:
        out = args.out
    else:
        slug = derive_default_outname(args.src)
        ts = datetime.now(timezone(timedelta(hours=9))).strftime("%Y%m%d-%H%M")
        out = Path("articles_note/build") / f"import-{slug}-{ts}.xml"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(xml)
    print(f"wrote {out}  ({len(inputs)} item(s))")


if __name__ == "__main__":
    main()
