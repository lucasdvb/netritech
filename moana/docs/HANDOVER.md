# Moana Beauté: handover

October 2026 (v6). Store: `moana-beaute.myshopify.com`.

## Where things are

| | |
|---|---|
| New theme on Shopify | **Moana Beauté v2 (preview)**, id `191582306594`, **unpublished**. The live theme is untouched |
| Preview link | `https://moana-beaute.myshopify.com/?preview_theme_id=191582306594` (the storefront password may be needed first) |
| Theme editor | Shopify admin → Online Store → Themes → *Moana Beauté v2 (preview)* → Customize |
| Code | `moana/` in this repository (branch `claude/eloquent-bardeen-p6n61a`) |

## What changed in v6 (ideas 1, 17, 26, 33, 38, 41, 43, 44, 45)

1. **My skin diary** (`/pages/skin-diary`, new page):
   - **Checklist:** her routine as a morning and evening list she ticks off. The evening list leaves out sunscreen.
   - **Streak and history:** a "days in a row" streak, the last four weeks as a calendar, and a one-tap "how does my skin feel" log.
   - **Setting it up:** the routine comes from the quiz (Save to my skin diary) or she builds it from the catalogue.
   - **Storage:** everything stays on her phone (localStorage); nothing is sent anywhere.
   - **Shortcuts:** once she has a diary, the phone dock's Routine button opens it.
2. **Moana rewards** (`/pages/rewards`, new page):
   - **Where points show:** "Earn N Moana points" on product pages, "This order earns about N points" in the bag, a points chip in the header when signed in, and her balance on the Rewards page as a ring that counts up to her next reward.
   - **My proposed numbers:** 10 points per Rs 100, 500 points = Rs 250 off (about 5% back). These are a proposal for you to confirm or change in Theme settings → Moana rewards. Rewards can be switched off there too.
   - **How points get added:** the theme only *shows* points. They are read from the customer field **Moana points** (`moana.points`, now defined in Settings → Custom data → Customers). Two ways to fill it:
     1. **Shopify Flow** (free). Create a workflow: trigger *Order paid*, action *Update customer metafield* `moana.points`, value = current points + (order subtotal ÷ 100 × 10), rounded down. Redeem by giving the customer a discount code when she reaches 500, and subtract 500.
     2. **A loyalty app** (Smile, Joy, Rivo and others) that writes the balance to the same field, or swap the field name in Theme settings.
3. **Budget slider** in Find my routine: a fourth question (Rs 2k to Rs 6k, or no limit).
   - The estimate updates live as she drags.
   - The quiz then swaps in cheaper picks that cost the least fit until the routine fits, and shows the total.
   - It says so honestly when the shelf can't get under the budget.
4. **Kreol touches** (Theme settings → Voice, on by default):
   - **Where:** Bonzour / Bonswar greetings (skin diary, Rewards), "Mersi! Added to your bag.", "Pa bizin traka." in empty bags, "Byenvini" on welcome screens, and "Mersi!" on the sign-up confirmation.
   - **Before launch:** have the team check the wording.
5. **Morning / evening switch** on the routine section (home and K-beauty guide):
   - **What changes:** the section re-tints to dusk, the evening copy swaps in, and sunscreen steps out.
   - **When:** it opens on evening after 5pm Mauritius time.
   - **Settings:** each step has a "When" setting (morning, evening or both).
6. **Mega menu previews:** hovering a category, concern or skin type crossfades a product photo, the name and a line (description or product count) into the menu's feature area.
7. **Celebrations:** a light shimmer and a ring of sparks when free delivery unlocks, when a diary session is complete, and when a reward is waiting.
8. **Long-press on phones:** hold a product card for half a second for Save, Quick view and Add to bag. The press never opens the product.
9. **Pull to refresh on phones:** at the top of any page, pull down to draw a ring around the Moana wave mark (shown as supplied, only faded and scaled evenly), then let go to reload. The browser's own pull-to-refresh is switched off on phones so there is only one.

**Store data changed (reversible):** two pages (My skin diary, Moana rewards), both added to the footer Shop menu; a customer metafield definition `moana.points`.

## What changed in v5 (UI and UX)

Eight interface upgrades, chosen for the biggest jump in "wow" and ease of use. All respect reduced motion, add no layout shift, and move only position and opacity.

1. **Water ripple.** Moving the cursor over the hero and brand-story photos sends soft rings across them, like a fingertip on water. It uses WebGL and is built only on the first hover, on mouse and trackpad devices. Between gestures the real photo shows, so nothing renders while still.
2. **Card-to-product morph.** Opening a product from a card, the card's photo glides into the product page's main photo; going back, it settles into its card. Other page changes crossfade. This uses the browser's built-in view transitions (Chrome, Edge, Safari 18.2+); other browsers load pages as usual.
3. **Island skin forecast** (new homepage section, after the categories):
   - **What it shows:** today's peak UV, humidity and temperature for Port Louis, a one-line skincare tip, and Shop sunscreen / Light moisturisers buttons. The numbers count up and a marker slides along the UV scale.
   - **Data:** from Open-Meteo, cached for 30 minutes. It never asks for the shopper's location.
   - **If the data can't load:** a default tip shows in the same layout.
   - **Licence:** Open-Meteo's free service is for non-commercial use. Before launch, take their commercial plan and paste the API key into the section settings (Theme editor → Island skin forecast).
4. **Full-screen product gallery.** Tap any product photo:
   - **Phones:** swipe between photos, pinch or double-tap to zoom, drag to pan, swipe down to close.
   - **Desktop:** arrows, a thumbnail rail, click to zoom at the pointer, arrow keys and Escape.
5. **Quick view.** On desktop, hovering a product card shows a Quick view pill. It opens a glass panel with photos, price, skin types, a short description, Add to bag and Save. Adding closes the panel and opens the bag.
6. **Full-screen routine quiz:**
   - **Layout:** one question per screen, with big answer tiles. Each tile has a one-line description, editable in the section settings.
   - **Motion:** the wash behind it shifts colour with each answer, questions rise in, and the intro steps aside once she starts.
7. **Add-to-bag morph.** The button turns into a tick and "Added", the bag number rolls up, and the new line slides into the bag with a soft spring and a brief tint.
8. **Phone dock.** An app-style bar on phones: Home, Shop, Routine, Wishlist and Bag, with live counts. It is glass, hides while scrolling down and returns on the way up. On product pages it steps aside for the sticky Add to bag bar.

Also: Raleway's lining figures for counters; the footer watermark is drawn from CSS (purely decorative).

## What changed in v4

The brief: more scroll motion and background life, still elegant; more sales; and a golden-ratio type hierarchy in Raleway.

### Type
- **Every heading is now Raleway.** The brand book sets Instrument Serif for headlines; this departs from it at the owner's request. It can be reversed (see `DESIGN-SYSTEM.md`).
- **Sizes step by the golden ratio** (16, 20.4, 25.9, 32.9, 41.9, 53.3, 67.8 px).
- **Weight carries the hierarchy:** ExtraLight 200 for display, Light 300 for headings and section titles, Regular 400 for body, Medium 500 for interface, SemiBold 600 for buttons, labels and prices. Emphasis is Raleway italic in forest.
- **Fonts:** Raleway is now one variable file per style (roman and italic, weights 200 to 700), so the whole weight ladder costs one request. Instrument Serif is no longer loaded.

### Motion and background
Native CSS scroll timelines; no scroll listeners. Reduced motion and older browsers get a still page.
- **Scroll progress:** a forest hairline across the top.
- **Hero:** the hero now has depth as you scroll away. The photo drifts and zooms, the copy lifts, and the glass product rises faster.
- **Story photo:** a gentle parallax.
- **Packshots:** they float through their category and editorial tiles.
- **Ambient light:** soft Spring and Linen light pools drift behind the concern finder, brand story, FAQ and page headers.
- **Routine:** a line fills beside the five steps as you read them, and each number brightens in turn.
- **Brand ticker** (new section, between the routine and Shop by brand): the brands you stock, in two large rows that slide in opposite directions with the scroll. It reads the brand list from the catalogue.
- **Pointer sheen:** a soft highlight follows the cursor over glass cards and concern tiles.

### Selling
Nothing below invents a claim; each uses data the store already has.
- **Delivery dates:** "Order today, usually with you Mon 12 Oct to Wed 14 Oct". This is the existing 1 to 3 working-day promise turned into real dates: counted in Mauritius time, skipping weekends, and worded "usually" because public holidays and the dispatch cut-off are not known. It appears on product pages and in the bag.
- **Complete your routine:** on a product page, the next routine step (cleanser → toner → serum → moisturiser → sunscreen → cleanser). It offers the in-stock product that shares the most skin types, with a one-tap add. The order is a setting on the product section.
- **Recently viewed:** a rail on product pages and the cart, remembered on the shopper's device only.
- **Fly-to-bag animation:** considered and left out, because the bag drawer opens on every add and would hide it.

## What changed in v3

The brief for v3: get closer to **cultbeauty.co.uk**, speak to Mauritian women shopping for themselves (not suppliers), take Kylie Cosmetics' voice, use GetLayers sections, backgrounds, motion and glass, make the footer near-black, drop WhatsApp, and add pages that make sense for a shop.

**Studied, not guessed.** Cult Beauty was inspected live (homepage, Korean skincare category, a product page, at 1440 px and 390 px, plus its computed CSS) once `www.cultbeauty.co.uk` and `static.thcdn.com` were allowed. Kylie Cosmetics was read for voice. See `RESEARCH.md`.

### Layout, after Cult Beauty

- **Header**:
  - **Bars:** a grey service bar with four promises, then a forest promo bar that rotates two messages.
  - **Main row:** a real search field on the left, the logo in the centre, and a black **Find my routine** button with Wishlist, Account and Bag on the right.
  - **Navigation:** centred underneath, with the Skincare mega menu (categories, concerns and skin types with live counts, two cards).
  - **Scrolling:** the header turns to frosted glass and hides on scroll down.
  - **Phone:** a drawer with the same content.
- **Homepage**, in Cult Beauty's order:
  1. Thin promo strip carousel
  2. Split hero carousel: a light serif line over a bold uppercase line, a sentence, two square buttons, and the picture beside it. Slide 2 is the GetLayers WebGL wash with a product floating on glass.
  3. Shop by category tiles
  4. Tabbed product rails: What's new, Serums, Island sun
  5. What's new at Moana: editorial cards
  6. Second promo strip
  7. In focus: three concern cards
  8. The five-step routine on the GetLayers wash with glass cards
  9. Shop by brand tiles
  10. Shop by concern
  11. Brand story
  12. FAQ
- **Product card**:
  - a photo with a wishlist heart, the name, and one outlined badge, all from real data (sold out, % off, low stock, or NEW IN for 60 days after publishing)
  - a bold price and a full-width black **ADD TO BAG**
- **Collection page**:
  - a centred uppercase title, the description clamped to two lines with **Read more**, and the item count
  - sub-category and concern shortcuts
  - square filter boxes (each opens the filter drawer at that filter) and a square Sort box, on a glass toolbar
- **Product page**:
  - brand name large, then the title and **View product details →**
  - price and size, and the badge
  - quantity, then a forest-green **ADD TO BAG – Rs X**, then **Add to wishlist**
  - "In stock | At your door in 1 to 3 working days"
  - ruled promise rows
  - a grey band with the description on the left and accordions on the right (key ingredients, how to use, full ingredients, delivery and returns)
  - "You might also love", and a sticky bar with the green button
  - the gallery is two-up on desktop and a swipe gallery with dots on phones
- **Design tokens:**
  - **Shape:** square corners everywhere, as on Cult Beauty.
  - **Buttons:** near-black (Pantone Black 3 C).
  - **Section titles:** quiet, tracked, uppercase Raleway.
  - **Brand fonts and colours are unchanged.**

### Copy

- **Voice:** every page and both locales (English and French) are rewritten in Kylie Cosmetics' direct, friendly voice, kept warm and poised as the brand book asks. For example: "What's your skin asking for?", "Add to bag", "Nice! Your delivery is free."
- **Removed:** the "Supply Moana Beauté" and "Brands and distributors" blocks. The Brands page now asks shoppers which brand to stock next.
- **No new claims:** product copy paraphrases the real product descriptions. No reviews, bestseller labels, results or discounts were invented.

### GetLayers

| Piece | GetLayers source | Where |
|---|---|---|
| Footer | **Lumora** footer composition (inverted slab, rounded top, three ruled tiers, bleeding wordmark) and the **Clarix** glass sign-up field | Every page |
| Watercolour wash (WebGL2 gradient) | **Feather** gradient, shader unchanged, tinted to Spring, Khaki Linen and Sage | Hero slide 2, the routine section, the routine finder |
| Glass | House / Clarix treatment (translucent, 20–24 px blur) | Header on scroll, mega menu, routine steps, floating hero product, routine finder card, collection toolbar |
| Line reveal | Lumora text engine (each line rises from its own mask, 100 ms apart, 900 ms ease-out) | Section headings, footer |
| Blur-and-rise and unmask | Dantora / Halden presets | Hero slides, cards, tiles |

The wash only compiles when its section is about to be seen, renders at half resolution and 30 frames a second, pauses off screen, and becomes a still image under reduced motion or on machines without a GPU.

### Footer

- **Ground:** **Pantone Black 3 C (#212721)**, the green-black at the dark end of the logo green.
- **Sign-up:** "The Moana list" uses Shopify's own customer form (no app). It saves the email as a customer who accepts marketing.

### WhatsApp removed

WhatsApp is gone from the header, footer, contact page, product page, password page, structured data, theme settings and copy. Payment copy no longer names a processor ("Securely at checkout").

### New pages

- **Find my routine** (`/pages/routine-finder`):
  - three questions: skin type, main concern, and three or five steps
  - it picks one product per step from the real catalogue by its tags, with add-to-bag on each and **Add the whole routine** (one request, then the bag opens)
  - if nothing in stock fits a step, it says so and links to the category
  - answers never leave the page
- **Wishlist** (`/pages/wishlist`):
  - hearts on every card and the product page save products on the shopper's device (no account or app)
  - the page shows live cards (price, stock, add to bag) and suggests new-in products when empty
  - it is `noindex`

Both are linked from the header and from the footer's Shop column.

### Store data changed (all reversible)

- **New menu** `moana-nav` (header): New In, Skincare (with sub-categories), Cleansers, Toners & Essences, Serums, Moisturisers, Sunscreen, Brands, Routine guide.
- **Updated menu** `moana-footer-shop`: adds Find my routine and Wishlist.
- **New pages:** Find my routine, which has an SEO description, and Wishlist. Both are published, like the FAQ page.
- **Theme settings:** the WhatsApp fields are removed, and the product-page delivery note is reworded.

## Shopify functionality: what was tested, and how

1. **Against Shopify:**
   - Theme Check: **0 errors**. 4 warnings, all false positives.
   - All 108 theme files were compared by MD5 with the repository: **all match**. `settings_data.json` is the only exception, because Shopify rewrites its format; its content was checked line by line.
   - Shopify accepted every template.
2. **Against the local preview** (`dev/`): the real theme files, the real catalogue, and Shopify's endpoints emulated (cart, including multi-item adds, section rendering, predictive search, filters, recommendations).
   - `node dev/e2e.mjs`: **40/40** (cart drawer, quantities, free-delivery maths, stock cap, sticky bar, recommendations, filters, sort, predictive search, keyboard, focus traps, no overflow, no-JS forms).
   - `node dev/batch3-test.mjs`: **49/49**. Budget slider (label, live estimate, routine within budget, hand-off to the diary); skin diary (empty state, Byenvini, building, Bonzour/Bonswar, ticking, celebration, streak and calendar, feelings, evening list, opening on evening, dock shortcut); routine morning/evening (steps, dusk, copy, wash tint, opening on evening); mega previews; free-delivery celebration; rewards (guest, earning rule, signed-in count-up, ready message, header chip, product points); long-press actions; pull to refresh (arms, reloads, springs back); Kreol empty bag.
   - `node dev/ux-test.mjs`: **41/41**. Dock (shows, current page, hides and returns, opens the bag, hidden on desktop); add-to-bag morph, count roll and new line; quick view (hover pill, content, Escape, add and hand-off to the bag); view-transition wiring; gallery (open, arrows, swipe, zoom in and out, thumbnails, drag-down close, focus return); forecast with a simulated Open-Meteo reply and offline; quiz (descriptions, full height, intro, wash tint, result); ripple (built on hover, runs, fades, off under reduced motion).
   - `node dev/cro-test.mjs`: **11/11**. Delivery dates on the product page and in the bag, the weekend arithmetic (Friday, Saturday and Monday orders), next-step pick and add, and recently viewed (newest first, current product excluded).
   - `node dev/new-pages-test.mjs`: **11/11**. The quiz builds a five-step routine; Add the whole routine opens the bag with the products; arrow keys don't skip questions; hearts toggle; the header count updates; the wishlist page shows, removes and clears cards; no console errors.
   - `node dev/sweep.mjs`: 22 pages × 10 widths (320–1440). No horizontal overflow, no console errors, every image has alt text and dimensions, one H1 per page, no skipped heading levels, no duplicate ids.
3. **Lighthouse** (local preview, simulated mobile):

   | Page | Perf | A11y | Best practices | SEO | CLS |
   |---|---|---|---|---|---|
   | Home | 87–89 | 100 | 100 | 100 | 0 |
   | Skin diary | 87 | 100 | 100 | 100 | 0 |
   | Rewards | 87 | 100 | 100 | 100 | 0 |
   | Collection | 87 | 100 | 100 | 100 | 0 |
   | Product | 96 | 100 | 100 | 100 | 0 |
   | Find my routine | 87 | 100 | 100 | 100 | 0 |
   | Wishlist | 91 | 100 | – | noindex | 0 |

   Layout shift was traced to zero on every template:
   - metric-matched fallback fonts, so headings don't re-wrap when the web fonts arrive
   - space reserved for carousel dots and the Read more button
   - the wishlist decides its state while the page is still parsing

**Not tested, because it needs the real store:**
- the live weather call (the test environment blocks Open-Meteo; the section was tested against a simulated reply in Open-Meteo's documented format)
- the card-to-product morph on a real phone (Safari 18.2+ and Chrome)
- a real add to bag and checkout
- the payment provider you are about to add
- which filters Search & Discovery exposes
- how the real product photos sit on the new white cards
- the customer form saving a subscriber

Do these on the preview before publishing.

## Outstanding issues and actions for the owner

1. **Check the preview on real Shopify** on a phone and a desktop, and place a test order once the payment provider is connected.
2. **Payment provider.** Connect the Mauritian processor in Settings → Payments. The theme names no processor, so nothing needs changing in the theme.
3. **Rename the store.** Shopify still calls it "My Store" (Settings → General). Checkout and emails use that name.
4. **Add a Returns and refunds policy** in Settings → Policies. The site's returns wording (7 days, unopened, hygiene exception, refund to card) comes from the earlier site copy; please confirm it.
5. **Customer emails.** The footer sign-up saves subscribers as customers with marketing consent. Shopify Email (free tier) or another email tool can send to them; nothing is sent automatically.
6. **Delete obsolete files from the preview theme** in the code editor before publishing. The API connector cannot delete theme files, and nothing references these:
   - sections: `about`, `brands`, `delivery`, `featured-launch`, `info-strip`, `kbeauty-auth`, `kbeauty-intro`, `kbeauty-routine`, `kbeauty-start`, `kbeauty-teaser`, `related-products`, `blank`
   - snippets: `brand-card`, `contact-form`, `mark-sprite`, `media-img`, `nav-items`, `product-grid`, `sticky-bar`, `wave`
   - assets: `instrument-serif-*.woff2` (4), `raleway-normal-400-700-*.woff2` (2), `shop.css`, `site.css`, `site.js`, `lockup-primary.svg`, `lockup-stacked.svg`, `lockup-white.svg`, `ph-hero-m.svg`, `ph-hero.svg`, `ph-square.svg`, `soon-*.jpg`, `favicon.svg`, `profile-mark-1024.png`
   - templates: `collection.body-care.json`, `collection.gifts-sets.json`, `collection.hair-care.json`, `collection.makeup.json` (identical to `collection.json`)
   - locales: `en.default.schema.json`

   These v2 sections are no longer on the homepage but remain usable in the editor: `hero`, `service-strip`, `category-rail`.
7. **Photography.** Cult Beauty's homepage runs on campaign photography. The hero currently uses the two photographs from the previous theme, and the category and editorial tiles use product packshots. Brand or lifestyle shots in the editor (each hero slide, category tile and editorial card takes an image) would lift it most. No images were generated.
8. **Pantone codes.** The brand guide gives colour names only. The footer uses Pantone Black 3 C by request; ask Disruptive Dodo to confirm the other values.
9. **Optional, in Search & Discovery:** add Tag filters (concern, skin type) so they show as filter boxes on collection pages.

## Readiness

**Not ready to publish yet. Close.**

Verified:
- The code passes Shopify's linter, and every file on the preview theme matches the repository.
- Every interaction works against an emulation of Shopify with the real catalogue.
- Layouts hold from 320 to 1440 px, with zero layout shift and accessibility 100 on every template.

Before launch:
1. Review the preview on Shopify (items 1 and 6).
2. Connect payments and do one real test order (item 2).
3. Rename the store and publish the refund policy (items 3 and 4).
