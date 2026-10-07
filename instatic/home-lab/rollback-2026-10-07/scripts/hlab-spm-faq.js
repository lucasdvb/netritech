/* hlab: Home Lab page only, inert on every other page */
(function () {
if (!document.querySelector('[class*="hlab-"]') || window.self !== window.top || !/\/home-lab(\/|\.html)?$/.test(location.pathname)) return;
// SPM FAQ — tabbed categories + accordion, data-driven.
(function () {
  var mount = document.getElementById('sf-mount');
  if (!mount || mount.dataset.built) return;
  mount.dataset.built = '1';

  var DATA = [
    { id: 'general', label: 'Général', items: [
      { q: "Qu'est-ce que l'externalisation avec SPM Services ?", a: "SPM vous confie une équipe dédiée, recrutée et formée spécifiquement pour votre entreprise. Contrairement à un centre d'appels classique, vos collaborateurs ne gèrent pas plusieurs clients en simultané. Ils deviennent une extension directe de vos équipes internes, avec vos process, votre culture et vos objectifs." },
      { q: "Quels services SPM propose-t-elle ?", a: "Nous couvrons le service client, le support technique, la gestion administrative, la comptabilité et le développement commercial. Chaque mission est construite sur mesure selon votre secteur d'activité, avec une expertise particulière dans l'automobile." },
      { q: "Pourquoi externaliser à l'Île Maurice plutôt qu'ailleurs ?", a: "L'Île Maurice combine un bassin de talents francophones, un décalage horaire minime avec la France, un système éducatif bilingue et un cadre juridique proche du droit français. Vos équipes comprennent vos clients sans barrière culturelle ni linguistique." },
      { q: "Quelle est la différence entre SPM et un centre d'appels traditionnel ?", a: "Un centre d'appels traite des volumes. SPM construit des équipes dédiées à taille humaine, formées à votre métier et suivies individuellement. Nos collaborateurs restent en poste sur la durée, ce qui garantit une continuité de service et une vraie connaissance de vos dossiers." },
      { q: "Pour quels types d'entreprises l'externalisation avec SPM est-elle adaptée ?", a: "Nos clients vont de la PME en croissance au grand groupe international. Si vous cherchez à structurer ou renforcer votre service client, votre support technique ou votre back-office sans alourdir votre masse salariale, une équipe SPM peut s'intégrer à votre organisation en quelques semaines." },
      { q: "Combien de temps faut-il pour démarrer une mission avec SPM ?", a: "Comptez généralement entre deux et six semaines entre la définition de vos besoins et la mise en production, le temps de recruter, former et intégrer les bons profils. Ce délai dépend de la complexité de vos process et du nombre de collaborateurs recherchés." }
    ]},
    { id: 'tarifs', label: 'Tarifs', items: [
      { q: "Combien coûte une externalisation avec SPM ?", a: "Le tarif dépend du nombre de collaborateurs, du niveau d'expertise requis et de la complexité de vos missions. Nous établissons un devis détaillé après un premier échange sur vos besoins, sans coût caché ni frais de mise en place surprise." },
      { q: "Quel est l'engagement minimum pour travailler avec SPM ?", a: "Nous privilégions des collaborations construites sur la durée, mais nous restons flexibles sur les volumes selon vos pics d'activité. Un échange avec notre équipe permet de définir la formule la plus adaptée à votre situation." },
      { q: "Le contrat prévoit-il une clause de réversibilité ?", a: "Oui. Vous restez libre de faire évoluer, réduire ou mettre fin à la collaboration selon les modalités définies dans votre contrat. Notre objectif est de vous accompagner par la qualité de notre travail, pas par une dépendance contractuelle." },
      { q: "Puis-je ajuster mes effectifs selon mon activité ?", a: "Oui, c'est l'un des principaux avantages de l'externalisation. Vous pouvez augmenter ou réduire votre équipe SPM selon vos saisons, vos lancements ou vos pics de demande, sans les contraintes d'un recrutement interne classique." },
      { q: "Quelles économies puis-je réellement attendre ?", a: "Les économies varient selon votre secteur et votre organisation actuelle, mais elles proviennent principalement de la transformation de coûts fixes (salaires, charges, locaux) en coûts variables ajustés à votre activité réelle." },
      { q: "Comment se déroule la facturation ?", a: "La facturation est adaptée à votre mission : au forfait, au nombre de collaborateurs ou au volume traité selon vos préférences. Vous recevez un reporting régulier qui justifie chaque ligne, sans surprise en fin de mois." }
    ]},
    { id: 'securite', label: 'Sécurité', items: [
      { q: "Comment SPM garantit-elle la qualité de service ?", a: "Chaque mission est suivie par un responsable d'activité dédié, avec des KPI définis en amont (taux de décroché, délai de traitement, satisfaction client). Un comité de pilotage mensuel fait le point sur les résultats et ajuste les actions si nécessaire." },
      { q: "Mes données sont-elles protégées et conformes au RGPD ?", a: "Oui. Nos process respectent le RGPD et les standards de sécurité informatique en vigueur (accès restreints, chiffrement, protocoles stricts). Vos données restent traitées dans un environnement cloisonné, dédié uniquement à votre activité." },
      { q: "Le niveau de français de vos équipes est-il vraiment natif ?", a: "Nos collaborateurs sont recrutés avec un niveau de français rigoureusement testé, à l'oral comme à l'écrit. Une grande partie de la population mauricienne est francophone, ce qui nous permet de sélectionner des profils exigeants, sans compromis sur l'accent ni le vocabulaire métier." },
      { q: "Comment suivez-vous la performance de vos équipes au quotidien ?", a: "Vous avez accès à des indicateurs en temps réel : nombre de leads, taux de transformation, chiffre d'affaires, délai moyen de traitement. Ce suivi permet d'ajuster rapidement les compétences et les ressources selon vos objectifs." },
      { q: "Que se passe-t-il si un collaborateur ne convient pas ?", a: "Nous avons la possibilité de vous présenter plusieurs profils avant de finaliser un recrutement. Si un collaborateur ne répond pas à vos attentes une fois en poste, nous ajustons rapidement l'équipe pour garantir la continuité de votre service." },
      { q: "Comment gérez-vous la continuité de service en cas d'absence ?", a: "Nos agents sont formés en multisite pour assurer la continuité de service. En cas d'absence, un autre collaborateur déjà formé sur votre dossier peut prendre le relais sans interruption." }
    ]},
    { id: 'talents', label: 'Talents', items: [
      { q: "Comment recrutez-vous les collaborateurs affectés à mon compte ?", a: "Notre cellule de recrutement utilise une approche de chasse ciblée. Chaque profil est sélectionné sur ses compétences, son savoir-être, une expérience minimum de trois ans, et peut vous être présenté avant intégration si vous le souhaitez." },
      { q: "Vos équipes reçoivent-elles une formation spécifique à mon activité ?", a: "Oui. Chaque collaborateur suit une formation initiale en présentiel, complétée par un parcours e-learning continu, y compris pour les secteurs techniques comme l'automobile ou l'électroménager." },
      { q: "Vos collaborateurs travaillent-ils uniquement pour mon entreprise ?", a: "Oui. Les équipes SPM sont 100 % dédiées à votre compte. Vos collaborateurs ne partagent pas leur temps entre plusieurs clients, ce qui garantit une meilleure connaissance de vos dossiers et une implication plus forte." },
      { q: "Comment SPM fidélise-t-elle ses collaborateurs ?", a: "Une politique salariale supérieure à la moyenne du secteur, des perspectives d'évolution réelles et un cadre de travail structuré permettent de limiter le turnover, souvent élevé dans ce type d'activité ailleurs." },
      { q: "Qui supervise mon équipe au quotidien ?", a: "Une organisation claire encadre chaque mission : un responsable d'activité pilote la stratégie, un team leader anime le plateau au quotidien, et un responsable formation assure la montée en compétences continue de vos collaborateurs." },
      { q: "Puis-je rencontrer ou échanger directement avec mon équipe ?", a: "Oui. Vous gardez un contact direct avec vos collaborateurs et votre responsable d'activité, par visioconférence ou lors de comités de suivi réguliers." }
    ]},
    { id: 'technologie', label: 'Technologie', items: [
      { q: "Dois-je fournir mes propres outils informatiques ?", a: "La plupart de nos clients mettent leurs outils à disposition (CRM, téléphonie, plateformes internes) pour que nos collaborateurs travaillent directement dans votre environnement. Nous pouvons aussi proposer notre propre solution de téléphonie si besoin." },
      { q: "Comment l'intelligence artificielle intervient-elle dans vos prestations ?", a: "L'IA vient renforcer le travail humain, jamais le remplacer. Elle analyse les appels et les échanges pour générer des transcriptions, des résumés et des points d'action, ce qui permet à nos équipes de se concentrer sur la relation avec vos clients." },
      { q: "L'IA peut-elle mesurer la satisfaction client sans questionnaire ?", a: "Oui. Nos outils d'analyse conversationnelle détectent le ton et les émotions directement dans les échanges, ce qui permet d'identifier les points de friction sans attendre un sondage après coup." },
      { q: "Vos outils s'intègrent-ils à mon CRM existant ?", a: "Oui, nos solutions sont compatibles avec les principaux CRM du marché et peuvent être étendues à d'autres services selon vos besoins." },
      { q: "Comment suis-je informé des performances de mon équipe ?", a: "Vous avez un accès en temps réel à un tableau de bord regroupant les indicateurs clés. Un reporting régulier est aussi partagé lors de vos comités de pilotage." },
      { q: "L'utilisation de l'IA remplace-t-elle une partie de mon équipe humaine ?", a: "Non. L'IA est un multiplicateur de performance, pas un substitut. Elle décharge vos collaborateurs des tâches répétitives pour qu'ils consacrent plus de temps à la qualité de la relation client." }
    ]},
    { id: 'suivi', label: 'Suivi', items: [
      { q: "Quelles sont les étapes pour démarrer une mission avec SPM ?", a: "Tout commence par une réunion pour définir vos besoins et vos fiches de poste. Nous établissons ensuite un plan de formation, sélectionnons et recrutons les profils, puis les intégrons à votre activité avant la mise en production." },
      { q: "Qui pilote la relation entre mon entreprise et SPM ?", a: "Un responsable d'activité dédié est votre interlocuteur direct. Il pilote la stratégie, anime les équipes et remonte les résultats lors de comités réguliers avec votre direction." },
      { q: "À quelle fréquence ai-je un point sur l'avancement de ma mission ?", a: "Un comité de production hebdomadaire suit les prestations au quotidien, un comité de pilotage mensuel fait le point sur les résultats, et un comité stratégique annuel valide les objectifs de l'année suivante." },
      { q: "Puis-je faire évoluer le périmètre de ma mission en cours de route ?", a: "Oui. Le périmètre de votre mission peut évoluer selon vos besoins : ajout de canaux, montée en volume, nouveaux services. Ces évolutions sont discutées lors de vos comités de pilotage ou à votre demande." },
      { q: "Que se passe-t-il si ma mission ne correspond plus à mes attentes ?", a: "Toute difficulté est remontée en toute transparence lors de vos comités de suivi, avec un plan d'action correctif. Notre objectif reste d'ajuster la prestation pour qu'elle continue de créer de la valeur pour vous." },
      { q: "Comment mesurez-vous le retour sur investissement de l'externalisation ?", a: "Nous suivons des indicateurs concrets : réduction du temps de traitement, réallocation des ressources selon les pics d'activité, coaching individualisé des collaborateurs. Ces leviers permettent généralement un gain de productivité mesurable sur la durée de la mission." }
    ]}
  ];

  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };

  var tabs = document.createElement('div');
  tabs.className = 'hlab-sf-tabs';
  tabs.setAttribute('role', 'tablist');
  var panels = document.createElement('div');
  panels.className = 'sf-panels';

  DATA.forEach(function (cat, ci) {
    var tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'hlab-sf-tab' + (ci === 0 ? ' hlab-sf-active' : '');
    tab.textContent = cat.label;
    tab.dataset.cat = cat.id;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', ci === 0 ? 'true' : 'false');
    tabs.appendChild(tab);

    var panel = document.createElement('div');
    panel.className = 'hlab-sf-panel' + (ci === 0 ? ' hlab-sf-active' : '');
    panel.dataset.cat = cat.id;

    cat.items.forEach(function (it) {
      var item = document.createElement('div');
      item.className = 'hlab-sf-item';
      item.innerHTML =
        '<button class="hlab-sf-q" type="button" aria-expanded="false"><span>' + esc(it.q) + '</span><span class="hlab-sf-ic" aria-hidden="true"></span></button>' +
        '<div class="hlab-sf-a"><div class="hlab-sf-a-in"><p></p></div></div>';
      item.querySelector('.hlab-sf-a p').textContent = it.a;
      var btn = item.querySelector('.hlab-sf-q');
      btn.addEventListener('click', function () {
        var open = item.classList.toggle('hlab-sf-open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      panel.appendChild(item);
    });
    panels.appendChild(panel);
  });

  mount.appendChild(tabs);
  mount.appendChild(panels);

  tabs.addEventListener('click', function (e) {
    var t = e.target.closest('.hlab-sf-tab');
    if (!t) return;
    tabs.querySelectorAll('.hlab-sf-tab').forEach(function (x) {
      var on = x === t;
      x.classList.toggle('hlab-sf-active', on);
      x.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    panels.querySelectorAll('.hlab-sf-panel').forEach(function (p) {
      p.classList.toggle('hlab-sf-active', p.dataset.cat === t.dataset.cat);
    });
  });
})();

})();
