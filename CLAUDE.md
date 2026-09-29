# SPM hero film: project memory

Project: 8-second premium website hero film for SPM (French human + AI outsourcing company). Work lives in `hero-video/`.

## Standing rules (set by the user)
- **Never generate anything (image or video) without explicit permission.** Wait for a clear go-ahead each time. Generations cost KIE credits.
- **Video model: `google/gemini-omni-flash-1-1`, at 1080p, unless the user says otherwise.** This replaces Veo 3.1 (`veo3` / `veo3_fast`), which was used earlier.
- **Before creating ANY media via KIE AI (image or video), tell the user the cost of that generation and the current credit balance, then wait for their go-ahead.** Get the balance live with `GET https://api.kie.ai/api/v1/chat/credit` right before asking. If the exact cost is not known (KIE's pricing page and docs are not reachable from this environment), say so plainly and give the best estimate with how it was derived (e.g. observed balance drop on a previous run of the same model and settings); never invent a number. After each generation, re-check the balance and record the observed cost in "Observed KIE costs" below.
- Videos must be **silent**. Strip any audio track after download (`ffmpeg -an -c:v copy`).
- Use the user's prompts **verbatim**. Flag anything appended or changed.
- No logos, text or watermarks in any generated frame.
- Report results honestly, including flaws. The user rejected the first Veo runs as "low quality AI slop".

## Image models (KIE, user-specified)
- **Defaults: 1 generation at 1K, unless the user states otherwise.** (Earlier requests explicitly asked for 2 generations at 2K; that was per-request, not the default.)
- Two model families. Use the one the user names; if they do not name one, ask.
  - **flare**: text-to-image `gpt-image-2-5-flare-text-to-image`, image-to-image `gpt-image-2-5-flare-image-to-image`.
  - **sunburst**: text-to-image `gpt-image-2-5-sunburst-text-to-image`, image-to-image `gpt-image-2-5-sunburst-image-to-image`.
- Image-to-image takes a reference image (upload it first, see API notes).
- Only the flare models have been tested here. Sunburst parameters are assumed to match flare (`aspect_ratio`, `resolution`, `input_urls`); check the first response before relying on that.

## Observed KIE costs
No per-generation costs were recorded before this rule existed. Known only: balance went 981 → 191 credits across the whole earlier session (2 Veo 3.1 Quality videos, each with a 1080p fetch; 3 `veo3_fast` 720p variants; 8 images), and one Veo 3.1 Quality first+last-frame job was refused with 402 because 191 was not enough. Record real per-model costs here as they are measured.

## Brand
SPM colours: Ink/Bleu Nuit `#0D141F`, Slate/Bleu Ardoise `#1B2A38`, Steel/Bleu Acier `#43617A`, Teal/Sarcelle `#22808A`, Pearl/Gris Perle `#DADDE0`, Mist/Blanc brume `#F9FAFB`.
Teal is a restrained accent only. No neon, no cyberpunk, no lasers, no Tron look.
Logo rule: never use Nuit or Sarcelle as weakened tints next to the logo (no logo appears in the film).

## Creative direction (agreed)
- Story: HUMAN → MICROPHONE → INTELLIGENCE → MICROPHONE → HUMAN → GRID. One continuous camera move, no cuts. Camera enters the headset mic's **foam** (soft black acoustic foam windscreen, never a metal grille), passes through a tiny opening into the AI world, exits via a second headset mic into a real workplace, then dissolves to a dark grid with one teal signal.
- Only the **headset** mic, never a second stand or studio mic in the first frame.
- First frame: bright, friendly workplace, curly-haired mixed-race agent, candid, not looking at camera.
- Last frame: dark ink-navy spatial grid, clean centre and top for headline, single teal pulse.
- Reference source video ended on a faint grid on near-black, with warm-to-cool arc and smoky tendrils.

## Approved frames (in `hero-video/frames/`)
- First frame pick: `frame01-i2i-bfb16e28.png` (2K). Alternative: `frame01-i2i-f6a9fa9b.png`.
- Last frame pick: `frameLAST-e0426640.png` (2736×1536). Alternative: `frameLAST-65e9800d.png`.
- The final run used the user's own supplied first/last frames, saved in `hero-video/final/` as `first_1080.jpg` and `last_1080.jpg`, with the full prompt in `hero-video/final/prompt_final.txt` (about 26k characters).

## KIE AI API notes (verified in this session)
- Key is in env var `KIE_AI_API_KEY`. Balance check: `GET https://api.kie.ai/api/v1/chat/credit`. **Balance was 191 credits** at last check, after starting at 981.
- Veo (old): `POST /api/v1/veo/generate`, poll `GET /api/v1/veo/record-info?taskId=`, then `GET /api/v1/veo/get-1080p-video?taskId=` (a separate async job that errors until ready). Responses arrive as 720p with audio; the 1080p fetch is needed. A Quality run with first+last frames failed with 402 insufficient credits.
- Images: `POST /api/v1/jobs/createTask` with `{model, input:{prompt, aspect_ratio, resolution}}`, poll `GET /api/v1/jobs/recordInfo?taskId=`, results in `resultJson.resultUrls`. For image-to-image, pass the reference in `input.input_urls`.
- Reference uploads: `POST https://kieai.redpandaai.co/api/file-base64-upload` (needs that host allowed in the environment network policy; it is allowed now). Returns `data.downloadUrl`.
- **The parameters for `google/gemini-omni-flash-1-1` are not yet known or tested.** Check KIE's docs (docs.kie.ai is blocked from this environment) or ask the user before the first call. Do not guess and spend credits.
- Scripts in `hero-video/` (`generate.py`, `gen_exact.py`, `frames/gen_image_i2i.py`, `final/gen_final.py`) are working templates.

## Lessons learned
- Text-to-video cannot reliably fly through a mic from one prompt; it tends to zoom into a flat image. First/last-frame chaining or short staged clips work better.
- Generated earcups sometimes carry garbled logo badges. Zoom to native resolution to check before approving.
- Foam texture usually renders smooth; "irregular fibres" rarely show.
- The container is ephemeral: commit and push work to `claude/relaxed-maxwell-5yrar8`.
