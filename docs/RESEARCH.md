# Research: reference stores and GetLayers

Internal working notes behind the Moana Beauté theme (October 2026).

## What could and could not be inspected

| Source | Status | How |
|---|---|---|
| kosas.com | Inspected | Headless Chromium at 1440 and 390 px: homepage, mega menu, collections, 2 product pages, cart drawer, search, computed CSS and motion |
| kyliecosmetics.com | Partly inspected | Same method. Its collection grid, filters and typed search are rendered client-side by Algolia, which the sandbox blocks, so they stayed on skeleton loaders. Reviews, loyalty and video widgets were also blocked |
| rhodeskin.com | **Not inspected** | `www.rhodeskin.com` is denied by this environment's network policy. Nothing here is based on Rhode's live site |
| cdn.shopify.com | Blocked | Some thumbnails failed on both sites; noted rather than treated as design choices |
| GetLayers library | Explored | Through its MCP: 109 compositions, 53 templates, 54 styles, sections, gradients; Halden and Dantora source read in detail |

Screenshots and raw CSS dumps from the reference study are in the session scratchpad (not committed: third-party material).

## Kosas (custom Shopify theme, Tailwind + web components, Splide)

**Strongest decisions**
- Two voices: a grotesk for product language, a mono uppercase for everything clickable. Every action looks like an action.
- One button per product card, always visible, with the price inside it ("ADD TO BAG — $48"). No hover-only controls, nothing over the photo.
- Image wells tinted (#FBFAF7) with `mix-blend-mode: darken`, so supplier pack shots on mismatched white backgrounds look like one set.
- A tagline under every product name saying what it is.
- Product page: title + rating, tagline, related-product switcher, quantity + add (46 px tall), shipping line, "use it with", then accordions (benefits & ingredients with key ingredients and one-liners, numbered how-to, clinical results).
- Cart drawer: 400 px, 300 ms `cubic-bezier(.4,0,.2,1)`, backdrop `rgba(43,41,38,.4)` with a 4 px blur, pill quantity stepper, one tiered progress bar.
- Card hover: image scale 1.04 + soft shadow, 600 ms `cubic-bezier(.4,0,.2,1)`.

**Not for Moana**: a non-sticky header on long pages; an eight-item cart carousel; mono type for long text; no filters at 59 products.

## Kylie Cosmetics (Vue storefront, Swiper, Algolia)

**Strongest decisions**
- Sticky header that is transparent over the hero and turns white on scroll (200 ms ease-out).
- Mobile product page: swipe gallery with 292 px slides showing the edge of the next image, and a sticky add-to-cart bar (71 px, slides up over 200 ms).
- Accordions open one at a time; full ingredient list is one tap away.
- Mobile hero text sits below the image, not over it.

**Not for Moana**: client-side catalogue rendering (when the script fails the grid never appears); a cluttered cart (free gift, rewards points, auto-added gift, upsell); all-lowercase interface type; invented-looking stats blocks; a 900 px hero.

## GetLayers (MCP library)

The library is built for immersive single-page sites (React, react-spring, Lenis, WebGL). For a 21-product shop the 3D scenes, preloaders and scroll-hijacking would cost load time and conversion, so the library was used for **layouts, motion numbers and interaction mechanics**, rebuilt in plain Liquid, CSS and a little vanilla JS.

| Pattern | Source | Verdict | Where it lives |
|---|---|---|---|
| Editorial split hero: copy column, tall portrait plate, fact ledger | `artist-hero` composition | Adapted | `sections/hero.liquid` |
| Sticky heading beside numbered steps (faint large numerals, ruled rows) | `artist-process` composition | Reused | `sections/routine-steps.liquid` |
| Ruled 4-cell trust row | `marcus-vane-impact` composition | Reused | `sections/service-strip.liquid` |
| 4/8 ruled accordion FAQ | `artist-faq` composition | Reused as native `<details>` | `sections/faq.liquid` |
| Catalogue rows with a packshot that follows the cursor | Halden catalogue band | Adapted (desktop hover only, plain list on touch) | `sections/brand-index.liquid` |
| Hover fill that wipes in from an edge instead of fading | Halden pills and buttons | Adapted | `.btn::before`, concern tiles |
| Search as a full-width panel dropping from the top (~520 ms) | Halden search overlay | Adapted | `snippets/search-modal.liquid` |
| Blur-and-rise reveal (Dantora: heading y 60 px / blur 14 px; body y 16 px / blur 12 px) | Dantora text presets | Adapted, gentler: 24 px / 8 px, never on the hero H1 or LCP image | `.reveal` in `base.css` |
| House easing `cubic-bezier(.2,0,0,1)` (fitted to Dantora's and Halden's springs within ~1.5 % RMS) | Dantora / Halden | Reused | `--ease` |
| Image plate unmasking top-down (`clip-path inset(0 0 100% 0) → 0`, ~900 ms, 110 ms stagger) | Halden product plates | Reused | `.reveal-media` |
| Preloader, Lenis smooth scroll, WebGL scenes, Shoal gradient | Several | Rejected: cost to first paint and to conversion; no reduced-motion handling in the gradient | — |

## What Moana took, and how it was adapted

| Pattern | Adapted as |
|---|---|
| Price in the card button (Kosas) | Full-width outline pill "Add to cart — Rs 900", Raleway Bold uppercase (the brand's CTA face) instead of a mono |
| Tinted image wells (Kosas) | `#f4f4f4` (First Frost lifted halfway to white) with `multiply`, 9 % inner padding |
| Tagline under the name (Kosas) | The product's real concern tags ("Hydration · Dullness") from the catalogue |
| Numbered how-to (Kosas) | The `custom.how_to_use` metafield split into steps on the product page |
| Sticky mobile add-to-cart (Kylie) | A buy bar on every width that appears once the main button scrolls away and steps aside for the footer |
| Swipe gallery with dots (Kylie) | Square slides on phones, stacked full-width images beside a sticky info column on desktop |
| One threshold, not tiers (Kosas, simplified) | One progress bar to the real Rs 1,500 free-delivery rule |
| Mega menu (both) | Kept, but light: category / concern / skin type with live counts, plus two cards. Concern and skin-type routes are the main way to find products in a 21-SKU K-beauty range |
