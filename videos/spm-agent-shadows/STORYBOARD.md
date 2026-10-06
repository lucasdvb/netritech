---
format: 1920x1080
duration: 8s
message: "Behind every SPM agent is AI that works alongside them"
arc: Establish → Rise → Scan → Agents rise → Drain → Dive → Grid
audience: support, admin and sales leaders landing on the SPM site
mode: collaborative
fps: 30
---

# SPM — Agent Shadows (v2)

## Changes from v1

- User: "I don't think interface panels and charts, lens flare or neon should be banned." Bans lifted; all three now have a defined role (UI panels as the agents' work, a restrained anamorphic flare at two moments, teal neon on agents, scan and ribbons).

## Decisions

- **Message:** Behind every SPM agent is AI that works alongside them. Humans stay the heroes; AI is their shadow, never a replacement.
- **Format:** 1920×1080, 8.0 s, 30 fps, silent (no voiceover, no music). Scroll-scrub hero: the site's headline sits centre-lower over the film; no text inside the film.
- **Spine (hero prop):** the woman's headset microphone. The scan starts from it, the first ribbon leaves from it, the camera dives into her agent, and the ribbons converge to one point of light that becomes the centre of the grid.
- **Built from:** the edited team photo (real people), an empty-room plate (same frame, people removed), local person mattes. Everything else (edges, point cloud, agents, ribbons, rings, bokeh, grid) is drawn in code, seeded and deterministic.
- **Layers (2.5D):** room plate → people → laptop lids (in front of hands) → line/point FX → agents → ribbons → dust/bokeh → grade.
- **Brand:** Ink navy #0D141F (background, end state), Bleu Ardoise #1B2A38, Steel blue #43617A (depth only), Teal #22808A (the only glow colour, agents), blue-white #DCEBF2 (linework, scan, ribbons), Gris Perle #DADDE0, Blanc brume #F9FAFB.
- **Bans:** no robots, mannequin or android faces; no purple or off-brand colours; no glitch; no motion-blur streaks (every frame must work as a still for scroll); no pure #000/#fff; nothing busy in the centre-lower headline zone.
- **Interface panels and charts (allowed, v2):** small frosted-glass panels in brand colours float beside each agent as its work: a live call card (voice waveform + timer), a ticket/CRM card that resolves with a check, a rising CSAT/sentiment bar chart. Micro-labels only as UI texture, never readable headlines; kept above and beside the agents, out of the centre-lower zone.
- **Lens flare (allowed, v2):** one restrained anamorphic teal-white flare, twice: at the scan's birth on the woman's microphone, and at the ribbons' convergence point.
- **Neon (allowed, v2):** teal #22808A pushed to a neon glow on the agents' edges, the scan line and the ribbon tips; brand teal only, no other neon hues.
- **Motion failures to avoid:** the slideshow (each beat a new card) and the screensaver (pretty motion that says nothing). One continuous camera, one direction: left-to-right, then down and in.
- **Held frames:** a 0.3 s breath when all three agents stand (the line lands), and the final 0.4 s locked on the grid (scroll end state).
- **Truthfulness:** the three people and the room are the real (edited) photo; the agents, data and grid are illustrative.

## Frame 1 — Establish

- scene: The exact first frame; the camera glides slowly right along the row with real parallax
- duration: 1.4s
- poster: 0.7
- transition_in: cut
- status: outline
- src: index.html
- rules: multi-phase-camera, depth-of-field-blur
- seam_out: continuous camera (no cut)

0.0–1.4 s. Opens pixel-identical to the first frame. A slow eased glide to the right and a slight push-in: the laptop lids (front layer) slide fastest, the people next, the room plate slowest. The team is alive in the only way a still can be: a faint breathing scale on each person. Constraint: no zoom-only "Ken Burns"; the parallax must be visible. Why: establishes real people doing real support work before any AI appears.

## Frame 2 — Rise

- scene: Crane rise over the row to a high three-quarter view
- duration: 1.2s
- poster: 2.0
- transition_in: continuous
- status: outline
- src: index.html
- rules: multi-phase-camera, 3d-camera-flight
- seam_out: continuous camera

1.4–2.6 s. The camera keeps drifting right while it lifts: layers slide down at different rates, a gentle downward tilt in perspective, the desk stretching away. Ends framed so the dark wall and screen behind the people fill the upper frame, ready for the agents. Constraint: no wobble, no handheld shake. Why: the lorry's crane reveal; gives the agents room to rise.

## Frame 3 — Scan

- scene: A thin blue-white scan line leaves the woman's microphone and sweeps down the row
- duration: 0.9s
- poster: 3.1
- transition_in: continuous
- status: outline
- src: index.html
- rules: svg-path-draw, center-outward-expansion, ambient-glow-bloom
- seam_out: continuous

2.6–3.5 s. A restrained anamorphic teal-white flare blooms on her microphone, and a hairline neon scan front (soft glow on the leading edge) ripples outward from it, front to back along the row. Behind it: glowing edges trace every silhouette, rows of tiny dots sit on clothes and hair, and each headset shows an X-ray outline. The photo stays visible underneath. Constraint: one thin line, never a thick light bar. Why: the moment SPM's technology "sees" the team.

## Frame 4 — Agents rise (hero)

- scene: Three teal agents, each built from its person's own silhouette, rise behind them; ribbons link mic to agent
- duration: 1.4s
- poster: 4.6
- transition_in: continuous
- status: outline
- src: index.html
- rules: depth-scatter-assemble, svg-path-draw, ambient-glow-bloom, stat-bars-and-fills, spring-pop-entrance
- seam_out: continuous

3.5–4.9 s. Staggered 0.25 s apart (woman, bald man, young man), a teal figure rises from behind each chair: the person's own outline scaled up a head taller (ponytail, beard, curls all readable), built from point-cloud dots and horizontal contour slices like a 3D scan, its core brighter than its edges. Silk ribbons, blue-white with tapered glowing tips, arc from each headset microphone to its agent; small packets of light travel both ways. As each agent completes, 2–3 frosted-glass panels pop in beside it and data rides the ribbons into them: the woman's agent gets the live call card (waveform + timer), the bald man's the ticket/CRM card resolving with a check, the young man's the CSAT bar chart rising (support, admin, sales). Agents' edges carry a teal neon glow. 0.3 s held breath when all three stand. Constraint: no faces drawn on the agents, no robot features; panels never in the centre-lower zone. Why: the message, stated visually: every person has AI working alongside them.

## Frame 5 — Drain

- scene: The daylight drains away; only wireframe people, glowing agents and ribbons remain on navy
- duration: 1.0s
- poster: 5.6
- transition_in: continuous
- status: outline
- src: index.html
- rules: theme-crossfade-morph, ambient-glow-bloom
- seam_out: continuous

4.9–5.9 s. The photo layers desaturate and fall to Ink navy from the edges inward while the panels stay lit, now glowing against the dark; the desk becomes a glossy black mirror faintly reflecting the agents; fine dust drifts like a night sky. The centre-lower zone is dark from here on. Constraint: no flicker, one smooth grade move. Why: the lorry's warm-world-to-wireframe drain; hands the frame to the AI layer.

## Frame 6 — Dive

- scene: The camera dives into the woman's agent; rings and bokeh inside; ribbons curl inward
- duration: 1.1s
- poster: 6.5
- transition_in: continuous
- status: outline
- src: index.html
- rules: 3d-camera-flight, depth-of-field-blur, center-outward-expansion
- seam_out: continuous

5.9–7.0 s. A decelerating push into her agent's chest, through its lattice of lines (they sweep past the lens and soften out of focus). The panels sweep past the lens on either side. Inside: large soft bokeh discs, a pair of hairline concentric rings ripple outward like a voice, and the ribbons from all three people curl in from the frame edges toward one point just above centre. Constraint: no tunnel or portal effect. Why: the viewer goes inside the AI.

## Frame 7 — Grid

- scene: Ribbons converge and fade; the hairline SPM grid fades up and holds
- duration: 1.0s
- poster: 7.8
- transition_in: continuous
- status: outline
- src: index.html
- rules: svg-path-draw, ambient-glow-bloom
- seam_out: end (hold)

7.0–8.0 s. The ribbon tips meet in a soft point mirrored on a glossy floor, marked by the second anamorphic flare, then ribbons, dots and dust fade while the grid (the supplied last frame) fades up behind them. 7.6–8.0 s holds pixel-identical to the last frame. Constraint: nothing left over in the final frame. Why: a calm, dark stage for the website headline and the scroll's end state.

Total: 1.4 + 1.2 + 0.9 + 1.4 + 1.0 + 1.1 + 1.0 = 8.0 s.
