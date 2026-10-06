"""
Rebuilds the web fonts in src/fonts/ and the share-image fonts in assets/fonts/
(Latin + Turkish glyphs only).

Why: Google's latin + latin-ext files for Inter and Cormorant Garamond weigh
about 100 KB per style. These subsets weigh 20 to 30 KB each and still cover
ç ğ ı İ ö ş ü, Latin-1 accents, smart quotes, € and ₺.

Display face: Cormorant Garamond Medium (500), roman and italic. Its default
figures are old-style (a "1" that reads as "I"), so the build makes lining
figures the default glyphs. No CSS is needed to get "$25,000" right, and
`font-variant-numeric: tabular-nums` still switches to tabular lining figures.

1. Get the source fonts: the variable TTFs from github.com/google/fonts
   (ofl/inter and ofl/cormorantgaramond).
2. pip install fonttools brotli
3. python3 scripts/subset-fonts.py <Inter[opsz,wght].ttf> <CormorantGaramond[wght].ttf> <CormorantGaramond-Italic[wght].ttf>
   Pass "-" for a source you want to leave untouched.

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


def freeze_lining_figures(font: TTFont) -> None:
    """Point the character map at the lining figures (and matching currency signs)."""
    gsub = font["GSUB"].table
    mapping: dict[str, str] = {}
    for record in gsub.FeatureList.FeatureRecord:
        if record.FeatureTag != "lnum":
            continue
        for index in record.Feature.LookupListIndex:
            for sub in gsub.LookupList.Lookup[index].SubTable:
                sub = getattr(sub, "ExtSubTable", sub)
                mapping.update(getattr(sub, "mapping", {}))
    if not mapping:
        raise SystemExit("No lnum feature found; is this the right source font?")
    for table in font["cmap"].tables:
        for codepoint, glyph in list(table.cmap.items()):
            if glyph in mapping:
                table.cmap[codepoint] = mapping[glyph]


def build(src: str, out: Path, axis_limits: dict, features: list[str], *, lining: bool = False, flavor: str = "woff2") -> None:
    font = TTFont(src, lazy=False)
    if lining:
        freeze_lining_figures(font)
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
    font.flavor = flavor
    font.save(out)
    print(f"{out.relative_to(ROOT)}: {out.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    inter, cormorant, cormorant_italic = sys.argv[1:4]
    fonts = ROOT / "src" / "fonts"
    display_features = ["kern", "calt", "locl", "liga", "tnum", "pnum"]
    if inter != "-":
        # Inter: variable 400-600 (body, medium, semibold), text optical size. tnum is used by tables.
        build(inter, fonts / "inter-latin-tr-400-600.woff2", {"wght": (400, 600), "opsz": 14}, ["kern", "calt", "locl", "tnum", "pnum", "liga", "case"])
        # Inter Medium as one static WOFF for the share images. One file per family: the image
        # renderer reads a single file for each family name, so a separate "latin-ext" file is
        # never consulted and İ, Ş, ğ would be drawn from another font instead.
        build(inter, ROOT / "assets" / "fonts" / "inter-latin-tr-500.woff", {"wght": 500, "opsz": 14}, ["kern", "calt", "locl", "case"], flavor="woff")
    if cormorant != "-":
        # Cormorant Garamond Medium: all display text and large numerals.
        build(cormorant, fonts / "cormorant-garamond-latin-tr-500.woff2", {"wght": 500}, display_features, lining=True)
        # Same cut as WOFF for the share images (the image renderer cannot read WOFF2).
        build(cormorant, ROOT / "assets" / "fonts" / "cormorant-garamond-latin-tr-500.woff", {"wght": 500}, display_features, lining=True, flavor="woff")
    if cormorant_italic != "-":
        # Cormorant Garamond Medium Italic: the one emphasized phrase in a headline, and the motto.
        build(cormorant_italic, fonts / "cormorant-garamond-latin-tr-500-italic.woff2", {"wght": 500}, display_features, lining=True)
