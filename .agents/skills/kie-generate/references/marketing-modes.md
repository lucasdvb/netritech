# Marketing Modes and the Video Ad Generator

Nine ad modes, each a prompt recipe on the video model (Gemini Omni Flash 1.1). Everything is assembled locally: pick a mode, fill the slots, show the prompt to the user (Permission rule), then run `scripts/kie_video.py`.

| Mode | Label | Hook/setting | Best for |
|---|---|---|---|
| `ugc` | UGC | yes | Default. Casual, organic-feel content from a presenter. |
| `ugc_how_to` | Tutorial | yes | "Here's how to use this." Tutorial / explainer. |
| `ugc_unboxing` | Unboxing | yes | "Just got this in the mail." Unboxing reveal. |
| `product_showcase` | Product Showcase | no | Clean product highlight, polished, little or no presenter. |
| `product_review` | Product Review | yes | Presenter giving an opinion on the product. |
| `tv_spot` | TV Spot | no | Broadcast-style commercial. Higher production. |
| `wild_card` | Wild Card | no | Experimental; you choose an unexpected concept. |
| `ugc_virtual_try_on` | UGC Virtual Try On | yes | Person trying on clothing/accessories, UGC vibe. |
| `virtual_try_on` | Pro Virtual Try On | no | Same but polished, studio look. |

Hook/setting blocks (`marketing-setup-items.md`) are valid only for the modes marked yes. They are never combined with an ad reference (`marketing-ad-references.md`).

**Default when the user doesn't specify:** `ugc`.

## Picking flow

- "Looks like a real person filmed on phone" -> `ugc` family (`ugc`, `ugc_unboxing`, `ugc_virtual_try_on`, `ugc_how_to`)
- "Polished broadcast commercial" -> `tv_spot`
- "Show the product itself, less presenter" -> `product_showcase`
- "Presenter giving an opinion" -> `product_review`
- "Try clothing on someone" -> `virtual_try_on` (polished) or `ugc_virtual_try_on` (organic feel)
- "Surprise me / something different" -> `wild_card`

## Settings for the video model

| Parameter | Value |
|---|---|
| Aspect `-a` | `9:16` for UGC/social (default for UGC modes), `16:9` for `tv_spot`, `product_showcase` and web. `1:1`/`4:5` = generate 9:16 and crop. |
| Clip length `-d` | 4, 6, 8 or 10 s. Ad length 15 s = 10 + 6, 30 s = 3 x 10. See the clip plan below. |
| Resolution `-r` | `1080p` |
| References `-i` | up to 7: product images first, then presenter image(s), then setting/style |
| Audio | written in the prompt (dialogue, effects, music mood); no separate audio model |

## Generator template

Fill every slot. Unused slots are deleted, not left blank.

```
FORMAT: {aspect} {duration}s {mode look: "handheld phone-shot UGC video" | "polished broadcast commercial" | ...}.
PRESENTER: {presenter card sentence, identical in every clip | "the person in image 2" | none}.
PRODUCT: {product card line}. The product is exactly as in image 1: same shape, colors, label and logo; never altered.
SETTING: {setting block or one line: place, time of day, props}.
HOOK: {hook block: the first 2 seconds}.
BEATS: 0-2s {hook action + line}. 2-{x}s {demo/reaction/benefit}. {x}-{duration}s {payoff + CTA action}.
CAMERA: {handheld selfie | tripod medium | slow push-in | macro detail | ...}.
LOOK: {light, palette, lens, grade}.
AUDIO: {presenter says, in a warm natural voice: "..."} {sound effects} {music: mood, level, or none}.
RULES: no on-screen text, subtitles or logos; hands and product stay in frame; natural skin and movement.
```

Rules:

1. Spoken lines: about 2.5 words per second, one idea per clip. Put dialogue in quotes with delivery.
2. Product fidelity is the top constraint: always pass product images and repeat "exactly as in image 1".
3. Keep on-screen text out of the prompt; add captions/CTA/logo in post (`workflows.md`).
4. For a chain of clips, the presenter sentence, setting sentence and LOOK line are copied verbatim into every clip; pass the previous last frame as `--first-frame`.
5. Add a brand kit prefix (`marketing-brand-kits.md`) to LOOK when the brand is known.

## Clip plans (ad length)

| Length | Clips | Structure |
|---|---|---|
| 8-10 s | 1 | hook (0-2) / proof (2-7) / CTA (last 2) |
| 15 s | 10 s + 6 s | clip 1: hook + problem + demo; clip 2: result + CTA (trim to 15 s) |
| 30 s | 3 x 10 s | hook + problem / solution + demo / proof + CTA |

## Mode recipes

Each recipe lists the changes to the template. Examples are complete `BEATS` lines; fill the rest from the template.

### ugc
Selfie or phone-propped, natural window light, imperfect framing, casual speech, product shown by hand.
`BEATS: 0-2s looks into the camera, "Okay, I need to tell you about this." 2-6s holds up the product, shows one feature. 6-8s smiles, "Honestly, worth it." `
CAMERA: handheld selfie, slight shake. AUDIO: room tone, no music or very quiet.

### ugc_how_to
Presenter demonstrates 2-3 steps at a table or counter. Numbered beats, hands and product close, overhead or medium shot.
`BEATS: 0-2s "Here's how I use it." 2-7s step 1, step 2 in hand close-ups with matching sound effects. 7-10s result shown, "That's it."`
Ask for one step per clip if the sequence is long.

### ugc_unboxing
Package arrives, opening, first reaction, product reveal held to camera. Sounds: tape, cardboard, tissue paper. Genuine surprise, short lines.
`BEATS: 0-3s parcel on the table, "It finally came." 3-7s opens, lifts the product out. 7-10s turns it to the camera, "Look at this."`

### product_showcase
No or minimal presenter; slow orbit or push-in, macro detail, clean surface, controlled highlights. Music bed allowed, no speech unless a short brand line. Use `16:9` or `9:16`.
`BEATS: 0-3s slow orbit around the product on a matte surface. 3-7s macro of texture/detail. 7-10s pull back to hero angle.`

### product_review
Presenter gives an honest opinion, one pro and one nuance, product in hand or on the desk, medium shot, conversational.
`BEATS: 0-2s "I've used this for a month, here's my take." 2-7s shows what she likes and one small con. 7-10s verdict, "Yes, I'd buy it again."`

### tv_spot
Cinematic, tripod/dolly/crane, designed light, hero product moments, stylized cut structure inside one clip kept simple, voice-over line and music swell described in AUDIO. `16:9`.
`BEATS: 0-3s establishing shot, mood. 3-7s product hero move, benefit in voice-over. 7-10s end frame on the product with room for a logo (added in post).`
AUDIO: confident voice-over "...", orchestral or electronic build, sound design.

### wild_card
Pick a concept the user would not have asked for (a surreal transformation, an impossible camera move, a stop-motion look) and state it in one line to the user with the prompt. Keep product fidelity rules. Ask before generating.

### ugc_virtual_try_on
Presenter in front of a mirror or selfie, puts on / turns to show the garment or accessory (image 1 = the item, image 2 = the presenter if supplied). Fit, fabric movement and a reaction line.
`BEATS: 0-2s holds the item, "Trying this on." 2-6s puts it on, turns left and right. 7-10s mirror check, "Fits perfectly."`
Only with a presenter who consented; item shown exactly as in the reference.

### virtual_try_on
Studio version: neutral backdrop, soft key light, full-body then detail, slow turn, fabric moves naturally, no speech, light music. Same item-fidelity rule.

## Worked example (SPM-style employer brand UGC, 9:16, 10 s)

```
FORMAT: 9:16 10s handheld phone-shot UGC video.
PRESENTER: a Mauritian woman in her late twenties, dark shoulder-length hair, navy blazer over a white tee, warm smile.
SETTING: bright open-plan office in Port Louis, glass wall behind her, morning light.
HOOK: she turns to the camera mid-stride, "Tu cherches une équipe qui reste ?"
BEATS: 0-2s hook. 2-7s she walks past colleagues laughing at their desks, gesturing around. 7-10s stops, faces camera, "Chez SPM, c'est la même équipe, chaque année."
CAMERA: handheld selfie-style, slight shake, eye level.
LOOK: natural light, palette Ink navy #0D141F and Teal #22808A accents in the environment, soft grade.
AUDIO: warm natural voice in French, office ambience, no music.
RULES: no on-screen text or logos; natural skin and movement.
```
(Written from the SPM brief: warmth and sophistication, continuity as the message. Read `docs/spm-brand-brief.md` before writing copy.)
