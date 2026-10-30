// src/scripts/spm-faq.js
(function() {
  var mount = document.getElementById("sf-mount");
  if (!mount || mount.dataset.built) return;
  mount.dataset.built = "1";
  var DATA = [
    { id: "general", label: "G\xE9n\xE9ral", items: [
      { q: "Qu'est-ce que l'externalisation avec SPM Services ?", a: "SPM vous confie une \xE9quipe d\xE9di\xE9e, recrut\xE9e et form\xE9e sp\xE9cifiquement pour votre entreprise. Contrairement \xE0 un centre d'appels classique, vos collaborateurs ne g\xE8rent pas plusieurs clients en simultan\xE9. Ils deviennent une extension directe de vos \xE9quipes internes, avec vos process, votre culture et vos objectifs." },
      { q: "Quels services SPM propose-t-elle ?", a: "Nous couvrons le service client, le support technique, la gestion administrative, la comptabilit\xE9 et le d\xE9veloppement commercial. Chaque mission est construite sur mesure selon votre secteur d'activit\xE9, avec une expertise particuli\xE8re dans l'automobile." },
      { q: "Pourquoi externaliser \xE0 l'\xCEle Maurice plut\xF4t qu'ailleurs ?", a: "L'\xCEle Maurice combine un bassin de talents francophones, un d\xE9calage horaire minime avec la France, un syst\xE8me \xE9ducatif bilingue et un cadre juridique proche du droit fran\xE7ais. Vos \xE9quipes comprennent vos clients sans barri\xE8re culturelle ni linguistique." },
      { q: "Quelle est la diff\xE9rence entre SPM et un centre d'appels traditionnel ?", a: "Un centre d'appels traite des volumes. SPM construit des \xE9quipes d\xE9di\xE9es \xE0 taille humaine, form\xE9es \xE0 votre m\xE9tier et suivies individuellement. Nos collaborateurs restent en poste sur la dur\xE9e, ce qui garantit une continuit\xE9 de service et une vraie connaissance de vos dossiers." },
      { q: "Pour quels types d'entreprises l'externalisation avec SPM est-elle adapt\xE9e ?", a: "Nos clients vont de la PME en croissance au grand groupe international. Si vous cherchez \xE0 structurer ou renforcer votre service client, votre support technique ou votre back-office sans alourdir votre masse salariale, une \xE9quipe SPM peut s'int\xE9grer \xE0 votre organisation en quelques semaines." },
      { q: "Combien de temps faut-il pour d\xE9marrer une mission avec SPM ?", a: "Comptez g\xE9n\xE9ralement entre deux et six semaines entre la d\xE9finition de vos besoins et la mise en production, le temps de recruter, former et int\xE9grer les bons profils. Ce d\xE9lai d\xE9pend de la complexit\xE9 de vos process et du nombre de collaborateurs recherch\xE9s." }
    ] },
    { id: "tarifs", label: "Tarifs", items: [
      { q: "Combien co\xFBte une externalisation avec SPM ?", a: "Le tarif d\xE9pend du nombre de collaborateurs, du niveau d'expertise requis et de la complexit\xE9 de vos missions. Nous \xE9tablissons un devis d\xE9taill\xE9 apr\xE8s un premier \xE9change sur vos besoins, sans co\xFBt cach\xE9 ni frais de mise en place surprise." },
      { q: "Quel est l'engagement minimum pour travailler avec SPM ?", a: "Nous privil\xE9gions des collaborations construites sur la dur\xE9e, mais nous restons flexibles sur les volumes selon vos pics d'activit\xE9. Un \xE9change avec notre \xE9quipe permet de d\xE9finir la formule la plus adapt\xE9e \xE0 votre situation." },
      { q: "Le contrat pr\xE9voit-il une clause de r\xE9versibilit\xE9 ?", a: "Oui. Vous restez libre de faire \xE9voluer, r\xE9duire ou mettre fin \xE0 la collaboration selon les modalit\xE9s d\xE9finies dans votre contrat. Notre objectif est de vous accompagner par la qualit\xE9 de notre travail, pas par une d\xE9pendance contractuelle." },
      { q: "Puis-je ajuster mes effectifs selon mon activit\xE9 ?", a: "Oui, c'est l'un des principaux avantages de l'externalisation. Vous pouvez augmenter ou r\xE9duire votre \xE9quipe SPM selon vos saisons, vos lancements ou vos pics de demande, sans les contraintes d'un recrutement interne classique." },
      { q: "Quelles \xE9conomies puis-je r\xE9ellement attendre ?", a: "Les \xE9conomies varient selon votre secteur et votre organisation actuelle, mais elles proviennent principalement de la transformation de co\xFBts fixes (salaires, charges, locaux) en co\xFBts variables ajust\xE9s \xE0 votre activit\xE9 r\xE9elle." },
      { q: "Comment se d\xE9roule la facturation ?", a: "La facturation est adapt\xE9e \xE0 votre mission : au forfait, au nombre de collaborateurs ou au volume trait\xE9 selon vos pr\xE9f\xE9rences. Vous recevez un reporting r\xE9gulier qui justifie chaque ligne, sans surprise en fin de mois." }
    ] },
    { id: "securite", label: "S\xE9curit\xE9", items: [
      { q: "Comment SPM garantit-elle la qualit\xE9 de service ?", a: "Chaque mission est suivie par un responsable d'activit\xE9 d\xE9di\xE9, avec des KPI d\xE9finis en amont (taux de d\xE9croch\xE9, d\xE9lai de traitement, satisfaction client). Un comit\xE9 de pilotage mensuel fait le point sur les r\xE9sultats et ajuste les actions si n\xE9cessaire." },
      { q: "Mes donn\xE9es sont-elles prot\xE9g\xE9es et conformes au RGPD ?", a: "Oui. Nos process respectent le RGPD et les standards de s\xE9curit\xE9 informatique en vigueur (acc\xE8s restreints, chiffrement, protocoles stricts). Vos donn\xE9es restent trait\xE9es dans un environnement cloisonn\xE9, d\xE9di\xE9 uniquement \xE0 votre activit\xE9." },
      { q: "Le niveau de fran\xE7ais de vos \xE9quipes est-il vraiment natif ?", a: "Nos collaborateurs sont recrut\xE9s avec un niveau de fran\xE7ais rigoureusement test\xE9, \xE0 l'oral comme \xE0 l'\xE9crit. Une grande partie de la population mauricienne est francophone, ce qui nous permet de s\xE9lectionner des profils exigeants, sans compromis sur l'accent ni le vocabulaire m\xE9tier." },
      { q: "Comment suivez-vous la performance de vos \xE9quipes au quotidien ?", a: "Vous avez acc\xE8s \xE0 des indicateurs en temps r\xE9el : nombre de leads, taux de transformation, chiffre d'affaires, d\xE9lai moyen de traitement. Ce suivi permet d'ajuster rapidement les comp\xE9tences et les ressources selon vos objectifs." },
      { q: "Que se passe-t-il si un collaborateur ne convient pas ?", a: "Nous avons la possibilit\xE9 de vous pr\xE9senter plusieurs profils avant de finaliser un recrutement. Si un collaborateur ne r\xE9pond pas \xE0 vos attentes une fois en poste, nous ajustons rapidement l'\xE9quipe pour garantir la continuit\xE9 de votre service." },
      { q: "Comment g\xE9rez-vous la continuit\xE9 de service en cas d'absence ?", a: "Nos agents sont form\xE9s en multisite pour assurer la continuit\xE9 de service. En cas d'absence, un autre collaborateur d\xE9j\xE0 form\xE9 sur votre dossier peut prendre le relais sans interruption." }
    ] },
    { id: "talents", label: "Talents", items: [
      { q: "Comment recrutez-vous les collaborateurs affect\xE9s \xE0 mon compte ?", a: "Notre cellule de recrutement utilise une approche de chasse cibl\xE9e. Chaque profil est s\xE9lectionn\xE9 sur ses comp\xE9tences, son savoir-\xEAtre, une exp\xE9rience minimum de trois ans, et peut vous \xEAtre pr\xE9sent\xE9 avant int\xE9gration si vous le souhaitez." },
      { q: "Vos \xE9quipes re\xE7oivent-elles une formation sp\xE9cifique \xE0 mon activit\xE9 ?", a: "Oui. Chaque collaborateur suit une formation initiale en pr\xE9sentiel, compl\xE9t\xE9e par un parcours e-learning continu, y compris pour les secteurs techniques comme l'automobile ou l'\xE9lectrom\xE9nager." },
      { q: "Vos collaborateurs travaillent-ils uniquement pour mon entreprise ?", a: "Oui. Les \xE9quipes SPM sont 100 % d\xE9di\xE9es \xE0 votre compte. Vos collaborateurs ne partagent pas leur temps entre plusieurs clients, ce qui garantit une meilleure connaissance de vos dossiers et une implication plus forte." },
      { q: "Comment SPM fid\xE9lise-t-elle ses collaborateurs ?", a: "Une politique salariale sup\xE9rieure \xE0 la moyenne du secteur, des perspectives d'\xE9volution r\xE9elles et un cadre de travail structur\xE9 permettent de limiter le turnover, souvent \xE9lev\xE9 dans ce type d'activit\xE9 ailleurs." },
      { q: "Qui supervise mon \xE9quipe au quotidien ?", a: "Une organisation claire encadre chaque mission : un responsable d'activit\xE9 pilote la strat\xE9gie, un team leader anime le plateau au quotidien, et un responsable formation assure la mont\xE9e en comp\xE9tences continue de vos collaborateurs." },
      { q: "Puis-je rencontrer ou \xE9changer directement avec mon \xE9quipe ?", a: "Oui. Vous gardez un contact direct avec vos collaborateurs et votre responsable d'activit\xE9, par visioconf\xE9rence ou lors de comit\xE9s de suivi r\xE9guliers." }
    ] },
    { id: "technologie", label: "Technologie", items: [
      { q: "Dois-je fournir mes propres outils informatiques ?", a: "La plupart de nos clients mettent leurs outils \xE0 disposition (CRM, t\xE9l\xE9phonie, plateformes internes) pour que nos collaborateurs travaillent directement dans votre environnement. Nous pouvons aussi proposer notre propre solution de t\xE9l\xE9phonie si besoin." },
      { q: "Comment l'intelligence artificielle intervient-elle dans vos prestations ?", a: "L'IA vient renforcer le travail humain, jamais le remplacer. Elle analyse les appels et les \xE9changes pour g\xE9n\xE9rer des transcriptions, des r\xE9sum\xE9s et des points d'action, ce qui permet \xE0 nos \xE9quipes de se concentrer sur la relation avec vos clients." },
      { q: "L'IA peut-elle mesurer la satisfaction client sans questionnaire ?", a: "Oui. Nos outils d'analyse conversationnelle d\xE9tectent le ton et les \xE9motions directement dans les \xE9changes, ce qui permet d'identifier les points de friction sans attendre un sondage apr\xE8s coup." },
      { q: "Vos outils s'int\xE8grent-ils \xE0 mon CRM existant ?", a: "Oui, nos solutions sont compatibles avec les principaux CRM du march\xE9 et peuvent \xEAtre \xE9tendues \xE0 d'autres services selon vos besoins." },
      { q: "Comment suis-je inform\xE9 des performances de mon \xE9quipe ?", a: "Vous avez un acc\xE8s en temps r\xE9el \xE0 un tableau de bord regroupant les indicateurs cl\xE9s. Un reporting r\xE9gulier est aussi partag\xE9 lors de vos comit\xE9s de pilotage." },
      { q: "L'utilisation de l'IA remplace-t-elle une partie de mon \xE9quipe humaine ?", a: "Non. L'IA est un multiplicateur de performance, pas un substitut. Elle d\xE9charge vos collaborateurs des t\xE2ches r\xE9p\xE9titives pour qu'ils consacrent plus de temps \xE0 la qualit\xE9 de la relation client." }
    ] },
    { id: "suivi", label: "Suivi", items: [
      { q: "Quelles sont les \xE9tapes pour d\xE9marrer une mission avec SPM ?", a: "Tout commence par une r\xE9union pour d\xE9finir vos besoins et vos fiches de poste. Nous \xE9tablissons ensuite un plan de formation, s\xE9lectionnons et recrutons les profils, puis les int\xE9grons \xE0 votre activit\xE9 avant la mise en production." },
      { q: "Qui pilote la relation entre mon entreprise et SPM ?", a: "Un responsable d'activit\xE9 d\xE9di\xE9 est votre interlocuteur direct. Il pilote la strat\xE9gie, anime les \xE9quipes et remonte les r\xE9sultats lors de comit\xE9s r\xE9guliers avec votre direction." },
      { q: "\xC0 quelle fr\xE9quence ai-je un point sur l'avancement de ma mission ?", a: "Un comit\xE9 de production hebdomadaire suit les prestations au quotidien, un comit\xE9 de pilotage mensuel fait le point sur les r\xE9sultats, et un comit\xE9 strat\xE9gique annuel valide les objectifs de l'ann\xE9e suivante." },
      { q: "Puis-je faire \xE9voluer le p\xE9rim\xE8tre de ma mission en cours de route ?", a: "Oui. Le p\xE9rim\xE8tre de votre mission peut \xE9voluer selon vos besoins : ajout de canaux, mont\xE9e en volume, nouveaux services. Ces \xE9volutions sont discut\xE9es lors de vos comit\xE9s de pilotage ou \xE0 votre demande." },
      { q: "Que se passe-t-il si ma mission ne correspond plus \xE0 mes attentes ?", a: "Toute difficult\xE9 est remont\xE9e en toute transparence lors de vos comit\xE9s de suivi, avec un plan d'action correctif. Notre objectif reste d'ajuster la prestation pour qu'elle continue de cr\xE9er de la valeur pour vous." },
      { q: "Comment mesurez-vous le retour sur investissement de l'externalisation ?", a: "Nous suivons des indicateurs concrets : r\xE9duction du temps de traitement, r\xE9allocation des ressources selon les pics d'activit\xE9, coaching individualis\xE9 des collaborateurs. Ces leviers permettent g\xE9n\xE9ralement un gain de productivit\xE9 mesurable sur la dur\xE9e de la mission." }
    ] }
  ];
  var esc = function(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  };
  var tabs = document.createElement("div");
  tabs.className = "sf-tabs";
  tabs.setAttribute("role", "tablist");
  var panels = document.createElement("div");
  panels.className = "sf-panels";
  DATA.forEach(function(cat, ci) {
    var tab = document.createElement("button");
    tab.type = "button";
    tab.className = "sf-tab" + (ci === 0 ? " sf-active" : "");
    tab.textContent = cat.label;
    tab.dataset.cat = cat.id;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-selected", ci === 0 ? "true" : "false");
    tabs.appendChild(tab);
    var panel = document.createElement("div");
    panel.className = "sf-panel" + (ci === 0 ? " sf-active" : "");
    panel.dataset.cat = cat.id;
    cat.items.forEach(function(it) {
      var item = document.createElement("div");
      item.className = "sf-item";
      item.innerHTML = '<button class="sf-q" type="button" aria-expanded="false"><span>' + esc(it.q) + '</span><span class="sf-ic" aria-hidden="true"></span></button><div class="sf-a"><div class="sf-a-in"><p></p></div></div>';
      item.querySelector(".sf-a p").textContent = it.a;
      var btn = item.querySelector(".sf-q");
      btn.addEventListener("click", function() {
        var open = item.classList.toggle("sf-open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });
      panel.appendChild(item);
    });
    panels.appendChild(panel);
  });
  mount.appendChild(tabs);
  mount.appendChild(panels);
  tabs.addEventListener("click", function(e) {
    var t = e.target.closest(".sf-tab");
    if (!t) return;
    tabs.querySelectorAll(".sf-tab").forEach(function(x) {
      var on = x === t;
      x.classList.toggle("sf-active", on);
      x.setAttribute("aria-selected", on ? "true" : "false");
    });
    panels.querySelectorAll(".sf-panel").forEach(function(p) {
      p.classList.toggle("sf-active", p.dataset.cat === t.dataset.cat);
    });
  });
})();
