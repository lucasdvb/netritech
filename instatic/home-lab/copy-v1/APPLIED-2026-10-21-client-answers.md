# Client answers round (email 2026-10-21), applied in the Instatic draft, not yet published

- "Marque" removed everywhere except SPM itself: clients -> "entreprises", client identity -> "activité" / "votre entreprise", reputation -> "votre image". Pages: homepage, Solutions, Clients, shared closing section, SEO script (meta, FAQ schema).
- Contract: FAQ "engagement" answer = no minimum term after the 3-month test, notice agreed between the parties, depends on sector and number of FTE. Reversibility answer aligned.
- CRM answer: no CRM named; market CRMs connect, in-house CRM needs a little development.
- Pic reinforcement delay: "quelques jours" -> "2 à 6 semaines" (homepage and Pourquoi SPM cards, homepage commercial card, SEO FAQ). SEO FAQ start-up delay aligned with the visible FAQ (2 to 6 weeks).
- 40 % savings: FAQ states it as the average seen at clients.
- Sectors: new list ADDED to the old one (17 sectors, Santé once). Descriptions for the new ones are ours, not SPM's.
- Offices: Lyon = siège, Aix = bureau de production, both use 04 81 65 98 45 (Contact page).
- 7 languages confirmed (Pourquoi SPM stat).
- "La fusion de l'humain et de l'IA, au service de votre croissance" (charter wording): end of the Human & AI block (Pourquoi SPM) and SEO description. Hero subtitle not added (homepage hero left as is).
- 1.07 margin note ignored. Absence cover: no change, "agents" -> "conseillers" in that answer.
- Fixed: list items (homepage closing steps, Carrières values) and the Contact phone span had not taken earlier edits; redone with replace_node_html.

Follow-up (same day, user decisions)
- Growth line wording: "La fusion de l'humain et de l'IA pour votre croissance" (Pourquoi SPM Human & AI block, SEO description and schema).
- Homepage hero: the tagline under the title now reads that line (the four services still appear in the scroll scene and the hidden H1 text).
- Secteurs: 17 sectors (new list + previous six, Santé once) in two columns on desktop (>=1025px), column-major order (9 + 8). CSS in spx-base.css (.sec-cat .sec-rows). Hover band follows the hovered row's column (patch in spx-font.js place()). One column on tablet and mobile.
