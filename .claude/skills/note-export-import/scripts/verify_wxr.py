#!/usr/bin/env python3
"""生成した note インポート用 WXR を公式エクスポート形式と突き合わせる検証スクリプト。

2026-04-18 のインポート失敗（`<item>` に wp:* フィールドが無く note importer が
post として認識せずエラー）を受けて追加。xmllint のXML妥当性チェックだけでは
捕捉できないセマンティック差分（必須フィールド欠落、著者フィールドの対応違い）
を検出する。

使い方:
    # 公式エクスポートZIPを自動検出して比較（articles_note/export/<date>/*.zip の最新）
    python3 verify_wxr.py articles_note/build/import-<slug>-YYYYMMDD-HHMM.xml

    # 参照WXRを明示指定
    python3 verify_wxr.py <generated.xml> --reference <official.xml>

チェック項目:
    1. XMLが well-formed（ElementTree.parse できる）
    2. `<channel>` 直下のタグ集合が公式と一致
    3. 各 `<item>` 直下の wp:* タグ集合が公式と一致
    4. 著者フィールド: `dc:creator` と `wp:author_display_name` の役割が公式どおり
       （`dc:creator` に login が入っていたら警告＝2026-04-18 と同じ罠）
    5. 画像 `<img src>` が https:// で始まる（noteは絶対URLでないと取り込めない）

Exit code:
    0: 全チェック合格
    1: 構造差分または検証失敗あり
"""
from __future__ import annotations
import argparse
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

NS = {
    "content": "http://purl.org/rss/1.0/modules/content/",
    "dc": "http://purl.org/dc/elements/1.1/",
    "wp": "http://wordpress.org/export/1.2/",
    "excerpt": "http://wordpress.org/export/1.2/excerpt/",
}

WP_NS_PREFIX = "{http://wordpress.org/export/1.2/}"


def localname(tag: str) -> str:
    return tag.split("}", 1)[-1] if "}" in tag else tag


def item_wp_tags(item: ET.Element) -> set[str]:
    return {localname(el.tag) for el in item if el.tag.startswith(WP_NS_PREFIX)}


def channel_top_tags(channel: ET.Element) -> set[str]:
    return {el.tag for el in channel if localname(el.tag) != "item"}


def auto_detect_reference() -> Path | None:
    """articles_note/export/<date>/*.zip から最新の公式WXRを取り出して返す。"""
    export_root = Path("articles_note/export")
    if not export_root.is_dir():
        return None
    zips = sorted(export_root.glob("*/*.zip"))
    if not zips:
        return None
    latest_zip = zips[-1]
    # ZIP の中身から note-*.xml を探して /tmp に展開
    tmp_dir = Path("/tmp/note-verify")
    tmp_dir.mkdir(exist_ok=True)
    with zipfile.ZipFile(latest_zip) as zf:
        xml_names = [n for n in zf.namelist() if n.endswith(".xml") and n.startswith("note-")]
        if not xml_names:
            return None
        zf.extract(xml_names[0], tmp_dir)
    return tmp_dir / xml_names[0]


def check(generated_path: Path, reference_path: Path) -> list[str]:
    errors: list[str] = []

    # 1. XML well-formed
    try:
        gen_tree = ET.parse(generated_path)
    except ET.ParseError as e:
        return [f"[FATAL] 生成WXRがXMLとして不正: {e}"]
    try:
        ref_tree = ET.parse(reference_path)
    except ET.ParseError as e:
        return [f"[FATAL] 参照WXRがXMLとして不正: {e}"]

    gen_ch = gen_tree.getroot().find("channel")
    ref_ch = ref_tree.getroot().find("channel")
    if gen_ch is None or ref_ch is None:
        return ["[FATAL] <channel> 要素が見つからない"]

    # 2. channel 直下タグ集合
    gen_ct = channel_top_tags(gen_ch)
    ref_ct = channel_top_tags(ref_ch)
    missing = ref_ct - gen_ct
    if missing:
        errors.append(f"[ERROR] channel に欠落タグ: {sorted(localname(t) for t in missing)}")

    # 3. item の wp:* 集合
    gen_item = gen_ch.find("item")
    ref_item = ref_ch.find("item")
    if gen_item is None:
        return errors + ["[FATAL] 生成WXRに <item> が存在しない"]
    if ref_item is None:
        return errors + ["[FATAL] 参照WXRに <item> が存在しない"]

    gen_wp = item_wp_tags(gen_item)
    ref_wp = item_wp_tags(ref_item)
    missing_wp = ref_wp - gen_wp
    if missing_wp:
        errors.append(
            f"[ERROR] <item> に必須 wp:* タグが欠落: {sorted(missing_wp)}\n"
            f"         note importer はこれらが無いと post として認識できない"
        )

    # 4. 著者フィールド — dc:creator が login っぽい値 (小文字/アンダースコアのみ) の場合は警告
    dc_creator = gen_item.find("dc:creator", NS)
    if dc_creator is not None and dc_creator.text:
        val = dc_creator.text
        if re.fullmatch(r"[a-z0-9_\-]+", val):
            errors.append(
                f"[WARN] <dc:creator> が login ID 形式 ({val!r}): 表示名を入れるのが note 公式形式。\n"
                f"        AGENT_LEARNINGS.md 2026-04-18 後段エントリ参照"
            )

    # 5. 画像 src が https
    content = gen_item.find("content:encoded", NS)
    if content is not None and content.text:
        srcs = re.findall(r'<img[^>]+src="([^"]+)"', content.text)
        bad = [s for s in srcs if not s.startswith("https://")]
        if bad:
            errors.append(
                f"[WARN] <img src> が https ではない画像 {len(bad)} 件: {bad[:3]}"
                " ...\n        --base-url で絶対URLに書き換えないとnoteが取り込めない"
            )

    return errors


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("generated", type=Path, help="検証する生成WXR (例: articles_note/build/import-*.xml)")
    ap.add_argument("--reference", type=Path, help="参照する公式WXR。省略時は articles_note/export/ から自動検出")
    args = ap.parse_args()

    if not args.generated.is_file():
        print(f"[FATAL] 生成WXR が見つからない: {args.generated}", file=sys.stderr)
        return 1

    ref = args.reference or auto_detect_reference()
    if ref is None or not ref.is_file():
        print(
            "[FATAL] 参照WXR が見つからない。`articles_note/export/<date>/*.zip` を配置するか "
            "`--reference <path>` を指定してください",
            file=sys.stderr,
        )
        return 1

    print(f"checking: {args.generated}")
    print(f"against : {ref}")
    errors = check(args.generated, ref)
    if not errors:
        print("\n[ok] 全チェック合格（構造は公式エクスポート形式に準拠）")
        return 0

    fatal_or_error = any(line.startswith("[FATAL]") or line.startswith("[ERROR]") for e in errors for line in [e])
    print("")
    for e in errors:
        print(e)
    return 1 if fatal_or_error else 0


if __name__ == "__main__":
    sys.exit(main())
