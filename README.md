# Moana Beauté: Shopify theme v2

Theme, brand assets, local preview and QA tooling for **moana-beaute.myshopify.com**.

| Path | What |
|---|---|
| `theme/` | The Shopify theme (Online Store 2.0: JSON templates, section groups, Liquid sections and snippets, one CSS and one JS file) |
| `brand/` | The official logo files as supplied, plus size-optimised SVGs (`optimised/`) |
| `docs/` | `HANDOVER.md` (start here), `DESIGN-SYSTEM.md`, `RESEARCH.md` |
| `dev/` | Local preview server, interaction tests, width sweep, screenshots |
| `tools/` | Theme Check runner, logo optimiser, upload batch builder |

## Local preview (no Shopify access needed)

```sh
cd tools/node && npm install && cd ../..
./dev/restart.sh                 # http://localhost:4100
node dev/e2e.mjs                 # 40 interaction checks
node dev/new-pages-test.mjs      # 11 checks: routine finder and wishlist
node dev/cls.mjs /               # layout-shift sources on one page
node dev/sweep.mjs               # every page at 320–1440 px: overflow, errors, alt text, headings, ids
node dev/shoot.mjs /products/round-lab-1025-dokdo-cleanser 390   # one screenshot
node tools/node/theme-check.mjs theme                              # Shopify Theme Check
```

The preview renders the real theme files with liquidjs and the real catalogue (`dev/data/*.json`, exported from the Admin API). It emulates the cart AJAX API with section rendering, predictive search, recommendations, storefront filters and `?section_id=` rendering. Product photos are replaced by labelled placeholders because they are served from Shopify's CDN. It is a QA aid, not a substitute for checking the real preview.

## Deploying changes to the Shopify preview theme

The theme lives on Shopify as **Moana Beauté v2 (preview)** (id 191582306594, unpublished). Edit the files under `theme/`, then upload them in one of these ways:

- **Shopify CLI** (on a computer with Shopify access): `shopify theme push --theme 191582306594 --path theme`.
- **Admin API:** commit and push, then call `themeFilesUpsert` with `URL` bodies pointing at `raw.githubusercontent.com/<repo>/<commit>/moana/theme/<file>`. Upload in this order: snippets, locales, config and assets; then sections; then section groups, templates and layouts. Shopify validates templates against the sections that exist at that moment.

Never edit the live theme directly. Publish only after reviewing the preview.
