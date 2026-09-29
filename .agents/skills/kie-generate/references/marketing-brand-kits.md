# Brand Kits

A brand kit captures a brand's identity (name, logo, hero images, colors, fonts, tone, products) so that ad images and videos stay on-brand. It is a **card plus a prompt prefix** built locally.

This is a light metadata capture for ad generation, not a visual-identity design workflow. For a new or extended logo, palette, typography system, applications or an editable brandbook, use `kie-brandkit`.

## Brand kit card

```
BRAND KIT
brand_name:    {name}
tagline:       {line}
overview:      {1-2 sentences}
industry:      {sector}
logo:          {public URL or local file; note dark/light versions}
colors:        {role: hex} e.g. primary #..., secondary #..., accent #..., background #..., text #...
fonts:         {headline font, body font; or style words: geometric sans, editorial serif}
imagery:       {photo/illustration style, subjects, light, what to avoid}
tone:          {3 adjectives + example line}
audience:      {who}
hero images:   {public URLs}
products:      {product card titles}
do / don't:    {rules: e.g. never stretch the logo, no stock-photo smiles}
```

Status: `draft` until the user confirms it (like a fetched-but-unchecked kit); only confirmed kits are applied.

## Create from a website URL

1. Read the site (WebFetch if available; otherwise ask the user to paste the name, tagline, about text, and the colors/fonts if known).
2. Extract name, tagline, overview, industry, tone, products, hero image URLs, and the visible colors and fonts (from CSS/meta if the fetch returns them, otherwise ask or describe from a supplied screenshot).
3. Fill the card and show it for correction. If the URL can't be read, say so and ask for text/screenshots, or skip the kit (ads work without one).

## SPM

For SPM, don't rebuild the kit from the web: read `docs/spm-brand-brief.md` and use its identity, voice and visual universe. Palette: Ink navy #0D141F, Deep navy #1B2A38, Steel blue #43617A, Teal #22808A, Light grey #DADDE0.

## Prompt prefix

Turn the card into one block placed at the start of every image prompt (or in the `LOOK:` line of video prompts):

```
BRAND: {brand_name}. Palette: {hex list with roles}. Type: {font style}. Imagery: {style}. Tone: {adjectives}. Use the logo from the reference image exactly; do not redraw or restyle it. Avoid: {don'ts}.
```

Logo fidelity: pass the logo as `-i` and say "exactly as in image N"; when the mark must be pixel-exact, generate the artwork without it and composite the logo file locally with Pillow (or ffmpeg `overlay` for video).

## Use in generation

The prefix plugs into the DTC still-ad generator (`marketing-dtc-ads.md`) and the video generator (`marketing-modes.md`). Without a kit, generate with the user's colors and words only.
