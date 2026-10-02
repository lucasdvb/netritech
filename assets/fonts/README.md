# Bricolage Grotesque 036

The single typeface of the SPM inner pages (Solutions, Pourquoi SPM, Clients &
Partenaires, Secteurs, Actualités, Carrières, Contact).

- Source: Bricolage Grotesque variable font from Google Fonts (SIL Open Font
  License 1.1, Mathieu Triay / Atelier Triay).
- `bricolage-grotesque-036.woff2`: optical size fixed at 36pt, normal width,
  weights 400–600, subset to the characters the pages use, hinting kept.
- `spm-bricolage-036.png`: the same woff2 stored losslessly in the pixels of a
  PNG (3 bytes per pixel, the first 4 bytes give the font's length). The site's
  CSP only allows same-origin fonts and the Instatic media library only accepts
  images, so this PNG is uploaded to the media library and
  `src/scripts/spx-font.js` reads it back through a canvas and registers it with
  the FontFace API.
