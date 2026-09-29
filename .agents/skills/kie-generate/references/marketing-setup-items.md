# Hooks And Settings

Reusable prompt blocks for video ads. They are text templates in this file, not server objects.

- **Hook** sets the opening angle (first 2 seconds). The hook block is placed in the `HOOK:` slot of the generator (`marketing-modes.md`) and shapes `BEATS` 0-2s; it does not replace the rest of the prompt.
- **Setting** sets the scene or environment; it fills the `SETTING:` slot.
- **Mode whitelist.** Valid only for `ugc`, `ugc_how_to`, `ugc_unboxing`, `product_review`, `ugc_virtual_try_on`. For `product_showcase`, `tv_spot`, `wild_card`, `virtual_try_on` don't use them.
- **Mutually exclusive with ad references.** If the user is rebuilding an ad reference (`marketing-ad-references.md`), don't also use hooks/settings. Either reference-driven or composed-from-blocks.
- **Product context.** Hooks are designed to pivot into a product pitch and are weak without a product card (`marketing-products.md`).

## Hook library

Pick by the angle the brief needs (or offer 3 and let the user choose). Each hook is a first line + first action; replace `{...}`.

| Hook | Pattern (first 2 s) | Works for |
|---|---|---|
| Problem call-out | "Still {struggling with pain}?" while showing the annoying situation | any product with a clear pain |
| Bold claim | "This {product} replaced my {old solution}." | consumer, review |
| Curiosity gap | Presenter hides the product behind their back: "I wasn't going to show you this." | unboxing, reveal |
| Story opener | "Three weeks ago I {situation}..." | testimonial, service |
| Question | "What if {benefit} took {short time}?" | service, app |
| Social proof | "Everyone keeps asking where I got this." | fashion, lifestyle |
| Before/after tease | Split gesture: "This was me yesterday. This is today." | beauty, fitness, tools |
| Myth-buster | "Everyone says {myth}. Not true." | expert, B2B |
| POV | "POV: you finally {desired outcome}." with the point of view shot | social-first |
| Direct offer | "{Offer} today only, here's why." | promo |

## Setting library

| Setting | Block |
|---|---|
| Kitchen morning | sunlit kitchen counter, coffee mug, soft window light, lived-in |
| Bathroom mirror | tidy bathroom, mirror selfie angle, warm vanity light |
| Home desk | desk with laptop and plant, daylight, natural clutter |
| Open-plan office | bright modern office, glass walls, colleagues out of focus |
| Car | parked car, front seat, daylight through windscreen |
| Street | urban pavement, natural daylight, passers-by out of focus |
| Gym | gym floor, bright overhead light, equipment behind |
| Bedroom | bedroom, bed and lamp, soft evening light |
| Studio white | seamless white or grey backdrop, soft key light (for polished modes) |
| Outdoors | park or terrace, golden hour, greenery |

Add specifics (props, time of day) to make it match the product. Custom hooks and settings from the user are used as written.

## Using them

1. Pick or write the hook and setting after the product card.
2. Put them into the generator slots; keep the setting sentence identical across clips of the same ad.
3. Do not copy the hook line into other slots; if the user wants it reinforced (e.g. said again at the end), write that beat explicitly.
