---
name: kie-video-explainer
description: |
  Build a complete non-photoreal narrated explainer or story video from
  ordered 10-second blocks: one narrator, one universal style key, one
  Gemini Omni Flash 1.1 clip per block (the narration line is spoken inside
  the clip), first-frame chaining for continuity, then local assembly with
  ffmpeg. Shows the full block plan and total clip count and waits for
  approval before generating anything. Use when: "make an explainer video",
  "explain this in a video", "turn this topic or document into a narrated
  video", "tell this story as an animated video", "make a faceless narrated
  video", or "show me explainer styles". Supports a local style catalog,
  custom style references, mascot/faceless modes, two aspects, and optional
  burned subtitles from a generated .srt. NOT for: photoreal films,
  ads/UGC, on-screen talking heads, podcasts, motion typography reels,
  one-off clips without narration (use kie-generate), or editing a finished
  video.
argument-hint: "[topic or source files] [duration] [language] [aspect ratio]"
allowed-tools: Bash
---

# KIE Video Explainer

Lock one visual style key, write one narration line and one matching visual prompt per 10-second block, get the whole plan approved, then generate one 10-second clip per block. Each clip carries its own spoken narration, so there is no separate voice step. Join the clips locally with ffmpeg.

For SPM content (copy, design, images, strategy), read `docs/spm-brand-brief.md` first.

Scripts (run from the repo root): `scripts/kie_image.py`, `scripts/kie_video.py`, `scripts/kie_upload.py`; the key comes from `KIE_AI_API_KEY` or `.mcp.json`. Local tools: `ffmpeg`, `ffprobe`, `python3`.

Models: GPT Image 2.5 Flare via KIE AI (style key, 1K) and Gemini Omni Flash 1.1 via KIE AI (clips, 1080p, `-d 10`).

## Permission (costs credits)

Video is costly and a film is many clips. Never run `kie_image.py`, `kie_video.py` or `kie_upload.py` without an explicit yes from the user, given for a plan that showed them:

- the full block plan and the final prompts,
- the exact number of calls (style-key image + N clips + frame uploads),
- model, aspect, duration and resolution.

Two gates: approve the plan (this starts the style key and the Block 1 pilot only), then approve the remaining blocks after the user has seen the pilot. Retries, regenerations, extra variants and any change to a prompt, style or setting need a fresh yes. A failed call is reported, not re-run. Local ffmpeg work needs no approval.

## Phase 0: ask first

Collect choices in two separate turns, in this order. Never merge them.

### Turn 1: style only

Read `references/styles.md`. Show the numbered preset names with their "best for" line and STYLE descriptor. Say one short line asking the user to pick a preset, describe a custom style, or attach style-reference images (and that preview swatches are available on request, one image each, after approval), then end the turn. Do not ask production questions in the same turn. Choosing a style is mandatory; never choose silently unless the user explicitly says "you choose."

Skip this turn only when the request already names a preset from the catalog.

### Turn 2: production settings

Only after style selection, collect every unresolved setting:

- Duration: any multiple of 10 seconds. `N = duration_seconds / 10` blocks (one minute is 6 clips). Suggest 30 to 90 seconds; above 18 blocks (3 minutes) say the clip count out loud and ask for explicit confirmation of the size.
- Narration language: English by default, but still offer the choice (French by default for SPM).
- Narrator: pick one from `references/styles.md` or describe one.
- Character: recurring mascot or faceless stylistic scenes. Always ask.
- Aspect: `16:9` by default or `9:16` vertical. Other ratios are cropped from these afterwards (see `references/assembly.md`).
- Continuity: `chained` (default: each block starts from the last frame of the previous one, smooth flow, blocks generated one after another) or `independent` (style key attached to every block, hard cuts between scenes, blocks can run in parallel after the pilot).
- Subtitles: off by default. They are burned locally from a generated .srt, free of credits, with estimated timing. If enabled, make the user choose the font (`Anton`, `Patrick Hand`, `Caveat`, `Permanent Marker`); never choose silently.

Every choice belongs to the user unless they explicitly delegate it.

## Inputs

- Topic or personal/philosophical story.
- Optional local source documents; read/extract them before scripting. They are factual input, not generation media.
- Optional catalog preset, mutually exclusive with custom style-reference images.
- Optional style-reference images. Use only their rendering style and color grading; never copy their people, text, logos, or objects unless requested. They must be public URLs: local files go through `scripts/kie_upload.py`, which needs the user's yes.
- Duration, language, narrator, character mode, aspect, continuity and subtitle choice from Phase 0.

## Hard rules

- Keep every visual strictly non-photorealistic. Repeat the same STYLE descriptor and non-realism negatives in every clip prompt.
- The narration line is the only speech, spoken by an off-screen voice-over inside the clip. No character lip-syncs or speaks, no on-screen text, captions, logos or watermark; everything else in the audio is ambient sound or music.
- Exactly one clip per block and one narration line per block. Block N narration is always inside Block N clip.
- One clip = one `scripts/kie_video.py -d 10` call, 16:9 or 9:16, 1080p.
- Paste the same STYLE, NARRATOR (and HOST in mascot mode) text into every clip prompt, character for character.
- Write all image/video prompts in English. Only the quoted narration uses the selected language.
- Research real topics before scripting. Do not invent quotes, dates, numbers, or events.
- Assemble locally in the same run once every clip exists. Returning loose clips is a failure.
- Do not promise a perfectly identical voice across clips (best effort), voice cloning, or exact subtitle timing.

## Pipeline

| Phase | Output | Tool |
|---|---|---|
| 0 Ask | style first; then duration, language, narrator, character, aspect, continuity, subtitles | user questions |
| R Research | verified facts and sources | available research tools |
| 1 Plan | STYLE, N narration lines, N block prompts, call count (nothing generated) | reasoning |
| 2 Approval gate 1 | user approves the full plan | user |
| 3 Style key + pilot | style key image, Block 1 clip | `kie_image.py`, `kie_video.py` |
| 4 Approval gate 2, then clips | Blocks 2 to N | `kie_video.py` (+ ffmpeg, `kie_upload.py` when chained) |
| 5 Assemble | one final MP4 | ffmpeg |
| 6 Subtitles (optional) | burned-in captions | `make_srt.py` + ffmpeg |

Read `references/prompts.md` before Phase 1. Read `references/assembly.md` before Phases 4 to 6.

## Phase R: research

For a real topic, use available web research tools and authoritative sources to verify enough facts for every block. Keep a short Sources list. Never script a factual explainer from memory alone.

For a personal story, skip web research and use only details supplied by the user. Invent nothing factual.

## Phase 1: plan (no generation)

1. STYLE descriptor: take the chosen preset's descriptor from `references/styles.md`, or write one (medium, palette, line/fill behavior, texture/finish, then the mandatory `non-photorealistic, illustrated, not a photo, no live-action, no realism`). For style-reference images, describe their look in the descriptor and use the prefix in `references/prompts.md`.
2. Style key prompt: abstract swatch, or mascot key when character mode is on (templates in `references/prompts.md`). Aspect equals the video aspect.
3. Narration: exactly `N` labeled lines in the selected language.

   ```text
   Block 1
   <line spoken inside clip 1>
   Block 2
   <line spoken inside clip 2>
   ```

   - One line per block: 18 to 22 words in English (15 to 19 in French, Spanish, Italian, German, Portuguese), about 8 seconds spoken. The voice runs from about 0.5 s to 9 s, so a longer line gets cut or rushed.
   - Plain spoken text only: no timecodes, emotion cues, parentheticals, or stage directions.
   - Spell numbers out.
   - Concrete tone; never say "in this video."
   - For a topic, build from hook through payoff. For a personal story, preserve the user's details and protagonist.
4. Block prompts: exactly `N` English prompts from the template in `references/prompts.md` (STYLE, CONTINUITY, CHARACTER, SCENE, MOTION, NARRATION with the line in quotes, AUDIO, NEGATIVE). Mascot mode: Block 1 greets by gesture with mouth closed, the final block waves a sign-off, middle blocks use consistent cameos only when useful. Faceless mode: stylistic scenes only. One clear action per block, ending on a held composition (the last frame feeds the next block when chained).
5. Work directory: `out/explainer/<slug>/`. Save `narration.txt` and `p01.txt` ... `pNN.txt` there (local files, no approval needed).

## Phase 2: approval gate 1 (mandatory)

Present the plan, then stop and wait. Nothing is generated before an explicit yes.

```text
PLAN: <title> | N blocks x 10 s = <total> s | <16:9|9:16> | 1080p
Style: <name> (<STYLE descriptor>)
Narrator: <descriptor> | Language: <lang> | Character: <mascot HOST | faceless>
Continuity: <chained | independent> | Subtitles: <off | font>

Calls I will make if you say yes:
- 1 image, GPT Image 2.5 Flare, 1K, <aspect>: style key
- N video clips, Gemini Omni Flash 1.1, 10 s, 1080p, <aspect>
- <N-1 | 0> frame uploads (chained mode)
Total: <X> KIE calls. No retries included: any retry is proposed and asked separately.

| # | Narration (words) | Scene | Continuity |
| 1 | "..." (20) | ... | style key |
| 2 | "..." (21) | ... | first frame of 1 |

Full prompts: <the shared STYLE / NARRATOR / HOST / NEGATIVE text once, then each block's SCENE, MOTION, NARRATION, AUDIO, or the complete p01..pNN>

Sources: ...
Approve? A "yes" starts only the style key and Block 1 (pilot); you approve the remaining <N-1> clips after seeing it.
```

Apply the user's edits to the files and re-present the changed parts. Only an unambiguous yes counts.

## Phase 3: style key and pilot

After the yes to the plan:

1. Style key (1 image), with `-i <public url>` per style-reference image when the user supplied some (upload local ones first, as approved in the plan):

   ```bash
   python3 scripts/kie_image.py "<style-key prompt>" -a 16:9 -r 1K -o out/explainer/<slug>/style_key.png
   ```

   Use `-a 9:16` for vertical. The command prints `url ...`: keep it as `STYLE_URL` (a public URL usable as `-i`). Look at the saved image when reachable. If it plainly breaks the spec (text, people in a swatch, realism), stop and propose a fix; do not go on to Block 1 and do not regenerate without a yes.

2. Pilot, Block 1:

   ```bash
   python3 scripts/kie_video.py "$(cat out/explainer/<slug>/p01.txt)" -a 16:9 -r 1080p -d 10 -i "<STYLE_URL>" -o out/explainer/<slug>/b01.mp4
   ```

   Add the same `--seed N` to every block if the user wants the best-effort voice/look consistency (choose N once and tell them). Add `--audio-id <id>` (same on every block) only if the user supplied a voice id.

3. Stop. Give the user the Block 1 file or URL and ask them to check three things: the look against the style key, the voice and language, and that the whole line is spoken before the clip ends. Adjust the shared wording or line lengths if needed and re-present (a new approval) before spending more.

## Phase 4: approval gate 2, then the remaining clips

Ask: "Generate blocks 2 to N (N-1 clips, 10 s, 1080p, plus N-1 frame uploads if chained)? Yes/no." Wait for the yes. Then, in block order:

**Chained** (default): sequential, each block depends on the previous file.

```bash
ffmpeg -y -sseof -0.2 -i out/explainer/<slug>/b01.mp4 -frames:v 1 -update 1 out/explainer/<slug>/b01_last.png
python3 scripts/kie_upload.py out/explainer/<slug>/b01_last.png
python3 scripts/kie_video.py "$(cat out/explainer/<slug>/p02.txt)" -a 16:9 -r 1080p -d 10 --first-frame "<URL printed by the upload>" -o out/explainer/<slug>/b02.mp4
```

Repeat with block N-1's last frame for block N. Use `--first-frame` alone (not together with `-i`). Look at each last frame before chaining from it. Small drift accumulates: if the style or a character drifts, stop and propose re-anchoring that block on the style key (`-i "<STYLE_URL>"` instead of `--first-frame`, accepting a hard cut) or a prompt fix, and ask before running it.

**Independent**: attach the style key to every block; after the yes the remaining blocks may run concurrently.

```bash
python3 scripts/kie_video.py "$(cat out/explainer/<slug>/p03.txt)" -a 16:9 -r 1080p -d 10 -i "<STYLE_URL>" -o out/explainer/<slug>/b03.mp4
```

Use `-a 9:16` for vertical. After every call, check for the `saved` line; if the file is not local (result host blocked), give the user the URL and ask them to download it into the work directory (`references/assembly.md`). Chaining cannot proceed without the local file: offer independent mode instead.

## Phase 5: assemble locally

Once all `N` clips exist locally and pair one-to-one with the block numbers (no missing or duplicate file), probe them, build `list.txt`, concatenate with ffmpeg, and verify the duration: exact commands in `references/assembly.md`. Total is about `N x 10` seconds. No approval is needed.

## Phase 6: subtitles (optional)

If the user chose subtitles: `scripts/make_srt.py` builds `narration.srt` from `narration.txt`, then ffmpeg burns it into a copy (`final_sub.mp4`); commands and font notes in `references/assembly.md`. Say the timing is estimated and offer to shift it with `--offset` after they watch it.

## Checkpoints and recovery

- Before Phase 3: the user's yes on the full plan, exactly `N` narration lines and `N` prompts, all saved in the work directory.
- Before Phase 4: the pilot reviewed and the second yes given.
- Before Phase 5: `N` clips saved locally, each with video and audio streams.
- Style drift or realism: strengthen the shared STYLE and NEGATIVE text, show the change, and ask before regenerating only that clip.
- Line cut off or rushed: shorten that block's narration, show it, ask before regenerating only that clip.
- Wrong or garbled words: spell numbers and acronyms phonetically in the line, ask before regenerating only that clip.
- Two identical failures mean the prompt or parameters must change; propose the change instead of re-running.
- A failed or interrupted call is reported to the user with the error; never re-submit it unasked.

## Deliver

Return the local path of the final video (and the subtitled copy if made), exact duration from `ffprobe`, aspect, narration language, selected style, narrator, subtitle status, and a Sources list for researched topics. Keep intermediate URLs internal unless requested. If clips could not be downloaded, list the URLs and what is missing.
