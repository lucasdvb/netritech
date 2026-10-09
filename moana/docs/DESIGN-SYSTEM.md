# Moana Beauté design system (theme v2)

Source of truth: *MOANA BEAUTE Brand Guidelines V2* (Disruptive Dodo) plus the three supplied logo files.
Every value below is a token in `theme/assets/base.css`; nothing in a section uses a colour or font that is not a token.

## Colour

The guide names five colours but gives **no hex or Pantone codes**. The hex values below were sampled from the guide's palette page and logo pages. **Pantone references are not in the guide**; ask Disruptive Dodo for them rather than guessing.

| Token | Hex | Name in the guide | Used for | Contrast on white |
|---|---|---|---|---|
| `--c-white` | #FFFFFF | – | Page ground everywhere (client rule) | – |
| `--c-licorice` | #343434 | Licorice | All text, outline buttons | 12.45:1 |
| `--c-forest` | #283106 | Logo green (wordmark and mark) | Primary buttons, links, labels, footer ground, active states | 13.71:1 |
| `--c-sage` | #ABB086 | Sage | Decorative only: step numerals, icons on dark, the footer's column labels | 2.26:1 (never body text; 6.06:1 on forest) |
| `--c-linen` | #C7C2AB | Khaki Linen | Reserved, not yet used | – |
| `--c-spring` | #D1D9BE | Spring | The one tinted band per page (routine), free-delivery "unlocked" state, hover fills | – |
| `--c-frost` | #EBEBEB | First Frost | Concern tiles, info panels, image wells (lifted to #F4F4F4) | – |
| `--c-mist` | #DFE0DB | Logo colour on dark grounds | Text on the forest footer and password page | 10.33:1 on forest |
| `--error` | #8F2D24 | – (functional) | Form errors and failed cart actions only, always with an icon and text | 8.18:1 |

Secondary text is Licorice at 74 % opacity on white (5.49:1) and on First Frost (4.96:1), and at 88 % on Spring (6.3:1). All ratios are computed with the WCAG 2 formula. Lighthouse accessibility: 100 on home, collection, product, routine guide, cart and contact (local preview).

## Logo

| File | Use |
|---|---|
| `brand/official-lockup-dark.svg` → `logo-lockup-dark.webp` | Light grounds: header, phone menu, gift card, structured data |
| `brand/official-lockup-light.svg` → `logo-lockup-light.webp` | Dark grounds: footer, password page, sharing image |
| `brand/official-mark-light.svg` | Favicon and app icon (on forest) |
| dark wave mark, cropped from the official dark lockup → `logo-mark-dark.webp` | 404 page |

The official files are Canva exports: vector lettering, with the wave as an embedded image. `tools/optimise_logo.py` crops the canvas to the logo and replaces the wave's flat colour layer with the identical flat fill under the original mask. Measured against the originals: the wave matches within 2/255, and the lettering paths are kept byte for byte. The theme ships lossless WebP renders of those files (900 px wide, at least 4× the on-screen size). The horizontal "mark beside wordmark" lockup in the previous theme was a redraw that is not in the guide, so it is no longer used.

## Typography

| Role | Face | Size (fluid) | Line height | Notes |
|---|---|---|---|---|
| Hero | Instrument Serif 400 | 44 → 96 px | 0.98 | −0.02em; italic word in forest for emphasis |
| H1 | Instrument Serif 400 | 38 → 68 px | 1.02 | |
| H2 | Instrument Serif 400 | 32 → 52 px | 1.06 | |
| H3 | Instrument Serif 400 | 24 → 32 px | 1.14 | Product titles on the product page use H2 size |
| Card title | Instrument Serif 400 | 19 / 21 px | 1.22 | |
| Lead | Raleway 400 | 17 → 20 px | 1.6 | max 38rem |
| Body | Raleway 400 | 16 px | 1.65 | |
| Label / eyebrow | Raleway 700 | 11 px | 1.4 | uppercase, 0.18em |
| Buttons | Raleway 700 | 13 px (11 px small) | 1 | uppercase, 0.12em (the guide: "Raleway Bold anchors CTAs") |
| Accent | Pinyon Script 400 | 32 → 48 px | 1.1 | At most once per page ("you already belong here") |

Fonts are self-hosted WOFF2 (SIL OFL), latin and latin-ext subsets, `font-display: swap`; only Raleway and Instrument Serif regular are preloaded.

## Space, shape, layout

- 4 px base: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128.
- Section rhythm `--section`: 56 → 104 px. Page width 1440 px; gutters 16 → 48 px.
- Radii: 4 (thumbs), 8 (inputs, image wells), 14 (cards, panels, media), pill (buttons, chips, steppers). Soft corners echo the wave mark.
- Hairlines: Licorice at 14 % (32 % for strong). No drop shadows except the mega menu and the floating brand packshot.
- Product grid: 2 columns under 750 px, 3 to 1199 px, 4 from 1200 px; image wells 4:5.

## Motion

| Token | Value | Use |
|---|---|---|
| `--ease` | cubic-bezier(.2, 0, 0, 1) | House curve (fitted to GetLayers' Dantora and Halden springs) |
| `--ease-out` | cubic-bezier(.16, 1, .3, 1) | Drawers, image zoom |
| `--t-fast` | 160 ms | Colour and background changes |
| `--t` | 250 ms | Hover wipes, menus, accordions |
| `--t-slow` | 700 ms | Reveals, drawers, buy bar |
| `--t-media` | 900 ms | Image clip reveals |

- **Reveal:** rise 24 px out of an 8 px blur, opacity lands at 280 ms, 90 ms stagger for text and 110 ms for cards. Fires once at 15 % visibility. It is never applied to the hero headline or the hero image, so those paint first.
- **Hover:** fills wipe in from an edge, never a fade. Product images scale to 1.035 and the second photo crossfades in. Hover effects are gated behind `(hover: hover)`.
- **No preloader, no smooth-scroll hijacking, no WebGL.**
- `prefers-reduced-motion` removes every transform, blur and clip and shortens transitions to 0.01 ms.

## Components

Header (sticky, hides on scroll down and returns on scroll up), mega menu, phone menu drawer, announcement bar, buttons (primary, secondary, light, ghost-light, small), pills, tags, quantity stepper, accordion (native `<details>` with height animation where supported), product card (price in button), price, cart drawer, cart line, free-delivery bar, cart summary, search overlay with predictive results, filter drawer with check rows, pagination, breadcrumbs, toast, notices, form fields with inline errors, lightbox, sticky buy bar, footer.
