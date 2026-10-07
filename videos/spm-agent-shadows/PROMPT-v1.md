# Video 1 prompt: SPM "Agent Shadows" (HyperFrames, 3D)

Using /hyperframes (general-video, companion mode) with Three.js, build an 8-second, 1920×1080, 30 fps, silent scroll-scrub website hero film for SPM.

SPM builds dream teams for customer support (main), admin and sales. The film is the SPM version of the lorry reference film. Use the same structure and camera language: a real hero, a crane rise, a wide view of a whole "yard", a scan wave spreading wireframe from object to object, the world draining to black, a top-down dive, smoky ribbons converging and a hairline grid. Make it dynamic, cinematic and premium (Apple-grade restraint). Everything is built in code. No AI generation.

## Message
Behind every SPM agent is AI that works alongside them. The people stay the heroes; AI is their shadow, never a replacement.

## Inputs
- `assets/first-frame.jpg`: the team photo, edited to cool on-brand daylight. It shows three agents in a row at a white desk, wearing dark grey headsets with boom mics: a woman with a black ponytail in a cream blouse (nearest), a bald bearded man in a light blue shirt, and a young man with curly hair in a white T-shirt. Behind them are a navy wall (left), a pale grey wall and a large dark screen (right). The film must open pixel-identical to this photo.
- `assets/plate-1k.png`: the same room with the people removed.
- `assets/last-frame.png`: the dark SPM hairline grid. The film must end pixel-identical to it and hold.
- The brand font: Bricolage Grotesque.

## Build approach
- **Hero relief.** Rebuild the photo as true 3D relief: unproject every pixel with an authored depth map (camera fov 38°). Use separate meshes so silhouette edges never stretch:
  - the back wall and screen (about 5.6 m);
  - the navy partition (about 2.8–3.3 m);
  - the desk (a plane fitted through the laptops);
  - each person on their own mesh at their own depth (woman 2.0 m, bald man 2.8 m, young man 3.5 m), with a body bulge from the mask distance transform.

  Cut each person out locally (u2net plus a photo-minus-plate difference matte). Extend the people further back by inpainting them under the people in front, so parallax never reveals holes.
- **Point clouds.** Sample about 30% of the people's pixels into a 3D point cloud (position, colour, edge flag) for the scan.
- **The floor.** Build a procedural office floor of about 25 desk pods (wireframe desks, laptops and chairs via EdgesGeometry), aligned to the hero row. Each pod has a sparse copy of the team's point cloud.
- **Agents.** Each person gets a teal point-cloud agent: an echo of their own head and shoulders, standing just behind their chair and taller.
- **Ribbons.** Glowing tapered tube ribbons with flowing light. They run from each hero's headset earcup to their agent, plus about 16 network arcs linking agents pod to pod.
- **Panels.** Three frosted-glass UI panels billboard above the hero pod.
- **Floor grid.** A hairline grid on the floor, revealed by the scan.
- **Post and overlay.** UnrealBloom post-processing. A 2D overlay canvas carries the anamorphic flares, bokeh, rings, the smoky finale ribbons with their floor reflection, grain and vignette.
- **Determinism.** Every frame is a pure function of time. A GSAP paused timeline drives `renderAt(t)`, and HyperFrames' `hf-seek` event also triggers it. Seeded randomness only. All libraries are vendored locally.

## Beats (one continuous camera, no cuts)
1. **0.0–1.4s, Hero track.** Open on the exact photo; the overlay fades out by 0.35s. A low lateral track right and slightly in, at seated eye level. The three people, desk and wall separate in true depth. A soft, out-of-focus glass mullion wipes across the frame in the near foreground.
2. **1.4–2.6s, Scan and crane.** An anamorphic teal-white flare blooms on the woman's microphone. A thin spherical scan front expands from it (to about 5 m by 2.65s). Behind the front, the room photo dissolves and the people become dense 3D points, shifting from photo colour to teal and ice, with brighter edge points. The camera cranes up and back. Bloom fades in.
3. **2.6–4.2s, The floor.** The camera rises to a high oblique view, slowly orbiting, like the lorry yard shot. The scan front races across a whole floor of SPM pods (out to about 22 m), drawing wireframe desks, laptops, chairs, point-cloud people and the floor grid.
   - At 2.85s a teal agent rises behind each hero, then at every pod in a wave that follows the scan.
   - Ribbons grow from each headset to its agent (from 2.95s), then network the floor pod to pod with light packets.
   - Panels pop in above the hero pod: a LIVE CALL card with a timer and waveform (3.3s), TICKET #48217 going from IN PROGRESS to ✓ RESOLVED (3.5s), and CSAT rising from 4.1 to 4.9 with "▲ 18%" (3.7s).
4. **4.2–5.2s, Drain.** The photographic world falls to near-black ink. Only the glowing linework, agents, ribbons, panels and dust remain. The centre-lower headline zone is dark from here on.
5. **5.2–6.6s, Top-down dive.** The camera pitches to straight down and dives onto the hero desk, widening the lens from 38° to 50°. The panels sweep past the lens. The pods, grid and network fade by about 6.3s. Bokeh opens and two hairline rings ripple out.
6. **5.95–7.05s, Converge.** Eleven soft, smoky, tapered ribbons in pale ice and teal swirl in from all edges to one point just above centre, mirrored on a glossy floor. A second anamorphic flare marks the convergence.
7. **7.05–8.0s, Grid.** Everything fades as the supplied grid frame fades up. It is pixel-identical from 7.6s and holds to 8.0s.

## Look
- **Palette:** Ink navy #0D141F, Bleu Ardoise #1B2A38, Steel blue #43617A (depth only), Teal #22808A pushed to a neon glow rgb(94,214,222) for the agents, scan and ribbon tips, ice #DCEBF2 for the linework, Gris Perle #DADDE0.
- **Allowed:** UI panels and charts, a restrained anamorphic flare, and teal neon.
- **Banned:** robot or android faces, purple or other neon hues, glitch effects, motion-blur streaks (every frame must work as a still for scroll-scrubbing), pure #000/#fff, and anything busy in the centre-lower headline zone.
- Subtle film grain and vignette, never on the exact first or last frames.

## Deliverable
- `npx hyperframes check` passes.
- Render to MP4 (H.264). Also make an all-intra copy (`-g 1`) for smooth scroll-scrubbing.
- Verify that frame 0 matches the photo and the final frames match the grid.
