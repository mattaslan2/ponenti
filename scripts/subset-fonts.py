"""
Rebuilds the two web fonts in src/fonts/ (Latin + Turkish glyphs only).

Why: Google's latin + latin-ext files for Inter and Cormorant Garamond weighed
about 207 KB. These subsets weigh about 47 KB and still cover ç ğ ı İ ö ş ü,
Latin-1 accents, smart quotes, € and ₺.

1. Get the source fonts (any full variable Inter and Cormorant Garamond TTF or
   WOFF2 works; the Google Fonts CSS API with `&text=` returns a usable file).
2. pip install fonttools brotli
3. python3 scripts/subset-fonts.py <inter-source> <cormorant-source>

Character list: scripts/font-chars.txt. Add characters there if new copy needs them.
License: SIL Open Font License 1.1 (see assets/fonts/LICENSE.md).
"""

import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parent.parent
TEXT = (ROOT / "scripts" / "font-chars.txt").read_text(encoding="utf-8")


def build(src: str, out: Path, axis_limits: dict, features: list[str]) -> None:
    font = TTFont(src, lazy=False)
    opts = subset.Options()
    opts.layout_features = features
    opts.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]  # keep copyright and license entries
    opts.name_languages = [0x0409]
    opts.hinting = False
    opts.notdef_outline = True
    opts.drop_tables += ["DSIG"]
    subsetter = subset.Subsetter(options=opts)
    subsetter.populate(text=TEXT)
    subsetter.subset(font)
    font = instancer.instantiateVariableFont(font, axis_limits, updateFontNames=False)
    font.flavor = "woff2"
    font.save(out)
    print(f"{out.relative_to(ROOT)}: {out.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    fonts = ROOT / "src" / "fonts"
    # Inter: variable 400-600 (body, medium, semibold). tnum is used by tables.
    build(sys.argv[1], fonts / "inter-latin-tr-400-600.woff2", {"wght": (400, 600)}, ["kern", "calt", "locl", "tnum", "pnum", "liga", "case"])
    # Cormorant Garamond: static 600 (all display text). lnum gives lining figures.
    build(sys.argv[2], fonts / "cormorant-garamond-latin-tr-600.woff2", {"wght": 600}, ["kern", "calt", "locl", "liga", "lnum", "tnum", "pnum"])
