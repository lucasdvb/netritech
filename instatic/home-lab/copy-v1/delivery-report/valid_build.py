"""Validation report for SPM (French): status of their amendment e-mail, and everything that needs their sign-off."""
import build as B
import seo_build as S

B.LG = 'fr'
HDR = 'SPM · Points à valider'

EXTRA = S.EXTRA + r"""
table.st td.s0 { width: 24mm; }
.pill { display: inline-block; font-size: 7.2pt; letter-spacing: .06em; border-radius: 10mm; padding: .5mm 2.2mm; font-weight: 600; white-space: nowrap; }
.pill.ok { background: #e7f3f3; color: #1b6f78; }
.pill.val { background: #fdf2e2; color: #92591b; }
.pill.wait { background: #eef0f3; color: #4b5866; }
.tx { font-size: 8.6pt; line-height: 1.45; color: var(--tx); }
.tx b { color: var(--ink); }
.box { border: 1px solid var(--line); border-radius: 3.4mm; padding: 3.6mm 4.4mm; margin-top: 3mm; break-inside: avoid; }
.box h3 { margin: 0 0 1.6mm; font-size: 10.6pt; font-family: 'Libre Baskerville', serif; }
.box .prop-t { font-size: 9pt; line-height: 1.45; color: var(--ink); }
.box .prop-t i { color: var(--tx); font-style: normal; }
.box .ask { margin-top: 1.8mm; font-size: 8.2pt; color: #92591b; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; }
.sec-doc h4 { font-size: 9.6pt; margin: 3.4mm 0 1mm; color: var(--ink); }
.sec-doc p, .sec-doc li { font-size: 8.4pt; line-height: 1.45; color: var(--tx); margin: 0 0 1.2mm; }
.sec-doc ul { margin: 0 0 1.4mm 4mm; padding: 0; }
.sec-doc .dsi { display: block; font-size: 8pt; color: #92591b; margin: 1mm 0 2mm; }
.legend { display: flex; gap: 3mm; margin-top: 3mm; font-size: 8pt; color: var(--tx); align-items: center; }
"""

def page(inner, n, total, cover=False):
    hdr = '' if cover else f'<div class="hdr"><img src="img/logo-dd.png" alt="Disruptive Dodo"><span>{HDR}</span></div>'
    ftr = '' if cover else f'<div class="ftr"><span>Disruptive Dodo · <b>www.disruptivedodo.mu</b></span><span>{n} / {total}</span></div>'
    return f'<section class="page{" cover" if cover else ""}">{hdr}<div class="body">{inner}</div>{ftr}</section>'

sec = B.sec
OK, VAL, WAIT = '<span class="pill ok">Fait</span>', '<span class="pill val">À valider</span>', '<span class="pill wait">En attente</span>'

def p_cover():
    return '''
<img class="logo-dd" src="img/logo-dd.png" alt="Disruptive Dodo">
<h1>Vos modifications,<br><em>point par point</em>.</h1>
<p class="sub">Ce qui est en place, ce que nous vous proposons, et ce qui attend votre validation avant la mise en ligne.</p>
<div class="meta">
  <div><span>Préparé pour</span><img src="img/logo-spm.png" alt="SPM"></div>
  <div><span>Préparé par</span><b>Disruptive Dodo</b></div>
  <div><span>Date</span><b>30 octobre 2026</b></div>
  <div><span>Version</span><b>1.0</b></div>
</div>
<div class="frame shot"><img src="img/cover-hero-now.jpg" alt=""></div>'''

ROWS = [
    ('1', 'Bandeau d’accueil : titre et sous-titre', VAL, 'En place avec le texte de votre e-mail. Trois propositions plus courtes, page 4.'),
    ('1', 'Section pour rassurer (contrôle, qualité, métier, sécurité des données, équipes internes)', OK, 'Juste sous le bandeau : cinq réponses courtes et l’audit.'),
    ('1', 'Méthode en six étapes et audit', OK, 'Méthode dans « Le lancement », audit dans la section de réassurance.'),
    ('1', 'Accompagnement au lancement', OK, 'Équipe onboarding, formalisation des processus, connexion sécurisée, un mois maximum, trois rendez-vous d’une heure, inclus dans la tarification.'),
    ('1', '95 % en grand', OK, '« 95 % de nos clients n’avaient jamais externalisé avant SPM », en très grand sur l’accueil.'),
    ('1', 'Ambition : la référence en France et dans l’océan Indien', VAL, 'Proposition : sur la page Pourquoi SPM plutôt que sur l’accueil (page 5).'),
    ('1', 'L’humain : photos des équipes et section dédiée', OK, 'Section « Les équipes SPM » avec vos photos et la vidéo de la formation. Propositions de mises en scène pour la prochaine séance photo jointes.'),
    ('1', 'L’IA : deux ou trois exemples concrets', OK, 'Transcription, résumés, points d’action, toujours en assistance au conseiller.'),
    ('1', 'Mieux valoriser les études de cas', VAL, 'Chiffres mis en avant. Proposition : une page par étude de cas (page 6).'),
    ('2', 'Page « Sécurité & données »', WAIT, 'Rédigée, non publiée. En attente des éléments de votre DSI et de votre validation (pages 8 et 9).'),
    ('3', 'Politique de confidentialité : transferts hors UE', OK, 'Formulation recommandée par Léo, reprise mot pour mot.'),
    ('3', 'Politique de confidentialité : DPA, sous-traitant, accès, mesures, réversibilité', VAL, 'Rédigé, non publié (page 9).'),
    ('4', 'Offres alignées sur les sept solutions', OK, 'Bandeau, onglets, menu mobile et métiers alignés sur les sept solutions.'),
    ('4', 'Horaires', VAL, 'Remplacés par « des horaires adaptés aux besoins de chaque client ». Merci de nous indiquer vos plages réelles.'),
    ('4', 'Langues', VAL, 'Harmonisé : « en français et dans six autres langues ». Merci de confirmer la liste des sept langues.'),
    ('4', 'Promesses de performance', OK, '« Zéro erreur » et « aucun client sans réponse, jamais » retirés, remplacés par vos chiffres réels.'),
    ('4', 'Titre « Au service des entreprises que vous connaissez déjà »', VAL, 'Remplacé par « Des chiffres, pas des promesses. » (page 5).'),
    ('5', 'Simulateur en pourcentage, détail après prise de contact', VAL, 'En place. Méthode de calcul à valider (page 7).'),
    ('6', 'Vouvoiement sur tout le site, Carrières compris', OK, 'Fait sur Carrières et Contact.'),
    ('7', 'Encart « Métiers externalisables »', VAL, 'Huit exemples tirés de vos solutions et de vos études de cas (page 6).'),
    ('8', 'FAQ pour une première externalisation', VAL, 'Nouvel onglet en tête de la FAQ, cinq questions (page 6).'),
    ('9', 'Plus de place à l’humain', OK, 'Voir le point 1 « L’humain ».'),
]

def _rows(rs):
    return ''.join(f'<tr><td style="width:7mm"><b>{n}</b></td><td style="width:64mm"><b>{t}</b></td><td class="s0">{st}</td><td>{d}</td></tr>' for n, t, st, d in rs)

def p_status():
    return sec('01', 'Suivi de votre e-mail', 'Chaque point, <em>et son statut</em>.') + f'''
<div class="legend"><span>{OK} en place sur le site</span><span>{VAL} en place ou rédigé, votre accord est nécessaire</span><span>{WAIT} attend des informations de votre part</span></div>
<table class="q st"><thead><tr><th>N°</th><th>Votre demande</th><th>Statut</th><th>Ce que nous avons fait</th></tr></thead><tbody>{_rows(ROWS[:11])}</tbody></table>'''

def p_status2():
    return sec('01', 'Suivi de votre e-mail, suite', 'Sécurité, cohérence <em>et contenus</em>.') + f'''
<table class="q st"><thead><tr><th>N°</th><th>Votre demande</th><th>Statut</th><th>Ce que nous avons fait</th></tr></thead><tbody>{_rows(ROWS[11:])}</tbody></table>
<div class="panel" style="margin-top:5mm"><h3>En résumé</h3><p class="small">Sur les 22 points de votre e-mail, 11 sont en place sur le site. 10 sont en place ou rédigés et attendent votre accord ; ils sont détaillés dans les pages suivantes, avec nos propositions. 1, la page Sécurité & données, attend les éléments de votre DSI.</p></div>'''

def hprop(tag, hl, sb, kws, why, rec=False):
    return S.prop(tag, hl, sb, kws, why, rec)

def p_h1():
    return sec('02', 'Le titre principal', 'Trois propositions, <em>à choisir</em>.') + '''
<p class="lead">Ce titre est le premier texte lu par vos visiteurs et par Google. Il doit dire en une seconde ce que fait SPM, avec les mots que tapent les dirigeants qui envisagent une première externalisation. Chaque proposition tient en 3 lignes sur le site, sur ordinateur comme sur mobile.</p>''' + \
    hprop('Proposition A · la plus claire pour une première fois', 'Externaliser son service client, pour la première fois.',
          '95 % de nos clients n’avaient jamais externalisé. Une équipe dédiée, formée à votre métier, opérationnelle en un mois.',
          ['externaliser son service client', 'équipe dédiée', 'première externalisation'],
          'Reprend une recherche fréquente mot pour mot et parle directement à votre cible : l’entreprise qui n’a jamais externalisé. La preuve suit dans le sous-titre.', rec=True) + \
    hprop('Proposition B · la plus référencée', 'Externalisation du service client, sans perdre la main.',
          'Des équipes dédiées, formées à votre métier et augmentées par l’IA, pour votre relation client, votre administratif, vos ventes et votre recrutement.',
          ['externalisation service client', 'équipes dédiées', 'administratif', 'recrutement'],
          'La requête la plus recherchée, et une réponse au premier frein : la peur de perdre le contrôle.') + \
    hprop('Proposition C · tous vos métiers', 'Externalisez vos métiers clés avec une équipe dédiée.',
          'Service client, gestion administrative, commercial, recrutement : une équipe SPM formée à votre activité, lancée en un mois.',
          ['externaliser', 'équipe dédiée', 'gestion administrative', 'commercial'],
          'Couvre les quatre familles de services dès le titre. Reprend votre idée : des métiers que l’on pensait garder en interne.') + '''
<div class="panel" style="margin-top:3mm;padding-top:3.4mm;padding-bottom:3.4mm"><h3>Avec la proposition A, dans Google</h3><p class="small"><b>Titre (53 caractères) :</b> Externaliser son service client avec une équipe | SPM<br><b>Description (143 caractères) :</b> Première externalisation ? Une équipe dédiée, formée à votre métier, lancée en un mois. Service client, administratif, commercial, recrutement.</p></div>'''

def box(title, now, ours, ask):
    return f'''<div class="box"><h3>{title}</h3><div class="prop-t"><i>Sur le site :</i> {now}</div><div class="prop-t" style="margin-top:1.2mm"><i>Notre proposition :</i> {ours}</div><div class="ask">À valider : {ask}</div></div>'''

def p_texts():
    return sec('03', 'Les textes à valider', 'Nos propositions, <em>section par section</em>.') + '<div class="grid2">' + \
    box('L’ambition', 'retirée de l’accueil pour garder le 95 % lisible.',
        '« Devenir la référence, en France et dans l’océan Indien, pour les entreprises qui se lancent dans leur première externalisation. », en conclusion de l’histoire sur la page Pourquoi SPM.',
        'l’emplacement et la formulation.') + \
    box('Le titre de la page Clients', '« Des chiffres, pas des promesses. »',
        'Garder ce titre : il annonce les chiffres sans laisser croire à des références nommées.',
        'le titre.') + \
    box('Les horaires', '« des horaires adaptés aux besoins de chaque client ».',
        'Écrire vos plages réelles dès que vous nous les donnez, par exemple « du lundi au samedi, de 7 h à 21 h, et 24 h/24 sur demande ».',
        'vos plages réelles.') + \
    box('Les langues', '« en français et dans six autres langues » ; la FAQ cite l’anglais, l’espagnol, l’italien, le néerlandais, l’allemand et le portugais.',
        'Afficher la liste complète sur la page Pourquoi SPM, et la mention courte ailleurs.',
        'la liste des sept langues.') + \
    box('Les témoignages', 'quatre citations rédigées pour la mise en page (accueil et Clients), présentées sans nom.',
        'Les remplacer par de vrais témoignages, même courts et anonymes, avant la mise en ligne définitive.',
        'de vrais témoignages, ou votre accord explicite sur les textes actuels.') + \
    box('Les informations légales', 'mentions légales complétées avec le registre officiel.',
        'Confirmer le capital social (10 000 €), la ville du RCS, le directeur de la publication et l’hébergeur.',
        'ces quatre informations.') + '</div>'

JOBS = ['Dépannage et SAV · du premier appel au support technique', 'Assistance automobile · 92 % d’appels décrochés pour un assisteur',
        'Réclamations et commandes · service consommateur, de bout en bout', 'Prise de rendez-vous · vos commerciaux se concentrent sur la vente',
        'Bases et portefeuille clients · détection de besoins, enrichissement, fidélisation', 'Traitement de dossiers · saisie, traitement et contrôle',
        'Secrétariat téléphonique · vos appels décrochés à votre nom', 'Recrutement · sourcing et préqualification de candidats']
FAQ1 = [('Par où commencer ?', 'Par un premier échange sur votre activité et vos besoins. Si vous hésitez sur ce qui peut être externalisé, un audit évalue si l’externalisation a du sens, avec un diagnostic qui appuie votre décision.'),
        ('Combien de temps faut-il pour démarrer ?', 'Un mois maximum après la signature du contrat, avec trois rendez-vous d’une heure de votre côté.'),
        ('Qui forme l’équipe ?', 'Notre équipe onboarding (informatique, formation, qualité) : 15 jours de formation initiale, des supports construits avec vous, inclus dans notre tarification.'),
        ('Comment nos données sont-elles protégées ?', 'Vos données restent dans vos outils, accessibles par connexion sécurisée ; chaque transfert vers Maurice est encadré par un DPA et une analyse d’impact (TIA).'),
        ('Que se passe-t-il si ça ne fonctionne pas ?', 'Phase de test de 3 mois, puis contrat sans engagement de durée avec préavis convenu ; plan d’action correctif en comité de suivi.')]

def p_jobs_faq():
    j = ''.join(f'<tr><td>{x.split(" · ")[0]}</td><td>{x.split(" · ")[1]}</td></tr>' for x in JOBS)
    f = ''.join(f'<tr><td style="width:52mm"><b>{q}</b></td><td>{a}</td></tr>' for q, a in FAQ1)
    return sec('04', 'Métiers, FAQ et études de cas', 'Le contenu <em>à confirmer</em>.') + f'''
<table class="q"><thead><tr><th>Métier externalisable</th><th>Exemple affiché</th></tr></thead><tbody>{j}</tbody></table>
<p class="small mut" style="margin-top:1.6mm">À valider : la liste, et d’éventuels métiers à ajouter (ceux que vos prospects pensent impossibles à externaliser).</p>
<table class="q" style="margin-top:4mm"><thead><tr><th>FAQ « Première externalisation »</th><th>Réponse (résumé)</th></tr></thead><tbody>{f}</tbody></table>
<p class="small mut" style="margin-top:1.6mm">À valider : les cinq réponses. Pour le référencement, nous proposons d’ajouter « Quels sont les avantages et les risques de l’externalisation ? » et « Externaliser ou internaliser : comment choisir ? », deux recherches fréquentes.</p>
<div class="box" style="margin-top:4mm"><h3>Les études de cas</h3><div class="prop-t"><i>Notre proposition :</i> une page par étude de cas (assistance automobile, électroménager, logiciel), avec le besoin, l’équipe mise en place et les résultats. Chaque page renforce la preuve et le référencement.</div><div class="ask">À valider : la publication de pages dédiées, et le niveau de détail autorisé.</div></div>'''

def p_calc():
    return sec('05', 'Le simulateur', 'Une méthode <em>à valider</em>.') + '''
<p class="lead">Le simulateur affiche un pourcentage, sans montant en euros. Le visiteur règle trois curseurs : le nombre de postes, ses heures travaillées par semaine et la part de l’activité confiée à SPM. Une mention précise que les résultats varient selon le service et le secteur. Le bouton « Parler à un expert » mène au formulaire de contact.</p>
<div class="panel" style="margin-top:4mm"><h3>Le calcul</h3><p class="small">Économie estimée = part confiée × [ 1 − (1 − économie moyenne) × heures chez le client ÷ 40 h ].<br>L’économie moyenne retenue est celle observée chez vos clients (40 %) ; elle n’apparaît pas sur le site. La différence d’heures reflète les 40 h travaillées chez SPM contre 35 h en France.<br>Le simulateur affiche aussi l’équivalent en postes économisés et les heures de production gagnées par poste.</p></div>
<table class="q" style="margin-top:4mm"><thead><tr><th>Exemple</th><th>Postes</th><th>Heures / semaine</th><th>Part confiée</th><th>Résultat affiché</th></tr></thead><tbody>
<tr><td>Par défaut</td><td>20</td><td>35 h</td><td>60 %</td><td><b>28 %</b> · 5,7 postes · +5 h</td></tr>
<tr><td>Tout externalisé</td><td>20</td><td>35 h</td><td>100 %</td><td><b>48 %</b> · 9,5 postes · +5 h</td></tr>
<tr><td>Petite équipe</td><td>5</td><td>39 h</td><td>50 %</td><td><b>21 %</b> · 1,0 poste · +1 h</td></tr>
</tbody></table>
<div class="box" style="margin-top:4mm"><h3>À valider</h3><div class="prop-t">La méthode de calcul, l’économie moyenne de 40 % et la prise en compte des heures. Si vous préférez une autre base (par service ou par secteur), nous pouvons ajouter un choix du service externalisé.</div></div>'''

def p_sec():
    return sec('06', 'Sécurité & données', 'La page, <em>avant publication</em>.') + '''
<p class="lead">La page est rédigée et liée depuis le menu, le pied de page et l’accueil dès votre validation. Elle n’est pas publiée. Les mentions en orange attendent les éléments de votre DSI.</p>
<div class="sec-doc">
<h4>1. Notre démarche ISO 27001</h4><p>SPM a engagé une démarche de certification ISO 27001, la norme internationale de référence pour la sécurité de l’information. La certification n’est pas encore obtenue : tant qu’elle ne l’est pas, nous parlons de démarche engagée, et non de certification.</p><span class="dsi">DSI : état d’avancement, périmètre et échéance visée.</span>
<h4>2. RGPD et encadrement contractuel</h4><ul><li>Chaque prestation est encadrée par un accord de sous-traitance (DPA), annexé au contrat et conforme à l’article 28 du RGPD.</li><li>SPM France agit exclusivement en qualité de sous-traitant, sur instruction documentée du client.</li><li>Seules les catégories de données strictement nécessaires à la prestation sont accessibles.</li><li>En fin de contrat, les données sont restituées ou supprimées.</li></ul><p>Le paragraphe de Léo sur le transfert vers l’île Maurice (chapitre V du RGPD, clauses contractuelles types module 3, TIA, Data Protection Act 2017, Convention 108+), mot pour mot.</p>
<h4>3. Nos mesures de sécurité</h4><ul><li>Accès au bâtiment sécurisé par badge électronique.</li><li>Accès nominatifs et authentification forte aux outils.</li><li>Journalisation des accès.</li><li>Chiffrement des flux et absence de stockage local : nos équipes travaillent dans vos outils, par connexion sécurisée.</li><li>Collaborateurs formés aux règles de protection des données.</li></ul><span class="dsi">DSI : confirmer chaque mesure, et ajouter celles qui manquent (postes sécurisés, engagements de confidentialité signés…).</span>
<h4>4. L’usage de l’IA</h4><p>L’IA assiste nos conseillers sur des usages précis : la transcription des appels, les résumés et les points d’action. Elle ne remplace pas la décision du conseiller. Les usages autorisés sur vos données, leur lieu de traitement et les exclusions sont définis avec vous dans le contrat.</p><span class="dsi">DSI : outils utilisés, lieu de traitement des données, exclusions applicables.</span>
</div>'''

SFAQ = [('Où sont hébergées nos données ?', 'Vos données ne sont pas hébergées chez SPM : nos équipes travaillent directement dans vos outils, par une connexion sécurisée.'),
        ('Qui peut accéder à nos données ?', 'Uniquement les collaborateurs affectés à votre compte, avec des accès nominatifs et une authentification forte, et seulement aux données nécessaires à la prestation.'),
        ('Comment le transfert vers Maurice est-il encadré ?', 'Par un DPA intégrant les clauses contractuelles types de la Commission européenne, complété par une analyse d’impact du transfert (TIA), conformément au chapitre V du RGPD.'),
        ('SPM est-elle certifiée ISO 27001 ?', 'La démarche de certification est engagée. La certification n’est pas encore obtenue.'),
        ('L’IA utilise-t-elle nos données ?', 'Uniquement pour assister les conseillers (transcription, résumés, points d’action), dans le cadre défini avec vous dans le contrat.'),
        ('Que deviennent nos données en fin de contrat ?', 'Elles sont restituées ou supprimées, selon les modalités prévues au contrat.')]

def p_sec2():
    f = ''.join(f'<tr><td style="width:56mm"><b>{q}</b></td><td>{a}</td></tr>' for q, a in SFAQ)
    return sec('07', 'FAQ sécurité et confidentialité', 'Les réponses, <em>harmonisées</em>.') + f'''
<p class="lead">Comme demandé dans votre e-mail, voici la version finale de la FAQ sécurité, pour validation avant publication. Elle reprend exactement les termes de la page Sécurité & données.</p>
<table class="q"><thead><tr><th>Question</th><th>Réponse</th></tr></thead><tbody>{f}</tbody></table>
<div class="box" style="margin-top:4mm"><h3>Politique de confidentialité : ajouts à valider</h3><div class="prop-t"><i>Section Sécurité :</i> badge électronique, accès nominatifs et authentification forte, journalisation, chiffrement des flux et absence de stockage local.<br><i>Nouveau paragraphe :</i> « Pour les données que nos clients nous confient, SPM France agit exclusivement en qualité de sous-traitant, sur instruction documentée du client. Chaque prestation est encadrée par un DPA conforme à l’article 28 du RGPD. Seules les données strictement nécessaires sont accessibles, et elles sont restituées ou supprimées en fin de contrat. »</div><div class="ask">À valider : ces deux ajouts, sous réserve des mesures confirmées par votre DSI.</div></div>'''

INFO = [('DSI', 'État d’avancement ISO 27001 (périmètre, échéance), liste vérifiable des mesures de sécurité, hébergement et localisation des données, encadrement des outils d’IA.'),
        ('Horaires et langues', 'Vos plages horaires réelles et la liste des sept langues.'),
        ('Témoignages', 'Deux ou trois vrais témoignages, même anonymes, ou votre accord sur les textes actuels.'),
        ('Mentions légales', 'Capital social, ville du RCS, directeur de la publication, hébergeur.'),
        ('Réseaux sociaux', 'Les nouveaux liens de vos comptes une fois les noms modifiés.'),
        ('Photos', 'La date de la prochaine séance et l’accord des personnes photographiées et filmées.')]

def p_info():
    q = ''.join(f'<li><i>{i+1:02d}</i><div><b>{t}</b><span>{d}</span></div></li>' for i, (t, d) in enumerate(INFO))
    return sec('08', 'Ce que nous attendons de vous', 'Pour <em>finaliser</em> la mise en ligne.') + f'''
<ul class="qs">{q}</ul>
<div class="panel" style="margin-top:5mm"><h3>La suite</h3><p class="small">Dès votre retour, nous appliquons le titre choisi, nous publions la page Sécurité & données avec ses liens, nous complétons la politique de confidentialité et nous intégrons vos informations. Un simple retour par e-mail, point par point, suffit.</p></div>'''

def build():
    bodies = [(p_cover(), True), (p_status(), False), (p_status2(), False), (p_h1(), False), (p_texts(), False), (p_jobs_faq(), False),
              (p_calc(), False), (p_sec(), False), (p_sec2(), False), (p_info(), False)]
    total = len(bodies)
    pages = ''.join(page(b, i + 1, total, cover=c) for i, (b, c) in enumerate(bodies))
    doc = f'''<!doctype html><html lang="fr"><head><meta charset="utf-8">
<title>SPM — Points à valider</title>
<link rel="stylesheet" href="fonts.css"><style>{B.CSS}{EXTRA}</style></head><body>{pages}</body></html>'''
    head, body = doc.split('<body>', 1)
    return head + '<body>' + B.fr_typo(body)

if __name__ == '__main__':
    open('build/report-valid.html', 'w', encoding='utf-8').write(build())
    print('ok')
