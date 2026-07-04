"""Extract text from the Refactoring Guru design-patterns PDF into a plain text file.

Usage:
    python scripts/extract-design-patterns-pdf.py \
        --pdf "C:/Users/ezeki/Downloads/design-patterns-en.pdf" \
        --out ".cache/design-patterns-en.txt"
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path


def extract(pdf_path: Path, out_path: Path) -> None:
    from pypdf import PdfReader

    reader = PdfReader(str(pdf_path))
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as fh:
        for i, page in enumerate(reader.pages):
            try:
                text = page.extract_text() or ""
            except Exception as exc:  # noqa: BLE001
                text = f"[extract error on page {i}: {exc}]"
            fh.write(f"\n\n===== PAGE {i + 1} =====\n\n")
            fh.write(text)
    print(f"wrote {out_path} ({out_path.stat().st_size} bytes)")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", required=True)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()
    extract(Path(args.pdf), Path(args.out))
    return 0


if __name__ == "__main__":
    sys.exit(main())
