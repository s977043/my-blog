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
import os
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


def warn_shrunk_files(out_root: Path) -> None:
    """取り込み(published/ drafts/ 再生成)完了後、既存ファイルが行数減少していないか検出する。

    既存 check_local_regression() は取り込み**前**に未コミット変更を検出して停止するが、
    commit 済みのローカル先行分（server 未反映のローカル修正）は素通りする
    (2026-09-02 PR #578 で -31行の巻き戻りを検知できなかった実例)。
    本関数は取り込み**後**に diff --numstat で deletions > insertions のファイルを一覧表示する。
    exit code は変えない（取り込み自体は成功しているため）。
    git 管理外 / git 不在なら黙って素通りする。
    """
    targets = [str(out_root / "published"), str(out_root / "drafts")]
    try:
        res = subprocess.run(
            ["git", "diff", "--numstat", "--", *targets],
            capture_output=True, text=True, check=True,
        )
    except (subprocess.CalledProcessError, FileNotFoundError):
        return  # git 管理外 / git 不在なら素通り

    shrunk = []
    for line in res.stdout.splitlines():
        if not line.strip():
            continue
        parts = line.split("\t")
        if len(parts) != 3:
            continue
        ins_s, del_s, path = parts
        if ins_s == "-" or del_s == "-":
            continue  # バイナリ差分は対象外
        try:
            ins, dels = int(ins_s), int(del_s)
        except ValueError:
            continue
        if ins == 0 and dels == 0:
            continue  # 新規ファイル(取り込み前に存在しない)は git diff に既存内容がないため insertions のみになる
        if dels > ins:
            shrunk.append((path, ins, dels))

    if not shrunk:
        return

    sys.stderr.write(
        "\n[wxr_to_md] WARN: 取り込みにより既存ファイルの行数が減少しました（巻き戻りの可能性）:\n"
    )
    for path, ins, dels in shrunk:
        sys.stderr.write(f"    {path}: +{ins} / -{dels}\n")
    sys.stderr.write(
        "  server 状態のほうが古い可能性があります。\n"
        "  `git diff -- <path>` で中身を確認し、ローカルが新しければ"
        " `git checkout -- <path>` で戻してください。\n"
        "  note 側へ未反映のローカル変更（commit 済み）が原因である可能性があります。\n\n"
    )


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("src", type=Path, nargs="?", help="ZIP or extracted dir(--self-test 時は不要)")
    ap.add_argument("--out", type=Path, default=Path("articles_note"), help="articles_note/ root")
    ap.add_argument(
        "--force", action="store_true",
        help="published/ drafts/ に未コミット変更があっても取り込みを強行する",
    )
    ap.add_argument(
        "--self-test", action="store_true",
        help="warn_shrunk_files() / check_local_regression() の fixture ベース self-test を実行して終了する",
    )
    args = ap.parse_args()

    if args.self_test:
        sys.exit(run_self_test())

    if args.src is None:
        ap.error("the following arguments are required: src")

    check_local_regression(args.out, args.force)

    with tempfile.TemporaryDirectory() as tmp:
        workdir = Path(tmp)
        root = extract_if_zip(args.src, workdir)
        xml = find_wxr(root)
        assets_src = next((root / p for p in ("assets",) if (root / p).exists()), root)
        archive_zip(args.src, args.out)
        pub, draft = convert(xml, assets_src, args.out)
        print(f"published: {pub} / drafts: {draft}")
        warn_shrunk_files(args.out)


def _selftest_git(cwd: Path, *args: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["git", *args], cwd=cwd, capture_output=True, text=True, check=True
    )


def run_self_test() -> int:
    """warn_shrunk_files() の fixture ベース self-test。
    一時 git リポジトリで ①行数減少 ②行数増加 ③新規ファイル の3パターンを検証する。
    AGENT_LEARNINGS.md 2026-07-03: check スクリプト新設時は self-test を同梱する。"""
    results: list[tuple[str, bool]] = []
    tmpdir = tempfile.mkdtemp(prefix="wxr_to_md_selftest_")
    orig_cwd = os.getcwd()
    try:
        repo = Path(tmpdir)
        _selftest_git(repo, "init", "-q")
        _selftest_git(repo, "config", "user.email", "selftest@example.com")
        _selftest_git(repo, "config", "user.name", "selftest")

        pub_dir = repo / "articles_note" / "published"
        draft_dir = repo / "articles_note" / "drafts"
        pub_dir.mkdir(parents=True)
        draft_dir.mkdir(parents=True)

        # ケース1: shrink.md は5行 → 取り込み後1行(巻き戻り想定)
        shrink = pub_dir / "shrink.md"
        shrink.write_text("line1\nline2\nline3\nline4\nline5\n")
        # ケース2: grow.md は1行 → 取り込み後5行(正常な追記)
        grow = draft_dir / "grow.md"
        grow.write_text("line1\n")
        _selftest_git(repo, "add", "-A")
        _selftest_git(repo, "commit", "-q", "-m", "baseline")
        # git status/diff は subprocess の cwd 起点で実行されるため、
        # (絶対パスの pathspec を渡していても) fixture repo に chdir してから呼ぶ
        os.chdir(repo)

        # 取り込みをシミュレート: shrink は縮小、grow は拡大、new.md は新規
        shrink.write_text("line1\n")
        grow.write_text("line1\nline2\nline3\nline4\nline5\n")
        (pub_dir / "new.md").write_text("brand new file\n")

        captured = []
        orig_write = sys.stderr.write
        sys.stderr.write = lambda s: (captured.append(s), None)[1]  # type: ignore[method-assign]
        try:
            warn_shrunk_files(repo / "articles_note")
        finally:
            sys.stderr.write = orig_write  # type: ignore[method-assign]
        out = "".join(captured)

        results.append(("shrink.md が WARN に含まれる", "shrink.md" in out))
        results.append(("grow.md が WARN に含まれない", "grow.md" not in out))
        results.append(("new.md(新規ファイル)が WARN に含まれない", "new.md" not in out))
        results.append(("WARN 見出しが出る", "WARN" in out))

        # 回帰確認: check_local_regression は未コミット変更で exit 1 のままか
        # (関数を直接呼び、未コミット dirty で SystemExit(1) になることを検証する)
        shrink.write_text("dirty change\n")
        try:
            check_local_regression(repo / "articles_note", force=False)
            regression_exit_ok = False
        except SystemExit as e:
            regression_exit_ok = (e.code == 1)
        results.append(("check_local_regression は dirty で exit 1 のまま(回帰なし)", regression_exit_ok))
        _selftest_git(repo, "checkout", "--", "articles_note/published/shrink.md")

    finally:
        os.chdir(orig_cwd)
        shutil.rmtree(tmpdir, ignore_errors=True)

    failed = [name for name, ok in results if not ok]
    for name, ok in results:
        print(f"  {'OK' if ok else 'FAIL'}: {name}")
    if failed:
        sys.stderr.write(f"\n[wxr_to_md] self-test FAILED: {len(failed)}/{len(results)}\n")
        return 1
    print(f"\n[wxr_to_md] self-test OK: {len(results)}/{len(results)}")
    return 0


if __name__ == "__main__":
    main()
