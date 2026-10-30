// src/scripts/v3f-spm-seo.js
(function() {
  try {
    let meta2 = function(attr, key, val) {
      if (document.querySelector("meta[" + attr + '="' + key + '"]')) return;
      var m = document.createElement("meta");
      m.setAttribute(attr, key);
      m.setAttribute("content", val);
      head.appendChild(m);
    };
    var meta = meta2;
    var head = document.head;
    document.title = "SPM \u2014 Externalisation relation client, back-office, commercial & recrutement";
    meta2("name", "robots", "noindex, nofollow");
    meta2("name", "description", "SPM con\xE7oit des \xE9quipes externalis\xE9es d\xE9di\xE9es \xE0 votre marque \u2014 service client, back-office, commercial et recrutement. Externalisation agile et engag\xE9e, augment\xE9e par l'IA, au plus pr\xE8s de vos clients.");
    meta2("property", "og:title", "SPM \u2014 Externalisation agile et engag\xE9e");
    meta2("property", "og:description", "Des \xE9quipes externalis\xE9es d\xE9di\xE9es \xE0 votre marque : relation client, back-office, commercial et recrutement.");
    meta2("property", "og:type", "website");
    if (!document.querySelector('link[rel="canonical"]')) {
      var c = document.createElement("link");
      c.rel = "canonical";
      c.href = location.origin + location.pathname;
      head.appendChild(c);
    }
    var faq = [
      ["Comment d\xE9marre une collaboration avec SPM ?", "On part du canal le plus tendu. En quelques jours, on cadre le p\xE9rim\xE8tre et on met en place une \xE9quipe d\xE9di\xE9e, form\xE9e \xE0 votre marque, pour traiter ce premier point de friction."],
      ["Pouvez-vous vous int\xE9grer \xE0 nos outils existants ?", "Oui. Vos outils et les n\xF4tres se parlent \u2014 CRM, t\xE9l\xE9phonie, ticketing, base de connaissances : l'information circule sans ressaisie."],
      ["Comment garantissez-vous la qualit\xE9 et la connaissance de notre marque ?", "Chaque agent est form\xE9 \xE0 votre marque, votre ton et vos proc\xE9dures. Un pilotage transparent et un interlocuteur d\xE9di\xE9 maintiennent l'exigence, saison apr\xE8s saison."],
      ["Peut-on ajuster les effectifs selon la saisonnalit\xE9 ?", "Oui \u2014 c'est le c\u0153ur de notre approche modulaire. Pics saisonniers, lancements, impr\xE9vus : on ajuste les effectifs \xE0 la demande, en quelques jours."],
      ["Comment assurez-vous la confidentialit\xE9 et la s\xE9curit\xE9 des donn\xE9es ?", "Acc\xE8s restreints, conformit\xE9 RGPD, environnements s\xE9curis\xE9s et engagements contractuels stricts. Vous gardez la main sur la strat\xE9gie et la donn\xE9e."],
      ["Sous quel d\xE9lai une \xE9quipe peut-elle \xEAtre op\xE9rationnelle ?", "Comptez quelques jours pour un premier p\xE9rim\xE8tre cadr\xE9, puis une mont\xE9e en charge au rythme qui vous convient."]
    ];
    var ld = {
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "Organization", "@id": location.origin + "/#org", name: "SPM", url: location.origin + location.pathname, description: "Externalisation agile et engag\xE9e : \xE9quipes d\xE9di\xE9es \xE0 la relation client, au back-office, au commercial et au recrutement, augment\xE9es par l'IA.", logo: location.origin + "/uploads/Kfmabc-aPvy5DPJ-mSQC3-HUMAN___AI__1_-w640.webp" },
        { "@type": "Service", name: "Externalisation d'\xE9quipes d\xE9di\xE9es", serviceType: "Business process outsourcing", provider: { "@id": location.origin + "/#org" }, areaServed: "FR", description: "Service client multicanal, administration et back-office, d\xE9veloppement commercial et recrutement, avec des \xE9quipes form\xE9es \xE0 votre marque." },
        { "@type": "FAQPage", mainEntity: faq.map(function(q) {
          return { "@type": "Question", name: q[0], acceptedAnswer: { "@type": "Answer", text: q[1] } };
        }) }
      ]
    };
    var s = document.createElement("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(ld);
    head.appendChild(s);
  } catch (e) {
  }
})();
