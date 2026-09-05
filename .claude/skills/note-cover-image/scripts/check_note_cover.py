#!/usr/bin/env python3

import argparse
import json
import struct
import sys
import tempfile
from pathlib import Path

RECOMMENDED_WIDTH = 1280
RECOMMENDED_HEIGHT = 670
RECOMMENDED_RATIO = RECOMMENDED_WIDTH / RECOMMENDED_HEIGHT
# note公式内で記述が競合している。ヘルプ「登録画像の推奨サイズ一覧」は現在も
# 「各画像の容量は最大10MB」と記載する一方、note公式info（2024-06-28）は
# 「アップロードできる画像サイズが10MBから20MBに増加」と告知している。
# どちらが見出し画像の現行仕様かを一次情報で確定できていないため、
# 保守的に厳しい側（10MB）を採用する。詳細は
# references/note-official-guidelines.md §1 を参照。
MAX_BYTES = 10 * 1024 * 1024
RATIO_TOLERANCE = 0.015


def png_size(data: bytes):
    if len(data) < 24 or data[:8] != b"\x89PNG\r\n\x1a\n":
        return None
    return struct.unpack(">II", data[16:24])


def jpeg_size(data: bytes):
    if len(data) < 4 or data[:2] != b"\xff\xd8":
        return None

    offset = 2
    sof_markers = {
        0xC0, 0xC1, 0xC2, 0xC3,
        0xC5, 0xC6, 0xC7,
        0xC9, 0xCA, 0xCB,
        0xCD, 0xCE, 0xCF,
    }

    while offset + 4 <= len(data):
        if data[offset] != 0xFF:
            offset += 1
            continue

        while offset < len(data) and data[offset] == 0xFF:
            offset += 1
        if offset >= len(data):
            break

        marker = data[offset]
        offset += 1

        if marker in {0xD8, 0xD9}:
            continue
        if marker == 0xDA:
            break
        if offset + 2 > len(data):
            break

        segment_length = struct.unpack(">H", data[offset:offset + 2])[0]
        if segment_length < 2 or offset + segment_length > len(data):
            break

        if marker in sof_markers and segment_length >= 7:
            height = struct.unpack(">H", data[offset + 3:offset + 5])[0]
            width = struct.unpack(">H", data[offset + 5:offset + 7])[0]
            return width, height

        offset += segment_length

    return None


def inspect_image(path: Path, strict: bool = False):
    result = {
        "path": str(path),
        "status": "PASS",
        "format": None,
        "width": None,
        "height": None,
        "ratio": None,
        "bytes": None,
        "findings": [],
    }

    if not path.exists() or not path.is_file():
        result["status"] = "FAIL"
        result["findings"].append("file not found")
        return result

    data = path.read_bytes()
    result["bytes"] = len(data)

    size = png_size(data)
    if size:
        result["format"] = "png"
    else:
        size = jpeg_size(data)
        if size:
            result["format"] = "jpeg"

    if not size:
        result["status"] = "FAIL"
        result["findings"].append("unsupported or invalid image format; expected PNG or JPEG")
        return result

    width, height = size
    result["width"] = width
    result["height"] = height
    result["ratio"] = round(width / height, 6) if height else None

    if len(data) > MAX_BYTES:
        result["status"] = "FAIL"
        result["findings"].append("file size exceeds note 10MB limit (see MAX_BYTES note on the 10MB/20MB conflict)")

    if height == 0:
        result["status"] = "FAIL"
        result["findings"].append("invalid height 0")
        return result

    ratio_delta = abs((width / height) - RECOMMENDED_RATIO)
    if ratio_delta > RATIO_TOLERANCE:
        result["status"] = "FAIL"
        result["findings"].append(
            f"aspect ratio differs from 1280x670 recommendation: {width}x{height}"
        )

    if strict and (width != RECOMMENDED_WIDTH or height != RECOMMENDED_HEIGHT):
        result["status"] = "FAIL"
        result["findings"].append(
            f"strict mode requires {RECOMMENDED_WIDTH}x{RECOMMENDED_HEIGHT}px"
        )
    elif not strict and (width != RECOMMENDED_WIDTH or height != RECOMMENDED_HEIGHT):
        if result["status"] == "PASS":
            result["status"] = "WARN"
        result["findings"].append(
            f"recommended article cover size is {RECOMMENDED_WIDTH}x{RECOMMENDED_HEIGHT}px"
        )

    if not result["findings"]:
        result["findings"].append("matches note article cover technical requirements")

    return result


def fake_png(width: int, height: int):
    # Dimension inspection only needs the PNG signature + IHDR width/height bytes.
    return (
        b"\x89PNG\r\n\x1a\n"
        + b"\x00\x00\x00\x0dIHDR"
        + struct.pack(">II", width, height)
        + b"\x08\x06\x00\x00\x00"
    )


def fake_jpeg(width: int, height: int):
    # SOI + APP0 (skipped segment) + SOF0 (dimensions) + SOS, which is the
    # minimum needed to exercise the jpeg_size() marker walk end to end.
    app0_payload = b"JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00"
    sof0_payload = (
        b"\x08"
        + struct.pack(">H", height)
        + struct.pack(">H", width)
        + b"\x01\x01\x11\x00"
    )
    return (
        b"\xff\xd8"
        + b"\xff\xe0"
        + struct.pack(">H", len(app0_payload) + 2)
        + app0_payload
        + b"\xff\xc0"
        + struct.pack(">H", len(sof0_payload) + 2)
        + sof0_payload
        + b"\xff\xda"
    )


def self_test():
    with tempfile.TemporaryDirectory(prefix="note-cover-check-") as tmp:
        root = Path(tmp)
        ok = root / "ok.png"
        wrong = root / "wrong.png"
        ok.write_bytes(fake_png(1280, 670))
        wrong.write_bytes(fake_png(1024, 1024))

        ok_result = inspect_image(ok, strict=True)
        if ok_result["status"] != "PASS":
            raise RuntimeError(f"expected strict PASS: {ok_result}")

        wrong_result = inspect_image(wrong, strict=False)
        if wrong_result["status"] != "FAIL":
            raise RuntimeError(f"expected ratio FAIL: {wrong_result}")

        missing_result = inspect_image(root / "missing.png", strict=True)
        if missing_result["status"] != "FAIL":
            raise RuntimeError(f"expected missing FAIL: {missing_result}")

        # JPEG は独自の SOF マーカ走査を通る。PNG ケースだけでは jpeg_size() が
        # 一度も実行されず、壊れても self-test が通ってしまう。
        jpeg = root / "ok.jpg"
        jpeg.write_bytes(fake_jpeg(RECOMMENDED_WIDTH, RECOMMENDED_HEIGHT))
        jpeg_result = inspect_image(jpeg, strict=True)
        if jpeg_result["format"] != "jpeg":
            raise RuntimeError(f"expected jpeg format: {jpeg_result}")
        if (jpeg_result["width"], jpeg_result["height"]) != (
            RECOMMENDED_WIDTH,
            RECOMMENDED_HEIGHT,
        ):
            raise RuntimeError(f"expected jpeg dimensions: {jpeg_result}")
        if jpeg_result["status"] != "PASS":
            raise RuntimeError(f"expected strict jpeg PASS: {jpeg_result}")

        # MAX_BYTES 超過パス。寸法は推奨どおりなので、容量判定が消えると PASS に転ぶ。
        oversized = root / "oversized.png"
        base = fake_png(RECOMMENDED_WIDTH, RECOMMENDED_HEIGHT)
        oversized.write_bytes(base + b"\x00" * (MAX_BYTES + 1 - len(base)))
        oversized_result = inspect_image(oversized, strict=True)
        if oversized_result["status"] != "FAIL":
            raise RuntimeError(f"expected oversized FAIL: {oversized_result}")
        if not any("file size exceeds" in f for f in oversized_result["findings"]):
            raise RuntimeError(f"expected file size finding: {oversized_result}")

        # 非 strict の WARN パス。比率は推奨どおりで寸法だけ違うケース。
        warn = root / "warn.png"
        warn.write_bytes(fake_png(1920, 1005))
        warn_result = inspect_image(warn, strict=False)
        if warn_result["status"] != "WARN":
            raise RuntimeError(f"expected non-strict WARN: {warn_result}")

        # 同じ寸法でも strict では FAIL になること（WARN と FAIL の分岐が生きているか）。
        warn_strict_result = inspect_image(warn, strict=True)
        if warn_strict_result["status"] != "FAIL":
            raise RuntimeError(f"expected strict FAIL: {warn_strict_result}")

    print("[test:note-cover-image] PASS")


def main():
    parser = argparse.ArgumentParser(
        description="Check note article cover image dimensions, ratio, format and file size."
    )
    parser.add_argument("image", nargs="?", help="PNG/JPEG image path")
    parser.add_argument(
        "--strict",
        action="store_true",
        help="require exactly 1280x670px",
    )
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()

    if args.self_test:
        self_test()
        return 0

    if not args.image:
        parser.error("image path is required unless --self-test is used")

    result = inspect_image(Path(args.image), strict=args.strict)
    print(json.dumps(result, ensure_ascii=False, indent=2))

    if result["status"] == "FAIL":
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
