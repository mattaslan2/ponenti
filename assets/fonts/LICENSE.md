# Fonts

Both families are licensed under the SIL Open Font License 1.1 (https://openfontlicense.org).

- Cormorant Garamond, Copyright 2015 The Cormorant Project Authors (github.com/CatharsisFonts/Cormorant).
- Inter, Copyright 2016 The Inter Project Authors (github.com/rsms/inter).

## Web fonts (`src/fonts/`)

Subsets built with `scripts/subset-fonts.py`: Basic Latin, Latin-1, the Turkish letters
ğ Ğ ı İ ş Ş, smart quotes, dashes, € and ₺.

- `inter-latin-tr-400-600.woff2`: Inter variable, weight 400 to 600.
- `cormorant-garamond-latin-tr-500.woff2`: Cormorant Garamond Medium, weight 500, roman.
- `cormorant-garamond-latin-tr-500-italic.woff2`: Cormorant Garamond Medium Italic, weight 500.

In both Cormorant files the lining figures are the default digits (the font's own `lnum`
alternates, remapped by the subsetting script), so prices and times read 18:06 and not I8:06.
This is a modification of the original fonts, which the OFL permits; the files carry a
different file name from the upstream fonts.

## Open Graph image fonts (`assets/fonts/`)

Used only to render Open Graph images (`src/lib/og.tsx`), which need WOFF, not WOFF2.
Both are written by `scripts/subset-fonts.py` with the same character set as the web fonts:

- `cormorant-garamond-latin-tr-500.woff`: the web display font, in WOFF format.
- `inter-latin-tr-500.woff`: Inter Medium, weight 500, as one static file.

Each family is a single file that includes ç, ğ, ı, İ, ö, ş, ü. Do not split a family into
"latin" and "latin-ext" files: the image renderer reads one file per family name, and the
Turkish letters would be drawn from the other family.
