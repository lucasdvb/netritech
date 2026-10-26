# spmservices.fr (current site) vs the new site: what is missing

Crawled 2026-10-26. The current site is WordPress (Yoast). It has 6 content pages, 4 legal pages and an empty news page (/actualites/ shows "Nothing Found").

| Current URL | Page | Covered on the new site? |
|---|---|---|
| / | Accueil | Yes |
| /service-client-sav/ | Service client & SAV | Yes, Solutions #s1. Missing: "service consommateur" |
| /developpement-commercial/ | Développement commercial | Mostly, Solutions #s2. Missing: détection de besoins, enrichissement de base de données, gestion de portefeuille client |
| /satisfaction-client/ | Enquête de satisfaction | Yes, Solutions #s3, including the 4 steps |
| /service-client-sav-2/ | Qui sommes-nous ? | Mostly, Pourquoi SPM. Missing: the 6-step process, "groupe français, siège dans la région lyonnaise" |
| /developpement-commercial-2/ | Services sur mesure | Mostly, Solutions #s4, #s5, #s7. Missing: the audit to assess whether to outsource |
| /contact/ | Contact | Yes (Dardilly and Port-Louis addresses, phone, e-mail) |
| /mentions-legales/ | Mentions légales | NO: the footer link goes to "#" |
| /politique-de-confidentialite/ | Politique de confidentialité | NO: the footer link goes to "#" |
| /gestion-des-cookies/ | Gestion des cookies | NO (needed only if trackers or analytics are added) |
| /plan-du-site/ | Plan du site | NO (optional) |

## Content that exists on the current site and could be added now

1. The 6-step process ("Un process qui ne laisse rien au hasard"), shown on 4 of the current pages. On the new site it only appears in a short FAQ answer.
   1. Définition de vos besoins: analysis of the organisation and processes, advice, job description, guideline.
   2. Sélection des profils: sourcing, shortlist, validation interview with the client and the manager.
   3. Supports de formation: training material built with the manager and adapted to the client's tools, remote access to the client's tools.
   4. Intégration & formation: training by the client with the manager, then continuous training by SPM managers.
   5. Mise en production: launch, daily check-in with the manager, strengths and weaknesses feed the training plan.
   6. Suivi & satisfaction: tailored reporting (quality and volume), daily, weekly or monthly reviews, a monthly review with sales and the manager.
2. The real-time wallboard: the client sees the team's figures live, with KPIs set for their activity.
3. The audit: an analysis of whether outsourcing makes sense, with a diagnosis to support the decision.
4. Missing services:
   - Service consommateur (customer service).
   - Détection de besoins, enrichissement de base de données, and gestion et fidélisation du portefeuille client (sales).
5. Trust line: a French group with its head office near Lyon.
6. The real LinkedIn URL: https://www.linkedin.com/company/service-premium-services/ (the new footer links LinkedIn, Facebook and Instagram to "#").

## Legal data available for the Mentions légales page

- Raison sociale: SPM Services.
- TVA intracommunautaire: FR02884459512.
- Capital social: 10 000 €.
- RCS: Nanterre B 884459512.
- Directeur de la publication: Léopold Chevallier.
- Siège: 8 chemin du Jubin, 69570 Dardilly.
- Still needed:
  - The new host's details: Instatic or wherever the site will be hosted.
  - The new site creator: Disruptive Dodo.
  - Whether the RCS (Nanterre) and the head office (Dardilly) are still current, since they do not match.

## Technical points for launch

- Redirects (301) from the current URLs, so Google rankings and old links are not lost:
  - /service-client-sav/ → /solutions#s1
  - /developpement-commercial/ → /solutions#s2
  - /satisfaction-client/ → /solutions#s3
  - /service-client-sav-2/ → /pourquoi-spm
  - /developpement-commercial-2/ → /solutions#s7
  - /contact/ → /contact
  - /actualites/ → /actualites
  - the legal pages to their new pages
- The new site has no /sitemap.xml and no /robots.txt yet (both 404 on staging).
- No cookie banner is needed today: no analytics or trackers were found on the new site. If analytics are added, a consent banner and the cookies page become mandatory (CNIL).

## Done on 2026-10-26

- Point 1: Mentions légales, Politique de confidentialité and Gestion des cookies pages created and linked from the footer. The shell shows only the footer on these pages, no lead form or FAQ.
- Point 2: the 6-step method, as a new "Notre méthode" section on Pourquoi SPM (#methode).
- Point 3: the live wallboard, as a "Vos chiffres en direct" card in that section.
- Point 4: the audit, in the Solutions "Sur mesure" block, with a "Demander un audit" button.
- Point 5: "service consommateur" added to Solutions s1, "détection de besoins" and "gestion / fidélisation du portefeuille client" to s2 (overview and detail).
- Point 6: "un groupe français dont le siège est dans la région lyonnaise" added to the Pourquoi SPM story.
- Still open:
  - The LinkedIn, Facebook and Instagram footer links still go to "#".
  - Redirects, sitemap.xml and robots.txt are not done yet.
