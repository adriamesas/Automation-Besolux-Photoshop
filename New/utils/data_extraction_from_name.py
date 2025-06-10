#!/usr/bin/env python3
"""bulk_normalise_hardcoded.py  — robust version 3

Improvements over v2
--------------------
* Size tokens like **40X40**, **55X55**, **40x40x5** (upper/lower‑case ‘x’) now detected.
* Size recognition is case‑insensitive (`x` or `X`).
* Everything else from v2 remains.

Output:  value (variable) / value (variable) ...
"""

import os
import re
import sys
from pathlib import Path

# ========== CONFIGURE HERE ==========
INPUT_TXT  = Path(r"C:\Users\Adria Mesas\OneDrive - Beso Lux\PC_FILES\Desktop\Automation Besolux Photoshop\New\utils\names.txt")
OUTPUT_TXT = Path(r"C:\Users\Adria Mesas\OneDrive - Beso Lux\PC_FILES\Desktop\Automation Besolux Photoshop\New\utils\canon.txt")  # set to None to just print
# ====================================

SIZE_CODES = {"XS", "S", "M", "L", "XL", "XXL"}
RE_LEGS    = re.compile(r"^F\d+[A-Za-z]*$")                 # e.g. F1, F12, F3L
# Accept x or X between numbers (optionally twice)
RE_SIZE_CM = re.compile(r"^\d{1,4}[xX]\d{1,4}([xX]\d{1,4})?$")
RE_VIEW    = re.compile(r"^(\d+|side|front|back|detail)$", re.I)

def classify_token(tok: str, found: dict) -> None:
    if found.get('size') is None and (tok.upper() in SIZE_CODES or RE_SIZE_CM.match(tok)):
        found['size'] = tok
    elif found.get('fabric') is None and tok.isdigit():
        found['fabric'] = tok
    elif found.get('legs') is None and RE_LEGS.match(tok):
        found['legs'] = tok
    else:
        found.setdefault('family_parts', []).append(tok)

def parse_tokens(tokens: list[str]) -> dict[str, str | None]:
    found = {'size': None, 'fabric': None, 'legs': None, 'family_parts': []}
    for tok in tokens:
        classify_token(tok, found)
    family = "_".join(found['family_parts']) if found['family_parts'] else None
    return {k: found[k] for k in ('size', 'fabric', 'legs')} | {'family': family}

def normalise(fname: str) -> str:
    base = os.path.splitext(fname.strip())[0]
    if not base:
        raise ValueError("empty line")

    head, maybe_view = base.rsplit('-', 1) if '-' in base else (base, '')
    view = maybe_view if maybe_view and RE_VIEW.match(maybe_view) else ''
    if not view:
        head = base

    parts = head.split('_')
    if len(parts) < 4:
        raise ValueError("too few parts")

    brand, product = parts[0], parts[1]
    remainder = parts[2:]

    vars_map = parse_tokens(remainder)

    comp = [f"{brand} (brand)", f"{product} (product)"]
    if vars_map['size']:
        comp.append(f"{vars_map['size']} (size)")
    if vars_map['fabric']:
        comp.append(f"{vars_map['fabric']} (fabric)")
    if vars_map['legs']:
        comp.append(f"{vars_map['legs']} (legs)")
    if vars_map['family']:
        comp.append(f"{vars_map['family']} (family)")
    if view:
        comp.append(f"{view} (view)")

    return " / ".join(comp)

def run(in_path: Path, out_path: Path | None):
    results = []
    with in_path.open(encoding='utf-8') as f:
        for lineno, raw in enumerate(f, 1):
            raw = raw.strip()
            if not raw:
                continue
            try:
                results.append(normalise(raw))
            except ValueError as exc:
                print(f"⚠️  line {lineno}: {raw!r} → {exc}")

    if out_path:
        out_path.write_text('\n'.join(results), encoding='utf-8')
        print(f"✓ Wrote {len(results)} lines to {out_path}")
    else:
        for line in results:
            print(line)

if __name__ == '__main__':
    if not INPUT_TXT.exists():
        sys.exit(f"Input file {INPUT_TXT} does not exist.")
    run(INPUT_TXT, OUTPUT_TXT)
