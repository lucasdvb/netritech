# Marketplace rules and compliance

Working rules used to build and check cards. Marketplaces change their policies: tell the user to confirm the current seller guidelines for their category before uploading, especially for regulated categories.

## 1. Main image

The main image is the search-result thumbnail. It must be the most conservative card.

| Rule | Amazon | Walmart | eBay | Etsy | Shopify / DTC |
|---|---|---|---|---|---|
| Background | pure white (RGB 255,255,255) | white or very light, clean | white recommended | any clean, listing-first | brand choice, consistent |
| Product share of frame | fills about 85% or more of the frame | fills most of the frame | fills most of the frame | free | free |
| Text, logos overlays, badges, watermarks | none (only the product's own packaging) | none | none | avoid | avoid on main |
| Props / extras not sold | none | none | none | allowed if styled | allowed |
| People / mannequins | none on most categories (apparel has own rules) | none on most | avoid | allowed | allowed |
| Ratio | `1:1` | `1:1` | `1:1` | `4:3` recommended (`5:4`) | `1:1` or `4:5` |
| Long-side pixels wanted | 1000 min, 2000+ enables zoom | 1000+ | 500 min, 1600 recommended | 2000+ | 2000 recommended |

- `other` marketplace or unknown: apply the Amazon column (strictest), tell the user.
- Show the product in its retail state, complete and uncropped, front or best three-quarter angle, sharp, evenly lit, natural soft shadow only if the marketplace allows it (a faint contact shadow is generally tolerated; no floor reflections or drop-shadow graphics on Amazon).
- Never show accessories, gifts or bonuses that are not included in the sale.
- Resolution: `-r 1K` gives roughly 1000 px on the long side, enough to meet a 1000 px minimum but not the 2000 px zoom threshold. When the marketplace wants more, tell the user and propose `-r 2K` in the permission step; do not upscale silently.

## 2. Secondary images

Secondary cards (slots 2–7/9) may use text, callouts, icons, lifestyle and people.

- Keep the product recognizably identical to the main image (same shape, color, label).
- Text must be legible at thumbnail size (about 300 px): large, high-contrast, short.
- No competitor logos, no marketplace logos, no third-party trademarks, no fake "Amazon's Choice / Best Seller / #1" badges, no star ratings, no review counts, no price or discount graphics on Amazon (they change and are prohibited), no shipping promises.
- Keep 5% safe margin; nothing important within it.
- `multi_angle`, `detail_shot`, `whats_in_box`: show only what the product truly has and includes.

## 3. A+ / enhanced content modules

| Module | Aspect for `-a` | Crop target (typical) |
|---|---|---|
| Header / hero banner | `21:9` | 970×300 or 1464×600 (crop centered) |
| Standard image + text module | `16:9` | 970×600 |
| Comparison / feature grids | `16:9` | 970×600 |
| Square tiles | `1:1` | 300×300 or 600×600 |

Render with the generation aspect, then crop/scale with `ffmpeg` (`-vf "crop=...,scale=W:H"`) to the exact size. Confirm current module sizes in the seller portal.

Text in A+ modules: headline plus one to three short lines; the copy comes from `product_context` only.

## 4. Claims policy

- Only state what the user provided or what is printed on the product photo: features, dimensions, materials, ingredients, quantities, usage steps, certifications, guarantees.
- Never invent: statistics ("97% agree"), clinical results, awards, certifications (organic, FDA, CE, "dermatologist tested"), testimonials, star ratings, "#1", before/after results, competitor comparisons with named brands, environmental claims.
- Regulated categories (supplements, cosmetics, food, baby, medical, kids' products, electronics with safety marks): no disease, treatment, cure or medical-benefit claims unless the user supplies compliant, approved wording; ask them to confirm it is permitted on the marketplace.
- `aplus_efficacy` and `aplus_endorsement`: if the user gave no data or quotes, replace them by qualitative benefit statements the product truly supports, or skip the asset and say why. Never fabricate a person, quote, logo or number.
- Units and language: use the units and language of the listing's market.

## 5. Compliance checklist (run on every card)

Main image:
- [ ] Background is pure white (Amazon) / clean and light, no gradient, no visible floor line.
- [ ] Product complete, uncropped, about 85% of frame, centered, sharp.
- [ ] No text, badge, watermark, extra logo or prop; only the product's own printed label.
- [ ] Product label text and colors match the reference photo.
- [ ] Ratio and resolution meet the marketplace row above.

Secondary and A+:
- [ ] Product identical to the main image.
- [ ] Every on-image word matches the approved copy character for character; spelling correct.
- [ ] Text readable at thumbnail size, inside safe margins.
- [ ] No prohibited graphics (badges, ratings, prices, competitor marks) and no invented claims.
- [ ] Hands, anatomy, scale and physics plausible.
- [ ] Visual system (palette, fonts, icon style) consistent with the rest of the set.

If any item fails: state the failed item, the fix line to add to the prompt (or an image-to-image edit call, "keep everything, change only ..."), and ask before spending another generation.
