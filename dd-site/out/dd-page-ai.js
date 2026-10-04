// Disruptive Dodo · ai page.
// Rendered by src/scripts/dd-core.js into #dd-root (shared nav, footer, styles and
// motion live there). Edit copy in `html` below. {{ar}} is the arrow icon.
const DD = (window.__DD = window.__DD || { pages: {} });
DD.pages["ai"] = {
  path: "/services/ai-chatbots",
  title: "AI chatbots for WhatsApp and websites in Mauritius",
  description: "AI assistants that answer your customers on WhatsApp, Facebook and your website, day and night, trained on your business and connected to your CRM.",
  section: "services",
  ld: {
 "@context": "https://schema.org",
 "@graph": [
  {
   "@type": "Service",
   "@id": "https://disruptivedodo.mu/services/ai-chatbots#service",
   "name": "AI implementation",
   "serviceType": "AI chatbots and assistants",
   "description": "AI assistants that answer your customers on WhatsApp, Facebook and your website, day and night, trained on your business and connected to your CRM.",
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
   "url": "https://disruptivedodo.mu/services/ai-chatbots",
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
     "name": "AI implementation",
     "item": "https://disruptivedodo.mu/services/ai-chatbots"
    }
   ]
  },
  {
   "@type": "FAQPage",
   "mainEntity": [
    {
     "@type": "Question",
     "name": "What is an AI chatbot?",
     "acceptedAnswer": {
      "@type": "Answer",
      "text": "A program that answers your customers' messages in everyday language, the way a person would. Ours are trained on your business and follow rules you approve."
     }
    },
    {
     "@type": "Question",
     "name": "Will it give wrong answers?",
     "acceptedAnswer": {
      "@type": "Answer",
      "text": "We limit it to the information you approve and test it before launch. When it isn't sure, it is set to hand over to your team instead of guessing. We also read the conversations and correct any answer that needs it."
     }
    },
    {
     "@type": "Question",
     "name": "Does it work on WhatsApp?",
     "acceptedAnswer": {
      "@type": "Answer",
      "text": "Yes, through WhatsApp Business, as well as on Facebook, Instagram and your website. [WhatsApp Business setup steps, to confirm.]"
     }
    },
    {
     "@type": "Question",
     "name": "Which languages does it speak?",
     "acceptedAnswer": {
      "@type": "Answer",
      "text": "English and French. [Creole, to confirm.]"
     }
    },
    {
     "@type": "Question",
     "name": "Is my customers' data safe?",
     "acceptedAnswer": {
      "@type": "Answer",
      "text": "The assistant gets only the information it needs, and your customer records stay in your CRM. [Where conversations are stored and which AI provider is used, to confirm.]"
     }
    },
    {
     "@type": "Question",
     "name": "Can AI replace my team?",
     "acceptedAnswer": {
      "@type": "Answer",
      "text": "No, and it shouldn't. It takes the repeated questions and the late-night messages, so your team spends its time on the customers ready to buy."
     }
    },
    {
     "@type": "Question",
     "name": "Can the assistant book appointments?",
     "acceptedAnswer": {
      "@type": "Answer",
      "text": "Yes. It can offer times from your calendar, book the call or the appointment, and send the reminders."
     }
    },
    {
     "@type": "Question",
     "name": "How long does it take to set up?",
     "acceptedAnswer": {
      "@type": "Answer",
      "text": "[About 2 to 3 weeks, to confirm.] Most of the time goes into writing what it knows and testing it."
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
.chat{display:flex;flex-direction:column;gap:14px;max-width:880px;margin-inline:auto}
.chat>li{display:flex}
.chat>li.cb{justify-content:flex-end}
.chat .bub{max-width:min(560px,86%);padding:22px 26px;border-radius:26px;background:var(--card);border:1px solid var(--ln);box-shadow:var(--sh1)}
.chat>li.ca .bub{border-bottom-left-radius:8px}
.chat>li.cb .bub{border-bottom-right-radius:8px;background:var(--inv);color:var(--inv-fg);--fg:var(--inv-fg);--mu:#62615b;border-color:transparent}
.chat .typing .bub{display:flex;gap:6px;padding:18px 22px}
.chat .typing i{width:7px;height:7px;border-radius:50%;background:var(--mu);animation:dot 1.4s infinite ease-in-out}
.chat .typing i:nth-child(2){animation-delay:.18s}
.chat .typing i:nth-child(3){animation-delay:.36s}
@keyframes dot{0%,60%,100%{opacity:.3;transform:none}
30%{opacity:1;transform:translateY(-3px)}
}
@media (prefers-reduced-motion:reduce){.chat .typing i{animation:none}
}
.vg-ai .phn{left:38%;top:3%;width:24%;height:94%;border-radius:2.8cqw}
.vg-ai .hdr{left:39.5%;top:7%;width:21%;padding-bottom:1cqw;border-bottom:1px solid rgba(255,255,255,.08)}
.vg-ai .onl{color:rgba(243,241,234,.55);font-size:.85cqw}
.vg-ai .bub{max-width:17cqw;padding:.9cqw 1.1cqw;border-radius:1.4cqw;font-size:1.02cqw;line-height:1.35;white-space:normal}
.vg-ai .cu{left:40%;background:rgba(255,255,255,.09);border-bottom-left-radius:.4cqw}
.vg-ai .bo{right:40%;background:#f3f1ea;color:#0c0c0e;border-bottom-right-radius:.4cqw;text-align:left}
.vg-ai .typ{right:40%;display:flex;gap:.4cqw;padding:1cqw 1.2cqw;border-radius:1.4cqw;background:#f3f1ea}
.vg-ai .typ i{width:.6cqw;height:.6cqw;border-radius:50%;background:#0c0c0e;opacity:.5}
.vg-ai .bk{left:6%;top:30%;width:26%;padding:1.4cqw}
.vg-ai .tm{left:68%;top:52%;width:26%;padding:1.4cqw}
.vg-ai .cal{width:3.4cqw;height:3.4cqw;border-radius:.8cqw;background:#f3f1ea;color:#0c0c0e;display:grid;place-items:center;font-weight:600;font-size:1.2cqw;flex:none}
@media (max-width:767px){.vg-ai{--fx:-45%}
}`,
  html: `<main>
  <section class="hero">
    <div class="hero-bg shade"></div>
    <div class="hero-grid">
      <div class="hl">
        <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><a href="/services">Services</a></li><li aria-current="page">AI implementation</li></ol></nav>
        <p class="kick mt-48">AI implementation · Mauritius</p>
        <h1 class="d1 mt-24">AI chatbots in Mauritius that answer your customers, day and night.</h1>
      </div>
      <div class="hr">
        <p class="lead">Your customers message at ten at night and on Sunday mornings. An AI assistant trained on your business answers them in seconds on WhatsApp, Facebook and your website, books the call, and hands the conversation to your team when a person is needed.</p>
        <div class="btn-row mt-32"><a class="btn btn-p" href="/contact">Book a free growth call{{ar}}</a><a class="btn" href="/fledge">See Fledge, the full system</a></div>
        <a class="sp-part mt-32" href="/fledge"><span class="cap">Part of Fledge ·</span><span class="tags"><span class="tag">Stage 03 · Get The Business</span></span></a>
      </div>
    </div>
  </section>

  <section class="sheet lt sec" aria-labelledby="plain-h">
    <div class="sp-ban"><div class="vg vg-ai" role="img" aria-label="An AI assistant answering a customer on WhatsApp and booking a visit" data-r="x"><div class="vg-in"><div class="v-g">
    <div class="v-win phn"></div>
    <div class="v-row hdr"><span class="v-av"></span><div><p class="v-t">Your business</p><p class="onl">Online</p></div></div>
    <p class="bub cu m1" style="top:20%">Hi, are you open on Sunday?</p>
    <div class="typ t1" style="top:32%"><i></i><i></i><i></i></div>
    <p class="bub bo m2" style="top:32%">Yes, from 9:00 to 13:00. Would you like to book a visit?</p>
    <p class="bub cu m3" style="top:51%">Yes, Sunday at 10:00 please.</p>
    <div class="typ t2" style="top:63%"><i></i><i></i><i></i></div>
    <p class="bub bo m4" style="top:63%">Done. You are booked for Sunday at 10:00.</p>
    <div class="v-win v-solid bk"><div class="v-row"><span class="cal">10</span><div><p class="v-t">Booked</p><p class="v-s">Sunday at 10:00</p></div></div></div>
    <div class="v-win v-solid tm"><div class="v-row"><span class="v-av"></span><div><p class="v-t">Team notified</p><p class="v-s">The full chat is in your CRM</p></div></div></div>
  </div></div><div class="lb" hidden><div class="lb"><b>AI assistant on WhatsApp</b><span>A customer conversation with the assistant, on a phone</span><i>21:9</i></div></div></div></div>
    <div class="g12">
      <div class="c1-5"><p class="kick">In plain terms</p><h2 class="h2 mt-24" id="plain-h">What you get, in plain terms.</h2></div>
      <p class="lead fg c7-12">We put AI to work where it helps you sell: answering customer questions, collecting their details, booking calls and drafting follow-ups. It works from your business's information, follows your rules, and passes the conversation to a person when it should.</p>
    </div>
    <dl class="facts mt-96" data-r="s"><div><dt class="cap">Who it's for</dt><dd>Businesses that get the same questions every day, or miss messages outside working hours.</dd></div><div><dt class="cap">What you get</dt><dd>An AI assistant on WhatsApp, Facebook, Instagram and your website, trained on your business and connected to your CRM.</dd></div><div><dt class="cap">Languages</dt><dd>English and French. <span class="todo">[Creole, to confirm]</span></dd></div><div><dt class="cap">How you pay</dt><dd>A setup fee, then <span class="todo">[a monthly fee for the AI and its upkeep, to confirm]</span>.</dd></div></dl>
  </section>

  <section class="sheet dk sec" aria-labelledby="sf-h">
    <div class="g12">
      <div class="c1-4"><div class="stick"><h2 class="d2" id="sf-h">Sound familiar?</h2></div></div>
      <ol class="qlist c5-12"><li data-r="u"><span class="n">01</span><p>"We get the same ten questions every day."</p></li><li data-r="u"><span class="n">02</span><p>"Messages that come in at night get answered the next afternoon."</p></li><li data-r="u"><span class="n">03</span><p>"We tried a chatbot. It answered nonsense, so we switched it off."</p></li><li data-r="u"><span class="n">04</span><p>"Everyone talks about AI. We don't know where it would actually help us."</p></li></ol>
    </div>
  </section>

  <section class="sheet sf sec inc-chat" aria-labelledby="inc-h">
    <div class="head"><div><p class="kick">What's included</p><h2 class="h2 mt-24" id="inc-h" style="max-width:18ch">Where we put AI to work.</h2></div></div>
    <ol class="chat mt-64">
      <li class="ca" data-r="u"><div class="bub"><p class="cap">01</p><h3 class="h4 mt-8">An assistant that answers customers</h3><p class="tx mt-8">On WhatsApp, Facebook, Instagram and your website. It answers questions about your products, services, prices and opening hours, in your tone.</p></div></li>
      <li class="cb" data-r="u"><div class="bub"><p class="cap">02</p><h3 class="h4 mt-8">Trained on your business</h3><p class="tx mt-8">It works from the information you approve: your services, your prices, your policies. When it doesn't know, it says so and calls a person.</p></div></li>
      <li class="ca" data-r="u"><div class="bub"><p class="cap">03</p><h3 class="h4 mt-8">Enquiries qualified and booked</h3><p class="tx mt-8">It asks the questions your team would ask, records the answers in your CRM, and books a call or an appointment.</p></div></li>
      <li class="cb" data-r="u"><div class="bub"><p class="cap">04</p><h3 class="h4 mt-8">A clean hand-off to your team</h3><p class="tx mt-8">When a customer needs a person, the conversation goes to the right member of your team, with the full history.</p></div></li>
      <li class="ca" data-r="u"><div class="bub"><p class="cap">05</p><h3 class="h4 mt-8">Follow-ups written for each person</h3><p class="tx mt-8">AI drafts follow-up messages from what each customer asked, for your team to check and send.</p></div></li>
      <li class="cb" data-r="u"><div class="bub"><p class="cap">06</p><h3 class="h4 mt-8">Content, made faster</h3><p class="tx mt-8">We use AI in our own studio to make visuals and video for your posts and ads faster. A person checks everything before it goes out.</p></div></li>
      <li class="ca typing" aria-hidden="true" data-r="u"><div class="bub"><i></i><i></i><i></i></div></li>
    </ol>
  </section>

  <section class="sheet lt sec" aria-labelledby="how-h">
    <div class="g12">
      <div class="c1-5"><div class="stick"><p class="kick">How it works</p><h2 class="h2 mt-24" id="how-h" style="max-width:12ch">How we set it up.</h2></div></div>
      <ol class="steps c7-12"><li data-r="u"><span class="i">01</span><div><h3>We find where AI helps</h3><p>We look at your messages and your sales process, and pick the jobs AI does well. Not everything should be automated.</p></div></li><li data-r="u"><span class="i">02</span><div><h3>We write what it knows and its rules</h3><p>What it can say, what it must never say, and when it must hand over to a person. You approve all of it.</p></div></li><li data-r="u"><span class="i">03</span><div><h3>We connect it</h3><p>To WhatsApp, your website, your pages and your CRM.</p></div></li><li data-r="u"><span class="i">04</span><div><h3>We test it hard</h3><p>We ask it the questions your customers ask, and the awkward ones too, before any customer sees it.</p></div></li><li data-r="u"><span class="i">05</span><div><h3>We watch and improve it</h3><p>We read the conversations, fill the gaps and keep its information up to date.</p></div></li></ol>
    </div>
  </section>

  <section class="sheet dk sec" aria-labelledby="choose-h">
    <div class="head"><div><p class="kick">Before you choose</p><h2 class="h2 mt-24" id="choose-h" style="max-width:20ch">How to choose an AI chatbot partner in Mauritius.</h2></div></div>
    <ol class="rows hov mt-64"><li data-r="u"><span class="n">(01)</span><h3 class="h3 t">Ask what it will be trained on</h3><p class="tx b">An assistant is only as good as the information it works from. Ask who writes and approves it, and how it is kept up to date.</p></li><li data-r="u"><span class="n">(02)</span><h3 class="h3 t">Ask what happens when it doesn't know</h3><p class="tx b">A good assistant hands the conversation to a person. A bad one guesses. Ask to see how the hand-off works.</p></li><li data-r="u"><span class="n">(03)</span><h3 class="h3 t">Check it connects to your sales</h3><p class="tx b">An assistant that chats but doesn't record enquiries or book calls leaves the job half done. It should feed your CRM and your calendar.</p></li><li data-r="u"><span class="n">(04)</span><h3 class="h3 t">Ask to test it first</h3><p class="tx b">Before launch, ask it the questions your customers ask, and the awkward ones too. If the answers worry you, it isn't ready.</p></li></ol>
  </section>

  <section class="sheet sf sec" aria-labelledby="fl-h">
    <div class="flc" data-r="u">
      <div class="a">
        <p class="kick">Part of Fledge</p>
        <h2 class="h2 mt-24" id="fl-h">The first reply every customer gets.</h2>
        <p class="tx mt-24">In Fledge, the AI assistant works inside your CRM. Every conversation is saved, every booking lands in your calendar, and every enquiry is followed up, whether it came in at noon or at midnight.</p>
        <a class="lnk mt-32" href="/fledge">Discover Fledge{{ar}}</a>
      </div>
      <ol class="stg b" aria-label="The four stages of Fledge"><li class=""><span class="n">01</span><div><p class="nm">Get Found</p><p class="lnn">People find you on Google, social media and ads.</p></div></li><li class=""><span class="n">02</span><div><p class="nm">Get Chosen</p><p class="lnn">Your website and proof make them pick you.</p></div></li><li class="on"><span class="n">03</span><div><p class="nm">Get The Business</p><p class="lnn">Every enquiry gets a fast reply and a follow-up.</p></div><p class="this">This service</p></li><li class=""><span class="n">04</span><div><p class="nm">Keep &amp; Grow</p><p class="lnn">Customers come back and send others.</p></div></li></ol>
    </div>
    <div class="head mt-128"><p class="kick">Works well with</p><a class="lnk" href="/services">All services{{ar}}</a></div>
    <div class="svcs mt-32" data-r="s">
      <a class="card lift svc" href="/services/marketing-automation-crm"><img class="cov" src="/uploads/scHUo4gyKrkiEYNTf-8EU-svc-04.webp" alt="" width="960" height="684" loading="lazy"><div><h3>Automation and CRM</h3><p class="sub">CRM, follow-up and automation, so you handle more enquiries without hiring more people.</p></div><div class="ft-row"><span></span><span class="ring">{{ar}}</span></div></a>
      <a class="card lift svc" href="/services/web-design"><img class="cov" src="/uploads/1qEcUtH4lHDuqfDdPiAdS-svc-01.webp" alt="" width="960" height="684" loading="lazy"><div><h3>Websites and SEO</h3><p class="sub">Websites and SEO that put your business in front of the right people.</p></div><div class="ft-row"><span></span><span class="ring">{{ar}}</span></div></a>
      <a class="card lift svc" href="/services/social-media-management"><img class="cov" src="/uploads/EmxO1Byhcnx4qSVf0rF7I-svc-06.webp" alt="" width="960" height="684" loading="lazy"><div><h3>Social media</h3><p class="sub">Social media and content that keep your brand visible, trusted, and relevant.</p></div><div class="ft-row"><span></span><span class="ring">{{ar}}</span></div></a>
    </div>
  </section>

  <section class="sheet lt sec" aria-labelledby="proof-h">
    <div class="g12">
      <div class="c1-4"><div class="stick"><p class="kick">Our work</p><h2 class="h2 mt-24" id="proof-h">A project like this.</h2>
        <p class="sm mt-32" style="max-width:30ch">Client names and results appear only with each client's written consent.</p><a class="lnk mt-24" href="/work">See all our work{{ar}}</a></div></div>
      <a class="card lift pcard c5-12" href="/work/case-study" data-r="u">
        <div class="ph r16x9"><div class="lb"><b>Project cover</b><span>An AI implementation project, shown in context</span><i>16:9</i></div></div>
        <div class="row"><div><h3 class="h3"><span class="todo">[Client name]</span></h3><p class="cap mt-12"><span class="todo">[Sector]</span></p></div><span class="ring">{{ar}}</span></div>
        <p class="tx"><span class="todo">[What changed, in one line]</span></p>
      </a>
    </div>
  </section>

  <section class="sheet dk sec" aria-labelledby="faq-h">
    <div class="g12">
      <div class="c1-5"><div class="stick"><p class="kick">Questions</p><h2 class="h2 mt-24" id="faq-h" style="max-width:12ch">AI questions, answered.</h2></div></div>
      <div class="faq c7-12">
        <details open><summary><h3>What is an AI chatbot?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans">A program that answers your customers' messages in everyday language, the way a person would. Ours are trained on your business and follow rules you approve.</p></details>
        <details><summary><h3>Will it give wrong answers?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans">We limit it to the information you approve and test it before launch. When it isn't sure, it is set to hand over to your team instead of guessing. We also read the conversations and correct any answer that needs it.</p></details>
        <details><summary><h3>Does it work on WhatsApp?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans">Yes, through WhatsApp Business, as well as on Facebook, Instagram and your website. <span class="todo">[WhatsApp Business setup steps, to confirm.]</span></p></details>
        <details><summary><h3>Which languages does it speak?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans">English and French. <span class="todo">[Creole, to confirm.]</span></p></details>
        <details><summary><h3>Is my customers' data safe?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans">The assistant gets only the information it needs, and your customer records stay in your CRM. <span class="todo">[Where conversations are stored and which AI provider is used, to confirm.]</span></p></details>
        <details><summary><h3>Can AI replace my team?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans">No, and it shouldn't. It takes the repeated questions and the late-night messages, so your team spends its time on the customers ready to buy.</p></details>
        <details><summary><h3>Can the assistant book appointments?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans">Yes. It can offer times from your calendar, book the call or the appointment, and send the reminders.</p></details>
        <details><summary><h3>How long does it take to set up?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans"><span class="todo">[About 2 to 3 weeks, to confirm.]</span> Most of the time goes into writing what it knows and testing it.</p></details>
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
  "root": ".vg-ai",
  "D": 10000,
  "still": 0.82,
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
    ".phn",
    0,
    [
     [
      0,
      900,
      {
       "opacity": 0,
       "transform": "translateY(3cqw) scale(.97)"
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
    ".hdr",
    0,
    [
     [
      400,
      1000,
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
    ".m1",
    0,
    [
     [
      1000,
      1500,
      {
       "opacity": 0,
       "transform": "translateY(1.2cqw) scale(.94)"
      },
      {
       "opacity": 1,
       "transform": "none"
      },
      "sp"
     ]
    ]
   ],
   [
    ".t1",
    0,
    [
     [
      1900,
      2200,
      {
       "opacity": 0,
       "transform": "scale(.8)"
      },
      {
       "opacity": 1,
       "transform": "scale(1)"
      },
      "sp"
     ],
     [
      3000,
      3150,
      {},
      {
       "opacity": 0
      },
      "l"
     ]
    ]
   ],
   [
    ".t1 i",
    150,
    [
     [
      2100,
      2400,
      {
       "transform": "translateY(0)"
      },
      {
       "transform": "translateY(-.4cqw)"
      },
      "io"
     ],
     [
      2400,
      2700,
      {},
      {
       "transform": "translateY(0)"
      },
      "io"
     ]
    ]
   ],
   [
    ".m2",
    0,
    [
     [
      3050,
      3550,
      {
       "opacity": 0,
       "transform": "translateY(1.2cqw) scale(.94)"
      },
      {
       "opacity": 1,
       "transform": "none"
      },
      "sp"
     ]
    ]
   ],
   [
    ".m3",
    0,
    [
     [
      4500,
      5000,
      {
       "opacity": 0,
       "transform": "translateY(1.2cqw) scale(.94)"
      },
      {
       "opacity": 1,
       "transform": "none"
      },
      "sp"
     ]
    ]
   ],
   [
    ".t2",
    0,
    [
     [
      5300,
      5600,
      {
       "opacity": 0,
       "transform": "scale(.8)"
      },
      {
       "opacity": 1,
       "transform": "scale(1)"
      },
      "sp"
     ],
     [
      6300,
      6450,
      {},
      {
       "opacity": 0
      },
      "l"
     ]
    ]
   ],
   [
    ".t2 i",
    150,
    [
     [
      5500,
      5800,
      {
       "transform": "translateY(0)"
      },
      {
       "transform": "translateY(-.4cqw)"
      },
      "io"
     ],
     [
      5800,
      6100,
      {},
      {
       "transform": "translateY(0)"
      },
      "io"
     ]
    ]
   ],
   [
    ".m4",
    0,
    [
     [
      6350,
      6850,
      {
       "opacity": 0,
       "transform": "translateY(1.2cqw) scale(.94)"
      },
      {
       "opacity": 1,
       "transform": "none"
      },
      "sp"
     ]
    ]
   ],
   [
    ".bk",
    0,
    [
     [
      7000,
      7600,
      {
       "opacity": 0,
       "transform": "translateX(2cqw) scale(.95)"
      },
      {
       "opacity": 1,
       "transform": "none"
      },
      "sp"
     ]
    ]
   ],
   [
    ".tm",
    0,
    [
     [
      7600,
      8200,
      {
       "opacity": 0,
       "transform": "translateX(-2cqw) scale(.95)"
      },
      {
       "opacity": 1,
       "transform": "none"
      },
      "sp"
     ]
    ]
   ]
  ]
 }
],
  // Hero gradient: GetLayers "cynosure", tinted greyscale through its CONFIG. The shader is untouched.
  gl: { cfg: {"bgColor":"#08080a","colorA":"#7d7c78","colorB":"#4e4e4b","colorC":"#4a4a47","colorD":"#8b8a86"}, poster: "/uploads/scHUo4gyKrkiEYNTf-8EU-svc-04.webp", mount: function(canvas, __ovr, __opts) {
 const __dummy = {
  style: {},
  textContent: ""
 };
 const __R = () => canvas.getBoundingClientRect();
 const __W = () => canvas.clientWidth || 1;
 const __H = () => canvas.clientHeight || 1;
 const CONFIG = {
  bgColor: "#000000",
  colorA: "#3fe07f",
  colorB: "#e0399a",
  colorC: "#2b6eff",
  colorD: "#ffd93f",
  scale: .2,
  speed: .33,
  flow: .35,
  warp: 1.6,
  warpScale: .6,
  roughness: .52,
  lacunarity: 1.9,
  zoom: .8,
  taper: .85,
  gate: .5,
  gateSoft: .75,
  core: .6,
  coreRadius: .7,
  contrast: 1.4,
  midpoint: .5,
  glow: .9,
  grain: .11,
  grainAnim: 0,
  dither: 1.2,
  vignette: .2,
  cursor: 1,
  pointerRadius: .7,
  pointerFollow: .85,
  pointerLift: .25,
  parallax: .002,
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
uniform vec3  uBg, uColorA, uColorB, uColorC, uColorD;
uniform float uScale, uSpeed, uFlow, uWarp, uWarpScale, uRoughness, uLacunarity;
uniform float uZoom, uTaper, uGate, uGateSoft, uCore, uCoreRadius;
uniform float uContrast, uMidpoint, uGlow, uGrain, uDither, uVignette;
uniform float uPointerRadius, uPointerFollow, uPointerLift, uParallax;
#define OCTAVES 4
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
vec2 rot(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }
#define TAPS 6
float source(vec2 q, vec2 w, float t) {
  float n = fbm(q + w + vec2(t * 0.09, -t * 0.07)) * 0.5 + 0.5;
  return smoothstep(uGate - uGateSoft, uGate + uGateSoft, n);
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
  vec2 c = iMouse * uPointerFollow;
  vec2 v = uv - c;
  float r = length(v);
  vec2 p0 = (uv - iMouse * uParallax) * uScale;
  float wv = fbm(p0 * uWarpScale + vec2(0.0, t * uFlow));
  vec2 w = uWarp * vec2(wv, -wv * 0.7);
  float acc = 0.0, wsum = 0.0;
  for (int i = 0; i < TAPS; i++) {
    float k = float(i) / float(TAPS - 1);
    float s = 1.0 - k * uZoom;
    vec2 q = (c + v * s - iMouse * uParallax) * uScale;
    float wt = mix(1.0, 1.0 - uTaper, k);
    acc += source(q, w, t) * wt;
    wsum += wt;
  }
  float rays = acc / max(0.001, wsum);
  float core = exp(-r * r / max(1e-4, uCoreRadius * uCoreRadius));
  float f = clamp((rays - uMidpoint) * uContrast + 0.5 + core * uCore + core * uPointerLift, 0.0, 1.0);
  vec3 col = uColorA;
  col = mix(col, uColorC, smoothstep(0.06, 0.50, f) * 0.7);
  col = mix(col, uColorB, smoothstep(0.44, 0.88, f));
  col = mix(col, uColorD, smoothstep(0.86, 1.00, f) * 0.9);
  col += uColorD * uGlow * core * core;
  col = mix(uBg, col, smoothstep(0.0, 0.10, f) * 0.90 + 0.10);
  col *= 1.0 - uVignette * dot(uv, uv);
  { float hgL = clamp(dot(col, vec3(0.299, 0.587, 0.114)), 0.0, 1.0);
    col += houseGrain(gl_FragCoord.xy) * uGrain * mix(1.0, 4.0 * hgL * (1.0 - hgL), 0.6); }
  col += triDither(gl_FragCoord.xy) * uDither;
  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;
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
  u1f("uFlow", CONFIG.flow);
  u1f("uWarp", CONFIG.warp);
  u1f("uWarpScale", CONFIG.warpScale);
  u1f("uRoughness", CONFIG.roughness);
  u1f("uLacunarity", CONFIG.lacunarity);
  u1f("uZoom", CONFIG.zoom);
  u1f("uTaper", CONFIG.taper);
  u1f("uGate", CONFIG.gate);
  u1f("uGateSoft", CONFIG.gateSoft);
  u1f("uCore", CONFIG.core);
  u1f("uCoreRadius", CONFIG.coreRadius);
  u1f("uContrast", CONFIG.contrast);
  u1f("uMidpoint", CONFIG.midpoint);
  u1f("uGlow", CONFIG.glow);
  u1f("uGrain", CONFIG.grain);
  u1f("uGrainAnim", CONFIG.grainAnim);
  u1f("uDither", CONFIG.dither);
  u1f("uVignette", CONFIG.vignette);
  u1f("uPointerRadius", CONFIG.pointerRadius);
  u1f("uPointerFollow", CONFIG.pointerFollow);
  u1f("uPointerLift", CONFIG.pointerLift);
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
};
DD.current = "ai";
if (DD.mount) DD.mount();
