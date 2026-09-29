# Website flow (independent brand, phased pipeline, local code)

You are building ONE website as local code in `site/` (or the folder the user
names), previewed locally. Two stacks, chosen by the user per project:

- **React** — Vite + React 19 + TypeScript, Tailwind v4 or custom CSS.
- **Plain HTML/CSS/JS** — `index.html`, `css/`, `js/`, `assets/`, no build step.

This flow is design-only: no deploy, publish, hosting, database, auth or backend.
Forms and dynamic content are UI-only unless the user supplies an endpoint.

**SPM sites:** read `docs/spm-brand-brief.md` first. The user's brand (SPM palette
Ink navy #0D141F, Deep navy #1B2A38, Steel blue #43617A, Teal #22808A, Light grey
#DADDE0, plus the brief's typography and voice) is binding and overrides the
palette bans and the "design the brand for me" path below.

**Scripts** (run from repo root): `scripts/kie_image.py`, `scripts/kie_video.py`,
`scripts/kie_upload.py`. Key from `KIE_AI_API_KEY` or `.mcp.json`.

**Permission (hard rule).** Every generation step (boards, asset kit, storyboard,
film, cover clip, and any upload of a local file) is shown to the user first: final
prompt, model (GPT Image 2.5 Flare or Gemini Omni Flash 1.1), aspect,
resolution/duration, number of outputs. Wait for an explicit yes. The yes covers
exactly the list shown; re-rolls, variants and retries are a new ask (propose the
fix, then ask). Never batch on your own.

**KIE AI as the asset engine.** All bespoke visuals are generated per
`references/asset-system.md` (stills: GPT Image 2.5 Flare; motion: Gemini Omni
Flash 1.1). Generation is a build-time activity: the shipped site performs no
runtime generation and carries no KIE branding.

**Project layout.**

```
site/
  design-brief.md          Phase 0 contract
  refs/                    Phase 1 boards, rejects, raw clips, storyboards (never shipped)
  public/assets/           React: shipped media, served at /assets/...
  assets/                  Plain HTML: shipped media, referenced as assets/...
  src/                     React: main.tsx, App.tsx, components/, styles.css
  index.html, css/, js/    Plain HTML
```

Run every `npm` command from `site/`. Keep raw generations, unpicked candidates
and intermediates in `site/refs/`; only referenced, final files go in the assets
folder.

---

## THE PIPELINE: phases in order, artifacts + gates, no skipping

Every NEW build runs this machine. Each phase produces a named artifact the next
phase consumes. Do not reorder, merge, or skip phases: "simple" briefs are where
generic output happens. (Follow-up edits to an existing site do NOT restart the
pipeline: see "Small edits" at the bottom.)

### Before Phase 0: intake (ONE batched round of questions, then never again)

Put all questions in one message and never ask a second round.

1. **Stack, the user's choice.** React (Vite) or plain HTML/CSS/JS. Recommend plain
   HTML for a one-page brochure, React for multi-section motion-heavy sites or
   anything with reusable components.
2. **Animation, MANDATORY, ALWAYS ask.** Never skipped, even when the request
   seems to imply a choice, even for a "simple" site. Offer exactly two options:
   - **Animated (recommended)** -> `Animation mode: animated-website`: the
     scroll-scrub camera journey (the product default; mark it Recommended).
   - **Non-animated** -> `Animation mode: non-animated`: a well-crafted site with
     lighter/optional motion, no mandatory camera journey.

   If the request already leans one way, still ask, and point the Recommended
   marker at the implied option. Record the answer on the brief's `Animation mode`
   line. ONLY if the user is genuinely unreachable do you proceed on **Animated**
   and say so in one line.
3. **Brand constraints.** An existing brand to honor (colors, fonts, logo, photos,
   links; SPM: the brand brief) vs free rein ("design the brand for me"). What they
   don't have, you propose to generate: the identity kit and personalization ladder
   in `references/asset-system.md` (logo family, icon set, patterns,
   illustrations, state artwork). Free rein is the richer path, not the degraded one.
4. **Credits.** State in the same message the asset budget the plan implies
   (roughly: boards + kit images + film clips) so the user can trim it. The
   itemized prompt list follows in Phases 1-2, each needing its own yes.

You may drop question 3 when the brief already answers it. Questions 1 and 2 are
always asked.

### Phase 0: Concept (`site/design-brief.md`, BEFORE any code)

Write the brief (~40 lines). Every section mandatory; a generic line ("modern and
clean", "Inter", "blue accent") means the brief is not done:

- **Stack** — React or plain HTML, as chosen.
- **Design read** — one sentence: who is this for, what emotional register.
- **Concept spine** — a nameable narrative idea threading the whole page (e.g.
  "the site is a calibration instrument", "an archive dossier", "a stage").
  Pick from `references/reference-boards.md`'s spine list or invent better.
- **Delivery tier** — `cinema` (**default**: Lenis+GSAP, Tier-1 hero, scroll
  chapters, carries the animated website) · `spectacle` (briefs saying
  awwwards/webgl/immersive: cinema + WebGL/procedural 3D/scrub + custom cursor + a
  second beat) · `editorial` (calm/minimal/B2B: typography + imagery + bespoke
  chrome, micro-motion only). The animated website is the default Tier-1
  experience regardless of tier. `editorial` drops the scroll-scrub journey to
  micro-motion; treat choosing it as one of the "user explicitly asked for
  something other than an animated website" cases, not a default an ordinary
  B2B/minimal brief falls into on its own.
- **Locked palette** — exact hexes + a one-line defense. Hard bans (mechanical,
  gate-checked): (1) graphite/near-black + orange/amber/ember accent, (2)
  near-black + neon cyan/blue/green accent, (3) beige/cream + brass/clay/
  oxblood, (4) AI purple/violet glow, (5) the palette family of your previous
  build in this chat. Overridable only by the user's explicit brand colors (SPM
  counts). See `references/reference-boards.md` for what to reach for instead.
- **Locked type** — pairing from the recipe's tables (or the brand's own
  typography); serif only with a written brand justification.
- **`Animation mode` — MANDATORY explicit state, set from the intake answer.
  HARD STOP.** The brief MUST contain a literal line `Animation mode: <value>`
  and you may not leave Phase 0 without it. Only two values are legal:
  - **`animated-website`** (the recommended default): the scroll-scrub camera
    journey (**A4**), where the visitor's scroll plays a generated film with the
    semantic chapters reading over it. This value OBLIGATES you to also write the
    journey block into the brief NOW, before boards or generation: read
    **`references/scroll-scrub.md`** and add its **Journey shape** (`single-shot`
    default), **Journey** (chapters/scenes), **Camera architecture** (multi-leg
    only), **seam direction**, and **mobile framing**, plus one sentence on how
    the journey enacts the concept spine. `Animation mode: animated-website` with
    no journey block is an INCOMPLETE brief. On this value, do NOT shop the
    wow-catalog: the animated website IS the technique; the anti-convergence "no
    repeat" rule does NOT force you off it (differ on the OTHER five axes).
  - **`non-animated`** (from "Non-animated" at intake, or a request that clearly
    asked for it): a well-crafted site with lighter/optional motion and NO
    mandatory camera journey. Legal ONLY as the user's own choice: append the
    reason on the line, e.g. `non-animated: user picked Non-animated at intake`.
    Your own taste ("calm/minimal/B2B") is NOT a reason. On this value the site
    still clears the `wow-maker.md` craft floor; reach into
    **`references/wow-catalog.md`** for a lighter Tier-1 technique (named with its
    catalog ID) or run the editorial tier. Never ship a dead flat page.

  Either way, a passive autoplay loop is never the Tier-1 mechanic.
- **Section plan** — ordered, one layout family per section, no consecutive
  repeats, >=4 families for 6+ sections, eyebrow budget ceil(sections/3).
- **Asset plan** — the full kit per `references/asset-system.md` (hero visual,
  section plates, content imagery, custom icon set, logo/monogram, OG/cover; +
  scroll-scrub film for the animated website), each item with its prompt intent,
  aspect and count, so it can be approved as one itemized list.
- **CTA inventory** — every CTA named with its OWN interaction identity (no
  shared button style; see bespoke-chrome in `references/image-to-code.md`).

The brief is a contract: later phases may not silently contradict it. Edit the
brief first and say why.

### Phase 1: Reference boards (design the page as IMAGES)

Read **`references/reference-boards.md`** and execute it: ONE horizontal design
reference image PER SECTION via `scripts/kie_image.py` (16:9 or 3:2, 1K), one
committed combinatorial pick (theme paradigm, background character, typography
character, hero architecture, section system, 4 signature components, narrative
spine, second-read moment), composition anchor VARYING per board, palette locked
across all boards. Show the user the itemized board prompts and wait for the yes.
Boards land in `site/refs/`.

**Look at every board** (the saved file; if the result host is blocked, the user
reviews the printed URLs). For any that reads template-y, propose an escalated
prompt and ask before re-rolling (budget 2 re-rolls). The boards ARE the design:
do not start Phase 3 with a generic board in the set.

### Phase 2: Asset system (approved list, build while it renders)

Read **`references/asset-system.md`**. Present the ENTIRE kit as one itemized list
(hero visual with 2 candidates, section plates, all content imagery, the custom
generated icon set, the logo/monogram + favicon source, the OG/cover card, plus the
scroll-scrub film for the animated website) and wait for the yes. Once approved,
run the independent jobs concurrently in the background and build the page while
they render; download into the assets folder; check kit coherence when it lands
(anything whose grade fights the boards: propose a re-generation, ask first).
Never fall back to stock/picsum/CSS-only. For the animated website, follow
`references/scroll-scrub.md`'s film chain: independent stills may run together,
but exact-frame forward legs are intentionally sequential. The normal "run
everything at once" rule never overrides a real rendered-frame dependency.

### Phase 3: Build to the boards, section by section

Read **`references/image-to-code.md`** and follow its discipline per section:
re-read the board at build time, extract text/type-scale/spacing/color/component
logic, implement faithfully, anti-drift (when your habit disagrees with the board,
the board wins). The craft floor in **`references/design-recipe.md`** applies
everywhere (hero discipline, layout bans, copy rules, zero em-dashes). Bespoke
chrome: every CTA designed in its own component/element with its own interaction
identity; no site-wide button utility classes. Registry components
(`references/wow-maker.md` §5, React only) remain raw material, restyled to the
boards, never default-skinned. Build static-but-complete; motion is the next phase.

**HARD STOP for `Animation mode: animated-website`: build the journey as the
spine, not an afterthought.** The scroll-scrub scene media (Phase 2) and the
scroll-scrub component (React: `site/src/components/scroll-scrub/scroll-scrub.tsx`
+ `.css`; plain HTML: `site/js/scroll-scrub.js` + `site/css/scroll-scrub.css`, per
`references/scroll-scrub.md` Phase 3) ARE the page: the semantic chapters are the
page structure, not decoration added later. Materialize the component and wire the
real scene data in THIS phase. Do NOT build a generic static page of sections and
plan to "add the camera journey later": that is the exact failure this flow
guards against, and it is caught by the Phase 5 gate. If the film is still
pending approval or rendering, build the component against posters and swap the
clips in when they land; never substitute a plain static layout for the animated
website.

### Phase 4: Motion pass (tier-mandated, one focused pass)

- **cinema/spectacle:** Lenis smooth scroll bridged to GSAP ScrollTrigger
  (`autoRaf: false` + `gsap.ticker`; without the bridge, scrub stutters).
- The **Tier-1 hero mechanic** from the brief, fully executed: a half-wired
  version fails review. The hero is the wow carrier and it must respond to the
  USER'S INPUT (scroll plays the movie), never a passive autoplay loop.
- **Animated website (default):** the scroll-scrub film from
  `references/scroll-scrub.md` IS the hero mechanic. Let its controller own
  scroll-to-video time; keep the Lenis/GSAP bridge for surrounding motion, and
  never drive the same media with a second ScrollTrigger timeline. Only when the
  user explicitly asked for a non-animated treatment do you instead wire the
  chosen catalog technique, e.g. the single scroll-scrubbed hero film per
  `asset-system.md` §7.
- Scroll-chapter reveals: staggered headline builds (`split-type` + GSAP or
  registry text components), per-section distinct timing; work rows / cards with
  hover reveals; magnetic nav/CTA physics via `useMotionValue` (React) or
  transform-only pointer handlers (plain HTML), never per-frame state.
- **Screenshot-safe reveals (hard rule):** nothing waits at `opacity: 0` for an
  IntersectionObserver. Headline/text builds fire ON MOUNT (not viewport-gated);
  scroll-linked effects animate transform/scale/clip ONLY, never opacity-to-zero;
  hover states may use opacity freely. Ignore any `whileInView` fade-in examples
  in the ingredient libraries: they fail this gate. A full-page capture must show
  every section.
- **Pin-spacer trap:** a GSAP pinned hero injects a spacer that reads as a large
  blank band in full-page captures. Use `pinSpacing: false` with the following
  content sliding over the pinned layer, or otherwise verify there is no dead band
  after the hero.
- EVERYTHING `prefers-reduced-motion`-gated with static fallbacks. Browser globals
  (`window`, `document`, `matchMedia`) only inside effects/handlers.
- spectacle only: custom cursor + WebGL/procedural-3D/scrub second beat.

### Phase 5: Mechanical gate (before hand-over; every item fixed)

Run the grep checklist in **`references/review-rubric.md` §A**: placeholders;
em/en-dashes; banned palette families in tokens; eyebrow ration; unreferenced
generated assets (every kit file used); `h-screen`; browser-global safety; reduced
motion coverage; **repeated CTA classes**; **opacity-0 + whileInView**
combinations; section plan honored; animation-mode gate; copy self-audit. Then the
SEO audit in `references/seo.md`. This is a completion gate: do not hand over with
a failing item.

### Phase 6: Hand-over (local preview)

1. Start (or give the command for) the local preview: `cd site && npm run dev`
   (React) or `python3 -m http.server -d site 5173` (plain HTML). If `npm run build`
   is available, run it once to catch type/build errors.
2. Report: the folder, the preview command, a one-line concept statement, the list
   of generated assets (so the user knows what brand property they now own), and
   anything honestly skipped or UI-only.

There is no deploy, publish or hosting step in this skill. If the user asks for
one, say it is outside this workflow and that the folder is ready to hand to
whoever hosts it.

---

## Design references: read order

1. **`references/design-recipe.md`** — craft floor (ALWAYS read; short).
2. **`references/scroll-scrub.md`** — the **animated website**, the DEFAULT Tier-1
   experience: read it in Phase 0. It owns the specialized boards/assets/runtime
   sequence and bundled code references. Only read **`references/wow-catalog.md`**
   (Tier-1 technique menu + anti-convergence ledger + implementation contracts)
   when the user explicitly asked for something other than an animated website.
3. **`references/reference-boards.md`** — Phase 1: per-section design boards.
4. **`references/asset-system.md`** — Phase 2: the KIE asset kit.
5. **`references/image-to-code.md`** — Phase 3: faithful implementation + bespoke
   chrome + the CTA garment catalog.
6. **`references/review-rubric.md`** — Phase 5: the mechanical gate.
7. `references/wow-maker.md` — ingredient directory: motion/3D libs (§4),
   component registries (§5), signature effect patterns (§2), client-only pattern
   (§6). Only listed free/permissive sources may be used.
8. `references/design-taste-frontend.md` — the full deep-dive playbook behind the
   recipe; consult for specific situations, not required start-to-end.
9. `references/seo.md` — meta tags, OG/Twitter cards, robots/sitemap, JSON-LD,
   entity, GEO, audit.
10. `references/cover-animator.md` — optional short cover clip (permission-gated).

Do NOT search the skill library for other design guidance: everything is here.

| Task | Read |
|---|---|
| **Any website (the DEFAULT: animated website)** / scrollable world / continuous camera journey / diorama fly-through | `references/scroll-scrub.md` (film pipeline + code assets + mobile/QA contract) |
| SEO: meta tags, OG/Twitter cards, robots/sitemap, JSON-LD, entity, GEO, audit | `references/seo.md` |
| OG / cover image, favicon set | `references/asset-system.md` (items 6-7) |
| Short cover clip / hero reveal clip | `references/cover-animator.md` |

## Stack notes

**React (Vite).**
- `npm create vite@latest site -- --template react-ts`, then `npm i` and add only
  the libraries the brief needs (`motion`, `gsap` + `@gsap/react`, `lenis`,
  `split-type`, `three` stack for spectacle). Tailwind v4 via `@tailwindcss/vite`
  or a custom CSS token layer from the design brief.
- Client-side routing only if the site has several pages (`react-router`); a
  one-page site needs none. There is no server: no server functions, no API
  routes, no bindings. If the site needs SEO-critical multi-page HTML, prefer
  plain HTML or add build-time prerendering, and say so in the brief.
- shadcn/registry components are optional raw material (`references/wow-maker.md`
  §5); they need `components.json` and Tailwind.
- Custom Tailwind/CSS from the brief's token layer: no site-wide CTA utility
  classes.

**Plain HTML/CSS/JS.**
- Semantic HTML, one CSS token layer (`css/tokens.css`) from the brief, ES modules
  in `js/`. Libraries (GSAP, Lenis) come from `npm i` copied into `js/vendor/`, or
  a pinned CDN build if the user accepts it.
- The scroll-scrub controller is ported from the React asset to a vanilla module
  (`references/scroll-scrub.md` Phase 3).
- Multi-page: one HTML file per page sharing `css/` and `js/`; the sitemap lists
  each.

## Hard rules

### 1. Browser globals only in effects/handlers
Never touch `window`, `document`, `localStorage`, `navigator` or `matchMedia` at
module top level or during render (React), and never before `DOMContentLoaded`
(plain HTML). This keeps the code safe for build-time prerendering later and
avoids the #1 recurring crash in generated sites.

### 2. Same-origin, durable assets
Every asset the page uses lives in the site's assets folder and is referenced by
a relative/same-origin path. NEVER reference `tempfile.aiquickdraw.com` result
URLs or `kie_upload.py` URLs from the page: result links expire and uploaded
inputs are deleted after about 3 days.

### 3. No secrets, no generation at runtime
The KIE key never appears in site code or `refs/` notes. The shipped site makes no
calls to KIE and shows no KIE branding or "made with" badge. The user's brand is
the only brand on the page.

### 4. No fake backend
No in-memory "database", no `localStorage`-as-database, no fixture data presented
as live. Static content lives in typed constants or JSON files in `src/`/`data/`.
Forms are UI-only (client validation + a clear success state) unless the user
supplies a real endpoint, and the final report says so.

### 5. Independent, accessible, fast
One theme per page, one accent, `prefers-reduced-motion` fallbacks, `h-dvh` not
`h-screen`, image dimensions set, hero image preloaded, fonts self-hosted with
`font-display: swap`.

## Editing map
- Pages / routing → `site/src/App.tsx` + `site/src/routes/**` (React, only if
  multi-page) or `site/*.html` (plain).
- Components → `site/src/components/**` (React), custom per the boards; plain HTML
  keeps section markup in the page and behaviour in `site/js/`.
- Styles / theme → `site/src/styles.css` or `site/css/tokens.css`: a custom token
  layer from the design brief, no site-wide CTA utility classes.
- Media → `site/public/assets/**` (React) or `site/assets/**` (plain).
- Pipeline artifacts → `site/design-brief.md` (Phase 0) + `site/refs/*.png` (Phase 1).

## Verify

From `site/`, only when you need it: `npm install` (dependencies changed),
`npm run build` (React: catches type/build errors), then the Phase 5 gate and the
SEO audit. There is no browser step inside this sandbox: verify by reading code
and grepping; the user reviews the visual result in their own browser through the
local preview.

**Small edits to an existing site** (copy tweak, one component, styling fix): the
pipeline does not restart. Make the edit, re-run the relevant gate items.

**Before claiming a build done, no placeholders may remain**: no `<...>`-style
tokens, `lorem ipsum`, or scaffold blank-page markers (`REMOVE_THIS`, default Vite
template text, default favicon). Covered by the Phase 5 gate.
