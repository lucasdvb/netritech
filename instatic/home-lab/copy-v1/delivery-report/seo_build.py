"""Copy + SEO recommendations report for SPM (French), reusing the delivery report's look."""
import build as B

B.LG = 'fr'
HDR = 'SPM · Recommandations éditoriales et SEO'

EXTRA = r"""
.prop { border: 1px solid var(--line); border-radius: 4mm; padding: 3.8mm 5mm 3.6mm; margin-top: 3.2mm; background: #fff; break-inside: avoid; }
.prop.rec { border-color: var(--teal); box-shadow: 0 0 0 .5mm rgba(34,128,138,.18) inset; }
.prop .tag { display: inline-block; font-size: 7.4pt; letter-spacing: .12em; text-transform: uppercase; color: var(--teal); font-weight: 600; margin-bottom: 1.6mm; }
.prop .tag.r { background: var(--teal); color: #fff; padding: .6mm 2.2mm; border-radius: 10mm; margin-left: 2mm; letter-spacing: .08em; }
.prop .hl { font-family: 'Bricolage Grotesque', sans-serif; font-size: 18pt; line-height: 1.04; letter-spacing: -.03em; color: var(--ink); max-width: 118mm; font-weight: 400; }
.prop .sb { font-size: 9.4pt; line-height: 1.42; color: var(--tx); margin-top: 1.8mm; max-width: 150mm; }
.prop .meta { display: flex; flex-wrap: wrap; gap: 1.4mm; margin-top: 2.2mm; align-items: center; }
.prop .meta span { font-size: 7.6pt; border: 1px solid var(--line); border-radius: 10mm; padding: .5mm 2.2mm; color: var(--tx); }
.prop .meta span.kw { border-color: rgba(34,128,138,.4); color: var(--teal); }
.prop .why { font-size: 8.4pt; line-height: 1.42; color: var(--mut-c, #5b6672); margin-top: 1.8mm; }
table.q { width: 100%; border-collapse: collapse; margin-top: 3mm; font-size: 8.4pt; }
table.q th { text-align: left; font-size: 7.2pt; letter-spacing: .12em; text-transform: uppercase; color: var(--tx); font-weight: 600; padding: 0 3mm 2mm 0; border-bottom: 1px solid var(--ink); }
table.q td { padding: 1.9mm 3mm 1.9mm 0; border-bottom: 1px solid var(--line); vertical-align: top; line-height: 1.4; }
table.q td b { color: var(--ink); font-weight: 600; }
table.q td .s { display: block; color: var(--tx); margin-top: .8mm; }
.qs { list-style: none; margin: 3mm 0 0; padding: 0; columns: 1; }
.qs li { display: grid; grid-template-columns: 9mm 1fr; padding: 1.7mm 0; border-bottom: 1px solid var(--line); font-size: 8.8pt; line-height: 1.38; break-inside: avoid; }
.qs li i { font-style: normal; color: var(--teal); font-weight: 600; font-size: 8.4pt; }
.qs li b { color: var(--ink); font-weight: 600; }
.qs li span { color: var(--tx); display: block; margin-top: .6mm; font-size: 8.4pt; }
.big3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; margin-top: 6mm; border-top: 1px solid var(--line); }
.big3 > div { padding: 4.6mm 4mm 0 0; }
.big3 .v { font-family: 'Libre Baskerville', serif; font-weight: 700; font-size: 25pt; line-height: 1; color: var(--ink); }
.big3 .l { font-size: 8.6pt; line-height: 1.4; color: var(--tx); margin-top: 2mm; }
.princ { margin-top: 6mm; }
.princ > div { display: grid; grid-template-columns: 12mm 1fr; padding: 3.6mm 0; border-top: 1px solid var(--line); }
.princ > div:last-child { border-bottom: 1px solid var(--line); }
.princ i { font-style: normal; color: var(--teal); font-weight: 600; font-size: 9pt; }
.princ h3 { font-size: 12pt; margin: 0 0 1.4mm; font-family: 'Libre Baskerville', serif; }
.princ p { margin: 0; font-size: 9.4pt; line-height: 1.5; color: var(--tx); }
.chips { display: flex; flex-wrap: wrap; gap: 1.4mm; margin-top: 1.4mm; }
.chips span { font-size: 7.6pt; border: 1px solid rgba(34,128,138,.35); color: var(--teal); border-radius: 10mm; padding: .4mm 2mm; }
.ex { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; margin-top: 4mm; }
.ex > div { border-radius: 3.4mm; padding: 4mm 4.6mm; font-size: 8.8pt; line-height: 1.45; }
.ex .bad { background: #f6f1f1; color: #5b4b4b; }
.ex .good { background: #eef6f6; color: #2e4f52; }
.ex b { display: block; font-size: 7.2pt; letter-spacing: .12em; text-transform: uppercase; margin-bottom: 1.6mm; }
"""

def page(inner, n, total, cover=False):
    hdr = '' if cover else f'<div class="hdr"><img src="img/logo-dd.png" alt="Disruptive Dodo"><span>{HDR}</span></div>'
    ftr = '' if cover else f'<div class="ftr"><span>Disruptive Dodo · <b>www.disruptivedodo.mu</b></span><span>{n} / {total}</span></div>'
    return f'<section class="page{" cover" if cover else ""}">{hdr}<div class="body">{inner}</div>{ftr}</section>'

sec = B.sec

def chips(items):
    return '<div class="chips">' + ''.join(f'<span>{i}</span>' for i in items) + '</div>'

def p_cover():
    return '''
<img class="logo-dd" src="img/logo-dd.png" alt="Disruptive Dodo">
<h1>Moins de mots,<br><em>plus de contacts</em>.</h1>
<p class="sub">Nos recommandations sur les modifications proposées par SPM : des titres courts, écrits à partir de ce que vos futurs clients tapent dans Google.</p>
<div class="meta">
  <div><span>Préparé pour</span><img src="img/logo-spm.png" alt="SPM"></div>
  <div><span>Préparé par</span><b>Disruptive Dodo</b></div>
  <div><span>Date</span><b>29 octobre 2026</b></div>
  <div><span>Version</span><b>1.0</b></div>
</div>
<div class="frame shot"><img src="img/cover-hero-now.jpg" alt=""></div>'''

def p_summary():
    return sec('', 'En un coup d’œil', 'Le fond est juste. La forme doit <em>raccourcir</em>.') + '''
<p class="lead">Les propositions de SPM sont pertinentes : rassurer sur la première externalisation, montrer l’accompagnement au lancement, donner plus de place à l’humain. Mais la plupart sont rédigées comme un document interne. Sur un site, un visiteur lit le titre, parcourt le sous-titre, puis décide en quelques secondes s’il continue.</p>
<div class="big3">
  <div><div class="v">0</div><div class="l">suggestion Google pour « première externalisation » : personne ne cherche cette expression</div></div>
  <div><div class="v">3</div><div class="l">lignes au maximum pour un titre, 2 pour un sous-titre</div></div>
  <div><div class="v">29</div><div class="l">requêtes réelles relevées dans Google, qui guident nos propositions</div></div>
</div>
<div class="princ">
  <div><i>01</i><div><h3>Un titre se lit, un paragraphe se survole</h3><p>Un titre tient en 8 à 10 mots, sur 3 lignes au plus. Le sous-titre précise en une ou deux lignes. Le détail va dans la page dédiée, la FAQ ou l’échange commercial, pas dans le bandeau.</p></div></div>
  <div><i>02</i><div><h3>On écrit à partir de ce que les gens cherchent</h3><p>Le référencement ne consiste pas à publier toute l’information disponible. Il faut partir des mots que les entreprises tapent dans Google, puis construire les titres et les pages autour de ces mots : c’est de la rétro-ingénierie de la recherche.</p></div></div>
  <div><i>03</i><div><h3>Une idée par section</h3><p>Chaque section répond à une seule question du visiteur. Quand une section explique à la fois les freins, la méthode et l’audit, elle n’en fait passer aucun.</p></div></div>
</div>
<div class="ex">
  <div class="bad"><b>Proposé</b>« L’expertise humaine, augmentée par l’IA : des équipes dédiées à votre entreprise pour votre relation client, votre gestion administrative, votre développement commercial, votre recrutement… » (27 mots)</div>
  <div class="good"><b>Recommandé</b>« Une équipe dédiée pour votre service client, votre gestion administrative, votre commercial et votre recrutement. » (16 mots, mêmes mots-clés)</div>
</div>'''

QUERIES = [
    ('Service client', ['externalisation service client', 'externaliser son service client', 'externalisation service client france', 'externalisation relation client', 'externalisation sav', 'externalisation centre d’appel']),
    ('Gestion administrative', ['externalisation administrative', 'externalisation gestion administrative', 'externalisation tâches administratives', 'tarifs externalisation administrative', 'externalisation back office']),
    ('Commercial', ['externalisation commerciale', 'externalisation commerciale b2b', 'externalisation prospection commerciale', 'externalisation force commerciale', 'tarif externalisation commerciale']),
    ('Recrutement et téléphonie', ['externalisation recrutement', 'permanence téléphonique externalisée', 'secrétariat téléphonique externalisé']),
    ('Lieu', ['centre d’appel île maurice', 'centre d’appel maurice', 'externalisation offshore', 'externalisation offshore madagascar', 'externalisation service client madagascar']),
    ('Décision', ['pourquoi externaliser', 'avantages externalisation', 'risques externalisation', 'externaliser ou internaliser', 'externalisation rgpd']),
]

def p_search():
    rows = ''.join(f'<tr><td style="width:38mm"><b>{g}</b></td><td>{chips(q)}</td></tr>' for g, q in QUERIES)
    return sec('01', 'Partir de la recherche', 'Ce que vos clients <em>tapent</em> dans Google.') + f'''
<p class="lead">Nous avons relevé les suggestions de Google en français pour les métiers de SPM. Ce sont des recherches réellement effectuées : Google ne suggère que ce que les internautes tapent souvent. Elles ne donnent pas encore de volumes, mais elles montrent les mots à reprendre.</p>
<table class="q"><thead><tr><th>Intention</th><th>Requêtes suggérées par Google (octobre 2026)</th></tr></thead><tbody>{rows}</tbody></table>
<div class="cols2" style="margin-top:6mm;align-items:start">
  <div class="panel"><h3>Ce que cela change</h3><p class="small">« Première externalisation » ne génère aucune recherche. L’idée reste forte pour convaincre, mais le titre doit aussi contenir les mots cherchés : <b>externaliser</b>, <b>service client</b>, <b>gestion administrative</b>, <b>commercial</b>, <b>recrutement</b>. Les recherches « avantages », « risques » et « externaliser ou internaliser » correspondent exactement aux freins que SPM veut lever : ce sont nos questions de FAQ.</p></div>
  <div class="panel"><h3>La concurrence est déjà là</h3><p class="small">Les recherches associées citent Madagascar, et les résultats montrent des acteurs installés à Maurice et au Maghreb. Pour exister, SPM doit avoir une page par métier et une page sur Maurice, avec un titre qui reprend la requête, plutôt qu’une seule page qui regroupe tout.</p></div>
</div>
<p class="small mut" style="margin-top:4mm">Méthode : suggestions Google (google.fr, langue française), relevées le 29 octobre 2026 pour 30 expressions de départ. Les volumes exacts seront mesurés après la mise en ligne, avec Google Search Console et l’outil de planification des mots-clés de Google.</p>'''

def prop(tag, hl, sb, kws, why, rec=False):
    r = '<span class="tag r">Notre recommandation</span>' if rec else ''
    return f'''<div class="prop{' rec' if rec else ''}"><span class="tag">{tag}</span>{r}
<div class="hl">{hl}</div><div class="sb">{sb}</div>
<div class="meta">{''.join(f'<span class="kw">{k}</span>' for k in kws)}<span>{len(hl)} caractères · 3 lignes sur le site</span></div>
<div class="why">{why}</div></div>'''

def p_hero():
    return sec('02', 'Le bandeau d’accueil', 'Trois titres, <em>trois lignes</em> au plus.') + '''
<p class="lead">Le titre proposé par SPM fait 5 lignes sur le site. Ces trois versions gardent l’idée, tiennent en 3 lignes (vérifié sur ordinateur et sur mobile) et reprennent les mots recherchés.</p>''' + \
    prop('Option A · l’idée de SPM, raccourcie', 'Externalisez les métiers que vous pensiez garder.',
         'Service client, gestion administrative, commercial, recrutement : une équipe dédiée, formée à votre activité et augmentée par l’IA.',
         ['externaliser', 'service client', 'gestion administrative', 'commercial', 'recrutement', 'équipe dédiée'],
         'Garde la promesse de SPM (les métiers qu’on croyait impossibles à externaliser) avec le verbe que les gens cherchent. Le sous-titre liste les quatre familles de services.', rec=True) + \
    prop('Option B · la première externalisation', 'Votre première externalisation, lancée en un mois.',
         'Une équipe dédiée pour votre service client, votre administratif, vos ventes et votre recrutement. 95 % de nos clients n’avaient jamais externalisé.',
         ['externalisation', 'service client', 'équipe dédiée'],
         'Met en avant la preuve (un mois, 95 %), mais contient moins de mots recherchés.') + \
    prop('Option C · la plus référencée', 'Externalisation du service client, sans perdre la main.',
         'Une équipe SPM dédiée, francophone et formée à votre métier, pilotée avec vous. Service client, back-office, commercial et recrutement.',
         ['externalisation service client', 'back-office', 'commercial', 'recrutement'],
         'Reprend mot pour mot la requête la plus fréquente et répond au premier frein, le contrôle. Idéal aussi pour la future page « Externalisation du service client ».') + '''
<div class="panel" style="margin-top:3mm;padding-top:3.4mm;padding-bottom:3.4mm"><h3>Titre et description dans Google (option A)</h3><p class="small"><b>Titre (51 caractères) :</b> Externalisation service client et back-office | SPM<br><b>Description (148 caractères) :</b> Externalisez votre service client, votre gestion administrative, votre commercial ou votre recrutement avec une équipe dédiée. Lancement en un mois.</p></div>'''

SECTIONS = [
    ('Message central', 'SPM associe des équipes humaines dédiées à l’IA pour permettre aux entreprises de réussir leur première externalisation, y compris sur des métiers qu’elles pensaient ne pas pouvoir externaliser.',
     'Des équipes humaines, augmentées par l’IA, pour réussir votre première externalisation.', ''),
    ('Les freins', 'Contrôle, qualité, connaissance du métier, sécurité des données, réactions des équipes internes, méthode en six étapes et audit, dans une même section.',
     'Externaliser, sans perdre le contrôle.', 'Pilotage, qualité, sécurité : vos réponses avant de vous lancer. Cinq cartes d’une phrase ; la méthode et l’audit passent dans « Le lancement ».'),
    ('Le lancement', 'Équipe onboarding (IT, formation, qualité), formalisation des processus, connexion sécurisée, lancement en un mois avec trois rendez-vous d’une heure, travaux inclus dans la tarification.',
     'Lancé en un mois. Porté par nos équipes.', 'Trois rendez-vous d’une heure de votre côté. Le reste, nous nous en occupons.'),
    ('La preuve', '« 95 % de nos clients n’avaient jamais externalisé avant SPM » + l’ambition de devenir la référence en France et dans l’océan Indien.',
     '95 %', 'de nos clients n’avaient jamais externalisé avant SPM. Sur l’accueil, la preuve suffit ; l’ambition trouve sa place sur la page Pourquoi SPM.'),
    ('Métiers externalisables', 'Un encart avec des exemples concrets de métiers repris.',
     'Ce que vous pensiez impossible à externaliser.', 'Des métiers réels, repris par nos équipes. Une ligne par métier, un lien vers la page du service.'),
    ('L’IA', 'Deux ou trois exemples concrets (transcription, résumés, points d’action), en mettant en avant l’assistance aux conseillers.',
     'L’IA prépare, le conseiller décide.', 'Transcription, résumés, points d’action : le temps gagné revient à la relation avec vos clients.'),
    ('L’humain', 'Une section dédiée aux collaborateurs (conseillers, formation, ancienneté moyenne).',
     'Derrière chaque appel, une équipe formée.', '500 collaborateurs, 15 jours de formation, 3 ans d’ancienneté moyenne. Avec les photos et vidéos de la séance de formation.'),
    ('Le simulateur', 'Un pourcentage indicatif, le détail du calcul et des hypothèses transmis après la prise de contact.',
     'Combien pourriez-vous économiser ?', 'Trois réglages, une estimation. Les résultats varient selon le service et le secteur.'),
    ('Sécurité & données', 'Une page en cinq parties et un résumé de trois à quatre lignes sur l’accueil.',
     'Vos données, protégées.', 'Sur l’accueil, une seule phrase et un lien : « Vos données restent dans vos outils, et chaque transfert est encadré par contrat. »'),
]

def p_sections():
    rows = ''.join(f'<tr><td style="width:27mm"><b>{n}</b></td><td style="width:66mm" class="mutd">{p}</td><td><b>{t}</b><span class="s">{s}</span></td></tr>' for n, p, t, s in SECTIONS)
    return sec('03', 'Les autres sections', 'La même idée, <em>en deux phrases</em>.') + f'''
<table class="q"><thead><tr><th>Section</th><th>Proposition de SPM</th><th>Version courte (titre + sous-titre)</th></tr></thead><tbody>{rows}</tbody></table>
<p class="small mut" style="margin-top:3mm">Chaque titre tient en 3 lignes sur ordinateur comme sur mobile. Les détails retirés ne disparaissent pas : ils vont dans la FAQ, la page Sécurité & données ou les pages par métier.</p>'''

FAQ = [
    ('Pourquoi externaliser son service client ?', 'pourquoi externaliser · externaliser son service client'),
    ('Quels sont les avantages et les risques de l’externalisation ?', 'avantages externalisation · risques externalisation'),
    ('Externaliser ou internaliser : comment choisir ?', 'externaliser ou internaliser'),
    ('Combien coûte l’externalisation d’un service client ?', 'tarif(s) externalisation…'),
    ('L’externalisation est-elle compatible avec le RGPD ?', 'externalisation rgpd'),
    ('Pourquoi un centre d’appel à l’île Maurice ?', 'centre d’appel île maurice · externalisation offshore'),
]
PAGES = [
    ('/externalisation-service-client', 'Externalisation du service client', 'externalisation service client · externaliser son service client · relation client · sav'),
    ('/externalisation-gestion-administrative', 'Externalisation de la gestion administrative', 'externalisation administrative · tâches administratives · back office'),
    ('/externalisation-commerciale', 'Externalisation commerciale et prospection', 'externalisation commerciale b2b · prospection commerciale · force commerciale'),
    ('/externalisation-recrutement', 'Externalisation du recrutement', 'externalisation recrutement'),
    ('/permanence-telephonique', 'Permanence et secrétariat téléphonique externalisés', 'permanence téléphonique externalisée · secrétariat téléphonique externalisé'),
    ('/centre-appel-ile-maurice', 'Votre centre d’appel à l’île Maurice', 'centre d’appel île maurice · externalisation offshore'),
]

def p_faq():
    f = ''.join(f'<tr><td><b>{q}</b></td><td>{chips(k.split(" · "))}</td></tr>' for q, k in FAQ)
    p = ''.join(f'<tr><td style="width:56mm"><b>{h}</b><span class="s">{u}</span></td><td>{chips(k.split(" · "))}</td></tr>' for u, h, k in PAGES)
    return sec('04', 'FAQ et nouvelles pages', 'Répondre aux questions <em>telles qu’elles sont posées</em>.') + f'''
<p class="lead">La FAQ « Première externalisation » demandée par SPM est utile. Pour qu’elle soit aussi trouvée sur Google, ses questions doivent reprendre la formulation des recherches.</p>
<table class="q"><thead><tr><th>Question de FAQ</th><th>Recherches couvertes</th></tr></thead><tbody>{f}</tbody></table>
<p class="lead" style="margin-top:6mm">Aujourd’hui, les sept solutions sont réunies sur une seule page : elle ne peut se positionner que sur une seule requête. Une page par métier, avec un titre qui reprend la recherche, multiplie les chances d’apparaître.</p>
<table class="q"><thead><tr><th>Page à créer</th><th>Recherches visées</th></tr></thead><tbody>{p}</tbody></table>'''

QUESTIONS = [
    ('Priorités', 'Quels sont les trois services qui rapportent le plus, ou que vous voulez développer en premier ? Ce sont eux qui auront leur page en priorité.'),
    ('Clients visés', 'Quelle taille d’entreprise et quels secteurs visez-vous en priorité ?'),
    ('Maurice', 'Voulez-vous mettre l’île Maurice en avant (recherchée et différenciante), ou présenter d’abord vos implantations en France ?'),
    ('Tarifs', 'Pouvez-vous afficher un ordre de prix (« à partir de », par poste ou par heure) ? Les recherches « tarif externalisation » sont fréquentes.'),
    ('Simulateur', 'Validez-vous la méthode de calcul (économie moyenne, différence 35 h / 40 h) ? Pouvons-nous montrer un montant en euros après la prise de contact ?'),
    ('Horaires', 'Quelles plages couvrez-vous réellement (soirées, week-ends, 24 h/24 pour certains clients) ? Nous pourrons alors l’écrire précisément.'),
    ('Langues', 'Quelles sont les sept langues parlées par vos équipes ?'),
    ('Preuves', 'Un client accepterait-il d’être cité, ou de donner un vrai témoignage ? Pouvons-nous publier les trois études de cas sur des pages dédiées ?'),
    ('Sécurité', 'La DSI peut-elle nous transmettre l’état d’avancement ISO 27001, les mesures en place, l’hébergement et l’encadrement des outils d’IA ?'),
    ('Photos et vidéos', 'Quand a lieu la prochaine séance photo ? Les personnes filmées pendant la formation ont-elles donné leur accord ?'),
    ('Contenus', 'Qui peut rédiger ou valider un article par mois ? Les articles répondant aux questions des recherches sont la base du référencement dans la durée.'),
    ('Comptes Google', 'Qui gère Google Search Console et les fiches Google Business Profile de vos trois sites ?'),
]

def p_questions():
    q = ''.join(f'<li><i>{i+1:02d}</i><div><b>{t}</b><span>{d}</span></div></li>' for i, (t, d) in enumerate(QUESTIONS))
    return sec('05', 'Vos réponses', 'Les questions auxquelles <em>nous avons besoin</em> de réponses.') + f'''
<ul class="qs">{q}</ul>
<div class="panel" style="margin-top:5mm"><h3>La suite</h3><p class="small">Dès vos réponses, nous finalisons les titres de l’accueil, nous créons les pages par métier dans l’ordre de vos priorités et nous reprenons la FAQ. Après la mise en ligne, Google Search Console nous donnera les volumes réels de recherche pour ajuster les titres.</p></div>'''

def build():
    bodies = [(p_cover(), True), (p_summary(), False), (p_search(), False), (p_hero(), False),
              (p_sections(), False), (p_faq(), False), (p_questions(), False)]
    total = len(bodies)
    pages = ''.join(page(b, i + 1, total, cover=c) for i, (b, c) in enumerate(bodies))
    doc = f'''<!doctype html><html lang="fr"><head><meta charset="utf-8">
<title>SPM — Recommandations éditoriales et SEO</title>
<link rel="stylesheet" href="fonts.css"><style>{B.CSS}{EXTRA}</style></head><body>{pages}</body></html>'''
    head, body = doc.split('<body>', 1)
    return head + '<body>' + B.fr_typo(body)

if __name__ == '__main__':
    open('build/report-seo.html', 'w', encoding='utf-8').write(build())
    print('ok')
