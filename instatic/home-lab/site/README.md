# Home Lab becomes the SPM homepage (2026-10-17)

## What changed

**Homepage**
- The Home Lab page is now the homepage: slug `index`, address `/`.
- Its page title (the raw `<title>`) is the SEO title already approved:
  "Externalisation service client, back-office et recrutement | SPM".

**Hero**
- Desktop: the headline is 40vw wide, so "une" starts the third line, clear of the orb.
- Mobile and tablet (< 1024px), a new layout:
  - Orb stage: the headline sits at the top under the menu, the 3D figure is free in the middle, and the copy and button are anchored at the bottom.
  - Brain stage: the sentence wraps the figure, from top left to bottom right.
  - Short phones and phones held sideways have their own rules.
- Portrait screens: the orb sits further back (camera at least 7.2) so it fits between the text blocks. This lives in `../perf/build.py`, scene file.

**Links**
- Menu, mobile drawer, footer, cards and buttons now point to the real pages:
  - The menu pages: `/solutions`, `/pourquoi-spm`, `/clients-partenaires`, `/secteurs`, `/actualites`, `/carrieres`.
  - Contact buttons: `/contact`. Phone: `tel:+33481659845`.
  - The Solutions sub-items and the team cards: `/solutions#s1` … `#s6`.
- The static menu and footer in the page markup were updated too, so crawlers that don't run JavaScript see the same links.
- The drawer logo no longer links to `/spmv3`.

**Inner pages (one site)**
- The inner pages now use the homepage's own menu, contact form, FAQ and footer:
  - `src/hlab-0-shell.js` builds the shell; it is named so it runs before the other hlab scripts.
  - `src/hlab-x9-shell.css` holds the three rules that only make sense on inner pages.
- The hlab scripts are split by where they run:
  - Site scripts (menu, drawer, buttons, reveals, FAQ): any page except V2 / V3.
  - Homepage-only scripts: `/` (and `/home-lab`).

**SPM V2 / V3: kept, but separate**
- Nothing on the site links to them.
- The V3 files that also served the inner pages (`v3f-shell`, `-buttons`, `-spm-chrome`, `-hero-nav`, `-spm-faq`, `-spm-lead-form`, `-spm-logos`, `-sections`) now return early off `/spmv3`. V3 itself is unchanged.
- V2 and V3 get `noindex, nofollow` (`spm-seo.js`, `v3f-spm-seo.js`), so they don't compete with the homepage in search.

## Files

| Path | What it is |
|---|---|
| `make.py` | Generates `out/<file>` and `patches.json` (exact replacements, with before and after hashes). |
| `base/` | The Instatic text before this round (for the line-diffed hero files). |
| `src/` | New or rewritten files: the shell script, the shell CSS, the hero CSS. |

## Rollback

- Each patch in `patches.json` is reversible: swap `oldText` and `newText`.
- The `from` hash is the version to return to.
- Make `/home-lab` the page slug again to undo the homepage move.

## Live check after publishing (2026-10-17)

- `/` serves the homepage, with the 3D scene running in the background worker.
- `/home-lab` now returns 404.
- The inner pages each show one menu (the site's own), with no V3 classes, a working form and a working FAQ.
- `/spmv3` still works as before.

Lighthouse from this sandbox, which is about 212 ms from the server:

| Run | Performance | Every other category |
|---|---|---|
| Mobile (5 runs) | 73 (outlier), 83, 85, 87 | 100 |
| Desktop | 96, 97 | 100 |

That is the same range as before this round (mobile 82 / 88, desktop 96).
