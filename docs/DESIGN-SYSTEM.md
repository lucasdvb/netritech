# Moana Beauté design system (theme v2)

Source of truth: *MOANA BEAUTE Brand Guidelines V2* (Disruptive Dodo) plus the three supplied logo files.
Every value below is a token in `theme/assets/base.css`; nothing in a section uses a colour or font that is not a token.

## Colour

The guide names five colours but gives **no hex or Pantone codes**. The hex values below were sampled from the guide's palette page and logo pages. **Pantone references are not in the guide**; ask Disruptive Dodo for them rather than guessing.

| Token | Hex | Name in the guide | Used for | Contrast on white |
|---|---|---|---|---|
| `--c-white` | #FFFFFF | – | Page ground everywhere (client rule) | – |
| `--c-licorice` | #343434 | Licorice | All text, outline buttons | 12.45:1 |
| `--c-forest` | #283106 | Logo green (wordmark and mark) | Promo bar, product-page ADD TO BAG, labels, badges, active states | 13.71:1 |
| `--c-sage` | #ABB086 | Sage | Decorative only: step numerals, icons on dark, the footer's column labels | 2.26:1 (never body text; 6.06:1 on forest) |
| `--c-linen` | #C7C2AB | Khaki Linen | Reserved, not yet used | – |
| `--c-spring` | #D1D9BE | Spring | The one tinted band per page (routine), free-delivery "unlocked" state, hover fills | – |
| `--c-frost` | #EBEBEB | First Frost | Concern tiles, info panels, image wells (lifted to #F4F4F4) | – |
| `--c-mist` | #DFE0DB | Logo colour on dark grounds | Text on the footer and password page | 11.49:1 on night |
| `--c-night` | #212721 | Pantone Black 3 C (green-black, chosen by the client for the footer) | Footer ground, primary buttons, card ADD TO BAG, header CTA | 15.25:1 on white |
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

## Typography (v4: one family, golden ratio)

At the owner's request every level is now **Raleway** (the brand guide sets Instrument Serif for headlines; this is a deliberate departure, reversible: restore the Instrument Serif files from git history, add their `@font-face` rules back and point `--f-display` at the serif). Hierarchy comes from a golden-ratio size scale and a weight ladder: the bigger the type, the lighter it gets.

**Scale.** Base 16 px. φ = 1.618 for each major step, √φ = 1.272 for the half steps, φ^¼ for the one small-UI step:

| Token | px | Step |
|---|---|---|
| `--fs-2xs` | 11.2 | φ^-¾ |
| `--fs-xs` | 12.6 | φ^-½ |
| `--fs-sm` | 14.2 | φ^-¼ |
| `--fs-md` | 16 | base |
| `--fs-lg` | 20.4 | φ^½ |
| `--fs-xl` | 25.9 | φ |
| `--fs-2xl` | 32.9 | φ^1½ |
| `--fs-3xl` | 41.9 | φ² |
| `--fs-4xl` | 53.3 | φ^2½ |
| `--fs-5xl` | 67.8 | φ³ |
| `--fs-6xl` | 86.2 | φ^3½ |

**Roles** (`--type-*`, CSS `font` shorthands; components use these, never raw sizes). Each fluid role slides one golden step between phone and desktop:

| Role | Weight | Size | Line height | Tracking |
|---|---|---|---|---|
| Display (hero, footer) | 200 ExtraLight | 3xl → 5xl | 1.05 | −0.035em |
| H1 | 300 Light | 2xl → 4xl | 1.12 | −0.022em |
| H2 | 300 Light | xl → 3xl | 1.12 | −0.022em |
| H3 | 400 Regular | lg → xl | 1.236 (2/φ) | −0.01em |
| H4 | 500 Medium | lg | 1.236 | |
| Lead | 300 Light | md → lg | 1.618 (φ) | |
| Body | 400 Regular | md | 1.618 | |
| Interface | 500 Medium | sm | 1.3 | 0.03em |
| Buttons | 600 SemiBold | sm | 1 | 0.1em, uppercase |
| Labels | 600 SemiBold | 2xs | 1.4 | 0.16em, uppercase |
| Price | 600 SemiBold | md | 1.3 | |
| Numerals (routine steps) | 200 ExtraLight | 3xl | 1 | |
| Section titles `.t-title` | 300 Light | lg → xl | | 0.14em, uppercase |

- Emphasis is **Raleway italic in forest** (same family), never a second typeface.
- Pinyon Script stays as the rare accent, at most once per page.
- Fonts: one variable WOFF2 per style (roman and italic, weights 200–700), latin and latin-ext, `font-display: swap`. Only the roman latin file is preloaded.

## Fallback fonts (no layout shift)

`Raleway Fallback` (Arial / Liberation Sans at `size-adjust: 103.2%`) sits second in the stack, so text keeps its line breaks when the web font arrives. Ratio measured in the browser; CLS is 0 on every template.

## Space, shape, layout

- 4 px base: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128.
- Section rhythm `--section`: 56 → 104 px. Page width 1440 px; gutters 16 → 48 px.
- Radii: **0 everywhere** (v3, after Cult Beauty: square buttons, cards, chips, inputs, filter boxes). The one curve on the site is the footer slab's rounded top (GetLayers Lumora).
- Hairlines: Licorice at 14 % (32 % for strong). No drop shadows except the mega menu and the floating brand packshot.
- Product grid: 2 columns under 750 px, 3 to 1199 px, 4 from 1200 px; white image wells at 1:1.04; product rails show 4 across on desktop and peek on phones.
- Section titles (Cult Beauty's voice): `.t-title`, Raleway 300, uppercase, tracked 0.14em, centred.

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
- **Line reveal** (GetLayers Lumora): headings marked `data-lines` split into their rendered lines; each rises out of its own mask, 100 ms apart, 900 ms ease-out cubic; descenders protected.
- **Carousels**: native scroll-snap (swipe works without script) plus arrows, dots and autoplay that pauses on hover, focus, a background tab, the pause tab and reduced motion. Hero slides rise out of a blur and their pictures settle from 1.06 scale.
- **WebGL**: the GetLayers *Feather* wash (one fragment shader, WebGL2). Compiled only near the viewport and when idle, half resolution, 30 fps, paused off screen, still frame on software GL or under reduced motion.
- **Glass**: white at 50–80 % with 20–24 px backdrop blur and an inset highlight; solid fallback where `backdrop-filter` is unsupported.
- **Scroll-driven motion (v4)**: native CSS scroll timelines (`animation-timeline: view()` / `scroll()`), so it runs off the main thread with no scroll listeners. Only `translate`, `scale` and `opacity` move. Browsers without scroll timelines, and reduced motion, get a still page.
  - **Scroll progress**: a 2 px forest hairline across the top of the window.
  - **Hero**: as it leaves, the picture drifts down and zooms to 1.12, the copy lifts and softens, the floating glass product rises faster (three depths).
  - **Photographs** (`.sx-parallax`): a ±6 % parallax inside their frame.
  - **Packshots** (`.sx-float`): products float up through their tiles, alternate tiles in the opposite direction (category tiles, editorial cards).
  - **Ambient light** (`.ambient`): two soft Spring and Linen light pools behind a section (plain radial gradients, no blur filter) that drift at different speeds. On the concern finder, brand story, FAQ and page headers.
  - **Routine**: a hairline beside the five steps fills as you read down them; each step number brightens as its card reaches the middle.
  - **Brand ticker**: the stocked brands (from the catalogue) in two large rows, ExtraLight and Light italic, sliding in opposite directions with the scroll. Decorative, hidden from screen readers; the only marquee on the site.
- **Pointer sheen** (`data-sheen`): a soft highlight follows the cursor across glass cards and concern tiles, moved by transform, mouse and trackpad only.
- **Page transitions** (`@view-transition`): pages crossfade in 240 ms; a product card's photo morphs into the product page's main photo (560 ms, house curve) and back.
- **Water ripple** (`assets/ripple.js`): analytic rings in a fragment shader over the hero and story photos, mouse and trackpad only, canvas fades out when still.
- **Feedback**: add-to-bag button morphs to a drawn tick and "Added" for 1.8 s; the bag count rolls up on a spring; the new bag line slides in with a brief Spring tint.
- **Quick view and gallery** open with a short rise and fade; the phone gallery follows the finger (swipe, pinch, pan, drag down to close).
- **Phone dock**: glass bar under 750 px, hides on scroll down with the header.
- **No preloader, no smooth-scroll hijacking.**
- `prefers-reduced-motion` removes every transform, blur and clip and shortens transitions to 0.01 ms.

## Components

Service bar, promo bar, header (search field, Find my routine, wishlist, account, bag; glass on scroll, hides on scroll down), centred nav, mega menu, hero carousel, promo strip, category tiles, product tabs, editorial cards, brand tiles, wishlist heart, routine finder, phone menu drawer, announcement bar, buttons (primary, secondary, light, ghost-light, small), pills, tags, quantity stepper, accordion (native `<details>` with height animation where supported), product card (price in button), price, cart drawer, cart line, free-delivery bar, cart summary, search overlay with predictive results, filter drawer with check rows, pagination, breadcrumbs, toast, notices, form fields with inline errors, lightbox, sticky buy bar, footer.
