# Style guide — SPM hero films (#10 Juggler, #6 Origami Office)

## Medium
Website hero, scroll-scrubbed (the visitor's scroll position = film time; they can scrub back and forth). Silent. No text, no logos.
Apple-style restraint: white void, generous negative space, soft contact shadows, fluid springs, one accent.

## Palette (supplied by SPM)
| Token | Hex | Use |
|---|---|---|
| Background | #FFFFFF | the void |
| Light grey | #DADDE0 | contact shadows, paper, card strokes, steam |
| Steel blue | #43617A | owner's shirt, chart bars, mid-tones |
| Deep navy | #1B2A38 | clothing, juggled balls, mug |
| Ink navy | #0D141F | hair, shoes, faces' line work |
| Teal | #22808A | **AI only**: orbs, discs, ticks, the link, the winning bar, chat bubble |
Skin tones (not in the brand palette, kept muted/desaturated so they sit inside it): #F2D3BC #D9A988 #C68E6A #8A5A3E #6E4532.

## Characters
Flat rubber-hose cartoon people (CAST in film/cast.js): big round heads, dot eyes, rosy cheeks, hose limbs, no outlines.
Roles: Support (headset), Admin (glasses, paper stack), Sales (blazer, chart card), Recruitment (profile cards). The owner wears a tie.

## Motion
Closed-form springs only (lib/motion.js). Enters grow out of something (an AI orb opens into a disc and the person grows 0.86→1 out of it).
Camera: one continuous shot — slow ease-out pull-back, then a micro push on the resting frame. No cuts, no crossfades, no fades as enters/exits.
The final frame must be a calm, complete composition (it is where the scroll rests, above the page CTA).

## Sound
None (silent web hero).
