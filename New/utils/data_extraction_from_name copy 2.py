#!/usr/bin/env python3
"""bulk_normalise_hardcoded.py  — robust version

* Reads a text file with one filename per line.
* Extracts components even when the pattern varies (size and/or legs optional).
* Builds a canonical, human‑readable line where:
      value (variable) / value (variable) ...
* Components included only if present.
* The obsolete *color* field is ignored/removed.

Edit `INPUT_TXT` and `OUTPUT_TXT` below, then run:

    python bulk_normalise_hardcoded.py
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
_RE_LEGS = re.compile(r"^F\d+[A-Za-z]*$")   # e.g. F1, F12, F3L
_RE_VIEW = re.compile(r"^(\d+|side|front|back|detail)$", re.I)  # fallback

def parse_tokens(tokens: list[str]) -> dict[str, str | None]:
    """Map tokens (after brand+product) to variables.

    Returns a dict with keys: size, fabric, legs, family (may be None).
    """
    size = fabric = legs = None
    family_parts: list[str] = []

    for tok in tokens:
        if size is None and tok in SIZE_CODES:
            size = tok
        elif fabric is None and tok.isdigit():
            fabric = tok
        elif legs is None and _RE_LEGS.match(tok):
            legs = tok
        else:
            family_parts.append(tok)

    family = "_".join(family_parts) if family_parts else None
    return {"size": size, "fabric": fabric, "legs": legs, "family": family}

def normalise(fname: str) -> str:
    """Convert *fname* into canonical descriptive string."""
    base = os.path.splitext(fname.strip())[0]
    if not base:
        raise ValueError("empty line")

    # Split off optional view (after last '-')
    head, maybe_view = base.rsplit('-', 1) if '-' in base else (base, '')
    view = maybe_view if maybe_view and _RE_VIEW.match(maybe_view) else ''
    if not view:
        # no recognised view – treat entire string as head
        head = base

    parts = head.split('_')
    if len(parts) < 4:     # need at least brand, product, and 2 more tokens
        raise ValueError("too few parts")

    brand, product = parts[0], parts[1]
    remainder = parts[2:]

    vars_map = parse_tokens(remainder)

    # Build the component list in desired order
    comp: list[str] = [f"{brand} (brand)", f"{product} (product)"]
    if vars_map["size"]:
        comp.append(f"{vars_map['size']} (size)")
    if vars_map["fabric"]:
        comp.append(f"{vars_map['fabric']} (fabric)")
    if vars_map["legs"]:
        comp.append(f"{vars_map['legs']} (legs)")
    if vars_map["family"]:
        comp.append(f"{vars_map['family']} (family)")
    if view:
        comp.append(f"{view} (view)")

    return " / ".join(comp)

def run(in_path: Path, out_path: Path | None):
    results: list[str] = []
    with in_path.open(encoding="utf-8") as f:
        for lineno, raw in enumerate(f, 1):
            raw = raw.strip()
            if not raw:
                continue
            try:
                results.append(normalise(raw))
            except ValueError as exc:
                print(f"⚠️  line {lineno}: {raw!r} → {exc}")

    if out_path:
        out_path.write_text("\n".join(results), encoding="utf-8")
        print(f"✓ Wrote {len(results)} lines to {out_path}")
    else:
        for r in results:
            print(r)

if __name__ == "__main__":
    if not INPUT_TXT.exists():
        sys.exit(f"Input file {INPUT_TXT} does not exist.")
    run(INPUT_TXT, OUTPUT_TXT)
