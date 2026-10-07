/* hlab: Home Lab page only, inert on every other page */
(function () {
if (!document.querySelector('[class*="hlab-"]') || window.self !== window.top || !/\/home-lab(\/|\.html)?$/.test(location.pathname)) return;
(function () {
  try {
    var head = document.head;
    document.title = 'SPM — Externalisation relation client, back-office, commercial & recrutement';
    function meta(attr, key, val) {
      if (document.querySelector('meta[' + attr + '="' + key + '"]')) return;
      var m = document.createElement('meta'); m.setAttribute(attr, key); m.setAttribute('content', val); head.appendChild(m);
    }
    // Home Lab is an experimental page: keep it out of search results until it is promoted.
    meta('name', 'robots', 'noindex, nofollow');
    meta('name', 'description', "SPM conçoit des équipes externalisées dédiées à votre marque — service client, back-office, commercial et recrutement. Externalisation agile et engagée, augmentée par l'IA, au plus près de vos clients.");
    meta('property', 'og:title', 'SPM — Externalisation agile et engagée');
    meta('property', 'og:description', 'Des équipes externalisées dédiées à votre marque : relation client, back-office, commercial et recrutement.');
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
        { '@type': 'Organization', '@id': location.origin + '/#org', name: 'SPM', url: location.origin + location.pathname, description: "Externalisation agile et engagée : équipes dédiées à la relation client, au back-office, au commercial et au recrutement, augmentées par l'IA.", logo: location.origin + '/uploads/Kfmabc-aPvy5DPJ-mSQC3-HUMAN___AI__1_-w640.webp' },
        { '@type': 'Service', name: "Externalisation d'équipes dédiées", serviceType: 'Business process outsourcing', provider: { '@id': location.origin + '/#org' }, areaServed: 'FR', description: 'Service client multicanal, administration et back-office, développement commercial et recrutement, avec des équipes formées à votre marque.' },
        { '@type': 'FAQPage', mainEntity: faq.map(function (q) { return { '@type': 'Question', name: q[0], acceptedAnswer: { '@type': 'Answer', text: q[1] } }; }) }
      ]
    };
    var s = document.createElement('script'); s.type = 'application/ld+json'; s.textContent = JSON.stringify(ld); head.appendChild(s);
  } catch (e) {}
})();

})();
