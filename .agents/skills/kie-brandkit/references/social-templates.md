# Social media graphics

Create once the slots used by the requested social graphic are approved.

## Required question

Require approved logo and palette for branded no-text graphics. Add approved typography only when readable text appears. Read those modules separately; never force typography for a no-text post.

Before generation, ask once for:

- Platform, aspect ratio, and number of outputs
- Exact text that must appear; “no text” is a valid answer
- Visual mode:
  - plain branded background/poster
  - mockup photography/application
- Any supplied photography or product assets

Preserve copy verbatim. Never invent sale language, CTA, claims, prices, contact details, or placeholder copy.

## Output contract

Social-media deliverables are flattened PNG/JPG graphics, not editable templates. Never promise or create PPTX, SVG, PSD, Figma, Canva, or layered files for this module.

Supported modules:

- square post
- 4:5 feed post
- 9:16 story
- carousel cover/body/CTA cards
- channel banner/cover

## Plain branded poster

Use GPT Image 2.5 Flare (`scripts/kie_image.py`, 1K unless asked) for the finished graphic. Show the final prompt and settings and wait for the user's yes before running it.

Pass references through repeated `-i <public url>` flags (Image 1 is the first `-i`, Image 2 the second, and so on; use public URLs from `scripts/kie_upload.py` (with the user's yes) or the printed URL of an earlier result — never an SVG):

- Exact approved logo variant
- Approved typography specimen
- Any official product/photo reference

The prompt must state:

- Exact literal copy
- Display/body font family names and which text uses each
- Logo placement, scale, clear space, and color variant
- Text placement, hierarchy, alignment, line breaks, and contrast
- Exact palette roles
- Requested aspect ratio

Never compose this flattened module with local Python/Pillow or runtime package installation. The controlled image render is the deliverable; use the deterministic poster/banner module when exact editable typography is required.

```bash
python3 scripts/kie_image.py "<exact social graphic prompt>" \
  -a 4:5 -r 1K -o "$BRANDKIT_WORKDIR/social/post-4x5-v1.png" \
  -i "<public URL of the approved logo PNG>" \
  -i "<public URL of the approved typography specimen PNG>"
```

Omit the typography reference for a no-text graphic. Use the platform ratio directly with `-a` (1:1, 4:5, 9:16, 16:9, and so on); no cropping step is needed. Verify the output ratio and that no locked logo or copy sits on an edge.

## Mockup photography/application

1. Create or use the mockup photograph first with its target surface blank. Follow `mockups.md` for the base scene.
2. Pass that exact mockup's result URL as the first `-i` (Image 1).
3. Pass the approved logo PNG URL as the second `-i` (Image 2).
4. Pass the approved typography specimen PNG URL as the third `-i` (Image 3).
5. The image model adds the exact copy, logo, and approved typography to the blank surface.

Preserve Image 1's camera, crop, people, pose, lighting, materials, folds, shadows, perspective, environment, and background exactly. Change only the controlled social artwork/application.

## Typography fidelity

The approved typography specimen is mandatory whenever text appears. Name the exact display/body families in the prompt; never infer typography from the logo or palette.

After generation, check the output against the specimen. Propose one corrected prompt (and ask before running it) when the letterform character is visibly substituted. If the model still cannot reproduce the approved typography, report the limitation instead of presenting the output as exact.

## Consistency and QA

- Exact copy and spelling
- Correct platform ratio
- Approved logo geometry and color variant
- Approved display/body typography character
- Readable hierarchy and text contrast
- Approved palette only
- No pseudo-text, extra logos, invented CTA, or unsupported claims
- All outputs in one set share the same Brand Lock

## Approval

Show all final graphics in chat and wait for ordinary feedback. Save the approved set through `approve_brandbook_element` with a stable key such as `social-media-graphics` and `required_slots: ["logo","palette"]`; add `"typography"` only for text-bearing graphics.
