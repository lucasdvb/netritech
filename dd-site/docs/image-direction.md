# Disruptive Dodo · image direction

How every generated image on the Disruptive Dodo site should look. Set by the client on
2026-10-05 with the first reference (a hand holding binoculars whose lenses show a search
page). Follow this for every image, one image at a time, and only after the client has
approved the prompt, model and settings (see the generation rule in /CLAUDE.md).

## The look

- **Black and white first.** Every image is monochrome. The base alternates between
  **black** (#08080a) and **white / off-white** (#f3f1ea) from one image to the next, so a
  row of cards reads black, white, black.
- **One accent, small.** Exactly one small detail carries colour, and only one of:
  - **Lime #E1FF01**
  - **Blue #0731D1**
  The accent is a detail (a ring, a wheel, a cursor, a dot, a thin edge), never a fill,
  never the background, never more than a few percent of the frame. Alternate the two
  accents across a set where it helps.
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

- Cards put their title at the top left. Keep the **top third quiet** (just base colour)
  and place the subject in the lower two-thirds, slightly right of centre.
- Default format **2:3 portrait** for cards (Sunburst does not accept 4:5). Wide sections
  use 16:9 or 21:9 with the same rules.
- **No added text**, logos or watermarks unless the idea needs a real interface on a
  screen (as in the reference), and then keep it minimal and in greys.

## Production

- Model: what the client names for the job (currently **GPT Image 2.5 Sunburst**, 1K) via
  KIE AI. Reference images go in with image-to-image after uploading them with
  `scripts/kie_upload.py`.
- Always show the prompt, model and settings and wait for a clear yes before generating.

## Log

| Section | Card | Base | Accent | Reference | Status |
|---|---|---|---|---|---|
| Everything you need to grow | 01 Get Found. Get Chosen. | asked black, came out white | lime #E1FF01 (focus wheel) | binoculars over search page | generated 2026-10-05 (Sunburst i2i, 1K, 2:3; 4:5 is not accepted by Sunburst), awaiting client review: media/gen/01-get-found.png |
