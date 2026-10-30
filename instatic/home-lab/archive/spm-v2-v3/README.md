# SPM V2 and V3: archived copies

Saved on 2026-10-30, from the published site (https://spm.3dweb.disruptivedodo.mu/spmv2 and /spmv3), before both pages were removed from the site at the user's request.

Each folder holds:
- `index.html`: the page exactly as published.
- `assets/…/entries/`: the scripts that only this page used. V2 used `spm-*.js` and `superconscious.js`; V3 used `v3f-*.js`.
- `css/`: the four stylesheets the page loaded. `userStyles-*.css` is the page's own bundle; the other three are shared with the main site.
- `uploads/`: the images the page shows.
- `screenshot-desktop.jpg`: a full-page screenshot at 1440 px.

Not copied: the `hlab-*`, `sections-*`, `spx-*` and `spm-site-0-shell` scripts. Both pages loaded them, but they belong to the main site and are still in use there.

To view a copy, serve the folder and open `index.html`. The script and style paths point to `/_instatic/…`, so they need rewriting to `assets/` and `css/` (or a local server that maps them).

On the site: both pages were deleted. Their own scripts (`spm-*`, `superconscious`, `v3f-*`) were emptied, because the Instatic connector cannot delete code files. Delete them by hand in the Instatic editor, along with the empty `spm-site-0-shell.js`. Before removal, nothing on the main site linked to /spmv2 or /spmv3.
