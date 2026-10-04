# Bricolage Grotesque 036

The single typeface of the SPM inner pages (Solutions, Pourquoi SPM, Clients &
Partenaires, Secteurs, Actualités, Carrières, Contact).

- Source: Bricolage Grotesque variable font from Google Fonts (SIL Open Font
  License 1.1, Mathieu Triay / Atelier Triay).
- `bricolage-grotesque-036.woff2`: instanced at optical size 36, normal width,
  weight 400 (one weight), hinting kept, subset to the characters the pages use.
- On the site: the site's CSP only allows same-origin fonts and the Instatic
  media library only accepts images, so this file is embedded as base64 in
  `src/scripts/spx-font.js` (scoped to the seven inner pages) and registered
  with the FontFace API. To change the font, rebuild this file and re-embed it.
