# Products

A product card holds what the prompts need: name, what it is, key facts, and reference images. Two ways to build one: from a URL you read, or manually from the user's images and details.

## Product card

```
PRODUCT CARD
title:        {name}
category:     {physical product | apparel | food | app/web | service}
description:  {1-2 sentences}
key facts:    {3-5 concrete benefits, materials, numbers}
look:         {shape, colors, finish, packaging, label/logo position}
images:       {3-5 public URLs: front, side, detail, in-use, packaging}
audience:     {who it is for}
tone:         {from the brand kit or the user}
```

Use the `look` line verbatim in prompts ("product exactly as in image 1: {look}").

## From a URL (default)

1. Read the page (WebFetch if available; otherwise ask the user to paste the title, description and bullet points).
2. Fill the card. Note image URLs from the page only as candidates: the user must confirm which to use and that they have the right to use them. Images are then already public URLs and can be passed to `-i` as they are.
3. If the page can't be read (blocked, empty), say so and ask for text or images instead.

## Manual (user images)

1. The user provides 3-5 photos (clean, well lit, product filling the frame, neutral background) and the details.
2. After the user's yes, upload: `python3 scripts/kie_upload.py shoe1.png shoe2.png`.
3. Fill the card with the returned URLs.

## App / web product

For an App Store page or website: collect name, tagline, description, favicon/logo and 2-4 screenshots (desktop and mobile). Pass screenshots as `-i` and describe the screen in words; model-rendered UI text is unreliable, so for exact screen content composite real screenshots onto device mockups locally with Pillow.

## Choosing reference images

- Order: hero angle first, then detail, then in-use.
- A video accepts up to 7 images total (presenter and setting included); an image up to 16.
- If the product has a logo or label, add one close-up of it and say "label and logo exactly as in image N; do not redraw".
- Fewer, cleaner images beat many mixed ones.

## Listing

Keep a short list of cards in the conversation (title + image URLs). Save as a small JSON file only if the user asks.
