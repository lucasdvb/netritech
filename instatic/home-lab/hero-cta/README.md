# Home Lab hero CTAs: Apple-style pills

**Status: in draft, not published.**

The two hero buttons ("Prendre rendez-vous" on the orb, "Parlons-en" on the brain) become one pill each:
- Pearl gradient (white → `#F1F3F5` → Gris Perle `#DADDE0`), a top highlight and a soft drop shadow.
- The arrow sits in a circle inside the pill: a navy gradient (Bleu Ardoise → Bleu Nuit).
- On hover: the pill lifts 1px, a light sheen sweeps across it, the circle turns teal (Sarcelle `#22808A`) and the arrow slides out and back in. It presses in slightly on click, and shows a teal focus ring for keyboard users.
- The arrow is drawn as a crisp SVG mask; the page's `→` text stays in the HTML.

Only CSS changes, in `src/styles/hlab-x8-hero-vesper.css` (Instatic fileId `mxE366NAA0VfgIChcxv-8`). The page markup is untouched.

| File | What it is |
|---|---|
| `hlab-x8-hero-vesper.css` | The new stylesheet (sha256 `54e961d0a38fa012eab3398f1f856d544f7095acd34f8aa5dfc4085fa0a93870`). |
| `preview-desktop.png` | The orb CTA at rest and on hover (2× pixel density). |
| `preview-brain.png` | The brain scene with "Parlons-en". |
| `preview-phone.png` | The orb CTA at phone width. |

**Rollback:** write `../rollback-2026-10-07/styles/hlab-x8-hero-vesper.css` back (sha256 `8ae1b96d…`), then publish.
