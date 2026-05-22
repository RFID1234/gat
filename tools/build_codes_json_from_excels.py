#!/usr/bin/env python3
"""
Build codes.json for all product code batches (no PNG copy required).
Guilloche images are served from R2; only the code keys must be listed here.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
GAT_ROOT = ROOT.parent

EXCEL_FILES = [
    GAT_ROOT / "product_codes_batch1.xlsx",
    GAT_ROOT / "product_codes_batch2.xlsx",
    GAT_ROOT / "product_codes_batch3.xlsx",
    GAT_ROOT / "product_codes_testrol_box.xlsx",
]

OUTPUT_PATHS = [
    ROOT / "public" / "api" / "codes.json",
    ROOT / "public" / "codes.json",
    ROOT / "netlify" / "functions" / "codes.json",
    ROOT / "codes.json",
]


def load_codes_from_excel(path: Path) -> list[str]:
    if not path.is_file():
        return []
    return pd.read_excel(path, header=None)[0].dropna().astype(str).str.strip().tolist()


def main() -> int:
    all_codes: list[str] = []
    for path in EXCEL_FILES:
        codes = load_codes_from_excel(path)
        print(f"{path.name}: {len(codes)} codes")
        all_codes.extend(codes)

    # dedupe preserve order
    seen = set()
    unique: list[str] = []
    for c in all_codes:
        if c not in seen:
            seen.add(c)
            unique.append(c)

    mapping = {
        code: {
            "imageUrl": f"/images/guilloche_{code}.png",
            "name": f"GAT Sport Product {code}",
            "description": "Authentic GAT Sport product",
        }
        for code in unique
    }

    for out in OUTPUT_PATHS:
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(mapping, indent=2), encoding="utf-8")
        print(f"Wrote {len(mapping)} codes -> {out}")

    # sanity checks
    checks = [
        ("597957138647", "batch1 first"),
        ("597957148647", "batch2 first"),
        ("597957193647", "batch3/extra first"),
        ("597957201647", "testrol_box first"),
        ("597957213645", "testrol_box last"),
    ]
    for code, label in checks:
        ok = code in mapping
        print(f"  {label} {code}: {'OK' if ok else 'MISSING'}")
        if not ok:
            return 1

    if len(mapping) != 37500:
        print(f"WARNING: expected 37500 unique codes, got {len(mapping)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
