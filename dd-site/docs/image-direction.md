# Disruptive Dodo · image direction

How every generated image on the Disruptive Dodo site should look. Set by the client on
2026-10-05 with the first reference (a hand holding binoculars whose lenses show a search
page). Follow this for every image, one image at a time, and only after the client has
approved the prompt, model and settings (see the generation rule in /CLAUDE.md).

## The look

- **Black and white first.** Every image is monochrome. The base alternates between
  **black** (#08080a) and **white / off-white** (#f3f1ea) from one image to the next, so a
  row of cards reads black, white, black.
- **One accent, small: lime #E1FF01.** Exactly one small detail carries colour, always lime
  #E1FF01 (the client dropped blue #0731D1 on 2026-10-05). The accent is a detail (a ring,
  a wheel, a marker, a dot, a thin edge), never a fill, never the background, never more
  than a few percent of the frame.
- **Editorial collage style** (from the reference): a real photographic subject, usually a
  hand or an everyday object, cut out and set on a flat, seamless base. Greyscale photo
  texture on the subject, crisp edges, soft contact shadow at most. One clear visual idea
  that says what the service does (binoculars on a search page = getting found).
- **Graphic and surreal, not stock.** The object becomes the metaphor (lenses as screens,
  a tool doing the service's job). Premium, quiet, Apple-campaign calm. No clutter, no
  extra props, no people's faces unless asked.
- **Fade into the base.** The subject can fade into the base colour at the frame edge (the
  reference fades the wrist into the background).

## Composition for the site

- Cards put a big bold title at the top left over the image. Keep the **top third quiet** (just base colour)
  and place the subject in the lower two-thirds, slightly right of centre.
- Default format **1:1 square** for service cards (the cards are square and the image fills the whole card). Sunburst does not accept 4:5. Wide sections
  use 16:9 or 21:9 with the same rules.
- **No added text**, logos or watermarks unless the idea needs a real interface on a
  screen (as in the reference), and then keep it minimal and in greys.

## Placing on cards

- Service cards: the image covers the whole card under a light veil and the title sits big and bold on top. On hover the image blurs, the veil darkens, the title steps down and the description appears. On touch screens the card that settles mid-screen opens the same way after 0.7s.
- The title must never touch the image, and an image under the title must run edge to edge and never be cut (client). For that, generate the image WIDE (16:9) and use `ph-under` to keep the image under the title (bottom left at 64% on desktop, full width at the bottom on phones), or `ph-low`.
- If an image has a light element at its top (like a cone of light), use `ph-drop`: the image sits low and its top fades in from black, so the title stays on clean black.
- Lime-base images: add `ph-lime` (card #d5fa10, dark text, lime veil on hover).
- White-base images: add `ph-light` (dark text, white veil, frosted blur on hover; card colour #fff).
- If the image is narrower than the card on desktop, add `ph-fade` so its side edges dissolve into the card.
- If the subject rises into the title on desktop, add `ph-low` (size and x position can be set per card with --s and --x on the image span) (image at 86% of the card height, anchored to the bottom; only works when the image edges are pure black).
- A card with a real photo gets the class `ph` (keeps the accent colour; the other cards stay greyscale). Card colour #020202, so make each image's black about #020202.

## White-base images

- On white, give lime a fine dark outline or halo so it reads, and draw rings and lines in black instead of light.

## Taste notes from the client

- References are a starting idea, not something to copy. Push them edgier, bolder, more minimal and more aesthetic: fewer elements, more empty space, graphic shapes, hard light.
- Sunburst image-to-image ignores background-colour changes about half the time, even from a reference that already has the right colour. When the background colour matters, prefer text-to-image.
- When the idea is loose, use text-to-image instead of image-to-image (image-to-image keeps the reference's background colour).

- The client likes creative, avant-garde staging: fashion-campaign tableaux, strict symmetry, deadpan figures, hard flash, surreal but readable ideas.
- A lime base is allowed for a single standout card (client, card 04).

## Production

- Model: what the client names for the job (currently **GPT Image 2.5 Sunburst**, 1K) via
  KIE AI. Reference images go in with image-to-image after uploading them with
  `scripts/kie_upload.py`.
- Always show the prompt, model and settings and wait for a clear yes before generating.

## Log

| Section | Card | Base | Accent | Reference | Status |
|---|---|---|---|---|---|
| Everything you need to grow | 01 Get Found. Get Chosen. | black | lime #E1FF01 (focus wheel) | binoculars over search page | LIVE 2026-10-05: /uploads/4SsE3nR2FS5MUv6PTN_CR-svc-01-get-found.webp (from media/gen/01-get-found-v2.png). Card class `ph`: image at full card height on the right, left edge faded, card colour #020202 |
| Everything you need to grow | 02 Get More Customers. | asked black (client), came out white | blue #0731D1 (floor marker) | crowd from above | v1 2026-10-05 (Sunburst i2i, 1K, 1:1) kept the reference's white floor: not used. media/gen/02-more-customers.png. Lesson: Sunburst i2i keeps the reference's base colour; invert the reference first when the base must flip |
| Everything you need to grow | 02 Get More Customers. | black | lime #E1FF01 (meeting point) | crowd from above (loose inspiration) | v2 "Pull" 2026-10-05 (Sunburst t2i, 1K, 1:1): four streams of tiny off-white people converge on one lime point, top half empty black. LIVE 2026-10-05: /uploads/qXcz1kpuNDfZZunGNJ81I-svc-02-more-customers.webp (background-position 68% center so the lime point stays in frame on phones) |
| Everything you need to grow | 03 Look Like the Leader. | black | lime #E1FF01 (light from the door gap) | ant in, elephant out (loose inspiration) | v1 2026-10-05 (Sunburst t2i, 1K, 1:1): a lone white door in a black void, the ant walks in, a rim-lit elephant walks out, lime light spills on the floor. LIVE 2026-10-05: /uploads/lswKF9BnskEC0aCrz1hvP-svc-03-look-like-leader.webp. Card class `ph ph-low`: on desktop the image sits at 86% height on the bottom so the title clears the door |
| Everything you need to grow | 04 Grow Without Growing Your Team. | white (client) | lime #E1FF01 (spark between fingertips, dark outline) | human and robot hands in a ring (loose inspiration) | v1 2026-10-05 (Sunburst t2i, 1K, 1:1): human hand and chrome robotic hand almost touching inside a thin black ring on off-white. LIVE 2026-10-05: /uploads/4DdNPqwJ3lBrJz9SNzfZA-svc-04-grow-without-team.webp. Card class `ph ph-light ph-low ph-fade` with --s:76% --x:50%: dark text, image lowered on desktop, side edges faded into white |
| Everything you need to grow | 04 Grow Without Growing Your Team. (v2, replaces the hands) | lime #E1FF01 (client) | the base is the colour; figures black and white | stressed owner with a robot (loose inspiration) | v2 "The Board" 2026-10-05 (Sunburst t2i, 1K, 1:1): avant-garde fashion editorial, the relaxed owner with coffee in front of three identical robots holding a phone, laptop and folder, hard flash. media/gen/04b-grow-without-team.png. Not used: the client did not like it |
| Everything you need to grow | 04 Grow Without Growing Your Team. (v3) | white | lime #E1FF01 (the coffee cup) | white robotic arm (loose inspiration) | v3 2026-10-05 (Sunburst t2i, 1K, 1:1): avant-garde editorial, a tiny relaxed owner perched on the fingertip of a giant white robotic arm, hard flash shadow. media/gen/04c-grow-without-team.png. Uploaded but replaced by v4 before publishing |
| Everything you need to grow | 04 Grow Without Growing Your Team. (v4 option) | lime | the base is the colour | robot hand on a keyboard (kept close, client asked) | v4 2026-10-05 (Sunburst i2i from the reference, 1K, 1:1): same hand and keyboard, white background replaced with lime. LIVE 2026-10-05: /uploads/Z8ihzSyggEgVS3mVc4igR-svc-04-robot-keyboard.webp. Card class `ph ph-lime ph-under`: lime card #d5fa10, dark text; the image sits under the title (bottom left), never behind it |
| Everything you need to grow | 04 (wide version for the bottom half) | asked lime, came out white | none | the lime keyboard image | 2026-10-05 (Sunburst i2i, 1K, 16:9): framing right, background white again even from a lime reference. Not used. A local lime recolour failed (the white floor joins the hand highlights). media/gen/04e-robot-keyboard-wide.png |
| Everything you need to grow | 04 Grow Without Growing Your Team. (v5, live) | lime | the base is the colour | robot hand on a keyboard | LIVE 2026-10-05 (Sunburst t2i, 1K, 16:9): /uploads/v3myoSUdgXACOKm9jF2E_-svc-04-robot-keyboard-wide.webp. Card `ph ph-lime ph-under`: the wide image is pinned to the bottom at full width and its own 16:9 height, whole and uncut; lime card #d9fb03 |
| Everything you need to grow | 05 Close More Sales. | black | lime #E1FF01 (two circle slices) | hand with coin stack, collage (loose inspiration) | v1 2026-10-05 (Sunburst t2i, 1K, 1:1): Swiss-poster collage, hand holding a coin stack, lime and engraved circle slices, cut-out leaves. media/gen/05-close-more-sales.png. Superseded by v2 (client wanted the banknote eye to be Sir Seewoosagur Ramgoolam's, more of the reference's detail, subtler lime, no numerals) |
| Everything you need to grow | 05 Close More Sales. (v2) | asked black, came out white | lime: one thin edge and a few threads | v1 + the collage + the Mauritian banknote portrait | v2 2026-10-05 (Sunburst i2i with 3 inputs, 1K, 1:1): cone of light, ringed circle slices, ink scribble on the coins, torn engraved banknote pieces, black and grey leaves, his eye and glasses as an engraving. Background white (taken from the collage reference). media/gen/05-close-more-sales-v2.png |
| Everything you need to grow | 05 Close More Sales. (v3) | black | lime: one thin edge and a few threads | v2 | v3 2026-10-05 (Sunburst i2i from v2 alone, 1K, 1:1): the same design on black, cone of light from the top. media/gen/05-close-more-sales-v3.png. Placed as /uploads/Li4cZA7TOd5NO4dqCY0tU-svc-05-close-more-sales.webp (900px, 100KB), card `ph ph-drop`: on desktop the image is full card width from the left edge, 3.25rem from the top, its top fading in under the title (11.6rem to 13.6rem). Lesson again: one input, white to black, works |
