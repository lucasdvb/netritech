# Moana Beauté: handover

October 2026. Store: `moana-beaute.myshopify.com`.

## Where things are

| | |
|---|---|
| New theme on Shopify | **Moana Beauté v2 (preview)**, id `191582306594`, **unpublished**. The live theme is untouched |
| Preview link | `https://moana-beaute.myshopify.com/?preview_theme_id=191582306594` (the storefront password may be needed first) |
| Theme editor | Shopify admin → Online Store → Themes → *Moana Beauté v2 (preview)* → Customize |
| Code | `moana/` in this repository (branch `claude/eloquent-bardeen-p6n61a`) |

## 1. What was implemented

**Theme (new code, Online Store 2.0)**
- **Header:** announcement bar with the real delivery terms, and a sticky header that hides as you scroll down and returns as you scroll up.
- **Mega menu:**
  - shop by category, with live counts
  - shop by concern and by skin type, built from the real product tags
  - two feature cards
- **Phone menu:** a drawer with the same structure.
- **Homepage:**
  - editorial hero with a featured product
  - service strip
  - category rail
  - launch collection grid
  - shop by concern
  - the five-step routine, each step with a real product you can add
  - brand index
  - brand story
  - FAQ
- **Collection pages:**
  - sub-category pills and concern shortcuts (tag routes, so they need no app)
  - a filter drawer on Shopify's storefront filters
  - sorting and filtering that update without a page reload, with browser back working
  - active filter chips and an empty state
  - a "coming soon" state with the launch collection for Makeup, Hair Care, Body Care, and Gifts & Sets
- **Product page:**
  - gallery: stacked on desktop, swipe with dots on phones, zoom on tap
  - vendor link, title, price and size, the real description
  - "Targets", "Suits" and "Routine" facts built from the tags
  - quantity stepper and add to cart
  - delivery and WhatsApp reassurance
  - accordions: key ingredients, how to use as numbered steps, full ingredients, delivery and returns, all from the `custom.*` metafields
  - a sticky buy bar
  - Shopify recommendations
  - product structured data from Shopify's own filter
- **Cart:**
  - a drawer and a full cart page, both rendered by Shopify (no prices worked out in JavaScript)
  - progress towards free delivery (Rs 1,500)
  - steppers and remove buttons
  - at most two suggestions
  - a clear message when stock caps a quantity
- **Search:** an overlay with Shopify's predictive search (products, collections, pages, suggestions) and new-in products before typing, plus a results page.
- **Inner pages:**
  - About, Contact (form), Delivery & returns, Brands, the routine guide, FAQ
  - 404, collections list, blog and article, password page, gift card
- **Locales:** English and French (French is published on the store).
- **Theme settings:** business details, the free-delivery threshold, low-stock threshold, cart suggestions, and the concern / skin-type / routine-step tag lists.

**Store data changed (all reversible)**
- **New menus:** `moana-main`, `moana-footer-shop`, `moana-footer-help`. The existing menus are unchanged.
- **New page:** `/pages/faq`, published, using the `faq` template. The answers come from your Shopify policies.
- **SEO:** descriptions set on 6 pages and 11 collections.
- **Collection intros:** the visible descriptions of the 8 category collections are rewritten (they were "Cleansers from Moana Beauté.").

**Not changed:** the live theme, products, prices, inventory, policies, shipping, payments, checkout, and whether the store is published.

## 2. Design decisions

See `RESEARCH.md` and `DESIGN-SYSTEM.md`. In short:

- **White everywhere, Spring for one band.**
  - The previous theme used First Frost grey as the page background, which broke the white-ground rule.
  - Brand palette only; Sage, Khaki Linen and Spring appear because the guide includes them.
- **Official logos only.**
  - The previous theme's horizontal "mark + wordmark" lockup is not in the guide, so it is gone.
  - Light-on-dark and dark-on-light variants are used as the guide shows.
- **Taken from Kosas:**
  - one add button per product card, always visible, with the price inside
  - tinted image wells that make mismatched pack shots look like one set
  - a benefit line under each name (here, the real concern tags)
  - numbered how-to steps
- **Taken from Kylie:**
  - the sticky buy bar
  - the swipe gallery with dots
  - hero text under the image on phones
- **Taken from GetLayers:** layouts (split hero, sticky numbered process, ruled trust row, 4/8 FAQ), the edge-wipe hover, the brand list with a floating packshot, the top-drop search panel, the blur-and-rise reveal, and the house easing. Its 3D scenes, preloaders and smooth scrolling were rejected for a shop.
- **Kept deliberately:** a light mega menu. Concern and skin-type routes are the main way to find products in a 21-SKU K-beauty range.

## 3. Shopify functionality: what was tested, and how

This environment could not open the storefront: its network policy blocks `moana-beaute.myshopify.com` and `cdn.shopify.com`. So testing was done in two layers.

1. **Against Shopify itself:**
   - Theme Check (Shopify's linter): **0 errors**. 2 warnings, both false positives.
   - All files uploaded to the preview theme.
   - Shopify accepted every template and section group. JSON templates are validated against the sections on upload.
   - File checksums on Shopify were compared with the local files: all match. `settings_data.json` is the only exception, because Shopify rewrites that file in its own format.
2. **Against a local preview** (`dev/`): the real theme files, rendered with the real catalogue, with Shopify's storefront endpoints emulated. **40/40 interaction checks pass:**
   - add from a card, then the drawer opens
   - quantity up and down, and remove
   - the free-delivery amount maths, and the unlocked state above Rs 1,500
   - product-page stepper, and the stock cap at 25
   - the over-stock error message
   - the sticky bar appears, hides, and steps aside for the footer
   - recommendations load
   - brand filter, price sort, clear all, browser back
   - predictive search with arrow keys
   - Escape and focus return
   - mega menu by keyboard
   - the phone menu's focus trap
   - no horizontal scroll
   - forms post to real Shopify routes, so they work without JavaScript

   **Width sweep:** 20 pages × 10 widths (320, 360, 375, 390, 414, 430, 768, 1024, 1280, 1440). No horizontal overflow, no console errors, every image has alt text and dimensions, one H1 per page, no skipped heading levels, no duplicate ids, standalone tap targets at least 24 px.

**Not tested, because the storefront was unreachable:**
- a real add to cart on Shopify
- the real checkout (MIPS card payments)
- Shopify's own predictive-search ranking
- which filters Search & Discovery actually exposes
- how the real product photos look in the new image wells

These need the live preview check below.

## 4. Technical quality

- **Lighthouse on the local preview, simulated mobile:**

  | Page | Performance | Accessibility | Best practices | SEO | CLS |
  |---|---|---|---|---|---|
  | Home | 95 | 100 | 100 | 100 | 0 |
  | Collection | 96 | 100 | 100 | 100 | 0 |
  | Product | 97 | 100 | 100 | 100 | 0 |

  Accessibility is also 100 on the routine guide, cart and contact pages. Performance figures from a local server are only indicative; measure on the real preview with PageSpeed Insights.
- **Weight:** one CSS file (41 KB) and one deferred JS file (27 KB), no libraries. Self-hosted fonts with `swap`, and only two preloaded. Responsive images with `srcset` and `sizes`; the hero image loads eagerly with high priority and everything below it lazily.
- **SEO:**
  - unique titles and descriptions, with fallbacks per template
  - canonical URLs, Open Graph and Twitter tags, and a 1200×630 sharing image
  - `noindex` on cart and search
  - BreadcrumbList structured data on products and collections
  - Product structured data from Shopify's filter
  - OnlineStore and WebSite (search action) structured data on the homepage
  - no FAQPage markup, since Google no longer shows FAQ rich results for shops
- **Accessibility:**
  - skip link, landmarks and headings
  - focus states everywhere
  - drawers and search trap focus and return it on close
  - Escape closes everything
  - live region announcements for cart changes
  - form errors tied to their fields
  - reduced-motion support
  - all text at least 4.5:1 contrast
- **Bugs found and fixed during QA:**
  - Empty price filters were sent as "Rs 0–0", so every filtered grid came back empty.
  - A slower, older filter response could overwrite a newer one.
  - The collection toolbar overflowed at 320–375 px.
  - Secondary text was 4.43:1 on Spring.
  - The card buttons' screen-reader names didn't match their visible words.

## 5. Outstanding issues and actions for the owner

1. **Check the preview on real Shopify before publishing.** Do a test order through MIPS on desktop and on a phone. I could not reach the storefront from here.
2. **Rename the store.** Shopify still calls it "My Store" (Settings → General). Checkout, emails and the browser tab on non-theme pages use that name. The theme uses a "Brand name" setting, so its own pages already say Moana Beauté.
3. **Add a Returns and refunds policy.** The Terms refer to one, but none exists in Settings → Policies. The returns wording on the site (7 days, unopened, hygiene exception, refund to card) comes from the previous site copy. Please confirm it is your policy, then add it as the Refund policy so it also appears at checkout.
4. **Delete obsolete files from the preview theme.** Shopify's API connector does not allow deleting theme files. Before publishing, delete these in the theme's code editor (Edit code); nothing references them:
   - sections: `about`, `brands`, `delivery`, `featured-launch`, `info-strip`, `kbeauty-auth`, `kbeauty-intro`, `kbeauty-routine`, `kbeauty-start`, `kbeauty-teaser`, `related-products`, `blank`
   - snippets: `brand-card`, `contact-form`, `mark-sprite`, `media-img`, `nav-items`, `product-grid`, `sticky-bar`, `wave`
   - assets: `shop.css`, `site.css`, `site.js`, `lockup-primary.svg`, `lockup-stacked.svg`, `lockup-white.svg`, `ph-hero-m.svg`, `ph-hero.svg`, `ph-square.svg`, `soon-*.jpg`, `favicon.svg`, `profile-mark-1024.png`
   - locales: `en.default.schema.json`
5. **Pantone codes.** The brand guide gives colour names only. Ask Disruptive Dodo for the official hex and Pantone values; the theme uses values sampled from the guide.
6. **Photography.**
   - The hero (dark wet leaves) and About (two women on a beach) images are carried over from the previous theme.
   - The "coming soon" images showed unbranded jars that could read as a Moana product line, so they are no longer used.
   - Brand-specific editorial photography would lift the homepage most.
   - Generating new images was not done without your approval.
7. **Optional, in the Search & Discovery app:**
   - add Tag filters (concern, skin type) to the filter drawer
   - set "complementary products" so the cart and product page can say "pairs with" instead of "you may also like"
8. **Reviews and newsletter.** Not added: there are no genuine reviews yet, and no confirmed email marketing workflow. Both slot in later.
9. **To see the reference sites and your storefront from this environment:** allow `moana-beaute.myshopify.com`, `cdn.shopify.com` and `www.rhodeskin.com` in the environment's network settings. Rhode could not be studied for that reason.

## 6. Readiness

**Not ready to publish yet. Close.**

Verified:
- The code passes Shopify's linter, was accepted by Shopify, and the uploaded files match their checksums.
- Every interaction works against an emulation of Shopify's endpoints with the real catalogue.
- Layouts hold from 320 to 1440 px.
- Accessibility scores 100.

Before launch:
1. Review the preview on Shopify (items 1 and 4 above).
2. Rename the store (item 2).
3. Publish the refund policy (item 3).
4. Do one test order with a real card.
