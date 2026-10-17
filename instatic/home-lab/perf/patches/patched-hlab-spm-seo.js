/* hlab: Home Lab page only, inert on every other page */
(function () {
if (!document.querySelector('[class*="hlab-"]') || window.self !== window.top || !/\/home-lab(\/|\.html)?$/.test(location.pathname)) return;
(function () {
  try {
    var head = document.head;
    document.title = 'Externalisation service client, back-office et recrutement | SPM';
    function meta(attr, key, val) {
      if (document.querySelector('meta[' + attr + '="' + key + '"]')) return;
      var m = document.createElement('meta'); m.setAttribute(attr, key); m.setAttribute('content', val); head.appendChild(m);
    }
    function link(rel, href, sizes) {
      if (document.querySelector('link[rel="' + rel + '"]')) return;
      var l = document.createElement('link'); l.rel = rel; l.href = href; if (sizes) l.setAttribute('sizes', sizes); head.appendChild(l);
    }
    link('icon', '/uploads/pA0UhXiw9EQPZ6zHnsBay-spm-favicon-192.png', '192x192');
    link('apple-touch-icon', '/uploads/FiB325gE1ympAW4T8D4tn-spm-apple-touch-icon-180.png', '180x180');
    meta('name', 'description', "SPM externalise votre service client, back-office, prospection et recrutement : une équipe dédiée, francophone, formée à votre marque et accélérée par l'IA.");
    meta('property', 'og:title', 'SPM — Externalisez votre service client avec une équipe dédiée');
    meta('property', 'og:description', 'Service client, back-office, prospection et recrutement externalisés, avec une équipe francophone dédiée à votre marque.');
    meta('property', 'og:type', 'website');
    if (!document.querySelector('link[rel="canonical"]')) {
      var c = document.createElement('link'); c.rel = 'canonical'; c.href = location.origin + location.pathname; head.appendChild(c);
    }
    var faq = [
      ['Comment démarre une collaboration avec SPM ?', "On part du canal le plus tendu. En quelques jours, on cadre le périmètre et on met en place une équipe dédiée, formée à votre marque, pour traiter ce premier point de friction."],
      ['Pouvez-vous vous intégrer à nos outils existants ?', "Oui. Vos outils et les nôtres se parlent — CRM, téléphonie, ticketing, base de connaissances : l'information circule sans ressaisie."],
      ['Comment garantissez-vous la qualité et la connaissance de notre marque ?', "Chaque agent est formé à votre marque, votre ton et vos procédures. Un pilotage transparent et un interlocuteur dédié maintiennent l'exigence, saison après saison."],
      ['Peut-on ajuster les effectifs selon la saisonnalité ?', "Oui — c'est le cœur de notre approche modulaire. Pics saisonniers, lancements, imprévus : on ajuste les effectifs à la demande, en quelques jours."],
      ['Comment assurez-vous la confidentialité et la sécurité des données ?', "Accès restreints, conformité RGPD, environnements sécurisés et engagements contractuels stricts. Vous gardez la main sur la stratégie et la donnée."],
      ['Sous quel délai une équipe peut-elle être opérationnelle ?', "Comptez quelques jours pour un premier périmètre cadré, puis une montée en charge au rythme qui vous convient."]
    ];
    var ld = {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'Organization', '@id': location.origin + '/#org', name: 'SPM', url: location.origin + location.pathname, description: "Externalisation du service client, du back-office, de la prospection commerciale et du recrutement, avec des équipes francophones dédiées, accélérées par l'IA.", logo: location.origin + '/uploads/Kfmabc-aPvy5DPJ-mSQC3-HUMAN___AI__1_-w640.webp' },
        { '@type': 'Service', name: "Externalisation du service client et du back-office", serviceType: 'Business process outsourcing', provider: { '@id': location.origin + '/#org' }, areaServed: 'FR', description: 'Service client multicanal (téléphone, e-mail, chat) en français et en anglais, back-office, prospection commerciale et recrutement, avec des équipes formées à votre marque.' },
        { '@type': 'FAQPage', mainEntity: faq.map(function (q) { return { '@type': 'Question', name: q[0], acceptedAnswer: { '@type': 'Answer', text: q[1] } }; }) }
      ]
    };
    var s = document.createElement('script'); s.type = 'application/ld+json'; s.textContent = JSON.stringify(ld); head.appendChild(s);
  } catch (e) {}
})();

})();
