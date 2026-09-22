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
from tempfile import TemporaryDirectory
from xml.etree import ElementTree as ET

NS = {
    "content": "http://purl.org/rss/1.0/modules/content/",
    "dc": "http://purl.org/dc/elements/1.1/",
    "wp": "http://wordpress.org/export/1.2/",
    "excerpt": "http://wordpress.org/export/1.2/excerpt/",
    "wfw": "http://wellformedweb.org/CommentAPI/",
}

WP_NS_PREFIX = "{http://wordpress.org/export/1.2/}"

NOTE_IMPORT_MAX_BYTES = 20_000_000
NOTE_IMPORT_MAX_ITEMS = 1000
REQUIRED_NAMESPACES = {key: NS[key] for key in ("excerpt", "content", "wfw", "dc", "wp")}

MINIMUM_WP_ITEM_TAGS = {
    "post_id",
    "post_date",
    "post_date_gmt",
    "post_modified",
    "post_modified_gmt",
    "comment_status",
    "ping_status",
    "post_name",
    "status",
    "post_parent",
    "menu_order",
    "post_type",
    "post_password",
    "is_sticky",
}


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


def check_structure(generated_path: Path) -> list[str]:
    """公式exportなしで、note importer向けの最低限構造と公開仕様を検証する。"""
    errors: list[str] = []

    size = generated_path.stat().st_size
    if size > NOTE_IMPORT_MAX_BYTES:
        return [
            f"[ERROR] WXR が note の 20MB 上限を超過: {size} bytes > {NOTE_IMPORT_MAX_BYTES} bytes"
        ]

    raw = generated_path.read_bytes()
    try:
        raw.decode("utf-8")
    except UnicodeDecodeError as e:
        return errors + [f"[FATAL] WXR がUTF-8として読めない: {e}"]

    try:
        namespace_map = {
            prefix: uri
            for _event, (prefix, uri) in ET.iterparse(generated_path, events=("start-ns",))
            if prefix
        }
    except ET.ParseError as e:
        return errors + [f"[FATAL] 生成WXRがXMLとして不正: {e}"]

    missing_ns = set(REQUIRED_NAMESPACES) - set(namespace_map)
    if missing_ns:
        errors.append(
            f"[ERROR] WXRに必須名前空間宣言が欠落: {sorted(missing_ns)}"
        )

    wrong_ns = [
        (prefix, namespace_map[prefix], expected)
        for prefix, expected in REQUIRED_NAMESPACES.items()
        if prefix in namespace_map and namespace_map[prefix] != expected
    ]
    if wrong_ns:
        errors.append(
            "[ERROR] WXRの名前空間URIが公式WordPress形式と不一致: "
            + ", ".join(
                f"{prefix}={actual!r} (expected {expected!r})"
                for prefix, actual, expected in wrong_ns
            )
        )

    try:
        tree = ET.parse(generated_path)
    except ET.ParseError as e:
        return errors + [f"[FATAL] 生成WXRがXMLとして不正: {e}"]

    root = tree.getroot()
    if localname(root.tag) != "rss":
        return errors + [f"[FATAL] ルート要素が <rss> ではない: <{localname(root.tag)}>"]

    channel = root.find("channel")
    if channel is None:
        return errors + ["[FATAL] <channel> 要素が見つからない"]

    items = channel.findall("item")
    if len(items) > NOTE_IMPORT_MAX_ITEMS:
        errors.append(
            f"[ERROR] 記事数が note の1000件上限を超過: {len(items)}"
        )
    if not items:
        return errors + ["[FATAL] 生成WXRに <item> が存在しない"]

    item = items[0]

    missing_wp = MINIMUM_WP_ITEM_TAGS - item_wp_tags(item)
    if missing_wp:
        errors.append(
            f"[ERROR] <item> に最低限必要な wp:* タグが欠落: {sorted(missing_wp)}\n"
            "         note importer が post として認識できない可能性がある"
        )

    author_login = channel.find("wp:author/wp:author_login", NS)
    author_display = channel.find("wp:author/wp:author_display_name", NS)
    if author_login is None or not author_login.text:
        errors.append("[ERROR] <wp:author_login> が欠落")
    if author_display is None or not author_display.text:
        errors.append("[ERROR] <wp:author_display_name> が欠落")
    if (
        author_login is not None
        and author_login.text
        and author_display is not None
        and author_display.text
        and author_login.text != author_display.text
    ):
        errors.append(
            f"[ERROR] author_login と author_display_name が不一致: "
            f"{author_login.text!r} != {author_display.text!r}"
        )

    dc_creator = item.find("dc:creator", NS)
    if dc_creator is None or not dc_creator.text:
        errors.append("[ERROR] <dc:creator> が欠落")
    elif re.fullmatch(r"[a-z0-9_\-]+", dc_creator.text):
        errors.append(
            f"[WARN] <dc:creator> が login ID 形式 ({dc_creator.text!r}): 表示名を入れるのが note 公式形式。\n"
            "        AGENT_LEARNINGS.md 2026-04-18 後段エントリ参照"
        )

    content = item.find("content:encoded", NS)
    if content is not None and content.text:
        srcs = re.findall(r'<img[^>]+src="([^"]+)"', content.text)
        bad = [src for src in srcs if not src.startswith("https://")]
        if bad:
            errors.append(
                f"[WARN] <img src> が https ではない画像 {len(bad)} 件: {bad[:3]}"
                " ...\n        --base-url で絶対URLに書き換えないとnoteが取り込めない"
            )

    return errors


def self_test() -> int:
    valid = """<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:wfw="http://wellformedweb.org/CommentAPI/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:wp="http://wordpress.org/export/1.2/">
<channel>
<wp:author><wp:author_login><![CDATA[mine_unilabo]]></wp:author_login><wp:author_display_name><![CDATA[mine_unilabo]]></wp:author_display_name></wp:author>
<item><title><![CDATA[x]]></title><dc:creator><![CDATA[みね]]></dc:creator><content:encoded><![CDATA[<p>x</p>]]></content:encoded>
<wp:post_id>1</wp:post_id><wp:post_date>2026-09-23 00:00:00</wp:post_date><wp:post_date_gmt>2026-09-22 15:00:00</wp:post_date_gmt>
<wp:post_modified>2026-09-23 00:00:00</wp:post_modified><wp:post_modified_gmt>2026-09-22 15:00:00</wp:post_modified_gmt>
<wp:comment_status><![CDATA[open]]></wp:comment_status><wp:ping_status><![CDATA[open]]></wp:ping_status><wp:post_name><![CDATA[x]]></wp:post_name>
<wp:status><![CDATA[publish]]></wp:status><wp:post_parent>0</wp:post_parent><wp:menu_order>0</wp:menu_order><wp:post_type><![CDATA[post]]></wp:post_type>
<wp:post_password><![CDATA[]]></wp:post_password><wp:is_sticky>0</wp:is_sticky></item></channel></rss>"""

    with TemporaryDirectory() as tmp:
        root = Path(tmp)
        valid_path = root / "valid.xml"
        valid_path.write_text(valid)
        tests: list[tuple[str, bool]] = []

        tests.append(("valid fixture passes", check_structure(valid_path) == []))

        missing_ns = root / "missing-ns.xml"
        missing_ns.write_text(valid.replace(' xmlns:wfw="http://wellformedweb.org/CommentAPI/"', ""))
        tests.append((
            "missing official namespace fails",
            any(e.startswith("[ERROR]") and "wfw" in e for e in check_structure(missing_ns)),
        ))

        wrong_ns = root / "wrong-ns.xml"
        wrong_ns.write_text(valid.replace("http://wellformedweb.org/CommentAPI/", "https://example.com/wfw/"))
        tests.append((
            "wrong official namespace URI fails",
            any(e.startswith("[ERROR]") and "名前空間URI" in e for e in check_structure(wrong_ns)),
        ))

        non_utf8 = root / "non-utf8.xml"
        non_utf8.write_bytes(b"\xff\xfe<rss></rss>")
        tests.append((
            "non UTF-8 is fatal",
            any(e.startswith("[FATAL]") and "UTF-8" in e for e in check_structure(non_utf8)),
        ))

        too_many = root / "too-many.xml"
        extra_item = "<item></item>" * NOTE_IMPORT_MAX_ITEMS
        too_many.write_text(valid.replace("</channel>", extra_item + "</channel>"))
        tests.append((
            "more than 1000 items fails",
            any(e.startswith("[ERROR]") and "1000" in e for e in check_structure(too_many)),
        ))

        too_large = root / "too-large.xml"
        with too_large.open("wb") as fh:
            fh.seek(NOTE_IMPORT_MAX_BYTES)
            fh.write(b"x")
        tests.append((
            "more than 20MB fails",
            any(e.startswith("[ERROR]") and "20MB" in e for e in check_structure(too_large)),
        ))

        missing = root / "missing.xml"
        missing.write_text(valid.replace("<wp:post_type><![CDATA[post]]></wp:post_type>", ""))
        tests.append((
            "missing required wp tag fails",
            any(e.startswith("[ERROR]") and "post_type" in e for e in check_structure(missing)),
        ))

        login_creator = root / "login-creator.xml"
        login_creator.write_text(valid.replace("<![CDATA[みね]]>", "<![CDATA[mine_unilabo]]>", 1))
        tests.append((
            "login-like dc:creator warns",
            any(e.startswith("[WARN]") and "dc:creator" in e for e in check_structure(login_creator)),
        ))

        local_image = root / "local-image.xml"
        local_image.write_text(valid.replace("<p>x</p>", '<p><img src="../assets/x.png"></p>'))
        tests.append((
            "local image warns",
            any(e.startswith("[WARN]") and "https" in e for e in check_structure(local_image)),
        ))

        wrong_root = root / "wrong-root.xml"
        wrong_root.write_text(valid.replace("<rss ", "<feed ", 1).replace("</rss>", "</feed>"))
        tests.append((
            "non-rss root is fatal",
            any(e.startswith("[FATAL]") and "<rss>" in e for e in check_structure(wrong_root)),
        ))

        invalid = root / "invalid.xml"
        invalid.write_text("<rss>")
        tests.append((
            "invalid XML is fatal",
            any(e.startswith("[FATAL]") for e in check_structure(invalid)),
        ))

    failed = [name for name, ok in tests if not ok]
    for name, ok in tests:
        print(f"  {'ok  ' if ok else 'FAIL'} {name}")
    if failed:
        print(f"\n[verify_wxr] self-test FAILED: {len(failed)}/{len(tests)}", file=sys.stderr)
        return 1
    print(f"\n[verify_wxr] self-test OK: {len(tests)}/{len(tests)}")
    return 0


def check(generated_path: Path, reference_path: Path) -> list[str]:
    errors = check_structure(generated_path)
    if any(e.startswith("[FATAL]") for e in errors):
        return errors

    gen_tree = ET.parse(generated_path)
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

    return errors


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("generated", type=Path, nargs="?", help="検証する生成WXR (例: articles_note/build/import-*.xml)")
    ap.add_argument("--reference", type=Path, help="参照する公式WXR。省略時は articles_note/export/ から自動検出")
    ap.add_argument("--structure-only", action="store_true", help="公式exportと比較せず、最低限のWXR構造だけを検証")
    ap.add_argument("--self-test", action="store_true", help="fixtureベースの構造検証self-testを実行")
    args = ap.parse_args()

    if args.self_test:
        return self_test()

    if args.generated is None:
        ap.error("generated が必要です（--self-test を除く）")

    if not args.generated.is_file():
        print(f"[FATAL] 生成WXR が見つからない: {args.generated}", file=sys.stderr)
        return 1

    if args.structure_only:
        print(f"checking: {args.generated}")
        print("mode    : structure-only")
        errors = check_structure(args.generated)
        if not errors:
            print("\n[ok] 構造チェック合格（公式export比較は未実施）")
            return 0
        fatal_or_error = any(e.startswith("[FATAL]") or e.startswith("[ERROR]") for e in errors)
        print("")
        for e in errors:
            print(e)
        return 1 if fatal_or_error else 0

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
