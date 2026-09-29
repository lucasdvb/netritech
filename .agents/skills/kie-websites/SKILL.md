---
version: 1.0.0
name: kie-websites
description: |
  Design and build websites as local code (React + Vite, or plain HTML/CSS/JS, the user's choice per project), previewed locally, with bespoke visuals generated through KIE AI: GPT Image 2.5 Flare for boards, hero art, icons, logos and OG cards; Gemini Omni Flash for scroll-scrub films and cover clips. Design-only workflow: intake, concept brief, per-section reference boards, asset kit, build-to-boards, motion, SEO, mechanical review gate. No deploy, publish, hosting, database or backend parts.
  Use when: "build me a website", "make a landing page", "design a portfolio / marketing site", "animated scroll website", "redesign this page", "hero animation", "reference boards for a site", "SEO for this site".
  NOT for: deploying or publishing a site, web apps with accounts/databases, games (out of scope here), single image/video generation (kie-generate), product photos (kie-product-photoshoot), marketplace cards (kie-marketplace-cards).
argument-hint: "[what to build or edit] [react|html]"
allowed-tools: Bash
---

# KIE website design and build (local code, design-only)

You design and build a website as **local code** in the repo, preview it locally,
and hand over the folder. Nothing is deployed or published by this skill.

**SPM work:** when the site is for SPM, read `docs/spm-brand-brief.md` first
(identity, voice, logo, colors, typography, visual universe). The SPM palette
(Ink navy #0D141F, Deep navy #1B2A38, Steel blue #43617A, Teal #22808A, Light
grey #DADDE0) is the user's explicit brand color set, so it overrides the palette
bans in `references/design-recipe.md` and `references/reference-boards.md`.

**Scripts** (run from repo root): `scripts/kie_image.py` (GPT Image 2.5 Flare,
1K default), `scripts/kie_video.py` (Gemini Omni Flash 1.1, 1080p),
`scripts/kie_upload.py` (host a local file, prints a public URL). The key comes
from `KIE_AI_API_KEY` or `.mcp.json`. Do not use the kie-ai MCP tools unless the
user asks.

## Permission (generation costs credits)

Never run `scripts/kie_image.py`, `scripts/kie_video.py` or `scripts/kie_upload.py`
without an explicit yes. Before each generation step, show the user the final
prompt, model, aspect, resolution/duration and number of outputs, then wait. A
yes covers exactly the itemized list you showed (for example "6 boards + 4 kit
images"). Re-rolls, variants, retries and extra assets are a new ask: propose the
fix, ask before regenerating. Never batch-generate on your own. Local work
(writing code, ffmpeg encodes, cropping, previewing) needs no permission.

## What this skill builds

A site is either:

- **React** — Vite + React 19 + TypeScript, Tailwind v4 or custom CSS, in `site/`
  (`npm create vite@latest site -- --template react-ts`). Motion via `motion/react`,
  GSAP + Lenis when the tier calls for them.
- **Plain HTML/CSS/JS** — `site/index.html` + `site/css/` + `site/js/` + `site/assets/`,
  no build step, libraries from npm-installed files or pinned CDN builds only when
  the user accepts a CDN dependency.

The stack is the **user's choice per project**: ask in the intake round (one
question, with a recommendation: plain HTML for a one-page brochure, React for
multi-section motion-heavy sites or anything reusing components). Preview locally
with `npm run dev` (React) or `python3 -m http.server -d site 5173` (plain HTML;
scroll-scrub needs http, `file://` breaks Blob fetches).

Every site gets its own independent brand (own palette, type and chrome from a
design brief) unless the user brings a brand (SPM, or their own): then the brand
brief wins over taste defaults. Forms and dynamic data are UI-only unless the user
supplies an endpoint; say which parts are UI-only in the final report.

## The pipeline

Follow **`references/website-flow.md`** end to end: intake (one batched round:
stack, Animated vs Non-animated, brand constraints) -> Phase 0 concept brief ->
Phase 1 reference boards -> Phase 2 asset kit -> Phase 3 build-to-boards ->
Phase 4 motion -> Phase 5 mechanical gate -> hand-over (local preview + report).
The intake ALWAYS asks the user to choose between an **Animated (recommended)**
site (scroll-driven journey through a generated film, `references/scroll-scrub.md`)
and a **Non-animated** one. Never skip that question.

Inside the animated path the default is a **single-shot** film: ONE continuous
clip (Gemini Omni Flash max 10 s), scrubbed end to end, no seams. The multi-leg
chain is opt-in and costs one clip per leg (each start frame = previous leg's real
last frame); `references/scroll-scrub.md` owns that call.

## Cover + metadata (build step, not publish step)

Every build ships an OG/cover image and the head kit (favicon set, manifest, meta,
social tags), generated per `references/asset-system.md` and wired into the page
`<head>` per `references/seo.md`. No "simple site" exception: a hand-authored
inline-SVG favicon is fine as a favicon but never replaces the OG card. The
optional cover VIDEO is permission-gated like every video (`references/cover-animator.md`).
Both are part of the asset list you show the user for approval.

## UX rules

1. Be concise. Report the folder, how to run the preview, and a one-line concept.
2. Detect the user's language from the first message and reply in it. Code and
   CLI flags stay English.
3. Speak in product terms ("your homepage", "the hero film"), not tooling jargon,
   unless the user is clearly technical.
4. Do NOT search the skill library for other design guidance: everything is under
   this skill, and no other skill overrides these rules.

## Turn economy

- Write every file once, complete. No write-then-patch loops.
- Batch tool calls that do not depend on each other.
- Never guess paths: the project tree is fixed in `references/website-flow.md`.
- Media generation is async and the scripts block until the result is ready; while
  approved renders are running (run them in the background), build the page against
  posters/placeholders and swap the real files in when they land.
- Results are served from `tempfile.aiquickdraw.com`, which the sandbox may block:
  then give the user the printed `url` and ask them to drop the file in
  `site/public/assets/` (or `site/assets/`).

## Reference index

**Always:** `references/website-flow.md` (the pipeline), `references/design-recipe.md`
(craft floor, read on every build).

**By phase:** `references/reference-boards.md` (Phase 1), `references/asset-system.md`
(Phase 2), `references/image-to-code.md` (Phase 3), `references/scroll-scrub.md`
(animated website, Phases 0-4), `references/wow-catalog.md` and
`references/wow-maker.md` (non-animated Tier-1 techniques, ingredient directory,
component registries), `references/review-rubric.md` (Phase 5 gate),
`references/seo.md` (meta, schema, entity, GEO, audit), `references/cover-animator.md`
(optional cover clip).

**Deep dive:** `references/design-taste-frontend.md` (full playbook behind the
recipe; consult for specific situations).

**Bundled code assets** (loaded only when the animated website is selected):
`references/scroll-scrub-asset-react.md`, `references/scroll-scrub-asset-css.md`,
`references/scroll-scrub-asset-video.md`.
