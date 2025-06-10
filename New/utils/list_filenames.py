#!/usr/bin/env python3
"""list_psd_filenames_hardcoded.py

Extracts **PSD** *file names* (no directory path) from a fixed folder,
looking only in its sub‑folders, and writes them to a fixed text file.

Edit FOLDER and OUTFILE below, then run:

    python list_psd_filenames_hardcoded.py
"""

from pathlib import Path
import sys


# ========== CONFIGURE HERE ==========
FOLDER = Path(r"O:\PSD FILES")  # root folder to scan
OUTFILE = Path(r"C:\Users\Adria Mesas\OneDrive - Beso Lux\PC_FILES\Desktop\Automation Besolux Photoshop\New\utils\names.txt")
# ====================================


def list_psd_filenames(folder: Path, output: Path) -> None:
    """Write .psd file names (basename only) to *output*,
    including files in sub‑folders of *folder* but excluding any in the root itself.
    """
    if not folder.is_dir():
        sys.exit(f"Error: '{folder}' is not a directory or cannot be accessed.")

    psd_files = (
        p.name
        for p in folder.rglob('*.psd')
        if p.is_file() and p.suffix.lower() == '.psd' and p.parent != folder
    )

    with output.open('w', encoding='utf-8') as f:
        for name in psd_files:
            f.write(name + '\n')


if __name__ == "__main__":
    list_psd_filenames(FOLDER, OUTFILE)
    print(f"Wrote {OUTFILE} with PSD file names from sub‑folders of {FOLDER}")
