# Moana Beauté (Shopify theme)

This branch (`moana-beaute`) holds Moana Beauté only. Keep other projects off it, and keep Moana off other branches.
Start with `README.md`, then `docs/HANDOVER.md` and `docs/DESIGN-SYSTEM.md`.

## Generation permission (hard rule)

- Never generate anything (image, video, or any KIE AI call that creates a task, including tests and API probes) without the owner's explicit permission for that specific generation. It costs credits. Show the prompt, model and settings and wait for a clear yes.

## Store safety

- Work on the unpublished preview theme only (Moana Beauté v2 (preview), id 191582306594). Never publish a theme or change payment settings.
- No WhatsApp. The Mauritian payment processor will be connected later; name no processor in the theme.
- Upload order and method are in `README.md`. Verify every upload by checksum (JSON templates and section groups by content: Shopify adds a comment header).

## Brand and copy

- Official logos only, never recoloured or distorted (`brand/`). White page ground. Raleway on the golden-ratio scale; Pinyon Script only as a rare accent.
- Shoppers are Mauritian women; the voice is warm and direct.
- No invented facts, claims, reviews or fake functionality.
- Minimal and premium: generous white space, one solid button per view at most (see `docs/DESIGN-SYSTEM.md`).

## Before each push

- Run the local preview tests (`README.md`) and Theme Check; all green.
