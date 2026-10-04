// Disruptive Dodo · automation page content (from the website-v1 design).
// Rendered by src/scripts/dd-core.js into #dd-root. Edit copy here; shared nav, footer and styles live in dd-core.js.
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
      "text": "We build on GoHighLevel, which brings your inbox, pipeline, booking, email and automation into one place. If you already use a CRM, we look at it first and tell you honestly whether to keep it."
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
  css: ``,
  html: `<main>
  <section class="hero-in sp-hero">
    <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><a href="/services">Services</a></li><li aria-current="page">Automation and CRM</li></ol></nav>
    <p class="eb"><span class="dot"></span>Automation and CRM · Mauritius</p>
    <h1 class="h1">Marketing automation and CRM in Mauritius, so no enquiry slips through.</h1>
    <p class="ld">Enquiries come in by WhatsApp, Facebook, email, phone and your website. Some get answered, some get forgotten. We put them all in one place, reply in minutes, and follow up automatically until each person says yes or no.</p>
    <div class="btn-row">
      <a class="btn btn-a" href="/contact">Book a free growth call</a>
      <a class="btn" href="/fledge">See Fledge, the full system</a>
    </div>
    <a class="sp-part" href="/fledge"><span class="cap">Part of Fledge ·</span><span class="tags"><span class="tag">Stage 03 · Get The Business</span><span class="tag">Stage 04 · Keep &amp; Grow</span></span></a>
  </section>

  <div class="gt sp-banner">
    <div class="ph r21x9"><div class="lb"><b>CRM pipeline</b><span>Enquiries moving through the stages of a sale, on a laptop</span><i>21:9</i></div></div>
  </div>

  <section class="lt panel sec sp-plain" aria-labelledby="plain-h">
    <div class="g12">
      <div class="span-5">
        <p class="eb"><span class="dot"></span>In plain terms</p>
        <h2 class="h2 mt-24" id="plain-h">What you get, in plain terms.</h2>
      </div>
      <p class="ld fg span-6 from-7 sp-plain-p">A CRM is one place where every enquiry and every customer is kept, with their full history. Automation is the work it does on its own: replies, reminders, follow-ups and review requests. We set up both, connect them to your website, your pages and your phone, and show your team how to use them.</p>
    </div>
    <dl class="meta sp-facts mt-96">
      <div><dt class="cap">Who it's for</dt><dd class="tx">Businesses that lose track of enquiries, or spend hours chasing them by hand.</dd></div>
      <div><dt class="cap">What you get</dt><dd class="tx">A CRM set up for you, every enquiry in one place, instant alerts, follow-up, online booking, review requests.</dd></div>
      <div><dt class="cap">Built on</dt><dd class="tx">GoHighLevel, or the CRM you already use if it does the job.</dd></div>
      <div><dt class="cap">How you pay</dt><dd class="tx">A setup fee, then <span class="todo">[a monthly fee for the CRM and support, to confirm]</span>.</dd></div>
    </dl>
  </section>

  <section class="sec sp-sf" aria-labelledby="sf-h">
    <h2 class="h2" id="sf-h">Sound familiar?</h2>
    <div class="sp-quotes mt-64">
      <blockquote class="sp-q"><p>"Enquiries come in on five channels and nobody sees all of them."</p></blockquote>
      <blockquote class="sp-q"><p>"We send quotes and forget to follow up."</p></blockquote>
      <blockquote class="sp-q"><p>"Our customer list is a spreadsheet, a phone and someone's memory."</p></blockquote>
      <blockquote class="sp-q"><p>"Half the week goes on copying information from one place to another."</p></blockquote>
    </div>
  </section>

  <section class="panel on-sf sec" aria-labelledby="inc-h">
    <div class="sp-inc-head">
      <p class="eb"><span class="dot"></span>What's included</p>
      <h2 class="h2 mt-24" id="inc-h">What we set up.</h2>
    </div>
    <ol class="sp-inc mt-64">
      <li><p class="cap">01</p><h3 class="h4">One place for every enquiry</h3><p class="tx">WhatsApp, Facebook, Instagram, email, your website forms and calls, in one inbox, with the full history of each person.</p></li>
      <li><p class="cap">02</p><h3 class="h4">A clear view of every sale</h3><p class="tx">Every enquiry and where it stands: new, contacted, quote sent, won or lost. Nothing hides in someone's inbox.</p></li>
      <li><p class="cap">03</p><h3 class="h4">Instant alerts</h3><p class="tx">Your team gets a WhatsApp alert the moment a real enquiry comes in, with the details.</p></li>
      <li><p class="cap">04</p><h3 class="h4">Questions that filter enquiries</h3><p class="tx">Forms that ask the right questions first, so your team spends its time on the people ready to buy.</p></li>
      <li><p class="cap">05</p><h3 class="h4">Follow-up that runs on its own</h3><p class="tx">Reminders by email, SMS or WhatsApp until the person decides. Your team steps in when it matters.</p></li>
      <li><p class="cap">06</p><h3 class="h4">Online booking</h3><p class="tx">A calendar on your website and pages where customers book a call or an appointment, with automatic reminders.</p></li>
      <li><p class="cap">07</p><h3 class="h4">Review requests</h3><p class="tx">After each sale, customers are asked for a Google review at the right moment.</p></li>
      <li><p class="cap">08</p><h3 class="h4">Email campaigns</h3><p class="tx">News and offers sent to past customers and to people who enquired but didn't buy yet.</p></li>
    </ol>
  </section>

  <section class="lt panel sec" aria-labelledby="how-h">
    <div class="g12">
      <div class="span-5 sp-how-h">
        <p class="eb"><span class="dot"></span>How it works</p>
        <h2 class="h2 mt-24" id="how-h">How we set it up.</h2>
      </div>
      <ol class="span-6 from-7">
        <li class="principle"><span class="idx">01</span><div><h3>We map how enquiries come in today</h3><p>Every channel, every step, and where things get lost.</p></div></li>
        <li class="principle"><span class="idx">02</span><div><h3>We design the flow</h3><p>What happens when someone enquires, who does what, and what runs on its own.</p></div></li>
        <li class="principle"><span class="idx">03</span><div><h3>We set it up and connect it</h3><p>CRM, website, pages, phone and calendar, connected and tested.</p></div></li>
        <li class="principle"><span class="idx">04</span><div><h3>We show your team how to use it</h3><p>Short sessions with your team, so the system is used from the first day.</p></div></li>
        <li class="principle"><span class="idx">05</span><div><h3>We watch and improve</h3><p>We check what's working and adjust the messages and the timing.</p></div></li>
      </ol>
    </div>
  </section>

  <section class="sec" aria-labelledby="choose-h">
    <div class="sp-choose-head">
      <p class="eb"><span class="dot"></span>Before you choose</p>
      <h2 class="h2 mt-24" id="choose-h">How to choose a CRM and automation partner in Mauritius.</h2>
    </div>
    <ol class="sp-choose mt-64">
      <li><span class="cap">01</span><div><h3 class="h3">Start from how you sell</h3><p class="tx">The right setup follows your sales process, not the other way round. Ask a partner to map how enquiries reach you before they suggest a tool.</p></div></li>
      <li><span class="cap">02</span><div><h3 class="h3">Ask who sets it up and who supports it</h3><p class="tx">A CRM nobody looks after goes stale in months. Find out who builds it, who fixes it and who answers your team's questions.</p></div></li>
      <li><span class="cap">03</span><div><h3 class="h3">Check it connects to WhatsApp</h3><p class="tx">In Mauritius, many customers enquire on WhatsApp first. Make sure your CRM brings those conversations in with the rest.</p></div></li>
      <li><span class="cap">04</span><div><h3 class="h3">Ask how your team will learn it</h3><p class="tx">A system only works if your team uses it. Ask how they will be trained, and what happens when someone new joins.</p></div></li>
    </ol>
  </section>

  <section class="sec sp-flsec" aria-labelledby="fl-h">
    <div class="sp-fl">
      <div>
        <p class="eb eba">Part of Fledge</p>
        <h2 class="h2 mt-24" id="fl-h">The part that turns attention into sales.</h2>
        <p class="tx mt-24">Your ads, website and social media bring people in. Your CRM and follow-up make sure each one gets an answer and a next step. In Fledge, they are built together, so you can see where every sale came from.</p>
        <a class="lnk" href="/fledge">Discover Fledge<svg class="ar" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.6 9.4L9.4 2.6M4.2 2.6h5.2v5.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
      </div>
      <ol class="sp-stages" aria-label="The four stages of Fledge">
          <li class="sp-st"><span class="n">01</span><div class="bd"><p class="nm">Get Found</p><p class="ln">People find you on Google, social media and ads.</p></div></li>
          <li class="sp-st"><span class="n">02</span><div class="bd"><p class="nm">Get Chosen</p><p class="ln">Your website and proof make them pick you.</p></div></li>
          <li class="sp-st on"><span class="n">03</span><div class="bd"><p class="nm">Get The Business</p><p class="ln">Every enquiry gets a fast reply and a follow-up.</p></div><p class="eb this"><span class="dot"></span>This service</p></li>
          <li class="sp-st on"><span class="n">04</span><div class="bd"><p class="nm">Keep &amp; Grow</p><p class="ln">Customers come back and send others.</p></div><p class="eb this"><span class="dot"></span>This service</p></li>
      </ol>
    </div>
    <div class="sp-with">
      <p class="cap">Works well with</p>
      <div class="sp-sibs">
      <a class="svc" href="/services/ai-chatbots">
        <img class="cov" src="/uploads/nCS7Kte6VC1XCoepoHERN-svc-05.webp" alt="" width="960" height="684">
        <div><h3>AI implementation</h3><p class="sub">AI assistants that reply to your customers on WhatsApp and your website, day and night.</p></div>
        <div class="disc"><span class="ring"><svg viewBox="0 0 19.0049 19" fill="none" aria-hidden="true"><path d="M19.0049 1.18457H19.002V18.3564H17.8047V2.21973L0.84668 19L0 18.1621L17.1582 1.18457H0.453125V0H19.0049V1.18457Z" fill="currentColor"/></svg></span></div>
      </a>
      <a class="svc" href="/services/web-design">
        <img class="cov" src="/uploads/1qEcUtH4lHDuqfDdPiAdS-svc-01.webp" alt="" width="960" height="684">
        <div><h3>Websites and SEO</h3><p class="sub">Websites and SEO that put your business in front of the right people.</p></div>
        <div class="disc"><span class="ring"><svg viewBox="0 0 19.0049 19" fill="none" aria-hidden="true"><path d="M19.0049 1.18457H19.002V18.3564H17.8047V2.21973L0.84668 19L0 18.1621L17.1582 1.18457H0.453125V0H19.0049V1.18457Z" fill="currentColor"/></svg></span></div>
      </a>
      <a class="svc" href="/services/facebook-google-ads">
        <img class="cov" src="/uploads/Y3s6CQVkiDaxrn8gIgp9C-svc-02.webp" alt="" width="960" height="684">
        <div><h3>Paid ads</h3><p class="sub">Facebook, Instagram and Google ads that turn attention into enquiries.</p></div>
        <div class="disc"><span class="ring"><svg viewBox="0 0 19.0049 19" fill="none" aria-hidden="true"><path d="M19.0049 1.18457H19.002V18.3564H17.8047V2.21973L0.84668 19L0 18.1621L17.1582 1.18457H0.453125V0H19.0049V1.18457Z" fill="currentColor"/></svg></span></div>
      </a>
      </div>
    </div>
  </section>

  <section class="sec sp-proof" aria-labelledby="proof-h">
    <div class="sp-proof-in sp-proof-g">
        <div class="sp-proof-head">
          <p class="eb"><span class="dot"></span>Our work</p>
          <h2 class="h2 mt-24" id="proof-h">A project like this.</h2>
        </div>
        <a class="sp-pcard" href="/work/case-study">
          <div class="ph r16x9"><div class="lb"><b>Project cover</b><span>An automation and CRM project, shown in context</span><i>16:9</i></div></div>
          <div class="sp-prow"><div><h3 class="h3"><span class="todo">[Client name]</span></h3><p class="cap mt-12"><span class="todo">[Sector]</span></p></div><span class="sp-pgo" aria-hidden="true"><svg class="ar" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.6 9.4L9.4 2.6M4.2 2.6h5.2v5.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>
          <p class="tx mt-16"><span class="todo">[What changed, in one line]</span></p>
        </a>
        <div class="sp-proof-foot">
          <p class="sm">Client names and results appear only with each client's written consent.</p>
          <a class="lnk" href="/work">See all our work<svg class="ar" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.6 9.4L9.4 2.6M4.2 2.6h5.2v5.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
        </div>
    </div>
  </section>

  <section class="lt panel sec" aria-labelledby="faq-h">
    <div class="g12">
      <div class="span-5 sp-faq-head">
        <p class="eb"><span class="dot"></span>Questions</p>
        <h2 class="h2 mt-24" id="faq-h">CRM and automation questions, answered.</h2>
      </div>
      <div class="span-6 from-7 faq">
        <details open><summary><h3>What is a CRM, in plain words?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans">One place where you keep every enquiry and every customer, with their messages, calls, quotes and history. Your whole team sees the same thing.</p></details>
        <details><summary><h3>Which CRM do you use?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans">We build on GoHighLevel, which brings your inbox, pipeline, booking, email and automation into one place. If you already use a CRM, we look at it first and tell you honestly whether to keep it.</p></details>
        <details><summary><h3>Can it work with WhatsApp?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans">Yes. WhatsApp messages can land in the same inbox as everything else, and your team can get a WhatsApp alert for every new enquiry.</p></details>
        <details><summary><h3>Will my customers know the replies are automatic?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans">The first reply tells them you have their message and what happens next. Real conversations stay with your team. If you want an assistant that answers questions too, see <a href="/services/ai-chatbots">AI implementation</a>.</p></details>
        <details><summary><h3>Do I need to change how my team works?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans">A little, for the better. We build around how you already sell, then show your team the new way. Most of what it removes is copying, chasing and remembering.</p></details>
        <details><summary><h3>How long does the setup take?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans"><span class="todo">[About 2 to 3 weeks, to confirm.]</span> It depends on how many channels and steps we connect.</p></details>
        <details><summary><h3>Can you move our contacts from spreadsheets?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans">Yes. We bring your existing contacts and customers into the CRM, cleaned up, so your team starts with everything in one place.</p></details>
        <details><summary><h3>Is this only for large businesses?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans">No. Small teams often gain the most, because every enquiry counts and nobody has time to chase them by hand.</p></details>
      </div>
    </div>
  </section>

  <section class="sec sp-cta" aria-labelledby="cta-h">
    <p class="eb eba">Get In Touch</p>
    <h2 class="h2 mt-24" id="cta-h">Tell us where your business is leaking customers</h2>
    <div class="btn-row mt-48"><a class="btn btn-a" href="/contact">Book a free growth call</a></div>
  </section>
</main>`,
};
DD.current = "automation";
if (DD.mount) DD.mount();
