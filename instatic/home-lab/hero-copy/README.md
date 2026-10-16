# Home Lab: clearer hero copy, "three problems" cards, new card photos

**Status: in draft, not published.**

Goal (client brief): a visitor understands immediately what SPM does. Animations, motion and scrolling are untouched; only text, the card photos and SEO tags change.

## Copy

`copy-changes.json` lists every change as `[old, new]` pairs (`hero` = the three scroll scenes, `fix` = the cards section). In short:

- **Scene 1 (orb):** "Externalisez votre service client avec une équipe dédiée." with the four services in the capitals line and a concrete support paragraph.
- **Scene 2 (woman):** "Recrutés, formés et encadrés par SPM, vos conseillers francophones deviennent…", channels and languages in the paragraph, and the 01–04 row now names the services (Relation client, Back-office, Prospection, Recrutement).
- **Scene 3 (brain):** headline kept ("l'équipe qui connaît vraiment votre métier."); the side text now says concretely what the AI and the advisers do.
- **Cards:** "Trois problèmes que SPM règle pour vous." with one card per problem: customer service, back-office, recruitment.
- **Hidden H1 and intro paragraph:** rewritten around the same search phrases.
- **Section labels:** the two scenes' `aria-label`s match the new headlines.

Fit, measured in Bricolage Grotesque:
- **Desktop and tablet (1024 to 1920 px):** every hero block keeps its exact height.
- **Phone (390 px):** scene 1's headline is one line shorter and scene 2's one line longer, with no overflow.
- **Cards:** all three now have equal heights, with two-line titles.

## SEO

`hlab-spm-seo.js` (Instatic fileId `wda_HeZ_JSJJaL6n5qhAX`, sha256 `4b3d357868a1121eeb34122f668fdfcbb4d1dcc074559ff31d1a8abe900b631a`) holds the new tab title, meta description (156 characters), Open Graph tags and schema.org Organization and Service descriptions. The page is still `noindex` until it is promoted. Rollback: `../rollback-2026-10-07/scripts/hlab-spm-seo.js` (sha256 `33cd0af7…`).

## Card photos (Pexels, free licence, no attribution required)

| Card | Pexels photo | Instatic upload |
|---|---|---|
| 01 Service client | [8204396](https://www.pexels.com/photo/woman-sitting-behind-a-table-working-as-call-center-agent-8204396/) | `/uploads/J6UIei8qvvLIl3DL8ywnY-externalisation-service-client-conseillere-casque-pexels-8204396-w1600.webp` |
| 02 Back-office | [8297040](https://www.pexels.com/photo/woman-using-laptop-sitting-at-the-table-8297040/) | `/uploads/-eOY9LKmwmRszq3ZdiIYb-externalisation-back-office-saisie-factures-pexels-8297040-w1600.webp` |
| 03 Recrutement | [18848927](https://www.pexels.com/photo/young-woman-in-business-attire-shaking-hands-with-recruiting-manager-after-job-interview-18848927/) | `/uploads/tip2eimz9I9N-aC5Pv-NH-externalisation-recrutement-poignee-de-main-pexels-18848927-w1600.webp` |

- **Format:** 1600 px WebP, 66–103 KB each, with descriptive filenames.
- **Accessibility:** each image block has `role="img"` and a French `aria-label`.
- **Previous photos:** Pexels 8867405, 7688174 and 7658250. They are still in the media library.

## Previews

`preview-scene1.png` to `preview-scene3.png` show current (left) and new (right) copy from the local test page. That page still has the old square buttons. `preview-cards.png` shows the new cards.

## Rollback

Restore the text and images from `../rollback-2026-10-07/page/home-lab-root.html`, restore the SEO script above, then publish.
