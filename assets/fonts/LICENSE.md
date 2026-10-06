# Fonts

Both families are licensed under the SIL Open Font License 1.1 (https://openfontlicense.org).

- Cormorant Garamond, Copyright 2015 The Cormorant Project Authors (github.com/CatharsisFonts/Cormorant).
- Inter, Copyright 2016 The Inter Project Authors (github.com/rsms/inter).

## Web fonts (`src/fonts/`)

Subsets built with `scripts/subset-fonts.py`: Basic Latin, Latin-1, the Turkish letters
ğ Ğ ı İ ş Ş, smart quotes, dashes, € and ₺.

- `inter-latin-tr-400-600.woff2`: Inter variable, weight 400 to 600.
- `cormorant-garamond-latin-tr-600.woff2`: Cormorant Garamond, weight 600.

## Open Graph image fonts (`assets/fonts/`)

Used only to render Open Graph images (`src/lib/og.tsx`). Copied from the @fontsource
packages (latin and latin-ext subsets, which cover ç, ğ, ı, İ, ö, ş, ü).
