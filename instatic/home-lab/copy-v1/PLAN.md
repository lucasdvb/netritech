# SPM copy round 1: plan of changes (from the client's annotated PDF)

Source: `Contenu_site_web.pdf` (34 pages, scanned):
- Pages 1–15: the homepage, blocks A.01–A.72. They were printed from `/spmv3`, so each block is mapped to its place on the new homepage `/`.
- Pages 16–34: the inner pages, blocks C.01 and 1.01–7.08.

Client's rule: *everything in pink is for SPM to review on their side; rework the rest using the comments.*

How the PDF is marked up and how I read it:

| Mark | Status | What we do |
|---|---|---|
| Pink highlight or pink arrow, `[à confirmer]`, "VH" | ⏳ SPM | Waiting on SPM; not touched. |
| Green highlight with a correction written beside it | ✅ | Apply the correction. |
| Handwritten correction with no pink | ✅ | Apply the correction. |
| Yellow highlight, or "à confirmer" written in pencil | ⏳ SPM | Waiting on SPM. |
| The comment names a problem but gives no wording | ❓ | Needs your decision; I propose wording. |

Scope:
- The website only: `/` and the seven inner pages. SPM V2 and V3 are not touched.
- The shared blocks are one source each, so a change there shows on every page:
  - the FAQ, A.34–A.70 (`hlab-spm-faq.js`);
  - the closing contact section, A.33 (page markup plus `hlab-0-shell.js`);
  - the footer, A.71 / C.01 (`hlab-spm-chrome.js`).
- Nothing is published until you approve.

---

## 0. Decisions needed before writing (❓)

1. **One word for the people.** The client asks: "Agents / Conseillers / Collaborateurs ?"
   - Proposal: **conseillers** for the people who talk to the client's customers.
   - **collaborateurs** for SPM staff in general (recruitment, training, retention).
   - **Never "agents".**
   - This touches about 15 blocks (A.11, A.36, A.38, A.49 and others).
2. **"Partenaires" or "clients"** (A.31, to adjust "across the whole document").
   - Proposal: the logo wall on the homepage and Clients & Partenaires becomes **"Ils nous font confiance."**
   - "Partenaires" is kept only for the tools and companies SPM works with (3.07).
   - The logos themselves are pink and wait for SPM.
3. **One response time and one contact journey on every page** (A.33 vs 6.02).
   - "Le jour même" contradicts the contact page, where the time is still `[à confirmer]` in pink.
   - Proposal until SPM confirms: title **"Contactez-nous : on revient vers vous rapidement."**
   - The list of steps becomes the contact page's three steps:
     1. we read your request;
     2. a discovery call;
     3. a team proposal.
   - "ROI" is removed (marked "jargon").
4. **One start-up time.** A.11 and A.25 say "en quelques jours", A.39 says "quelques semaines", A.40 says "deux à six semaines".
   - Proposal: A.40 is the reference.
   - Everywhere else: **"en quelques semaines"** for a new team, **"rapidement"** for adjusting headcount on an existing team.
5. **A.52 vs A.55 contradict each other.** One says agents are trained across several sites for continuity; the other says teams are 100% dedicated.
   - Proposal for A.52: *"Chaque conseiller a un binôme formé sur votre dossier : en cas d'absence, il prend le relais sans interruption."*
   - A.55 stays as it is, without "100 %" (*"Les équipes SPM sont dédiées à votre compte."*).
6. **The homepage cards and the Solutions page say the same things differently** (A.14–A.30 vs 1.09–1.37). The client asks for one version of each argument, reused word for word on both pages.
   - Proposal: build one shared list from the corrected texts and use it in both places.
   - Homepage: the team cards, 4 tabs × 4 cards (`hlab-tm2`).
   - Solutions: the detail blocks.
   - The pairs are listed in section 3.
7. **Opening animation.** Above A.01 the client wrote: *"La fusion de l'humain et de l'IA pour votre croissance."*
   - The PDF shows V3's old animation; our hero is different.
   - Proposal: use it as the small eyebrow above the headline on the orb stage. It would replace "Service client, back-office, prospection et recrutement externalisés.", which moves into the SEO description.
   - Or leave it out. Your call.
8. **The Pourquoi SPM FAQ (2.19–2.25) is never seen.** The shared FAQ at the bottom of every page replaces it, a rule inherited from V3.
   - Proposal: merge its questions into the shared FAQ.
   - Add a new first tab **"Human & AI"** whose first question is *"Que signifie Human & AI ?"* (2.24 bis).
   - Use the question forms the client asked for (2.22 / 2.24).

---

## 1. Homepage `/` (A.xx)

| Ref | Where on `/` | Change | Status |
|---|---|---|---|
| A.01 | Hero | See decision 7. | ❓ |
| A.02 | Logo wall | "La confiance de vos marques" / "Au service des marques que vous connaissez déjà." No correction. | — |
| A.03–A.06 | Replaced already by "Trois problèmes" | Only "sans ~~jamais~~ bousculer" applied to our version, which no longer has "jamais". | ✅ nothing to do |
| A.07 | Simulator eyebrow and title | "Estimer vos économies" or "Le coût de votre organisation actuelle", pink, "à confirmer (VH)". | ⏳ SPM |
| A.08 | Simulator fields | No correction. | — |
| A.09 | Notre approche, intro | → *"L'expertise humaine et l'IA ne s'opposent pas : elles s'amplifient. On conçoit des équipes qui connaissent vos clients et que l'IA rend plus rapides."* Same as 2.12; the client says the old wording repeats words the brand charter discourages. | ✅ |
| **NEW** after A.09 | New block on `/` | Title **"Human & AI : deux forces, une seule équipe."** Text as written by the client: *"Chez SPM, l'humain reste au centre : des équipes formées, stables, qui connaissent votre activité. L'IA les rend plus rapides et plus précises : elle transcrit les appels, en tire des résumés et des points d'action, et laisse aux conseillers le temps de la relation avec vos clients. Notre symbole le dit déjà : deux formes imbriquées, l'humain et l'IA, qui avancent dans la même direction."* This also answers A.60 ("bring the essentials of the AI up the page"). | ✅ |
| A.10 = 2.13 | "Une vision claire, en temps réel" | One text for both. "Temps réel" waits on what SPM really provides (2.13 "confirmer ce qui est réellement fourni"). Until then, both use the 2.13 wording. | ⏳ SPM |
| A.11 = 2.14 | "Des équipes qui montent en charge" | "en quelques jours" → per decision 4. "Agents" → "conseillers". One text for both. | ✅ after decisions 1 and 4 |
| A.12 = 2.15 | "Une donnée / information qui circule" | Both become **"Une information qui circule"**; text without ~~"ni perte"~~: *"Vos outils et les nôtres se parlent : l'information circule sans ressaisie. L'historique client suit chaque échange, du premier appel au dernier e-mail."* | ✅ |
| A.13 = 2.16 | "Décider et agir en confiance" | "Vous gardez la stratégie, on exécute" already appears in 1.01, 2.16 and 2.22. Keep the phrase in two places at most (client, under 2.22): A.13 / 2.16 and the FAQ 2.22. A.13 becomes *"Un pilotage transparent, des décisions partagées, des comptes rendus réguliers et un interlocuteur dédié."* | ✅ |
| A.15 | Card "Une relation client qui fidélise" | Shared with 1.10 (decision 6). | ✅ |
| A.16 | Card "Présents quand vos clients appellent" | Pink ("promesse absolue", "horaires que vous choisissez [à confirmer]"). | ⏳ SPM |
| A.17 | Card "Un support qui coûte moins cher" | Title → **"Un support à coût maîtrisé"** (the old one is a price promise). Text unchanged. | ✅ |
| A.18 | Card "Des signaux clients exploitables" | No correction (same as 1.13). | — |
| A.19 | Card "Vos tâches chronophages, absorbées" | Text → *"Saisie, traitement, contrôle : on prend en charge le back-office et on libère vos équipes des tâches à faible valeur ajoutée."* | ✅ |
| A.20 | Card "Zéro erreur, zéro angle mort" | Title → **"Des dossiers fiables, suivis de bout en bout"** ("promesse impossible à tenir"). Text aligned with 1.26. | ✅ |
| A.21 | Card "Des effectifs qui suivent l'activité" | Text ends *"…sans surcoût de structure, et sans payer les périodes creuses."* | ✅ |
| A.22 | Card "Des opérations sous contrôle" | Keep "conformité" only if a specific compliance is proven, which depends on 2.25 / 3.08 (pink). Until then the eyebrow becomes **"Traçabilité"** and the text follows 1.28: *"Traçabilité et comptes rendus clairs, pour piloter sereinement et montrer la qualité du travail à tout moment."* | ✅ |
| A.23 | Card "Plus de leads qualifiés, traités" | Title → **"Plus de contacts qualifiés, tous traités"**; "vos closers" → **"vos commerciaux"**. Same title on Solutions 1.15. | ✅ |
| A.24 | Card "Un suivi qui transforme" | Shared with 1.16 → **"Un suivi qui fait avancer chaque opportunité"** / *"Des relances rapides et personnalisées à chaque étape du parcours."* | ✅ |
| A.25 | Card "Développez sans recruter" | Eyebrow "Scalabilité" → **"Montée en puissance"**. "en quelques jours" → per decision 4. | ✅ after decision 4 |
| A.26 | Card "Un pipeline enfin lisible" | Shared with 1.18. "Temps réel" waits (1.18 "confirmer ce qui est fourni"). | ⏳ SPM |
| A.27–A.29 | Recruitment cards | No correction. Shared with 1.35–1.37 (decision 6). | — |
| A.30 | Card "Un recrutement plus rentable" | No figures, so remove "moins de mauvaises embauches": *"Moins de temps perdu : un coût par recrutement maîtrisé et prévisible."* | ✅ |
| A.31 | "Nos partenaires de confiance." | Per decision 2. | ❓ |
| A.32 | Testimonial | Pink, "Témoignage client (VH)". | ⏳ SPM |
| A.33 | Closing contact section, every page | Per decision 3. | ❓ |
| A.34 = 2.19 | FAQ intro | *"…leur relation client, leur back-office ou leur développement commercial."* | ✅ |
| A.35 | FAQ | "avec SPM ~~Services~~" (old name). | ✅ |
| A.36 | FAQ "Quels services SPM propose-t-elle ?" | List the six real services (1.02–1.07): service client & SAV, développement commercial, enquêtes de satisfaction, assistance administrative, secrétariat téléphonique, recrutement & RH. Drop "comptabilité / support technique", which don't appear anywhere else. The automotive expertise stays. | ✅ |
| A.37 | FAQ "Pourquoi l'île Maurice ?" | "un décalage horaire minime" → **"2 heures de décalage avec la France en été, 3 heures en hiver"**. "cadre juridique proche du droit français" → **"un droit civil d'inspiration française"** (Mauritius' civil code comes from the Code Napoléon). Please check with SPM, but this is factual and not pink. | ✅ (to check) |
| A.38–A.41 | FAQ | No correction, apart from "agents" → decision 1 and the delay in A.39 → decision 4. | ✅ |
| A.42 / A.43 / 2.23 | FAQ commitment and reversibility | Notice period and data return are pink in 2.23 ("préavis de X"). | ⏳ SPM |
| A.44 | FAQ | No correction. | — |
| A.45 | FAQ "Quelles économies ?" | Pink (range or link to case studies). | ⏳ SPM |
| A.46–A.47 | FAQ | No correction. | — |
| A.48 | FAQ GDPR | Data transfer outside the EU, hosting, contracts: "faire valider" by SPM, together with 2.25 (pink). | ⏳ SPM |
| A.49 | FAQ "niveau de français natif ?" | → *"Nos conseillers sont francophones ; leur niveau est testé à l'oral et à l'écrit."* The unverifiable "sans compromis sur l'accent" is removed. | ✅ |
| A.50–A.51 | FAQ | No correction. | — |
| A.52 / A.55 | FAQ continuity / dedication | Per decision 5. | ❓ |
| A.53 | FAQ recruitment | "chasse ciblée" → **"une approche de recrutement ciblée"**. "Trois ans minimum" is pink. | ✅ / ⏳ |
| A.54 | FAQ training | "électroménager" (pink). | ⏳ SPM |
| A.56 | FAQ retention | Pink (seniority, turnover rate). | ⏳ SPM |
| A.57 | FAQ "Qui supervise ?" | "pilote la stratégie" → **"pilote l'activité"**. | ✅ |
| A.58–A.59 | FAQ | No correction. | — |
| A.60 | FAQ AI | Keep it, and bring the essentials up the page (new block after A.09; Solutions, see section 2). | ✅ |
| A.61 | FAQ AI satisfaction | → *"Oui. L'analyse des échanges permet de repérer les points de friction sans attendre un sondage après coup."* | ✅ |
| A.62 | FAQ CRM | Pink, "nommer les CRM (VH)". | ⏳ SPM |
| A.63 | FAQ | No correction. | — |
| A.64 = 2.24 | FAQ "L'IA remplace-t-elle… ?" | One text, the client's 2.24: *"Non. Chez SPM, l'IA n'est pas là pour remplacer les équipes, elle est là pour les augmenter. Nos conseillers décident, répondent et gardent la relation avec vos clients : vous parlez toujours à une personne."* "Multiplicateur" (jargon) goes. | ✅ |
| A.65 | FAQ | No correction. | — |
| A.66 | FAQ "Qui pilote la relation ?" | "pilote la stratégie" → **"pilote la mission"**. | ✅ |
| A.67–A.69 | FAQ | No correction. | — |
| A.70 | FAQ ROI | Pink (explain the method). | ⏳ SPM |
| A.71 = C.01 | Footer heading, every page | → **"Des équipes humaines, accélérées par l'IA, qui restent dans la durée."** | ✅ |
| A.72 | Hidden H1 and SEO description | Add **Human & AI** and the locations, **île Maurice et France** (Lyon, Aix-en-Provence). | ✅ |

## 2. Solutions `/solutions` (1.xx)

| Ref | Change | Status |
|---|---|---|
| 1.01 | Intro → *"Service client, développement commercial, back-office, recrutement : on construit des équipes dédiées à votre marque : des personnes formées dans la durée, que l'IA rend plus rapides et plus précises."* "Vous gardez la stratégie…" moves out (decision on A.13). | ✅ |
| 1.02 / 1.09 | Add one AI line to Service client & SAV, per the client's general remark 3: *"L'IA transcrit les appels et en tire des résumés et des points d'action. L'équipe répond, rassure et résout."* "Niveau 1 à 3" is to confirm (VH), and the example "classe et priorise les demandes" is in brackets, so both wait. | ✅ / ⏳ |
| 1.03–1.07 | "La notion de l'IA n'est pas mise en avant." The real AI use for prospecting, surveys, back-office, the switchboard and recruitment is SPM's question (remark 4: "usage réel de l'IA ?"), so no invented AI claims. 1.04 "quatre étapes" is pink. | ⏳ SPM |
| 1.11 | Title → **"Une équipe là quand vos clients ont besoin d'elle"**; "+ horaires ?" waits. | ✅ / ⏳ |
| 1.12 | Title → **"Une équipe experte, sans les coûts d'une équipe interne"** (the old title is identical to 2.04). Text → *"Vous financez une équipe experte, sans recrutement ni infrastructure."* | ✅ |
| 1.15 | **"Plus de contacts qualifiés, tous traités"** (same as A.23). | ✅ |
| 1.16 | **"Un suivi qui fait avancer chaque opportunité"** / *"Des relances rapides et personnalisées à chaque étape du parcours."* | ✅ |
| 1.18 | "temps réel": confirm what's really provided. | ⏳ SPM |
| 1.19 / 1.21 | "quatre étapes", the method's steps. | ⏳ SPM |
| 1.25 | "faible valeur" → **"des tâches répétitives"**. The client offers two options; this one avoids repeating A.19. | ✅ |
| 1.26 | → *"Des process rigoureux et une donnée propre : des dossiers suivis de bout en bout, avec moins de ressaisies et d'oublis."* | ✅ |
| 1.38 | "audit interne" (pink). | ⏳ SPM |
| 1.39 | Intro → *"Un besoin hors recrutement ? Parlons-en."* The "audit interne" mention goes with it. | ✅ |
| Decision 6 | Shared cards, Solutions ↔ homepage: 1.10 ↔ A.15, 1.11 ↔ A.16, 1.12 ↔ A.17, 1.13 ↔ A.18, 1.15 ↔ A.23, 1.16 ↔ A.24, 1.17 ↔ A.25, 1.18 ↔ A.26, 1.25 ↔ A.19, 1.26 ↔ A.20, 1.27 ↔ A.21, 1.28 ↔ A.22, 1.35 ↔ A.27, 1.36 ↔ A.28, 1.37 ↔ A.29. | ❓ |

## 3. Pourquoi SPM `/pourquoi-spm` (2.xx)

| Ref | Change | Status |
|---|---|---|
| 2.01 | Title → **"Des équipes qui restent. Une IA qui les rend plus rapides."** | ✅ |
| **NEW** after 2.01 | Explain the name: the same "Human & AI" block as on the homepage. | ✅ |
| 2.03 | Real figure for response time `[X] → [Y]`. | ⏳ SPM |
| 2.05 / 2.06 / 2.08 | Average seniority, how peaks are absorbed. | ⏳ SPM |
| 2.08–2.11 | Remove the **quotation marks** on the principles: they read as testimonials, but they are principles. | ✅ |
| 2.11 | Text is identical to 2.03 → *"Chaque engagement se mesure, et on vous montre les chiffres."* | ✅ |
| 2.12 | Intro → *"…On conçoit des équipes qui connaissent vos clients et que l'IA rend plus rapides."* (as A.09) | ✅ |
| 2.13 | Confirm what's really provided. | ⏳ SPM |
| 2.14–2.16 | See A.11–A.13. | ✅ |
| 2.17 | → *"Depuis 2016, SPM construit des équipes qui restent. Elles connaissent vos métiers et vos clients, parce qu'elles y travaillent dans la durée. Aujourd'hui, l'IA les rend plus rapides et plus précises."* The client also wants it corrected in the brand charter; noted. | ✅ |
| 2.18 | **300 collaborateurs**; "Langues parlées" figure is pink. | ✅ / ⏳ |
| 2.19–2.25 | Merged into the shared FAQ (decision 8). 2.20: who works where, Lyon / Aix offices, and hours are SPM's. 2.21 → *"On vous présente les personnes qui travaillent pour vous : vous savez toujours avec qui vous travaillez."* (meeting arrangements wait). 2.22 / 2.24: question forms *"Est-ce que je garde la main ?"* and *"Est-ce que l'IA remplace vos conseillers ?"*. 2.23 / 2.25 are pink. | ✅ / ⏳ |

## 4. Clients & Partenaires, Secteurs, Actualités, Contact, Carrières

| Ref | Change | Status |
|---|---|---|
| 3.04–3.08 | Testimonials, logos, certifications. | ⏳ SPM |
| 3.07 | Wording per decision 2. | ❓ |
| 4.08–4.16 | Case studies, and hiding the section if there are none (VH). | ⏳ SPM |
| 4.17 | → *"Nos équipes se forment à votre activité. Parlons de vos besoins."* (the old line was "trop prometteur") | ✅ |
| 5.02 | Title → **"SPM ajoute HUMAN & AI à son nom : pourquoi, et ce que ça change pour vous"**. Text → *"Notre logo évolue et notre nom s'enrichit. Pourquoi nous avons choisi de faire travailler l'humain et l'IA ensemble, et ce que cela change concrètement pour vous."* | ✅ |
| 5.03 | "14 juillet" → **"14 juillet 2026"**. | ✅ |
| 5.04 | The title repeats 2.24 and the summary is missing; the article is SPM's. | ⏳ SPM |
| 6.02 | Reply time. | ⏳ SPM |
| 6.05 + footer | Mauritius phone **+230 290 6226**: replaces "[Téléphone Maurice]" in the footer too. | ✅ |
| 6.06 | "8 **Chemin** du Jubin" (capital C), also in the footer. Lyon phone is pink. | ✅ / ⏳ |
| 6.07 | "103 Impasse **É**variste Galois": the footer has it without the accent, so fix the footer. Aix phone is pink. | ✅ / ⏳ |
| 7.03 | "Un travail qui connecte…": the client asks "que connecte-t-il ?" but gives no wording. Proposal: *"Un travail qui rassemble, qui valorise, et qui donne envie de revenir."* | ❓ |
| 7.04 | Concrete fact (stable team, mentoring, seniority). | ⏳ SPM |
| 7.05 | → *"L'IA prend les tâches répétitives. Toi, tu te concentres sur ce qui demande de l'humain : les personnes."* | ✅ |
| 7.07 | Values → the five new ones: **L'humain au cœur de la stratégie · Le sur-mesure, jamais la série · L'excellence par l'innovation · L'exigence comme standard · La confiance par la transparence**. | ✅ |
| 7.08 | "profils ~~bilingues français-anglais~~" → **"profils francophones"** ("français seulement pour le moment"). | ✅ |

## 5. How it will be done

1. Text in the page markup is edited node by node in the Instatic draft:
   - the homepage sections;
   - each inner page.
2. Text built by scripts is patched through a reproducible `make.py`, as in the last two rounds:
   - FAQ: `hlab-spm-faq.js`;
   - team cards: page markup;
   - footer: `hlab-spm-chrome.js`;
   - closing contact section: page markup plus `hlab-0-shell.js`;
   - SEO: `hlab-spm-seo.js`.
3. The new "Human & AI" blocks reuse the existing section styles, so there is no new design and no image generation.
4. FAQ structure: a new "Human & AI" tab first, plus the merged Pourquoi SPM questions. The FAQ JSON-LD is regenerated from the same list.
5. Checks before you review:
   - screenshots of every page;
   - link check;
   - Lighthouse on `/`, to confirm the score holds;
   - a diff of every text, old → new, to send back to the client.
6. Nothing is published until you approve. V2 and V3 are not touched.
7. Placeholders stay where SPM has to supply information (pink), so the site never shows an invented figure.
