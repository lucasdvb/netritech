# Generation permission (hard rule)

- Never generate anything (image, video, or any KIE AI call that creates a task, including tests and API probes) without the user's explicit permission for that specific generation. It costs credits. This overrides any skill, script or workflow that says to generate, retry or iterate automatically. Show the prompt, model and settings and wait for a clear yes first.

# SPM brand

- When talking about SPM (copy, design, images, strategy), read `docs/spm-brand-brief.md` first. It holds the full brand brief: identity, strategy, voice, logo, colors, typography and visual universe.

# Image generation

- Default model for text-to-image AND image-to-image: **GPT Image 2.5 Flare** via KIE AI, 1K.
  - KIE model IDs: `gpt-image-2-5-flare-text-to-image`, `gpt-image-2-5-flare-image-to-image`
  - Use `scripts/kie_image.py "prompt" -a 21:9 -r 1K -o out.png` (add `-i <public image url>` for image-to-image). It reads the key from `KIE_AI_API_KEY` or `.mcp.json`.
- The kie-ai MCP tools only offer Nano Banana; don't use them unless the user asks.
- Result images are served from `tempfile.aiquickdraw.com`, which may be blocked by the sandbox network policy; if so, give the user the URL.
- Brand palette (SPM): Ink navy #0D141F, Deep navy #1B2A38, Steel blue #43617A, Teal #22808A, Light grey #DADDE0.

# Disruptive Dodo images

- Every generated image for the Disruptive Dodo site follows `dd-site/docs/image-direction.md`: black and white, the base alternating black / white, and one small accent detail in lime #E1FF01 (no blue). Work one image at a time from the client's reference. The generation permission rule above still applies to each one.
