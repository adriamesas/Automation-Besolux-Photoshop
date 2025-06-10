#!/usr/bin/env python3
"""bulk_normalise_hardcoded.py  — robust version 2

Handles:
* legs + family combined tokens (already OK thanks to '_' split)
* size tokens like '40x40', '55x55', etc.
* filenames with only fabric+family (no size/legs)
* optional view suffix after '-'

The output is         value (variable) / value (variable) ...
with components included only when present.
"""

import os
import re
import sys
from pathlib import Path

# ========== CONFIGURE HERE ==========
INPUT_TXT  = Path(r"C:\Users\Adria Mesas\OneDrive - Beso Lux\PC_FILES\Desktop\Automation Besolux Photoshop\New\utils\names.txt")
OUTPUT_TXT = Path(r"C:\Users\Adria Mesas\OneDrive - Beso Lux\PC_FILES\Desktop\Automation Besolux Photoshop\New\utils\canon.txt")  # set to None to just print
# ====================================

SIZE_CODES   = {"XS", "S", "M", "L", "XL", "XXL"}
RE_LEGS      = re.compile(r"^F\d+[A-Za-z]*$")                 # legs token, e.g. F1, F12, F3L
RE_SIZE_CM   = re.compile(r"^\d{1,4}x\d{1,4}(x\d{1,4})?$") # sizes like 40x40 or 55x55x5
RE_VIEW      = re.compile(r"^(\d+|side|front|back|detail)$", re.I)

def classify_token(tok: str, found: dict) -> None:
    """Update *found* dict in-place with classification for *tok* if not set."""
    if found.get('size') is None and (tok in SIZE_CODES or RE_SIZE_CM.match(tok)):
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

    # Extract view (suffix after last '-') if it looks like a view label
    head, maybe_view = base.rsplit('-', 1) if '-' in base else (base, '')
    view = maybe_view if maybe_view and RE_VIEW.match(maybe_view) else ''
    if not view:
        head = base   # revert if 'maybe_view' wasn't a real view

    parts = head.split('_')
    if len(parts) < 4:
        raise ValueError("too few parts")

    brand, product = parts[0], parts[1]
    remainder = parts[2:]

    vars_map = parse_tokens(remainder)

    comp: list[str] = [f"{brand} (brand)", f"{product} (product)"]
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
