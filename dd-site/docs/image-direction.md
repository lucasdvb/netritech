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
- A card with a real photo gets the class `ph` (keeps the accent colour; the other cards stay greyscale). Card colour #020202, so make each image's black about #020202.

## Taste notes from the client

- References are a starting idea, not something to copy. Push them edgier, bolder, more minimal and more aesthetic: fewer elements, more empty space, graphic shapes, hard light.
- When the idea is loose, use text-to-image instead of image-to-image (image-to-image keeps the reference's background colour).

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
