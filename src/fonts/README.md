# Site fonts

Lexend (text) and Lexend Exa (display) variable fonts, self-hosted under the SIL Open Font License 1.1 ([OFL.txt](OFL.txt)). `src/styles/site.css` declares them; the Site Page Shell preloads the two `-core` files.

Each family is split into three files with disjoint `unicode-range`s, so a page downloads only what its text uses:

| File | Covers | Loaded |
| --- | --- | --- |
| `*-core.woff2` | Printable ASCII plus the punctuation the site's copy uses (`© · – — ‘ ’ “ ” • … ← → ↓ ↗ −`, no-break and hair spaces) | Every page (preloaded) |
| `*-latin-rest.woff2` | The rest of Google Fonts' `latin` subset (accented Latin-1 letters, other punctuation, `€`, `™`) | Only when a page uses one of those characters |
| `*-latin-ext.woff2` | Google Fonts' `latin-ext` subset, unchanged | Only when a page uses one of those characters |

The `latin` and `latin-ext` sources are the Google Fonts files for `Lexend:wght@300..700` and `Lexend Exa:wght@400..700`. `core` and `latin-rest` were cut from the `latin` file with fontTools, keeping hinting and every layout feature:

```bash
pip install fonttools brotli
pyftsubset lexend-latin.woff2 --flavor=woff2 --layout-features='*' --name-IDs='*' --name-languages='*' --notdef-outline \
  --unicodes="U+0020-007E,U+00A0,U+00A9,U+00B7,U+200A,U+2013-2014,U+2018-2019,U+201C-201D,U+2022,U+2026,U+2190,U+2192-2193,U+2197,U+2212" \
  --output-file=lexend-core.woff2
```

`latin-rest` uses the same command with the `latin-rest` `unicode-range` from `site.css`. Repeat both for Lexend Exa.

If new copy uses a character outside `core` (for example `é`), it still renders in Lexend, because the browser fetches `latin-rest` for that page. Add the character to `core`, both here and in `site.css`, only if it becomes common across pages.
