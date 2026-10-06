# Review log

Every check is made from the rendered MP4s (`python3 scripts/review.py <round>`) plus the per-beat contact sheets
(`node scripts/render.mjs --sheet`). Nothing is judged from the page. Critic prompt: the skill's `reference/CRITIQUE.md`.

Scores 1–10. Ship only when EVERY score is ≥ 8, after at least 3 rounds.

---

## Round 1: <what was rendered, when>

| Criterion | Score | Evidence (timestamps, frames, metrics) |
|---|---|---|
| Hook (first 2 s) | | |
| Readability at phone size | | |
| Motion quality | | |
| Variety / pacing | | |
| Brand accuracy | | |
| Sound sync | | |
| Composition (every format) | | |
| Polish | | |

**3 worst problems**
1.
2.
3.

**Fixes for round 2**
1.
2.
3.

---

## Round 1: renders/draft_16x9.mp4 (11.0 s, 30 fps, 1920x1080, silent, text-free scroll-scrub hero; 16x9 only)

| Criterion | Score | Evidence (timestamps, frame numbers, metric values) |
|---|---|---|
| Hook (first 2 s) | 8 | f0 already reads: close-up of the owner mid-juggle with 4 navy icon balls, sweat drops and an "o" mouth, so "overloaded" lands at 0.0 s. The pull-back (1.33–2.4 s) shows white space without stalling. Docked from 9: in the cascade the balls merge into each other (0.83 s, two pairs touching; 1.53 s, person + headset balls fully overlap into one blob), so the "four jobs" count is muddy. |
| Readability at phone size (story read; no text in film) | 6 | phone_16x9.jpg at 360 px: the overloaded owner (0–2 s) and the relaxed owner with mug (8–10 s) both read. The middle beat, "each teammate catches one ball", does not. Ball icons are about 6 px. The caught ball is the same deep navy as Support's and Sales' clothing and is lost against the raised arm. The props it turns into are faint: the headset is a 2 px mic dot, and the paper stack is white/#DADDE0 on white. Nothing in the 3 s / 4 s / 5 s phone frames links a ball leaving the owner to one teammate. |
| Motion quality | 5 | Cap 6: every teammate enters as an opacity fade, not a grow. f79 empty disc → f80 (2.63 s) a ~25 % ghost figure → f81 full. Same at f118 (3.93 s, Admin ghosted), f155 (5.17 s), f193 (6.43 s). Cap 7 also hit: the push-in steps. The group bbox jumps 7–8 px per side in one frame at 8.567, 9.033, 9.333 and 9.667 s and holds still between steps (frame-diff spikes 3.5–3.8 against a 0.1 baseline). The ball→prop hand-offs are vanish-and-appear. The headset ball shrinks to a dot in Support's hand over f101–f104 (3.33–3.43 s) and a mic appears on the face at ~3.57 s; it never travels "onto the head". The springs in the pull-back and the arcs drawing on (9–10 s) are clean. |
| Variety / pacing | 7 | Cap 7: metrics max_gap_between_visual_events = 5.87 s from 5.13 s. On screen something does change about every 1.2 s: catches at 3.3 / 4.6 / 5.8 / 7.0 s, mug 7.6 s, bubble 8.0 s, ticks 8.5–9 s, arcs 9.3–10 s. But everything after 5 s is small in area, so the film reads as flattening out after the last entrance. longest_static 1.3 s from 9.67 s is the resting frame, which is acceptable here. |
| Brand accuracy (palette discipline, no text/logos) | 7 | No text and no logos. Navy/steel/grey are used correctly, and the teal sits on orbs, discs, ticks, bubble, winning bar and links. Breaches: a teal dot on the owner's mug (7.6–11 s), which is not AI. Soft blurred glow halos around every orb and disc (2.6 s, 4.0 s, 5.4 s, 6.6 s; still around all 4 orbs in the final frame), against "no glow on UI". |
| Sound sync | N/A | Silent web hero. Not scored. |
| Composition (16x9 only; 9:16 N/A) | 7 | The final frame is a calm five-figure line-up with the arcs above. Faults: Admin and Sales stand so close to the owner that during their catches their raised hands touch his (4.50 s Admin's hand on the owner's shoulder/ball; 5.60 s Sales' hand meets the owner's hand like a high-five). The four arc orbs do not sit over their teammates (orb x ≈ 238 / 560 / 1358 / 1681 against heads at 345 / 672 / 1250 / 1572), so the chain floats between people. Recruitment's #DADDE0 shirt and arms nearly vanish on white. |
| Polish | 6 | No blank frames. Ghost-figure frames f80, f118, f155, f193. The AI orb passes over teammates' faces: Support's eye at 3.10 s, Admin's chin at 4.30 s, Sales' eye at 5.60 s. The chart card fades in semi-transparent across Sales' face at 5.85 s. The recruitment ball lands across her chin at 7.10 s. The owner's mug is held by a hand with no arm (the right arm is not drawn from 7.7 s to the end), so the mug looks glued to the shirt. Support's arm stays frozen in a raised fist from 3.5 s to the end. |

**3 worst problems** (ranked by damage to the film, each with timestamp + cause)
1. **Teammates fade in as ghosts** (2.63 s f80, 3.93 s f118, 5.17 s f155, 6.43 s f193). The figure's opacity ramps 0 → ~25 % → 100 % over 2–3 frames inside the disc instead of growing 0.86→1 out of it. This is a banned fade enter, and when scroll-scrubbed it flickers like a pop at each of the four key beats.
2. **The catches, the core story beat, are physically muddled and don't read at phone size.**
   - Orb paths cross faces: 3.10 s, 4.30 s, 5.60 s.
   - Catch hands collide with the owner's hands: 4.50 s, 5.60 s.
   - The chart card ghosts over Sales' face: 5.85 s.
   - Balls vanish and props appear separately instead of the ball becoming the prop. The headset ball shrinks to nothing at 3.33–3.43 s and the headset is only a mic dot.
   - At 360 px nobody can follow which ball went to whom.
3. **The push-in stutters in 4 discrete steps** (8.567, 9.033, 9.333, 9.667 s). The camera scale is applied in quantised jumps of 7–8 px per side and holds still between them. This happens in the resting composition, where the scroll comes to rest above the CTA, so a scrubbing visitor sees the frame jolt.

**Fixes for round 2** (concrete, testable, one per problem: what changes, where, and how to verify it)
1. Teammates must enter at opacity 1 from their first visible frame, growing 0.86→1 out of the disc. Alternatively, reveal them with a circular clip that expands with the disc. No alpha ramp. Verify: extract f78–83, f116–121, f153–158, f191–196. No frame may show a partially transparent figure: skin and hair pixels are either absent or at full colour. The frame-diff has no single-frame spike at those enters.
2. Re-block the hand-offs:
   - (a) Route each orb's rise behind the character (z-order) or offset it by at least one head radius, so it never crosses a face.
   - (b) Move Admin and Sales outward 80–100 px. A teammate's catch hand must stay ≥ 40 px from any owner limb or ball.
   - (c) Make each ball visibly arc into the hand, then morph into the prop in place at opacity 1. No translucent prop over the face.
   - (d) Headset: the ball rises from hand to head and becomes a visible navy headband plus mic.
   - (e) Give caught balls the teal ring early, from the moment they leave the owner, so the hand-off reads at 360 px.

   Verify: stills at 3.10, 4.30, 4.50, 5.60, 5.85 and 7.10 s show no orb, prop or hand overlapping a face or the owner. Re-cut phone_16x9 at 0.5 s steps from 2.5 to 7.5 s; each catch must show the ball between the owner and exactly one teammate.
3. Make the 7.9–11 s push continuous: compute the camera scale every frame with no rounding and no cached raster held between frames (e.g., drop `will-change`/layer caching on the camera group, or force a re-raster each frame). Verify: the frame-diff over 7.9–11 s has no isolated spike > 1.0 against its neighbours, and the group bbox width grows monotonically by ≤ 1 px per frame.

Smaller issues for the same round:
- Draw the owner's right arm holding the mug.
- Make the mug's dot navy, not teal.
- Remove the blurred glow halos on the orbs and discs, or reduce them to a flat contact shadow.
- Fix the juggling pattern so no two balls overlap (0.83 s, 1.53 s).
- Lower Support's arm after the catch, or give it a natural hand-to-headset pose.
- Darken Recruitment's shirt edge or arms for contrast.
- Centre each arc orb over its teammate's head.

**Verdict:** ANOTHER ROUND

---

## Round 2: renders/draft_16x9.mp4 re-render (11.0 s, 30 fps, 1920x1080, silent, text-free; 16x9 only)

**Did the round-1 fixes land?**
- **R1 fix 1 (ghost fade enters): LANDED.** f79–f84 show a full-opacity circular reveal out of the orb. Admin (f117–f120), Sales and Recruitment enter the same way. No semi-transparent figure frames.
- **R1 fix 2 (catch re-block): MOSTLY LANDED.**
  - No hand collisions with the owner (4.45 s, 5.80 s are clear).
  - Orbs park above heads and never cross faces.
  - The chart card grows at full opacity (5.93–6.2 s).
  - The headset reads: mic boom plus teal tip.
  - Support's arm drops back (4.1–4.3 s).
  - Residual: the document ball sits ~10 px off the owner's ear at 4.10 s. The recruitment ball overlaps her cheek by ~15 px at 7.10 s. The headset ball still shrinks to a dot in the hand (f108→f110, 3.60–3.67 s) rather than becoming the headset.
- **R1 fix 3 (push stepping): LANDED.**
  - Round 1 had single-frame spikes of 3.5–3.8 at 8.567, 9.033, 9.333 and 9.667 s. Over 7.9–11 s the frame-diff now ramps smoothly, 0.11 → 0.64 → 0.03, with no isolated spikes.
  - Group width grows 1542 → 1610 px; the largest frame-to-frame change is 3 px, including limb motion.
- **Smaller issues:**
  - Landed: mug arm drawn, teal dot off the mug, glow halos gone, steam stronger, sweat clears before the smile, Recruitment in steel, arc orbs within ~35 px of their heads.
  - Not landed: juggled balls still overlap at 1.50 s (person ball over headset ball), though the keylines now separate them.

| Criterion | Score | Evidence (timestamps, frame numbers, metric values) |
|---|---|---|
| Hook (first 2 s) | 8 | f0: close-up overloaded owner, 4 keylined icon balls with larger glyphs, sweat. Reads at 0.0 s. Still docked from 9: balls overlap in the cascade (strip_fast f45, 1.50 s, person over headset). |
| Readability at phone size (story read) | 7 | Up from 6. In phone_16x9 each catch now shows the teal-ringed ball between the owner and one teammate: 3 s Support's raised hand, 4 s Admin's raised hand, 6 s Sales holding the chart card, 7 s Recruitment's card. Not 8: the results of two catches stay illegible at 360 px. The headset is a mic dot and the paper stack is #DADDE0 lines on white. The reveal ring at 5 s and 6 s is the most visible shape in those frames. |
| Motion quality | 7 | Fades and the push stutter are fixed. Visible pop, cap 7: the mug appears in one frame at full size and ~25 % opacity (7.633 s), then is solid at 7.667 s, with no grow into the hand. Throws glide instead of arc. Headset ball, 2.73–3.2 s: ~375 px sideways at nearly constant height. Document ball, 4.03–4.43 s: hovers beside the owner's head, moving ~100 px in 0.4 s while Admin reaches for it. The reveal rings fade out as they expand. |
| Variety / pacing | 7 | Cap 7: metrics max_gap_between_visual_events = 4.6 s from 6.4 s (round 1: 5.87 s). On screen there is a new event every ~0.6–1.2 s after 6.4 s: recruit reveal, catch 7.0, mug 7.6, bubble 7.9, ticks 8.3–9.0, arcs 9.3–10. They are small in area. longest_static 1.23 s from 9.73 s is the resting frame. |
| Brand accuracy (palette, no text/logos) | 8 | No text or logos. The glow halos are gone (orbs are flat-shaded spheres, final frame). The mug is navy with no teal. Teal appears only on AI elements: orbs, rings, caught-ball rings, the headset mic tip (AI-supplied prop), bubble, ticks, winning bar, arcs. Recruitment's steel #43617A is in palette, but it matches the owner's shirt and slightly dilutes him as the hero. |
| Sound sync | N/A | Silent web hero. |
| Composition (16x9 only; 9:16 N/A) | 8 | The final frame is balanced. Head spacing is 308 / 377 / 385 / 308 px; arc orbs sit over heads; contact shadows give depth; the props are readable at 1080p. No limb collisions at any catch. Docked: each reveal ring grows to ~600 px radius and sweeps through other characters. It crosses Support's face at 4.0 s (f120) and the owner's face and torso at 4.1 s. |
| Polish | 7 | No blank frames, no ghost figures, no stepping. Remaining: mug ghost frame at 7.633 s; ring lines across faces at 4.0 s and 4.1 s; document ball touching the owner's ear at 4.1 s; recruit ball over her cheek at 7.1 s; ball overlap in the juggle at 1.5 s. |

**3 worst problems** (ranked by damage to the film, each with timestamp + cause)
1. **The throws float instead of fly.**
   - The headset ball travels ~375 px at almost constant height over 2.73–3.2 s.
   - The document ball hangs beside the owner's head for ~0.4 s (4.03–4.43 s, f121–f133) while Admin's arm comes up.
   - The ball's path is being eased toward the catcher's hand, not following a ballistic arc. The hand-off reads as levitation, which undercuts the core "they catch it" beat.
2. **The reveal rings are loud and fade out.** At every entrance (2.6–3.1, 3.9–4.4, 5.1–5.6, 6.4–6.9 s) a thin teal ring expands to ~600 px radius and fades. It is the largest moving shape in frame at each beat, and it crosses other characters' faces (Support at 4.0 s, owner at 4.1 s). The exit is an opacity fade.
3. **The mug pops in as a ghost** (7.633 s). It appears at full size and ~25 % opacity for one frame, then is solid. It does not "grow into one hand" as the shotlist asks. On a scroll-scrub this is the relax payoff, and it flickers.

**Fixes for round 3** (concrete, testable, one per problem: what changes, where, and how to verify it)
1. **Throws:** make each throw ballistic.
   - Solve launch velocity from release point, catch point and flight time (≥ 0.45 s) with constant gravity, so the apex is ≥ 120 px above the higher of the two points.
   - Time the catcher's hand to arrive at the catch point 2–3 frames before the ball, so the ball never waits.
   - Verify: track the ball centre per frame through 2.6–3.3 s and 3.9–4.6 s. y(t) must be a parabola (second difference of constant sign), and no 5-frame window may show the ball moving < 20 px.
2. **Rings:**
   - Cap the reveal ring at ~1.15× the figure's height (≈ 260 px radius) and draw it behind all characters.
   - Exit by thinning the stroke to 0 or contracting back into the orb, never by opacity.
   - Verify: stills at 3.0, 4.0, 4.1, 5.3 and 6.6 s show no ring line over any face, and the ring is never wider than the gap to the neighbouring figure.
3. **Mug:** grow the mug from scale 0 at the hand at opacity 1, with the heavy spring over ≥ 6 frames, and have the hand rise with it. Verify: frames 7.60–7.85 s show a solid navy mug growing in size each frame, with no frame where the mug is pale or semi-transparent.

Smaller issues for the same round:
- Let the headset ball travel onto the head and morph into the band instead of shrinking at 3.60–3.67 s.
- Nudge the document ball's path ≥ 30 px off the owner's head (4.1 s) and the recruit ball off her cheek (7.1 s).
- Give the paper stack a navy outline or a steel top sheet so it reads at 360 px.
- Remove the remaining ball overlaps in the juggle (1.5 s).

**Verdict:** ANOTHER ROUND (round 2 < 3; Motion, Variety, Polish, Readability below 8)

---

## Round 3: renders/draft_16x9.mp4 re-render (11.0 s, 30 fps, 1920x1080, silent, text-free; 16x9 only)

**Did the round-2 fixes land?** Each caught ball was tracked by its teal ring at full resolution, every 2nd frame from 2.8 to 7.8 s.
- **R2 fix 1 (ballistic throws): LANDED for the physics.** Every flight is a real parabola: x moves steadily, y decelerates to an apex and then accelerates down. No hovering.

  | Throw | Release | Apex | Catch / landing | Apex rise | Sideways travel |
  |---|---|---|---|---|---|
  | Support | 3.00 s (784,396) | 3.27 s (624,294) | caught ~3.40 s (542,332) | ~100 px | ~240 px |
  | Admin | 3.93 s (824,434) | 4.20 s (788,306) | 4.53 s (742,480) | 128 px | **88 px** |
  | Sales | 5.60 s (1100,402) | 5.87 s (1134,306) | 6.20 s (1186,514) | 96 px | **86 px** |
  | Recruitment | 6.53 s (1100,442) | 6.83 s (~1282,296) | 7.20 s (1492,508) | 146 px | ~390 px |

  The briefed "apex ≥ 150 px, 0.62 s flight" is not met for Support (rise ~100 px, ~0.43 s) or Sales (rise 96 px).
- **R2 fix 2 (rings): LANDED.** Rings are capped at ~260 px, sit behind the characters (Admin's face is clear at 3.55 s), and end by thinning (barely visible at 3.75 s). No opacity fade.
- **R2 fix 3 (mug): LANDED.** At 7.60–7.97 s the mug grows solid navy from a dot, and the hand rises into it. No pale frame. Nit: for about 2 frames (7.77–7.80 s) the mug sits ~15 px above the hand before the hand meets it.
- **Smaller fixes:**
  - Landed: the headset ball rides to the ear, then shrinks (3.73–4.13 s), and the mic reads. The paper stack's steel keylines read in the final frame and at 360 px. Recruitment reads against white. The push stays smooth: no isolated frame-difference spikes after 2 s, and the 7.9–11 s values run 0.52 → 0.71 → 0.03.
  - Not landed: juggled balls still overlap (strip_fast f21–22, 0.70–0.73 s; strip_fast2 f41, 1.37 s).

| Criterion | Score | Evidence (timestamps, frame numbers, metric values) |
|---|---|---|
| Hook (first 2 s) | 8 | f0 reads at 0.0 s: close-up of the overloaded owner with 4 keylined icon balls and sweat. Held at 8 by ball-on-ball overlaps in the cascade (0.70–0.73 s, 1.37 s). |
| Readability at phone size (story read) | 7 | At 360 px the props now read (headset mic, keylined paper stack, chart, card) and the relaxed owner with mug is clear. But two hand-offs are ambiguous. **3 s:** the headset ball sits inside Admin's arriving ring, right above Admin's head, so it reads as going to Admin. **4 s:** the document ball overlaps the person ball beside the owner's head. |
| Motion quality | 8 | No fades, pops or stepping. Throws follow measured parabolas. Rings thin out instead of fading. The mug grows on a spring. Held from 9 by ball-on-ball overlaps: in the juggle, and the document ball merging with the person ball at the moment of the Admin hand-off (4.37–4.47 s). |
| Variety / pacing | 7 | Cap 7: metrics max_gap_between_visual_events = 5.07 s from 5.93 s (round 2: 4.6 s). On screen there is something every ~0.5–1 s: recruit reveal 6.0, catch 7.14, relax 7.35, mug 7.7, bubble 8.0, ticks 8.3–9.0, arcs 9.3–10. All of it is small in area and slips under the detector. longest_static 1.23 s from 9.73 s is the resting frame. |
| Brand accuracy (palette, no text/logos) | 8 | No text, logos or glow. Teal appears only on AI elements. Flag: Recruitment's new #2F4455 is not one of the five palette hexes. It sits between Deep navy #1B2A38 and Steel #43617A, so it reads on-brand but breaks strict palette discipline. |
| Sound sync | N/A | Silent web hero. |
| Composition (16x9 only; 9:16 N/A) | 7 | The final frame is the best yet: balanced spacing, orbs over heads, readable props, contact shadows. Mid-film, entrances now collide with catches. 3.2–3.55 s: Admin's orb drop and ring reveal happen while the headset ball is in flight, and the ball crosses Admin's orb at 3.2 s. 5.9–6.2 s: Recruitment's reveal lands during the Sales catch. The Admin and Sales throws go almost straight up beside the owner's head, so the catching hand comes within ~40–50 px of his raised hand (4.47 s, 6.05 s). This is made worse by the wider juggle stance. |
| Polish | 7 | No blank or ghost frames. Remaining: document ball overlaps the person ball (4.37–4.47 s); the person ball passes in front of Sales' AI orb and covers it (6.97 s); the headset ball covers Support's cheek for ~0.3 s while at the ear (3.80–4.07 s); the mug leads the hand by 2 frames (7.77 s). |

**3 worst problems** (ranked by damage to the film, each with timestamp + cause)
1. **Entrances overlap catches, so whose ball is it?**
   - 3.2–3.55 s: Admin's orb drops and Admin is revealed while the headset ball is still in flight. At 3.4 s the ball sits inside Admin's ring, directly above Admin's head, before Support's hand reaches it.
   - 5.9–6.2 s: Recruitment's reveal happens during the Sales catch.
   - Cause: the re-solved juggling tempo moved the catches later (3.55 / 6.16 s) but left the entrance marks where they were. Each "one teammate, one ball" beat now shares the screen with the next entrance.
2. **The Admin and Sales hand-offs are vertical tosses beside the owner's head.** The ball moves only 86–88 px sideways (Admin 824→736, Sales 1100→1186), so the catcher has to reach into the owner's space: hands ~40–50 px apart at 4.47 s and 6.05 s. At 4.37–4.47 s the document ball also merges with the juggled person ball. The ball never visibly travels to the teammate, which weakens the hand-off read at phone size.
3. **Pacing metric gap of 5.07 s from 5.93 s** (cap 7). After the last entrance every event (catch, relax, mug, bubble, ticks, arcs) is small in area, so the back half of the film registers as nearly still even though it is busy at full size.

**Fixes for round 4** (concrete, testable, one per problem: what changes, where, and how to verify it)
1. **De-overlap entrances and catches.** Each teammate's entrance (orb drop and ring) must finish before the previous catch's ball is released, or start after that catch lands. Example: move Admin's orb drop to ≥ 3.6 s, or Support's release to ≤ 2.75 s with the catch by 3.2 s; do the same for Recruitment against Sales. Verify: in the tracked ball positions, no ringed ball is in flight while another orb or ring is on screen within 300 px of it. Stills at 3.4 s and 6.0 s show one in-flight ball and no ring.
2. **Make the Admin and Sales throws travel to the catcher.**
   - Release each ball from the owner's outer hand with lateral velocity, so the landing point is at the teammate's hand ≥ 180 px from the owner's nearest hand.
   - Pull the owner's catching-side hand in, or end his juggle stroke, while the teammate catches.
   - Re-time the juggle so no juggled ball is within 1 ball diameter of a ringed ball during its flight.
   - Verify: tracked flights show ≥ 180 px of sideways travel. At the catch frame (4.53 s, 6.16 s) the owner's nearest hand is ≥ 120 px from the catching hand, and no ringed ball overlaps another ball in any frame.
3. **Lift the back-half pacing.** Make each 7.7–10 s event read larger.
   - The bubble's typing dots → tick, the bar-chart rise and the profile-card tick each get a visible scale beat of ≥ 1.15× on the prop, staggered 0.5 s apart.
   - Draw the link arcs with a travelling teal pulse.
   - Verify: re-run review.py and get max_gap_between_visual_events ≤ 4.0 s, with longest_static still ≤ 1.3 s, ending in the resting frame.

Smaller issues for the same round:
- Route the recruitment ball above Sales' orb (6.97 s) or start the orb drop later.
- Move the headset ball to the ear outside the face silhouette (3.80–4.07 s).
- Start the mug's grow at the palm, not 15 px above it.
- Clear the juggle overlaps at 0.70 s and 1.37 s.
- Change Recruitment's #2F4455 to a palette hex (Deep navy #1B2A38 with a steel collar works).

**Verdict:** ANOTHER ROUND (round 3; Readability, Variety, Composition and Polish are below 8)

---

## Round 4: renders/draft_16x9.mp4 re-render (12.0 s, 30 fps, 1920x1080, silent, text-free; 16x9 only)

**Did the round-3 fixes land?** Each caught ball was tracked by its teal ring at full resolution, every 2nd frame from 2.4 to 9.0 s.

- **R3 fix 1 (separate entrances from catches): LANDED.**
  - Support catch 3.20 s → Admin orb first visible ~3.73 s.
  - Admin catch ~5.10 s → Sales orb ~5.50 s.
  - Sales catch ~6.70 s → Recruitment orb ~7.40 s.
  - No ringed ball is in flight while another orb or ring is on screen. Each beat is one ball and one catcher (contact 2.5–8.5 s; phone 3 s, 5 s, 6 s, 8 s).
- **R3 fix 2 (throws travel to the catcher): LANDED.**

  | Throw | Release | Apex | Catch | Apex rise | Sideways travel | Gap to owner's nearest hand at catch |
  |---|---|---|---|---|---|---|
  | Support | 2.60 s (796,406) | 2.87–2.93 s (~570,234) | 3.20 s (358,388) | 172 px | 438 px | far side of frame |
  | Admin | 4.53 s (810,400) | 4.80 s (728,268) | ~5.10 s (~645,410) | 132 px | ~165 px | ~170 px |
  | Sales | 6.13 s (1106,400) | 6.40 s (1188,268) | ~6.70 s (~1270,390) | 132 px | ~164 px | ~180 px |
  | Recruitment | 8.07 s (1142,376) | 8.33 s (1344,230) | ~8.63 s (~1550,380) | 146 px | ~400 px | far side of frame |

  Admin and Sales are slightly under the 180 px sideways I asked for, but the catches are overhead and clearly away from the owner. No ringed ball overlaps a juggled ball in any tracked frame.
- **R3 fix 3 (back-half pacing): LANDED on screen.**
  - Props come alive about 0.8 s after their own catch: bubble 4.1 s, paper tick ~5.9 s, chart ~7.5 s, card ~9.4 s.
  - Relax ~8.9 s, mug 9.13–9.40 s, staggered finale bumps, arc draw-on with a travelling pulse 9.8–10.6 s.
  - Frame-diff stays 0.8–1.4 through 7–9 s and 0.4–0.9 through 9–10.6 s, then settles into the rest.
- **Smaller fixes:**
  - Landed: the recruitment ball no longer crosses Sales' orb; the mug grows from the palm (scales about its base, 9.13–9.40 s, solid every frame); Recruitment wears Deep navy with a steel collar, on palette; no isolated frame-diff spikes anywhere after 2 s.
  - Partly landed: the headset is placed from the top of the head (3.6–4.0 s).
  - Not landed: juggled balls still kiss in the cascade (strip_fast2 f21, 0.70 s; strip_fast f40, 1.33 s).

**Correction to my rounds 1–3 Variety scores.** I re-read scripts/review.py. `max_gap_between_visual_events` adds the film's end (DUR) as the last "event", so every reported gap so far ran to the last frame and included the resting end card. Round 1: 5.13 + 5.87 = 11.0. Round 2: 6.4 + 4.6 = 11.0. Round 3: 5.93 + 5.07 = 11.0. Now: 7.47 + 4.53 = 12.0. The brief requires that rest, and the rubric exempts the end card. Measured to the start of the rest (longest_static from 10.8 s), the real gap is 3.33 s. I applied the cap mechanically before; I no longer apply it.

| Criterion | Score | Evidence (timestamps, frame numbers, metric values) |
|---|---|---|
| Hook (first 2 s) | 8 | f0 reads at 0.0 s: close-up of the overloaded owner with 4 keylined icon balls and sweat. The pull-back reveals white space by 1.5 s. Held at 8 by balls touching in the cascade (0.70 s, 1.33 s). |
| Readability at phone size (story read) | 8 | phone_16x9 at 360 px reads the whole story with no competing element. 0–1 s overloaded owner. 3 s Support holding the ringed headset ball overhead. 4 s bubble. 5 s Admin with the ringed doc ball. 6 s Sales reaching. 7 s chart card. 8 s Recruitment reaching for the ringed ball. 9 s owner relaxed with mug. 10–11 s team line-up with linked orbs. Each prop is legible at 360 px. |
| Motion quality | 8 | No fades, pops or stepping. All four throws are measured parabolas with 132–172 px apex rise. Reveal rings thin out behind the characters. The mug grows from the palm on a spring. Held from 9: as each ball rides the hand down after a catch it crosses the catcher's cheek for 2–3 frames (Admin 5.17–5.30 s, Sales ~6.80 s, Recruitment ~8.70 s). Catch arms go dead-straight overhead, which is a stiff pose. |
| Variety / pacing | 8 | Something new every ≤ 1 s from 2 s to 10.6 s: entrance, throw, catch, prop beat, next entrance, relax, mug, finale bumps, arc pulse. The camera pulls back, then pushes in on the rest. The build lands in a calm resting frame (longest_static 1.17 s from 10.8 s). Metric max gap 4.53 s from 7.47 s runs to the film's end and includes the rest (see correction). |
| Brand accuracy (palette, no text/logos) | 8 | No text, logos or glow. Every colour is one of the five palette hexes or the muted skin tones. Teal appears only on AI elements: orbs, rings, caught-ball keylines, headset mic tip, bubble, ticks, winning bar, link arcs and pulse. |
| Sound sync | N/A | Silent web hero. |
| Composition (16x9 only; 9:16 N/A) | 8 | Final frame: five figures, head x ≈ 250 / 545 / 955 / 1375 / 1670. The owner sits in the widest gaps (410 / 420 px against 295 px outside), so he reads as the hero. Arc orbs sit over heads; contact shadows ground each figure; props are readable. No limb collisions at any catch; catch hands are ≥ 170 px from the owner's. Minor: the circular reveal shows Admin as a floating head for ~2 frames at 4.0 s (f120) before her body opens. |
| Polish | 8 | No blank, ghost or double-exposed frames. No pops; no orb or ring crossing faces. Remaining small items: ball-over-cheek frames during the ride-down (5.2 s, 6.8 s, 8.7 s), the floating-head reveal frame (4.0 s), and touching juggle balls (0.70 s, 1.33 s). |

**3 worst problems** (ranked by damage to the film, each with timestamp + cause)
1. **The ball crosses the catcher's face on the ride-down** (Admin 5.17–5.30 s, Sales ~6.80 s, Recruitment ~8.70 s). The ball travels straight down the hand path from overhead to chest, and that path runs over the cheek. A visitor who stops scrolling there sees a ball on someone's face.
2. **Juggled balls still touch in the cascade** (0.70 s, 1.33 s). Two of the four balls kiss or overlap in the hook, which slightly muddies the "four jobs" count.
3. **Floating-head reveal frame at 4.0 s** (f120). The circular reveal opens from the orb above the head, so for ~2 frames Admin is only a head; the same pattern applies to the other reveals. Stiff vertical catch arms are a related nit.

**Fixes for a polish pass (optional; none blocks ship)**
1. Ride-down: route the caught ball on a short outward arc that keeps it ≥ 20 px outside the head silhouette, e.g. a hand path offset 60 px to the outer side before it comes in to the chest. Verify: stills at 5.23, 6.80 and 8.70 s show no ball pixels over skin.
2. Juggle: add 1–2 frames of phase offset between the two balls that cross at 0.70 s and 1.33 s. Verify: strip_fast and strip_fast2 show a clear gap between every pair of balls.
3. Reveal: centre the reveal circle on the figure's chest instead of the orb, or start it at a radius that already covers the head and shoulders. Verify: f118–f122 show at least head plus torso in every frame. Optionally give the catch arm a 10–15° elbow bend.

**Verdict:** SHIP (round 4 ≥ 3; every scored criterion is ≥ 8; Sound sync N/A for a silent hero)
