# Disruptive Dodo inner pages: working folder

- `current/`: byte-exact backup of the live Instatic code assets (sha256-checked) before the premium redesign.
- `drafts/`: the plain-HTML copy mockups from drafts.disruptivedodo.mu (assets ignored).
- `build/`: local tooling.
  - `serve.js`: local stand-in for the Instatic site (`SRC=current|out node build/serve.js`, port 8787).
  - `shoot.js` + `sheet.py`: Playwright frames down a page, and contact sheets of them.
  - `gl-port.js`: ports a GetLayers gradient (gl/<id>.html, not committed) into a mount function, shader and motion untouched.
  - `mono.js`: greyscale CONFIG tint that keeps each gradient's tonal structure.
- `out/`: the new code assets, uploaded to the site.
