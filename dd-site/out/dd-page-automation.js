// Disruptive Dodo · automation page.
// Rendered by src/scripts/dd-core.js into #dd-root (shared nav, footer, styles and
// motion live there). Edit copy in `html` below. {{ar}} is the arrow icon.
const DD = (window.__DD = window.__DD || { pages: {} });
DD.pages["automation"] = {
  path: "/services/marketing-automation-crm",
  title: "Marketing automation and CRM in Mauritius",
  description: "CRM and marketing automation for Mauritian businesses: every enquiry in one place, a reply in minutes, and follow-up that runs on its own.",
  section: "services",
  ld: {
 "@context": "https://schema.org",
 "@graph": [
  {
   "@type": "Service",
   "@id": "https://disruptivedodo.mu/services/marketing-automation-crm#service",
   "name": "Automation and CRM",
   "serviceType": "Marketing automation and CRM",
   "description": "CRM and marketing automation for Mauritian businesses: every enquiry in one place, a reply in minutes, and follow-up that runs on its own.",
   "inLanguage": "en",
   "areaServed": {
    "@type": "Country",
    "name": "Mauritius"
   },
   "provider": {
    "@type": "Organization",
    "name": "Disruptive Dodo",
    "url": "https://disruptivedodo.mu/"
   },
   "url": "https://disruptivedodo.mu/services/marketing-automation-crm",
   "isRelatedTo": {
    "@type": "Service",
    "name": "Fledge",
    "url": "https://disruptivedodo.mu/fledge"
   }
  },
  {
   "@type": "BreadcrumbList",
   "itemListElement": [
    {
     "@type": "ListItem",
     "position": 1,
     "name": "Home",
     "item": "https://disruptivedodo.mu/"
    },
    {
     "@type": "ListItem",
     "position": 2,
     "name": "Services",
     "item": "https://disruptivedodo.mu/services"
    },
    {
     "@type": "ListItem",
     "position": 3,
     "name": "Automation and CRM",
     "item": "https://disruptivedodo.mu/services/marketing-automation-crm"
    }
   ]
  },
  {
   "@type": "FAQPage",
   "mainEntity": [
    {
     "@type": "Question",
     "name": "What is a CRM, in plain words?",
     "acceptedAnswer": {
      "@type": "Answer",
      "text": "One place where you keep every enquiry and every customer, with their messages, calls, quotes and history. Your whole team sees the same thing."
     }
    },
    {
     "@type": "Question",
     "name": "Which CRM do you use?",
     "acceptedAnswer": {
      "@type": "Answer",
      "text": "We build you a custom CRM that brings your inbox, pipeline, booking, email and automation into one place. If you already use a CRM, we look at it first and tell you honestly whether to keep it."
     }
    },
    {
     "@type": "Question",
     "name": "Can it work with WhatsApp?",
     "acceptedAnswer": {
      "@type": "Answer",
      "text": "Yes. WhatsApp messages can land in the same inbox as everything else, and your team can get a WhatsApp alert for every new enquiry."
     }
    },
    {
     "@type": "Question",
     "name": "Will my customers know the replies are automatic?",
     "acceptedAnswer": {
      "@type": "Answer",
      "text": "The first reply tells them you have their message and what happens next. Real conversations stay with your team. If you want an assistant that answers questions too, see AI implementation."
     }
    },
    {
     "@type": "Question",
     "name": "Do I need to change how my team works?",
     "acceptedAnswer": {
      "@type": "Answer",
      "text": "A little, for the better. We build around how you already sell, then show your team the new way. Most of what it removes is copying, chasing and remembering."
     }
    },
    {
     "@type": "Question",
     "name": "How long does the setup take?",
     "acceptedAnswer": {
      "@type": "Answer",
      "text": "[About 2 to 3 weeks, to confirm.] It depends on how many channels and steps we connect."
     }
    },
    {
     "@type": "Question",
     "name": "Can you move our contacts from spreadsheets?",
     "acceptedAnswer": {
      "@type": "Answer",
      "text": "Yes. We bring your existing contacts and customers into the CRM, cleaned up, so your team starts with everything in one place."
     }
    },
    {
     "@type": "Question",
     "name": "Is this only for large businesses?",
     "acceptedAnswer": {
      "@type": "Answer",
      "text": "No. Small teams often gain the most, because every enquiry counts and nobody has time to chase them by hand."
     }
    }
   ]
  }
 ]
},
  css: `.sp-part{display:flex;flex-wrap:wrap;align-items:center;gap:10px;color:rgba(243,241,234,.6)}
.sp-part .cap{color:inherit}
.sp-part .tag{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.12);color:#f3f1ea;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
.sp-part:hover .tag{border-color:rgba(255,255,255,.3)}
.sp-ban{margin-bottom:clamp(64px,8vw,120px)}
.flc{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:40px var(--gap);padding:clamp(28px,4vw,64px);border-radius:var(--rx);background:var(--card);border:1px solid var(--ln);box-shadow:var(--sh2);position:relative;overflow:hidden;isolation:isolate}
.flc>*{grid-column:1/-1}
@media (min-width:1024px){.flc .a{grid-column:1/span 5}
.flc .b{grid-column:7/-1}
}
.flc::before{content:"";position:absolute;inset:auto -10% -40% 30%;height:80%;background:radial-gradient(closest-side,rgba(215,213,205,.12),transparent);z-index:-1}
.flc .kick{color:var(--fg)}
.stg{display:grid;gap:10px}
.stg>li{display:grid;grid-template-columns:44px minmax(0,1fr) auto;gap:16px;align-items:center;padding:18px 20px;border-radius:16px;border:1px solid var(--ln);background:var(--card2);color:var(--mu)}
.stg .n{font-size:13px}
.stg .nm{font-size:18px;color:var(--fg);letter-spacing:-.01em}
.stg .lnn{font-size:14px;margin-top:2px}
.stg>li.on{background:var(--inv);color:#62615b;border-color:transparent;--fg:var(--inv-fg)}
.stg .this{display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:500;white-space:nowrap;color:var(--fg)}
.stg .this::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor}
@media (max-width:639px){.stg>li{grid-template-columns:32px minmax(0,1fr)}
.stg .this{grid-column:2}
}
.pcard{display:block;padding:12px;border-radius:var(--r3)}
.pcard .ph{border-radius:20px;box-shadow:none}
.pcard .row{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;padding:20px 12px 8px}
.pcard .tx{padding:0 12px 10px}
.flow{position:relative;display:grid;gap:clamp(20px,2.4vw,36px);max-width:1180px;margin-inline:auto}
.flow-line{position:absolute;left:50%;top:0;bottom:0;width:1px;background:var(--ln);transform:translateX(-50%)}
.flow-line>i{position:absolute;inset:0;background:var(--fg);transform-origin:top;transform:scaleY(var(--p,0))}
.flow>li{position:relative;display:grid;grid-template-columns:1fr 1fr;gap:clamp(48px,7vw,120px)}
.flow>li .card{padding:28px;max-width:470px}
.flow>li.fl .card{grid-column:1;justify-self:end}
.flow>li.fr .card{grid-column:2;justify-self:start}
.flow .node{position:absolute;left:50%;top:34px;width:13px;height:13px;margin-left:-6.5px;border-radius:50%;background:var(--bg);border:1px solid var(--ls);transition:background .5s,border-color .5s,box-shadow .5s;z-index:1}
.flow>li.on .node{background:var(--fg);border-color:var(--fg);box-shadow:0 0 0 6px rgba(243,241,234,.08)}
@media (min-width:768px){.flow>li+li{margin-top:-72px}
}
@media (max-width:767px){.flow-line{left:6px}
.flow>li{grid-template-columns:1fr;padding-left:32px}
.flow>li .card{grid-column:1!important;justify-self:stretch!important;max-width:none}
.flow .node{left:6px}
}
.vg-crm .board{left:4%;top:7%;width:63%;height:86%}
.vg-crm .colh{width:13.6%;top:12%;display:flex;justify-content:space-between;align-items:center}
.vg-crm .lane{width:13.6%;top:20%;height:68%;border-radius:1cqw;background:rgba(255,255,255,.03);border:1px dashed rgba(255,255,255,.08)}
.vg-crm .cd{width:13.6%;padding:1cqw;border-radius:1cqw;background:#1b1b20;border:1px solid rgba(255,255,255,.1);box-shadow:0 1cqw 2cqw -1cqw rgba(0,0,0,.8);display:grid;gap:.6cqw}
.vg-crm .cd.pri{background:#f3f1ea;color:#0c0c0e;z-index:3}
.vg-crm .cd.pri .v-s{color:#62615b}
.vg-crm .won{left:63.2%;top:24.4%;z-index:4;height:2cqw;font-size:.85cqw;background:#0c0c0e;color:#f3f1ea;padding:0 .9cqw}
.vg-crm .alert{left:70%;top:9%;width:26%;padding:1.2cqw 1.4cqw}
.vg-crm .fu{left:70%;top:40%;width:26%;padding:1.2cqw 1.4cqw;display:grid;gap:1cqw}
.vg-crm .ck{width:1.8cqw;height:1.8cqw;border-radius:50%;background:#f3f1ea;color:#0c0c0e;padding:.3cqw;flex:none}
@media (max-width:767px){.vg-crm{--fx:-6%}
}`,
  html: `<main>
  <section class="hero">
    <div class="hero-bg shade"></div>
    <div class="hero-grid">
      <div class="hl">
        <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><a href="/services">Services</a></li><li aria-current="page">Automation and CRM</li></ol></nav>
        <p class="kick mt-48">Automation and CRM · Mauritius</p>
        <h1 class="d1 mt-24">Marketing automation and CRM in Mauritius, so no enquiry slips through.</h1>
      </div>
      <div class="hr">
        <p class="lead">Enquiries come in by WhatsApp, Facebook, email, phone and your website. Some get answered, some get forgotten. We put them all in one place, reply in minutes, and follow up automatically until each person says yes or no.</p>
        <div class="btn-row mt-32"><a class="btn btn-p" href="/contact">Book a free growth call{{ar}}</a><a class="btn" href="/fledge">See Fledge, the full system</a></div>
        <a class="sp-part mt-32" href="/fledge"><span class="cap">Part of Fledge ·</span><span class="tags"><span class="tag">Stage 03 · Get The Business</span><span class="tag">Stage 04 · Keep &amp; Grow</span></span></a>
      </div>
    </div>
  </section>

  <section class="sheet lt sec" aria-labelledby="plain-h">
    <div class="sp-ban"><div class="vg vg-crm" role="img" aria-label="A new enquiry moving through a sales pipeline until the sale is won" data-r="x"><div class="vg-in"><div class="v-g">
    <div class="v-win board"></div>
    <div class="colh" style="left:6%"><span class="v-t">New</span><span class="v-s">3</span></div><div class="lane" style="left:6%"></div><div class="colh" style="left:21.2%"><span class="v-t">Contacted</span><span class="v-s">2</span></div><div class="lane" style="left:21.2%"></div><div class="colh" style="left:36.4%"><span class="v-t">Quote sent</span><span class="v-s">2</span></div><div class="lane" style="left:36.4%"></div><div class="colh" style="left:51.599999999999994%"><span class="v-t">Won</span><span class="v-s">1</span></div><div class="lane" style="left:51.599999999999994%"></div>
    <div class="cd st" style="left:6%;top:40%"><div class="v-row"><span class="v-av" style="width:1.8cqw;height:1.8cqw"></span><span class="v-t">Jean</span></div><span class="v-bar" style="width:80%"></span></div><div class="cd st" style="left:6%;top:55%"><div class="v-row"><span class="v-av" style="width:1.8cqw;height:1.8cqw"></span><span class="v-t">Aisha</span></div><span class="v-bar" style="width:80%"></span></div><div class="cd st" style="left:21.2%;top:23%"><div class="v-row"><span class="v-av" style="width:1.8cqw;height:1.8cqw"></span><span class="v-t">Kevin</span></div><span class="v-bar" style="width:80%"></span></div><div class="cd st" style="left:21.2%;top:38%"><div class="v-row"><span class="v-av" style="width:1.8cqw;height:1.8cqw"></span><span class="v-t">Marie</span></div><span class="v-bar" style="width:80%"></span></div><div class="cd st" style="left:36.4%;top:23%"><div class="v-row"><span class="v-av" style="width:1.8cqw;height:1.8cqw"></span><span class="v-t">Ravi</span></div><span class="v-bar" style="width:80%"></span></div><div class="cd st" style="left:36.4%;top:38%"><div class="v-row"><span class="v-av" style="width:1.8cqw;height:1.8cqw"></span><span class="v-t">Sophie</span></div><span class="v-bar" style="width:80%"></span></div><div class="cd st" style="left:51.599999999999994%;top:38%"><div class="v-row"><span class="v-av" style="width:1.8cqw;height:1.8cqw"></span><span class="v-t">Leo</span></div><span class="v-bar" style="width:80%"></span></div>
    <div class="cd pri" style="left:6%;top:23%"><div class="v-row"><span class="v-av" style="width:1.8cqw;height:1.8cqw"></span><span class="v-t">Priya</span></div><span class="v-s">Villa rental</span></div>
    <span class="v-pill won">Won</span>
    <div class="v-win v-solid alert"><div class="v-row"><span class="v-dot"></span><span class="v-t">New enquiry on WhatsApp</span></div><p class="v-s" style="margin-top:.6cqw">Priya wants a villa for June</p></div>
    <div class="v-win v-solid fu"><span class="v-t">Follow-up</span>
      <div class="v-row fr"><span class="ck"><svg viewBox="0 0 16 16" width="100%" height="100%" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="v-s" style="color:#f3f1ea">Reply sent in 2 minutes</span></div>
      <div class="v-row fr"><span class="ck"><svg viewBox="0 0 16 16" width="100%" height="100%" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="v-s" style="color:#f3f1ea">Quote sent</span></div>
      <div class="v-row fr"><span class="ck"><svg viewBox="0 0 16 16" width="100%" height="100%" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="v-s" style="color:#f3f1ea">Reminder after 2 days</span></div>
    </div>
  </div></div><div class="lb" hidden><div class="lb"><b>CRM pipeline</b><span>Enquiries moving through the stages of a sale, on a laptop</span><i>21:9</i></div></div></div></div>
    <div class="g12">
      <div class="c1-5"><p class="kick">In plain terms</p><h2 class="h2 mt-24" id="plain-h">What you get, in plain terms.</h2></div>
      <p class="lead fg c7-12">A CRM is one place where every enquiry and every customer is kept, with their full history. Automation is the work it does on its own: replies, reminders, follow-ups and review requests. We set up both, connect them to your website, your pages and your phone, and show your team how to use them.</p>
    </div>
    <dl class="facts mt-96" data-r="s"><div><dt class="cap">Who it's for</dt><dd>Businesses that lose track of enquiries, or spend hours chasing them by hand.</dd></div><div><dt class="cap">What you get</dt><dd>A CRM set up for you, every enquiry in one place, instant alerts, follow-up, online booking, review requests.</dd></div><div><dt class="cap">Built on</dt><dd>A custom-built CRM, or the CRM you already use if it does the job.</dd></div><div><dt class="cap">How you pay</dt><dd>A setup fee, then <span class="todo">[a monthly fee for the CRM and support, to confirm]</span>.</dd></div></dl>
  </section>

  <section class="sheet dk sec" aria-labelledby="sf-h">
    <div class="g12">
      <div class="c1-4"><div class="stick"><h2 class="d2" id="sf-h">Sound familiar?</h2></div></div>
      <ol class="qlist c5-12"><li data-r="u"><span class="n">01</span><p>"Enquiries come in on five channels and nobody sees all of them."</p></li><li data-r="u"><span class="n">02</span><p>"We send quotes and forget to follow up."</p></li><li data-r="u"><span class="n">03</span><p>"Our customer list is a spreadsheet, a phone and someone's memory."</p></li><li data-r="u"><span class="n">04</span><p>"Half the week goes on copying information from one place to another."</p></li></ol>
    </div>
  </section>

  <section class="sheet sf sec inc-flow" aria-labelledby="inc-h">
    <div class="head"><div><p class="kick">What's included</p><h2 class="h2 mt-24" id="inc-h" style="max-width:18ch">What we set up.</h2></div></div>
    <ol class="flow mt-64"><i class="flow-line" aria-hidden="true"><i></i></i>
      <li class="fl"><span class="node" aria-hidden="true"></span><div class="card" data-r="u"><p class="cap">01</p><h3 class="h4 mt-12">One place for every enquiry</h3><p class="tx mt-12">WhatsApp, Facebook, Instagram, email, your website forms and calls, in one inbox, with the full history of each person.</p></div></li>
      <li class="fr"><span class="node" aria-hidden="true"></span><div class="card" data-r="u"><p class="cap">02</p><h3 class="h4 mt-12">A clear view of every sale</h3><p class="tx mt-12">Every enquiry and where it stands: new, contacted, quote sent, won or lost. Nothing hides in someone's inbox.</p></div></li>
      <li class="fl"><span class="node" aria-hidden="true"></span><div class="card" data-r="u"><p class="cap">03</p><h3 class="h4 mt-12">Instant alerts</h3><p class="tx mt-12">Your team gets a WhatsApp alert the moment a real enquiry comes in, with the details.</p></div></li>
      <li class="fr"><span class="node" aria-hidden="true"></span><div class="card" data-r="u"><p class="cap">04</p><h3 class="h4 mt-12">Questions that filter enquiries</h3><p class="tx mt-12">Forms that ask the right questions first, so your team spends its time on the people ready to buy.</p></div></li>
      <li class="fl"><span class="node" aria-hidden="true"></span><div class="card" data-r="u"><p class="cap">05</p><h3 class="h4 mt-12">Follow-up that runs on its own</h3><p class="tx mt-12">Reminders by email, SMS or WhatsApp until the person decides. Your team steps in when it matters.</p></div></li>
      <li class="fr"><span class="node" aria-hidden="true"></span><div class="card" data-r="u"><p class="cap">06</p><h3 class="h4 mt-12">Online booking</h3><p class="tx mt-12">A calendar on your website and pages where customers book a call or an appointment, with automatic reminders.</p></div></li>
      <li class="fl"><span class="node" aria-hidden="true"></span><div class="card" data-r="u"><p class="cap">07</p><h3 class="h4 mt-12">Review requests</h3><p class="tx mt-12">After each sale, customers are asked for a Google review at the right moment.</p></div></li>
      <li class="fr"><span class="node" aria-hidden="true"></span><div class="card" data-r="u"><p class="cap">08</p><h3 class="h4 mt-12">Email campaigns</h3><p class="tx mt-12">News and offers sent to past customers and to people who enquired but didn't buy yet.</p></div></li>
    </ol>
  </section>

  <section class="sheet lt sec" aria-labelledby="how-h">
    <div class="g12">
      <div class="c1-5"><div class="stick"><p class="kick">How it works</p><h2 class="h2 mt-24" id="how-h" style="max-width:12ch">How we set it up.</h2></div></div>
      <ol class="steps c7-12"><li data-r="u"><span class="i">01</span><div><h3>We map how enquiries come in today</h3><p>Every channel, every step, and where things get lost.</p></div></li><li data-r="u"><span class="i">02</span><div><h3>We design the flow</h3><p>What happens when someone enquires, who does what, and what runs on its own.</p></div></li><li data-r="u"><span class="i">03</span><div><h3>We set it up and connect it</h3><p>CRM, website, pages, phone and calendar, connected and tested.</p></div></li><li data-r="u"><span class="i">04</span><div><h3>We show your team how to use it</h3><p>Short sessions with your team, so the system is used from the first day.</p></div></li><li data-r="u"><span class="i">05</span><div><h3>We watch and improve</h3><p>We check what's working and adjust the messages and the timing.</p></div></li></ol>
    </div>
  </section>

  <section class="sheet dk sec" aria-labelledby="choose-h">
    <div class="head"><div><p class="kick">Before you choose</p><h2 class="h2 mt-24" id="choose-h" style="max-width:20ch">How to choose a CRM and automation partner in Mauritius.</h2></div></div>
    <ol class="rows hov mt-64"><li data-r="u"><span class="n">(01)</span><h3 class="h3 t">Start from how you sell</h3><p class="tx b">The right setup follows your sales process, not the other way round. Ask a partner to map how enquiries reach you before they suggest a tool.</p></li><li data-r="u"><span class="n">(02)</span><h3 class="h3 t">Ask who sets it up and who supports it</h3><p class="tx b">A CRM nobody looks after goes stale in months. Find out who builds it, who fixes it and who answers your team's questions.</p></li><li data-r="u"><span class="n">(03)</span><h3 class="h3 t">Check it connects to WhatsApp</h3><p class="tx b">In Mauritius, many customers enquire on WhatsApp first. Make sure your CRM brings those conversations in with the rest.</p></li><li data-r="u"><span class="n">(04)</span><h3 class="h3 t">Ask how your team will learn it</h3><p class="tx b">A system only works if your team uses it. Ask how they will be trained, and what happens when someone new joins.</p></li></ol>
  </section>

  <section class="sheet sf sec" aria-labelledby="fl-h">
    <div class="flc" data-r="u">
      <div class="a">
        <p class="kick">Part of Fledge</p>
        <h2 class="h2 mt-24" id="fl-h">The part that turns attention into sales.</h2>
        <p class="tx mt-24">Your ads, website and social media bring people in. Your CRM and follow-up make sure each one gets an answer and a next step. In Fledge, they are built together, so you can see where every sale came from.</p>
        <a class="lnk mt-32" href="/fledge">Discover Fledge{{ar}}</a>
      </div>
      <ol class="stg b" aria-label="The four stages of Fledge"><li class=""><span class="n">01</span><div><p class="nm">Get Found</p><p class="lnn">People find you on Google, social media and ads.</p></div></li><li class=""><span class="n">02</span><div><p class="nm">Get Chosen</p><p class="lnn">Your website and proof make them pick you.</p></div></li><li class="on"><span class="n">03</span><div><p class="nm">Get The Business</p><p class="lnn">Every enquiry gets a fast reply and a follow-up.</p></div><p class="this">This service</p></li><li class="on"><span class="n">04</span><div><p class="nm">Keep &amp; Grow</p><p class="lnn">Customers come back and send others.</p></div><p class="this">This service</p></li></ol>
    </div>
    <div class="head mt-128"><p class="kick">Works well with</p><a class="lnk" href="/services">All services{{ar}}</a></div>
    <div class="svcs mt-32" data-r="s">
      <a class="card lift svc" href="/services/ai-chatbots"><img class="cov" src="/uploads/nCS7Kte6VC1XCoepoHERN-svc-05.webp" alt="" width="960" height="684" loading="lazy"><div><h3>AI implementation</h3><p class="sub">AI assistants that reply to your customers on WhatsApp and your website, day and night.</p></div><div class="ft-row"><span></span><span class="ring">{{ar}}</span></div></a>
      <a class="card lift svc" href="/services/web-design"><img class="cov" src="/uploads/1qEcUtH4lHDuqfDdPiAdS-svc-01.webp" alt="" width="960" height="684" loading="lazy"><div><h3>Websites and SEO</h3><p class="sub">Websites and SEO that put your business in front of the right people.</p></div><div class="ft-row"><span></span><span class="ring">{{ar}}</span></div></a>
      <a class="card lift svc" href="/services/facebook-google-ads"><img class="cov" src="/uploads/Y3s6CQVkiDaxrn8gIgp9C-svc-02.webp" alt="" width="960" height="684" loading="lazy"><div><h3>Paid ads</h3><p class="sub">Facebook, Instagram and Google ads that turn attention into enquiries.</p></div><div class="ft-row"><span></span><span class="ring">{{ar}}</span></div></a>
    </div>
  </section>

  <section class="sheet lt sec" aria-labelledby="proof-h">
    <div class="g12">
      <div class="c1-4"><div class="stick"><p class="kick">Our work</p><h2 class="h2 mt-24" id="proof-h">A project like this.</h2>
        <p class="sm mt-32" style="max-width:30ch">Client names and results appear only with each client's written consent.</p><a class="lnk mt-24" href="/work">See all our work{{ar}}</a></div></div>
      <a class="card lift pcard c5-12" href="/work/case-study" data-r="u">
        <div class="ph r16x9"><div class="lb"><b>Project cover</b><span>An automation and CRM project, shown in context</span><i>16:9</i></div></div>
        <div class="row"><div><h3 class="h3"><span class="todo">[Client name]</span></h3><p class="cap mt-12"><span class="todo">[Sector]</span></p></div><span class="ring">{{ar}}</span></div>
        <p class="tx"><span class="todo">[What changed, in one line]</span></p>
      </a>
    </div>
  </section>

  <section class="sheet dk sec" aria-labelledby="faq-h">
    <div class="g12">
      <div class="c1-5"><div class="stick"><p class="kick">Questions</p><h2 class="h2 mt-24" id="faq-h" style="max-width:12ch">CRM and automation questions, answered.</h2></div></div>
      <div class="faq c7-12">
        <details open><summary><h3>What is a CRM, in plain words?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans">One place where you keep every enquiry and every customer, with their messages, calls, quotes and history. Your whole team sees the same thing.</p></details>
        <details><summary><h3>Which CRM do you use?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans">We build you a custom CRM that brings your inbox, pipeline, booking, email and automation into one place. If you already use a CRM, we look at it first and tell you honestly whether to keep it.</p></details>
        <details><summary><h3>Can it work with WhatsApp?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans">Yes. WhatsApp messages can land in the same inbox as everything else, and your team can get a WhatsApp alert for every new enquiry.</p></details>
        <details><summary><h3>Will my customers know the replies are automatic?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans">The first reply tells them you have their message and what happens next. Real conversations stay with your team. If you want an assistant that answers questions too, see <a href="/services/ai-chatbots">AI implementation</a>.</p></details>
        <details><summary><h3>Do I need to change how my team works?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans">A little, for the better. We build around how you already sell, then show your team the new way. Most of what it removes is copying, chasing and remembering.</p></details>
        <details><summary><h3>How long does the setup take?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans"><span class="todo">[About 2 to 3 weeks, to confirm.]</span> It depends on how many channels and steps we connect.</p></details>
        <details><summary><h3>Can you move our contacts from spreadsheets?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans">Yes. We bring your existing contacts and customers into the CRM, cleaned up, so your team starts with everything in one place.</p></details>
        <details><summary><h3>Is this only for large businesses?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans">No. Small teams often gain the most, because every enquiry counts and nobody has time to chase them by hand.</p></details>
      </div>
    </div>
  </section>

  <section class="sheet lt cta" aria-labelledby="cta-h">
    <p class="kick">Get In Touch</p>
    <h2 class="d1 mt-32" id="cta-h">Tell us where your business is leaking customers</h2>
    <div class="btn-row mt-48"><a class="btn btn-p" href="/contact">Book a free growth call{{ar}}</a></div>
  </section>
</main>`,
  // Live motion: looping scenes played by dd-core's motion engine (see motion()).
  motion: [
 {
  "root": ".vg-crm",
  "D": 10000,
  "still": 0.8,
  "tracks": [
   [
    ".v-g",
    0,
    [
     [
      0,
      500,
      {
       "opacity": 0
      },
      {
       "opacity": 1
      },
      "io"
     ],
     [
      9300,
      9900,
      {
       "opacity": 1
      },
      {
       "opacity": 0
      },
      "io"
     ]
    ]
   ],
   [
    ".board",
    0,
    [
     [
      0,
      900,
      {
       "opacity": 0,
       "transform": "translateY(2cqw) scale(.97)"
      },
      {
       "opacity": 1,
       "transform": "none"
      },
      "sg"
     ]
    ]
   ],
   [
    ".colh, .lane",
    60,
    [
     [
      300,
      900,
      {
       "opacity": 0,
       "transform": "translateY(.8cqw) scale(.97)"
      },
      {
       "opacity": 1,
       "transform": "none"
      },
      "sg"
     ]
    ]
   ],
   [
    ".cd.st",
    70,
    [
     [
      700,
      1300,
      {
       "opacity": 0,
       "transform": "translateY(1cqw) scale(.97)"
      },
      {
       "opacity": 1,
       "transform": "none"
      },
      "sg"
     ]
    ]
   ],
   [
    ".alert",
    0,
    [
     [
      1200,
      1800,
      {
       "opacity": 0,
       "transform": "translateY(2cqw) scale(.97)"
      },
      {
       "opacity": 1,
       "transform": "none"
      },
      "sg"
     ]
    ]
   ],
   [
    ".cd.pri",
    0,
    [
     [
      1600,
      2200,
      {
       "opacity": 0,
       "transform": "translate(0,0) scale(.8)"
      },
      {
       "opacity": 1,
       "transform": "translate(0.0cqw,0) scale(1)"
      },
      "sp"
     ],
     [
      3000,
      3500,
      {},
      {
       "transform": "translate(7.6cqw,-.6cqw) scale(1.04)"
      },
      "i"
     ],
     [
      3500,
      3950,
      {},
      {
       "transform": "translate(15.2cqw,0) scale(1)"
      },
      "sg"
     ],
     [
      4900,
      5400,
      {},
      {
       "transform": "translate(22.8cqw,-.6cqw) scale(1.04)"
      },
      "i"
     ],
     [
      5400,
      5850,
      {},
      {
       "transform": "translate(30.4cqw,0) scale(1)"
      },
      "sg"
     ],
     [
      6800,
      7300,
      {},
      {
       "transform": "translate(38.0cqw,-.6cqw) scale(1.04)"
      },
      "i"
     ],
     [
      7300,
      7750,
      {},
      {
       "transform": "translate(45.6cqw,0) scale(1)"
      },
      "sg"
     ]
    ]
   ],
   [
    ".fu",
    0,
    [
     [
      2600,
      3200,
      {
       "opacity": 0,
       "transform": "translateY(2cqw) scale(.97)"
      },
      {
       "opacity": 1,
       "transform": "none"
      },
      "sg"
     ]
    ]
   ],
   [
    ".fr:nth-of-type(1)",
    0,
    [
     [
      3700,
      4200,
      {
       "opacity": 0,
       "transform": "translateY(.6cqw) scale(.97)"
      },
      {
       "opacity": 1,
       "transform": "none"
      },
      "sg"
     ]
    ]
   ],
   [
    ".fr:nth-of-type(2)",
    0,
    [
     [
      5600,
      6100,
      {
       "opacity": 0,
       "transform": "translateY(.6cqw) scale(.97)"
      },
      {
       "opacity": 1,
       "transform": "none"
      },
      "sg"
     ]
    ]
   ],
   [
    ".fr:nth-of-type(3)",
    0,
    [
     [
      7000,
      7500,
      {
       "opacity": 0,
       "transform": "translateY(.6cqw) scale(.97)"
      },
      {
       "opacity": 1,
       "transform": "none"
      },
      "sg"
     ]
    ]
   ],
   [
    ".won",
    0,
    [
     [
      7800,
      8300,
      {
       "opacity": 0,
       "transform": "scale(.6)"
      },
      {
       "opacity": 1,
       "transform": "scale(1)"
      },
      "sp"
     ]
    ]
   ],
   [
    ".v-g",
    0,
    [
     [
      0,
      5000,
      {
       "transform": "translateY(0)"
      },
      {
       "transform": "translateY(-.35cqw)"
      },
      "io"
     ],
     [
      5000,
      10000,
      {},
      {
       "transform": "translateY(0)"
      },
      "io"
     ]
    ]
   ]
  ]
 }
],
  // Hero gradient: GetLayers "hearth", tinted greyscale through its CONFIG. The shader is untouched.
  gl: { cfg: {"bgColor":"#08080a","colorA":"#6c6b68","colorB":"#424240","colorC":"#71706d","colorD":"#adaca7"}, poster: "/uploads/nCS7Kte6VC1XCoepoHERN-svc-05.webp", mount: function(canvas, __ovr, __opts) {
 const __dummy = {
  style: {},
  textContent: ""
 };
 const __R = () => canvas.getBoundingClientRect();
 const __W = () => canvas.clientWidth || 1;
 const __H = () => canvas.clientHeight || 1;
 const CONFIG = {
  bgColor: "#1f7a6b",
  colorA: "#3fbfa0",
  colorB: "#e8324d",
  colorC: "#ff8fa8",
  colorD: "#e8f5a0",
  scale: .2,
  speed: .33,
  rise: .1,
  flicker: .1,
  bedHeight: 1.42,
  coal: .33,
  roughness: .72,
  lacunarity: 1.94,
  contrast: .56,
  midpoint: .51,
  sink: .53,
  glow: .12,
  grain: .07,
  grainAnim: 0,
  dither: 1.33,
  vignette: .07,
  cursor: 1,
  pointerRadius: 1.28,
  pointerStrength: .08,
  pointerLift: .04,
  wake: .68,
  parallax: .001,
  maxDpr: 1
 };
 Object.assign(CONFIG, __ovr || {});
 function hexToVec3(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [ (n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255 ];
 }
 const gl = canvas.getContext("webgl2", {
  alpha: false,
  antialias: false,
  depth: false,
  stencil: false,
  powerPreference: "high-performance"
 });
 if (!gl) return null;
 const VERT = `#version 300 es
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;
 const FRAG = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2  iResolution;
uniform float iTime;
uniform vec2  iMouse;
uniform vec2  iMouseVel;
uniform vec3  uBg, uColorA, uColorB, uColorC, uColorD;
uniform float uScale, uSpeed, uRise, uFlicker, uBedHeight, uCoal;
uniform float uRoughness, uLacunarity, uContrast, uMidpoint, uSink, uGlow;
uniform float uGrain, uDither, uVignette, uPointerRadius, uPointerStrength, uPointerLift;
uniform float uWake, uParallax;
#define OCTAVES 4
float hash1(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}
float snoise(vec2 p) {
  const float K1 = 0.366025404, K2 = 0.211324865;
  vec2 i = floor(p + (p.x + p.y) * K1);
  vec2 a = p - i + (i.x + i.y) * K2;
  float m = step(a.y, a.x);
  vec2 o = vec2(m, 1.0 - m);
  vec2 b = a - o + K2;
  vec2 c = a - 1.0 + 2.0 * K2;
  vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
  vec3 n = h * h * h * h * vec3(dot(a, hash2(i)), dot(b, hash2(i + o)), dot(c, hash2(i + 1.0)));
  return dot(n, vec3(70.0));
}
float fbm(vec2 p) {
  float v = 0.0, amp = 0.5;
  for (int i = 0; i < OCTAVES; i++) {
    v += amp * snoise(p);
    p *= uLacunarity;
    amp *= uRoughness;
  }
  return v;
}
vec3 ramp4(float t) {
  vec3 c = mix(uColorA, uColorB, smoothstep(0.00, 0.36, t));
  c = mix(c, uColorC, smoothstep(0.32, 0.70, t));
  c = mix(c, uColorD, smoothstep(0.66, 1.00, t));
  return c;
}
float triDither(vec2 fc) {
  float a = fract(sin(dot(fc, vec2(12.9898, 78.233))) * 43758.5453);
  float b = fract(sin(dot(fc + 17.0, vec2(12.9898, 78.233))) * 43758.5453);
  return (a + b - 1.0) / 255.0;
}
uniform float uGrainAnim;
float houseGrain(vec2 fc) {
  uvec2 q = uvec2(fc) * uvec2(1597334677u, 3812015801u)
          + uint(floor(iTime * 24.0 * uGrainAnim)) * 2654435769u;
  uint n = q.x ^ q.y; n = n * 1664525u + 1013904223u; n ^= n >> 16u; n *= 2246822519u; n ^= n >> 13u;
  float a = float(n & 0xffffu) / 65535.0;
  n *= 3266489917u; n ^= n >> 16u;
  float b = float(n & 0xffffu) / 65535.0;
  return a + b - 1.0;
}
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution) / iResolution.y;
  float t = iTime * uSpeed;
  vec2 d = uv - iMouse;
  float near = exp(-dot(d, d) / max(1e-4, uPointerRadius * uPointerRadius));
  vec2 p = (uv - iMouse * uParallax) * uScale;
  float lift = smoothstep(-0.6, 0.7, uv.y);
  p.x -= iMouseVel.x * uWake * lift;
  float bed = exp(-pow(max(0.0, uv.y + 0.32), 2.0) * (3.4 / max(0.05, uBedHeight)));
  float coals = fbm(p * 2.3 + vec2(0.0, -t * 0.12)) * 0.5 + 0.5;
  float heat = fbm(vec2(p.x * 1.4, p.y * 0.8 - t * uRise)) * 0.5 + 0.5;
  float lick = fbm(vec2(p.x * 3.1 + heat * 0.6, p.y * 1.6 - t * uRise * 1.9)) * 0.5 + 0.5;
  float f = bed * (uCoal * coals + 0.30) * 0.85 + heat * 0.26 * lift + lick * uFlicker * 0.20 * lift;
  f = clamp(f + near * uPointerLift * bed, 0.0, 1.0);
  f *= smoothstep(0.95, -0.30, uv.y) * 0.92 + 0.08;
  f = clamp((f - uMidpoint) * uContrast + 0.5, 0.0, 1.0);
  vec3 col = ramp4(f);
  col += uColorD * uGlow * pow(f, 4.0);
  col = mix(uBg, col, smoothstep(0.0, max(0.01, uSink), f) * 0.9 + 0.1);
  col *= 1.0 - uVignette * dot(uv, uv);
  { float hgL = clamp(dot(col, vec3(0.299, 0.587, 0.114)), 0.0, 1.0);
    col += houseGrain(gl_FragCoord.xy) * uGrain * mix(1.0, 4.0 * hgL * (1.0 - hgL), 0.6); }
  col += triDither(gl_FragCoord.xy) * uDither;
  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;
 function compile(type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
  return sh;
 }
 const program = gl.createProgram();
 gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
 gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
 gl.linkProgram(program);
 if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
 gl.useProgram(program);
 gl.bindVertexArray(gl.createVertexArray());
 const LOC = {};
 const loc = n => n in LOC ? LOC[n] : LOC[n] = gl.getUniformLocation(program, n);
 const u1f = (n, v) => gl.uniform1f(loc(n), v);
 const u2f = (n, x, y) => gl.uniform2f(loc(n), x, y);
 const u3c = (n, hex) => {
  const c = hexToVec3(hex);
  gl.uniform3f(loc(n), c[0], c[1], c[2]);
 };
 function applyConfig() {
  gl.useProgram(program);
  u3c("uBg", CONFIG.bgColor);
  u3c("uColorA", CONFIG.colorA);
  u3c("uColorB", CONFIG.colorB);
  u3c("uColorC", CONFIG.colorC);
  u3c("uColorD", CONFIG.colorD);
  u1f("uScale", CONFIG.scale);
  u1f("uSpeed", CONFIG.speed);
  u1f("uRise", CONFIG.rise);
  u1f("uFlicker", CONFIG.flicker);
  u1f("uBedHeight", CONFIG.bedHeight);
  u1f("uCoal", CONFIG.coal);
  u1f("uRoughness", CONFIG.roughness);
  u1f("uLacunarity", CONFIG.lacunarity);
  u1f("uContrast", CONFIG.contrast);
  u1f("uMidpoint", CONFIG.midpoint);
  u1f("uSink", CONFIG.sink);
  u1f("uGlow", CONFIG.glow);
  u1f("uGrain", CONFIG.grain);
  u1f("uGrainAnim", CONFIG.grainAnim);
  u1f("uDither", CONFIG.dither);
  u1f("uVignette", CONFIG.vignette);
  u1f("uPointerRadius", CONFIG.pointerRadius);
  u1f("uPointerStrength", CONFIG.pointerStrength);
  u1f("uPointerLift", CONFIG.pointerLift);
  u1f("uWake", CONFIG.wake);
  u1f("uParallax", CONFIG.parallax);
  resize();
 }
 let dpr = 1;
 function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, CONFIG.maxDpr);
  const w = Math.max(1, Math.round(__W() * dpr));
  const h = Math.max(1, Math.round(__H() * dpr));
  if (canvas.width !== w || canvas.height !== h) {
   canvas.width = w;
   canvas.height = h;
  }
  gl.viewport(0, 0, w, h);
  gl.useProgram(program);
  u2f("iResolution", w, h);
 }
 let resizeQueued = false;
 addEventListener("resize", () => {
  if (resizeQueued) return;
  resizeQueued = true;
  requestAnimationFrame(() => {
   resizeQueued = false;
   resize();
  });
 }, {
  passive: true
 });
 const mouse = {
  x: 0,
  y: 0,
  ax: 0,
  ay: 0,
  tx: 0,
  ty: 0
 };
 const aim = e => {
  const a = __W() / __H();
  mouse.tx = ((e.clientX - __R().left) / __W() - .5) * a;
  mouse.ty = .5 - (e.clientY - __R().top) / __H();
 };
 addEventListener("pointermove", aim, {
  passive: true
 });
 addEventListener("pointerdown", aim, {
  passive: true
 });
 const fadeEl = __dummy;
 const fpsEl = __dummy;
 let visible = true;
 new IntersectionObserver(es => {
  visible = es[0].isIntersecting;
 }, {
  threshold: 0
 }).observe(canvas);
 const t0 = performance.now();
 let prevT = t0, clock = 0, fpsT = t0, fpsN = 0;
 function frame(now) {
  requestAnimationFrame(frame);
  const raw = now - prevT;
  prevT = now;
  if (!visible || document.hidden) return;
  const ms = raw > 50 ? 50 : raw < 4.167 ? 4.167 : raw;
  const s = ms > 36.7 ? 2.2 : ms * .06;
  clock += ms * .001;
  const kLead = .105 * s, kBody = .043 * s;
  mouse.ax += (mouse.tx - mouse.ax) * kLead;
  mouse.ay += (mouse.ty - mouse.ay) * kLead;
  mouse.x += (mouse.ax - mouse.x) * kBody;
  mouse.y += (mouse.ay - mouse.y) * kBody;
  u1f("iTime", clock);
  if (mouse.rest === undefined) mouse.rest = {
   x: mouse.tx,
   y: mouse.ty
  };
  if (!CONFIG.cursor) {
   mouse.tx = mouse.rest.x;
   mouse.ty = mouse.rest.y;
  }
  u2f("iMouse", mouse.x, mouse.y);
  u2f("iMouseVel", mouse.ax - mouse.x, mouse.ay - mouse.y);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  fpsN++;
  if (now - fpsT > 500) {
   fpsEl.textContent = Math.round(fpsN * 1e3 / (now - fpsT)) + " fps · " + dpr.toFixed(1) + "×";
   fpsT = now;
   fpsN = 0;
  }
 }
 applyConfig();
 gl.drawArrays(gl.TRIANGLES, 0, 3);
 fadeEl.style.opacity = 0;
 new ResizeObserver(() => resize()).observe(canvas);
 if (__opts && __opts.still) {
  gl.useProgram(program);
  u1f("iTime", __opts.t || 6);
  u1f("iIntro", 1);
  u2f("iMouse", 0, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
 } else requestAnimationFrame(frame);
 return {
  gl: gl
 };
} },
  init: function (R) {
    var list = R.querySelector('.flow'), fill = R.querySelector('.flow-line');
    if (!list || !fill) return;
    var items = list.querySelectorAll(':scope > li'), ticking = false;
    function update() {
      ticking = false;
      var r = list.getBoundingClientRect(), mid = innerHeight * 0.6;
      var p = Math.min(1, Math.max(0, (mid - r.top) / r.height));
      fill.style.setProperty('--p', p.toFixed(4));
      items.forEach(function (li) { li.classList.toggle('on', li.getBoundingClientRect().top + 40 < mid); });
    }
    addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  },
};
DD.current = "automation";
if (DD.mount) DD.mount();
