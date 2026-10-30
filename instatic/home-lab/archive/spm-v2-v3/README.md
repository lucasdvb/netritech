# SPM V2 and V3: archived copies

Saved on 2026-10-30, from the published site (https://spm.3dweb.disruptivedodo.mu/spmv2 and /spmv3), before both pages were removed from the site at the user's request.

Each folder holds:
- `index.html`: the page exactly as published.
- `assets/…/entries/`: the scripts that only this page used. V2 used `spm-*.js` and `superconscious.js`; V3 used `v3f-*.js`.
- `css/`: the four stylesheets the page loaded. `userStyles-*.css` is the page's own bundle; the other three are shared with the main site.
- `uploads/`: the images the page shows.
- `screenshot-desktop.jpg`: a full-page screenshot at 1440 px.
- `editor-source.html` and `editor-source.css`: the page as the Instatic editor held it (annotated HTML and its CSS), read just before deletion.

Not copied: the `hlab-*`, `sections-*`, `spx-*` and `spm-site-0-shell` scripts. Both pages loaded them, but they belong to the main site and are still in use there.

To view a copy, serve the folder and open `index.html`. The script and style paths point to `/_instatic/…`, so they need rewriting to `assets/` and `css/` (or a local server that maps them).

On the site (done 2026-10-30): both pages are deleted (/spmv2 and /spmv3 now return 404). The scripts and styles scoped only to them were emptied, because the Instatic connector cannot delete code files: V2 `spm-a11y`, `spm-faq`, `spm-feature-sweep`, `spm-footer-fx`, `spm-footer`, `spm-lazy-video`, `spm-lead-form`, `spm-logos`, `spm-scroll`, `spm-seo`, `spm-teams`, `superconscious.js/.css`; V3 `v3f-fs`, `v3f-hero-scroll`, `v3f-review`, `v3f-spm-a11y`, `v3f-spm-feature-sweep`, `v3f-spm-footer-fx`, `v3f-spm-footer`, `v3f-spm-lazy-video`, `v3f-spm-scroll`, `v3f-spm-seo`, `v3f-spm-teams`, `v3f-tm2` and the V3 stylesheets `v3f-buttons`, `v3f-fs`, `v3f-hero`, `v3f-logo-grid`, `v3f-mobile`, `v3f-review`, `v3f-styles`, `v3f-tm2`. Delete them by hand in the Instatic editor, with the empty `spm-site-0-shell.js` and the four disabled stubs (`spm-almanac`, `spm-colonnade`, `spm-spotlight`, `spm-review-parallax`).

Kept on purpose: `v3f-buttons.js`, `v3f-hero-nav.js`, `v3f-sections.js`, `v3f-shell.js/.css`, `v3f-spm-chrome.js`, `v3f-spm-faq.js`, `v3f-spm-lead-form.js` and `v3f-spm-logos.js`. Despite the name, they are also scoped to the inner pages (Solutions, Pourquoi SPM, Clients, Secteurs, Actualités, Carrières, Contact).
