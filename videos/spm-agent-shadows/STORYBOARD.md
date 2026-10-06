---
format: 1920x1080
duration: 8s
message: "Behind every SPM agent is AI that works alongside them"
arc: Establish → Rise → Scan → Agents rise → Drain → Dive → Grid
audience: support, admin and sales leaders landing on the SPM site
mode: collaborative
fps: 30
---

# SPM — Agent Shadows (v3, 3D lorry structure)

## Changes from v2

- User: "It needs to be the SPM version of the truck video. Dynamic. Camera angles, camera motion and graphics that just work. Not just a simple wireframe transition."
- User chose: all code, real 3D (Three.js / React Three Fiber). The photo becomes a 3D relief; at the scan the team becomes a 3D point cloud and the camera breaks free to reveal a whole floor of SPM teams, like the lorry yard.

## Changes from v1

- User: "I don't think interface panels and charts, lens flare or neon should be banned." Bans lifted; all three now have a defined role (UI panels as the agents' work, a restrained anamorphic flare at two moments, teal neon on agents, scan and ribbons).

## Decisions

- **Message:** Behind every SPM agent is AI that works alongside them. Humans stay the heroes; AI is their shadow, never a replacement.
- **Format:** 1920×1080, 8.0 s, 30 fps, silent (no voiceover, no music). Scroll-scrub hero: the site's headline sits centre-lower over the film; no text inside the film.
- **Spine (hero prop):** the woman's headset microphone. The scan starts from it, the first ribbon leaves from it, the camera dives into her agent, and the ribbons converge to one point of light that becomes the centre of the grid.
- **Built from:** the edited team photo (real people), an empty-room plate (same frame, people removed), local person mattes. Everything else (edges, point cloud, agents, ribbons, rings, bokeh, grid) is drawn in code, seeded and deterministic.
- **3D world:** the hero photo rebuilt as depth-relief meshes (room plate, desk, each person at their own depth with body bulge); a large procedural office floor of SPM desks (wireframe desks, monitors, chairs) with seated figures as point clouds; one teal agent per figure; ribbons as glowing tubes; floating UI panels; glossy floor; bloom.
- **Lorry mapping:** side-on golden truck → hero team low track; crane rise past foreground containers → crane rise past a near glass mullion and panels; high oblique yard of trucks → high oblique floor of SPM teams; wireframe spreading truck to truck → scan spreading desk to desk with agents rising; world drains → world drains; top-down dive onto the truck → top-down dive onto the hero desk; smoky ribbons swirl to centre with reflection → same; grid → supplied grid frame.
- **Brand:** Ink navy #0D141F (background, end state), Bleu Ardoise #1B2A38, Steel blue #43617A (depth only), Teal #22808A (the only glow colour, agents), blue-white #DCEBF2 (linework, scan, ribbons), Gris Perle #DADDE0, Blanc brume #F9FAFB.
- **Bans:** no robots, mannequin or android faces; no purple or off-brand colours; no glitch; no motion-blur streaks (every frame must work as a still for scroll); no pure #000/#fff; nothing busy in the centre-lower headline zone.
- **Interface panels and charts (allowed, v2):** small frosted-glass panels in brand colours float beside each agent as its work: a live call card (voice waveform + timer), a ticket/CRM card that resolves with a check, a rising CSAT/sentiment bar chart. Micro-labels only as UI texture, never readable headlines; kept above and beside the agents, out of the centre-lower zone.
- **Lens flare (allowed, v2):** one restrained anamorphic teal-white flare, twice: at the scan's birth on the woman's microphone, and at the ribbons' convergence point.
- **Neon (allowed, v2):** teal #22808A pushed to a neon glow on the agents' edges, the scan line and the ribbon tips; brand teal only, no other neon hues.
- **Motion failures to avoid:** the slideshow (each beat a new card) and the screensaver (pretty motion that says nothing). One continuous camera, one direction: left-to-right, then down and in.
- **Held frames:** a 0.3 s breath when all three agents stand (the line lands), and the final 0.4 s locked on the grid (scroll end state).
- **Truthfulness:** the three people and the room are the real (edited) photo; the agents, data and grid are illustrative.

## Frame 1 — Hero track

- scene: Exact first frame, then a low lateral track right with real 3D depth; a near glass mullion sweeps past the lens
- duration: 1.4s
- poster: 0.9
- status: outline
- src: index.html

0.0–1.4 s. Opens pixel-identical to the photo. Camera at seated eye level tracks right and slightly in; the three people, desk and wall separate in true depth. A blurred vertical glass mullion (near foreground) wipes across the left third. Why: real people first.

## Frame 2 — Scan and crane

- scene: Anamorphic flare on her microphone; a neon scan wave turns the team into a 3D point cloud while the camera starts craning up and back
- duration: 1.2s
- poster: 2.1
- status: outline
- src: index.html

1.4–2.6 s. Flare blooms on the woman's mic; a thin spherical scan front expands from it. Behind the front the photo becomes dense coloured points, then teal-white points and edge lines, in 3D. Camera cranes up and pulls back.

## Frame 3 — The floor (high oblique)

- scene: High oblique crane reveals a whole floor of SPM desks drawn by the expanding scan; agents rise at every desk; ribbons network the floor; panels float
- duration: 1.6s
- poster: 3.7
- status: outline
- src: index.html

2.6–4.2 s. The scan front sweeps outward across a large floor (5–6 rows of pods), drawing wireframe desks, monitors and chairs and point-cloud people. At each person a teal agent rises (stagger following the wave). Ribbons arc pod to pod, with light packets, forming one network. Frosted UI panels (live call, ticket resolved, CSAT) float above the hero pod and a few others. Camera orbits slowly at about 35–40° down, like the lorry yard shot. Why: SPM builds dream teams at scale; AI alongside every person.

## Frame 4 — Drain

- scene: The world drains to near-black; only the glowing network, agents and particles remain
- duration: 1.0s
- poster: 4.8
- status: outline
- src: index.html

4.2–5.2 s. Remaining photo colour and floor shading fall away; star-like dust; the headline zone is dark from here.

## Frame 5 — Top-down dive

- scene: Camera tilts to straight down and dives onto the hero desk; panels and agent lattices sweep past; bokeh; two rings ripple out from the desk
- duration: 1.4s
- poster: 6.0
- status: outline
- src: index.html

5.2–6.6 s. Pitch to top-down while descending fast onto the hero pod (the three agents seen from above), passing through panels and lines that blur past the lens.

## Frame 6 — Ribbons converge

- scene: Smoky tapered ribbons swirl in from all sides to one point, mirrored on a glossy floor; second flare
- duration: 1.0s
- poster: 7.0
- status: outline
- src: index.html

6.6–7.6 s. As in the lorry finale: soft silk/smoke ribbons in pale ice and teal curl radially to the centre, tips converging; reflection below.

## Frame 7 — Grid

- scene: Everything fades; the supplied SPM grid frame holds
- duration: 0.4s
- poster: 7.9
- status: outline
- src: index.html

7.6–8.0 s. Pixel-identical to the supplied last frame (crossfade completes by 7.6 s).

Total: 1.4 + 1.2 + 1.6 + 1.0 + 1.4 + 1.0 + 0.4 = 8.0 s.
