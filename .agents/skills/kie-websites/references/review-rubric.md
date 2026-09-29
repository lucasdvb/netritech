# review-rubric — Phase 5 mechanical gate

§A runs BEFORE hand-over and is a completion gate, not a suggestion. Most items
are verified by grep/code inspection. **Item 9f is the hard machine gate for the
animated-website default: a website that ships without the scroll-scrub component
+ scene media (and without an explicit `non-animated` choice in the brief) FAILS, no matter
how polished the rest is** — this is the single most common miss, so run 9f every
time. For the animated website, item 9e adds its interactive runtime checks in the
local preview (run by the user; list them in the hand-over message). There is no
browser step inside the sandbox — this mechanical gate is the only automated
verification.

Paths below assume `site/`. `SRC` means `site/src/` (React) or
`site/*.html site/css site/js` (plain HTML); `ASSETS` means `site/public/assets/`
(React) or `site/assets/` (plain HTML).

## §A. Mechanical gate (pre-hand-over, code-level)

Check each item; fix every hit before handing the site over.

1. **Placeholders** — zero `<...>`-style tokens (e.g. `<brand name>`, `<product>`),
   `lorem`, `REMOVE_THIS`, scaffold default text, or empty `src=""`. Grep for the
   literal markers: `grep -rniE 'lorem ipsum|REMOVE_THIS|Vite \+ React|Get started by editing' SRC`,
   and scan for any remaining `<...>` placeholder tokens in quoted strings. The
   scaffold's default favicon, logo and page title must be gone.
2. **Em-dash ban** — `grep -rn "—\|–" SRC` over user-visible strings returns
   nothing (code comments exempt).
3. **Banned default palette** — none of the banned palette families from
   `design-recipe.md` §2 appear in `styles.css`/`tokens.css`/tokens: beige/brass/espresso
   hexes, graphite/near-black + orange/amber/ember accent, near-black + neon
   cyan/blue/green accent, AI purple/violet glow, or the palette family of your
   previous build in this chat. Overridable ONLY by the user's explicit brand
   colors (SPM's palette counts), justified in the design brief.
4. **Eyebrow ration** — count **eyebrow-position section labels only**. An
   eyebrow is a small uppercase/mono kicker sitting DIRECTLY above the
   section's display headline in the same column; nothing else counts. Must
   be ≤ ceil(sectionCount / 3). Uppercase mono in non-eyebrow roles (spec
   strips, table/metric captions, rail labels, footer column heads) is
   exempt — especially when the reference boards show them. Grep for
   `uppercase tracking` to find candidates, then classify by position.
5. **Asset kit complete + referenced** — every file saved into `ASSETS` is
   actually referenced by a route/component/page, and nothing in the page points
   at `tempfile.aiquickdraw.com` or a `kie_upload.py` URL (both expire); the hero
   references a real generated asset (no picsum/stock/CSS-gradient-only hero); the
   icon slots use the generated icon set (or the documented library fallback), and
   no kit item from `asset-system.md`'s "always" list is silently missing.
5b. **Head kit complete** — the full favicon/meta set from `asset-system.md`
   item 7 is present and wired: favicon (ico/svg + png sizes), apple-touch-icon,
   192/512 + maskable icons with a `site.webmanifest`, `theme-color`, and the
   full OG + twitter card block with absolute image URLs (`seo.md`). An empty
   `<head>` or the scaffold's default favicon is a gate failure.
6. **`h-screen`** — zero occurrences; use `h-dvh` / `min-h-dvh`.
7. **Browser-global safety** — no `window` / `document` / `localStorage` /
   `navigator` at module top level or in render (React), and none before
   `DOMContentLoaded` (plain HTML); every `[C]`/`[W]` component behind a mounted
   gate; `[W]` additionally `React.lazy`.
8. **Reduced motion** — every animation source (`motion/react`, GSAP, registry
   components, plain-JS observers) paired with a `prefers-reduced-motion` guard or
   static fallback.
9. **CTA integrity + bespoke chrome** — one label per intent page-wide (no "Get
   in touch" + "Contact us"); no CTA label longer than ~3 words for primaries;
   AND no shared site-wide button style: grep for a repeated CTA class string /
   `Button` utility component reused across sections — every CTA per the brief's
   inventory has its own component with its own interaction identity.
9b. **Screenshot-safe reveals** — flag any `opacity: 0` / `opacity-0` **whose
   removal depends on a viewport/scroll trigger** (`whileInView`,
   IntersectionObserver entry, ScrollTrigger-gated fade-ins). Hover-state
   decorations at opacity-0 are fine. Nothing may sit invisible waiting for a
   viewport trigger; animate from visible states (y-offset/blur) or fire on
   mount. Video elements need a `poster` (or a rendered first frame) so
   headless shots never show a black box. A full-page headless screenshot
   must show every section.
9c. **No tool branding, no runtime generation** —
   `grep -rniE "kie ai|gpt image|gemini omni|made with|powered by" SRC` returns no
   user-visible strings and no "Powered by / Built on" badge; no page code calls a
   generation API; the KIE key appears nowhere in `site/`
   (`grep -rn "KIE_AI_API_KEY\|api.kie.ai" site/` returns nothing). The user's
   brand is the only brand on the page.
9d. **Anti-convergence ledger honored** — the brief lists the previous
   build's six identity axes (palette family, type pairing, hero
   architecture, Tier-1 technique, CTA garments, corner language) and this
   build differs on ≥4; the rationed garments (drawing underline, hover
   flood-fill, framed block) appear at most once page-wide combined. On the
   `non-animated` path the Tier-1 technique carries a `wow-catalog.md` ID and is
   interactive (not a passive loop); on the default `animated-website` path the
   Tier-1 technique IS the scroll-scrub animated website (enforced by 9f) — a
   generic wow-catalog ID does NOT satisfy the default path.
9e. **Animated website — A4 scroll scrub (every website by default; skip only if
   the user explicitly opted out)** — verify every media segment has a
   first-frame poster extracted from the exact shipped clip; chapter copy is in
   the initial HTML in semantic document flow (not hidden until a viewport
   callback); `prefers-reduced-motion` performs no video fetch and shows the
   complete static story; desktop and lighter mobile encodes are wired;
   connector/leg handoffs use the neighboring rendered clips' ACTUAL boundary
   frames; camera velocity does not reverse accidentally; initialization runs only
   in an effect (or after `DOMContentLoaded`); and teardown aborts fetches, removes
   listeners/video nodes, cancels RAF, and revokes Blob URLs. Scrub videos directly
   from seekable MP4/Blob URLs, ensure any CSP `media-src` permits `blob:`, and
   ensure no second ScrollTrigger timeline drives the same media. Shipped clips
   carry no audio (`ffprobe` shows no audio stream). Have the user inspect each
   seam immediately before/after in both scroll directions and test source
   swapping, a fast mobile flick, and unmount/remount in the local preview (served
   over http, not `file://`).
9f. **Animation mode gate (machine-verifiable — HARD, every website).** This is
   the completion gate for the animated-website default; a site that passes every
   other check but this one is NOT done. Steps:
   1. `grep -n "^Animation mode:" site/design-brief.md` — there MUST be exactly
      one such line. Zero matches → FAIL (the brief never declared the state).
   2. If the value is **`animated-website`**, ALL of these must hold, or FAIL:
      - the scroll-scrub component exists — React:
        `ls site/src/components/scroll-scrub/scroll-scrub.tsx`; plain HTML:
        `ls site/js/scroll-scrub.js` — and is actually imported/loaded by the
        page (grep for its import / script tag);
      - real film shipped — at least ONE clip (`single-shot` ships exactly
        one; a `multi-leg` journey ships one per leg) under `ASSETS/**/*.mp4`,
        each with a first-frame poster (item 9e);
      - the brief carries the journey block (Journey scenes + Camera
        architecture A/B for multi-leg) written in Phase 0.
      A website on this path with no scroll-scrub component or no scene MP4s is
      the failure mode this gate exists to catch — do NOT hand it over; build the
      camera journey (film generation needs the user's yes, so ask for it).
   3. If the value is **`non-animated`**, the line MUST record the user's choice
      (an intake pick or a verbatim request). No scroll-scrub artifacts are
      required; instead confirm the site clears the `wow-maker.md` craft floor and
      any chosen `wow-catalog.md` technique is actually built (9d). A
      `non-animated` with no recorded user choice → FAIL (treat as
      `animated-website` and go back to step 2).
10. **Section plan honored** — the built page matches `site/design-brief.md`'s
    section plan (families, order, no consecutive family repeats). If the plan
    changed during the build, the brief was updated to match.
11. **Copy self-audit** — every visible string re-read; nothing grammatically
    broken, referent-unclear, filler-verb ("Elevate", "Seamless"…), or fake-precise
    (`92%`, `4.1×` without a source).
12. **No fake backend** — no in-memory "database", `localStorage`-as-database or
    fixture data presented as live; forms are UI-only unless the user supplied a
    real endpoint (and the hand-over says so).
