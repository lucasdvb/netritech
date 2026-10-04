// Fledge: the signature system. Hero runs the "chatoyance" gradient under a giant
// wordmark; stages stack as sticky cards; the customer path fills as you scroll.
const STAGES = [
  ['/uploads/_aEIAO-vT9eQ9p08XxTeR-stage-get-found.webp', 569, 379, 'Get Found', 'We put you where your customers are looking.', '01',
    '<li><a href="/services/web-design">A website built to be found on Google{{ar}}</a></li><li><a href="/services/web-design">Your Google listing, set up and kept active{{ar}}</a></li><li><a href="/services/facebook-google-ads">Facebook, Instagram and Google ads{{ar}}</a></li><li><a href="/services/social-media-management">Posts every week on the platforms your customers use{{ar}}</a></li>'],
  ['/uploads/bG7W8Y3ge0MCiasr9z3Mq-stage-get-chosen.webp', 632, 421, 'Get Chosen', 'When they find you, they choose you.', '02',
    '<li><a href="/services/web-design">A website that makes the case for you{{ar}}</a></li><li><span>Your brand used the same way everywhere</span></li><li><span>Reviews and proof in the right places</span></li><li><a href="/services/social-media-management">Content that answers your customers\' questions{{ar}}</a></li>'],
  ['/uploads/ci3Z6faTkzajuXrUfoL-z-stage-get-business.webp', 632, 421, 'Get The Business', 'No enquiry is lost.', '03',
    '<li><a href="/services/marketing-automation-crm">Every enquiry in one CRM{{ar}}</a></li><li><a href="/services/marketing-automation-crm">Instant alerts and fast replies{{ar}}</a></li><li><a href="/services/ai-chatbots">An AI assistant that answers day and night{{ar}}</a></li><li><a href="/services/branding-logo-design">Branding{{ar}}</a></li><li><a href="/services/marketing-automation-crm">Follow-up until they say yes or no{{ar}}</a></li>'],
  ['/uploads/JdHstpeuD7jFaymUxCvgq-stage-keep-grow.webp', 702, 468, 'Keep &amp; Grow', 'Customers come back and send others.', '04',
    '<li><a href="/services/marketing-automation-crm">Review requests after every sale{{ar}}</a></li><li><a href="/services/marketing-automation-crm">Offers and news for past customers{{ar}}</a></li><li><a href="/services/social-media-management">Content that keeps you top of mind{{ar}}</a></li><li><a href="/services/marketing-automation-crm">Repetitive work done automatically{{ar}}</a></li>'],
];
const PATH = ['Sees your ad, or finds you on Google', 'Lands on your website', 'Sends a message or books a call', 'Gets a reply in minutes, from your team or your AI assistant', 'Is followed up until they decide', 'Buys, and is asked for a review', 'Hears from you again, and comes back'];
const LOOP = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v4.5h-4.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

module.exports = {
  gl: 'chatoyance',
  css: `
.flh{justify-content:flex-end}
.flh .top{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));column-gap:var(--gap);align-items:end}
.flh .top>*{grid-column:1/-1}
.flh h1{display:flex;flex-direction:column;grid-row:2}
.flh h1 .mega{display:block;line-height:.8;letter-spacing:-.07em;white-space:nowrap;margin-left:-.04em}
.flh h1 .fl-sub{font-size:clamp(28px,3vw,48px);font-weight:var(--w-dsp);letter-spacing:-.035em;line-height:1.04;max-width:17ch;margin-top:clamp(28px,3.4vw,48px)}
.flh .rr{grid-row:3;margin-top:28px}
@media (min-width:1024px){.flh .rr{grid-row:2;grid-column:8/-1;align-self:end;margin-top:0}}
.flh .dodo{position:absolute;right:calc(var(--gt) + 1%);top:clamp(110px,14vh,170px);height:min(34vh,330px);width:auto;z-index:1;filter:drop-shadow(0 30px 40px rgba(0,0,0,.7))}
@media (max-width:1023px){.flh .dodo{height:24vh;top:96px}}
@media (max-width:639px){.flh .dodo{display:none}}
.leaks>li{padding:clamp(28px,3vw,44px) 0}
.leaks .n{font-size:clamp(44px,5vw,84px);font-weight:var(--w-dsp);letter-spacing:-.06em;line-height:.8;color:var(--su);padding-top:0}
.leaks>li:hover .n{color:var(--fg)}
.leaks .n{transition:color .5s}
.stg2 .st{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:28px var(--gap);padding:clamp(16px,1.6vw,22px);border-radius:var(--r3);min-height:clamp(380px,34vw,500px)}
.stg2 .st:nth-child(even){background:#0c0c0e;color:#f3f1ea;--fg:#f3f1ea;--mu:#8c8b84;--ln:rgba(243,241,234,.12)}
.stg2 .im{grid-column:1/-1;border-radius:20px;overflow:hidden}
.stg2 .im img{width:100%;height:100%;object-fit:cover}
.stg2 .tx2{grid-column:1/-1;display:flex;flex-direction:column;padding:clamp(4px,1vw,16px) clamp(4px,1.2vw,20px)}
@media (min-width:1024px){.stg2 .im{grid-column:1/span 6}.stg2 .tx2{grid-column:7/-1}}
.stg2 .row{display:flex;justify-content:space-between;gap:16px}
.stg2 .h3{font-size:clamp(32px,3.2vw,52px);letter-spacing:-.04em}
.stg2 .num{font-size:clamp(44px,4.4vw,72px);font-weight:var(--w-dsp);letter-spacing:-.06em;line-height:.8;color:var(--mu)}
.items{margin-top:auto;padding-top:28px;border-top:0}
.items li{border-bottom:1px solid var(--ln)}
.items li:first-child{border-top:1px solid var(--ln)}
.items a,.items span{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:13px 0;font-size:16px}
.items span{color:var(--mu)}
.items .ar{width:10px;height:10px;opacity:.5;flex:none;transition:transform .5s var(--e),opacity .3s}
.items a:hover .ar{opacity:1;transform:translate(2px,-2px)}
.path{position:relative;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:var(--gap)}
.path .line{position:absolute;left:0;right:0;top:27px;height:1px;background:var(--ln)}
.path .line i{position:absolute;inset:0;background:var(--fg);transform-origin:0 50%;transform:scaleX(var(--p,0))}
.path li{position:relative}
.path .nd{display:grid;place-items:center;width:56px;height:56px;border-radius:50%;border:1px solid var(--ls);background:var(--bg);font-size:15px;transition:background .5s var(--e),color .5s,border-color .5s;position:relative;z-index:1}
.path li.on .nd{background:var(--fg);color:var(--bg);border-color:var(--fg)}
.path p{margin-top:22px;font-size:16px;line-height:1.4;color:var(--mu);transition:color .5s;max-width:18ch}
.path li.on p{color:var(--fg)}
@media (max-width:1023px){.path{grid-template-columns:1fr;gap:0}.path .line{left:27px;right:auto;top:0;bottom:0;width:1px;height:auto}.path .line i{transform-origin:50% 0;transform:scaleY(var(--p,0))}
  .path li{display:grid;grid-template-columns:56px 1fr;gap:20px;align-items:center;padding:10px 0}.path p{margin-top:0}}
.again{display:inline-flex;align-items:center;gap:12px;margin-top:40px;padding:12px 18px 12px 12px;border-radius:999px;border:1px solid var(--ls);color:var(--fg)}
.again svg{width:22px;height:22px}
.ways2{display:grid;grid-template-columns:1fr 1fr;gap:var(--gap)}
.ways2 .way{padding:clamp(28px,3.4vw,52px);border-radius:var(--r3)}
.ways2 .way.dk{background:#0c0c0e}
.ways2 ul{margin-top:32px;border-top:1px solid var(--ln)}
.ways2 li{display:flex;gap:12px;align-items:flex-start;padding:14px 0;border-bottom:1px solid var(--ln);font-size:16px}
.ways2 .ck{width:16px;height:16px;flex:none;margin-top:4px}
@media (max-width:1023px){.ways2{grid-template-columns:1fr}}
.metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0 var(--gap)}
.metrics>div{padding:28px 0 32px;border-top:1px solid var(--ln)}
.metrics dt{font-size:clamp(26px,2.4vw,38px);font-weight:var(--w-dsp);letter-spacing:-.035em;color:var(--fg);line-height:1.05}
.metrics dd{margin-top:12px}
@media (max-width:767px){.metrics{grid-template-columns:1fr}}
.cmp{width:100%;font-size:16px}
.cmp th,.cmp td{text-align:left;padding:22px 20px;vertical-align:top;border-bottom:1px solid var(--ln)}
.cmp thead th{font-size:14px;font-weight:500;color:var(--mu);border-bottom:1px solid var(--ls)}
.cmp tbody th{font-weight:400;color:var(--mu);width:24%}
.cmp td{color:var(--mu)}
.cmp .us{background:#0c0c0e;color:#f3f1ea}
.cmp thead .us{border-radius:20px 20px 0 0;color:#f3f1ea}
.cmp tbody tr:last-child .us{border-radius:0 0 20px 20px}
.cmp .us{border-bottom-color:rgba(243,241,234,.1)}
.cmp .dot{display:inline-flex;align-items:center;gap:8px}
.cmp .dot::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor}
@media (max-width:767px){.cmp thead{display:none}.cmp,.cmp tbody,.cmp tr,.cmp th,.cmp td{display:block;width:auto}.cmp tr{padding:14px 0;border-bottom:1px solid var(--ln)}
  .cmp th,.cmp td{border:0;padding:6px 0}.cmp tbody th{color:var(--fg);font-weight:500;width:auto}.cmp td::before{content:attr(data-label);display:block;font-size:12px;color:var(--mu);margin-bottom:2px}
  .cmp .us{padding:12px 16px;border-radius:14px!important;margin-top:8px}.cmp .us::before{color:rgba(243,241,234,.6)}}
.fit{display:grid;grid-template-columns:1fr 1fr;gap:var(--gap)}
.fit .card{padding:clamp(28px,3.4vw,52px)}
.fit .us{background:#f3f1ea;color:#0c0c0e;--fg:#0c0c0e;--mu:#62615b;--ln:rgba(12,12,14,.12);border-color:transparent}
.fit h3{display:flex;align-items:center;gap:10px;font-size:clamp(24px,2vw,30px);font-weight:400;letter-spacing:-.025em}
.fit .us h3::before{content:"";width:8px;height:8px;border-radius:50%;background:currentColor}
.fit ul{margin-top:28px;border-top:1px solid var(--ln)}
.fit li{display:flex;gap:12px;align-items:flex-start;padding:14px 0;border-bottom:1px solid var(--ln);font-size:16px}
.fit .ck{width:16px;height:16px;flex:none;margin-top:4px}
@media (max-width:1023px){.fit{grid-template-columns:1fr}}
.plug{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:24px var(--gap);align-items:center;margin-top:clamp(48px,5vw,72px);padding-top:32px;border-top:1px solid var(--ln)}
.plug>*{grid-column:1/-1}
@media (min-width:1024px){.plug .tx{grid-column:1/span 4}.plug ul{grid-column:6/-1}}
.plug ul{display:flex;flex-wrap:wrap;gap:8px}
.plug a{display:inline-flex;align-items:center;gap:8px;height:42px;padding:0 18px;border-radius:999px;border:1px solid var(--ls);font-size:14px;transition:background .4s var(--e),color .4s,border-color .4s}
.plug a .ar{width:9px;height:9px}
.plug a:hover{background:var(--fg);color:var(--bg);border-color:var(--fg)}
.name{min-height:min(92vh,900px);display:flex;flex-direction:column;justify-content:center}
.name .gl{font-weight:var(--w-dsp)}
.name h2{max-width:20ch;font-size:clamp(38px,4.6vw,76px);font-weight:var(--w-dsp);letter-spacing:-.042em;line-height:1.02}
.name .tx{max-width:46ch}`,
  html: `<main>
  <section class="hero flh" aria-labelledby="fl-h">
    <div class="hero-bg shade"></div>
    <div class="top">
      <div><nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li aria-current="page">Fledge</li></ol></nav>
        <p class="kick mt-32">Our signature system</p></div>
      <h1 id="fl-h" class="mt-32" data-r="0"><span class="mega" data-fit="28">Fledge.</span><span class="fl-sub" data-r="l">Your full marketing system, built and run by one team.</span></h1>
      <div class="rr">
        <p class="lead">Most businesses buy marketing in pieces. A website from one supplier, ads from another, a page someone posts on when they find the time. The pieces don't talk to each other, so customers slip through the gaps. Fledge builds every piece as one system, then runs it with you every month.</p>
        <div class="btn-row mt-32"><a class="btn btn-p" href="/contact">Book a free growth call{{ar}}</a><a class="btn" href="#inside">See what's inside</a></div>
      </div>
    </div>
    <img class="dodo" src="/uploads/8hzVIXmhSCC0RLLMXrB-F-hero-dodo.webp" alt="Disruptive Dodo mascot" width="921" height="1228">
  </section>

  <section class="sheet lt sec" aria-labelledby="plain-h">
    <div class="g12">
      <div class="c1-5"><p class="kick">In plain terms</p><h2 class="h2 mt-24" id="plain-h">What you get with Fledge.</h2></div>
      <p class="lead fg c7-12">One team builds your website, your social media, your ads, your CRM and follow-up, and your AI assistant, so they work as one. Then we run it with you every month and show you what it brings in.</p>
    </div>
    <dl class="facts mt-96" data-r="s">
      <div><dt class="cap">Who it's for</dt><dd>Businesses ready to grow that would rather have one team for all of it than five suppliers.</dd></div>
      <div><dt class="cap">What's included</dt><dd>Website, social media, ads, CRM and follow-up, AI assistant, a monthly report and a monthly call.</dd></div>
      <div><dt class="cap">How you pay</dt><dd>A setup fee for the build, then a monthly fee to run it.</dd></div>
      <div><dt class="cap">Minimum term</dt><dd><span class="todo">[3 months, then 30 days' notice, to confirm]</span></dd></div>
    </dl>
  </section>

  <section class="sheet dk sec" aria-labelledby="why-h">
    <div class="head"><div><p class="kick">Why one system</p><h2 class="h2 mt-24" id="why-h" style="max-width:14ch">Marketing in pieces leaks customers.</h2></div>
      <p class="tx">Every business loses customers at the same four points. Most marketing fixes one of them and ignores the rest. Fledge closes all four.</p></div>
    <ol class="rows hov leaks mt-64">
      <li data-r="u"><span class="n">01</span><h3 class="h3 t">They can't find you.</h3><p class="tx b">Your competitors show up on Google, Facebook and Instagram. You don't, or not often enough.</p></li>
      <li data-r="u"><span class="n">02</span><h3 class="h3 t">They find you, then choose someone else.</h3><p class="tx b">Your website and pages don't look like the leader you are, so people pick the business that does.</p></li>
      <li data-r="u"><span class="n">03</span><h3 class="h3 t">They enquire, and nobody follows up in time.</h3><p class="tx b">A message sits unanswered for a day. By then they've called someone else.</p></li>
      <li data-r="u"><span class="n">04</span><h3 class="h3 t">They buy once and never come back.</h3><p class="tx b">No reminder, no review request, no reason to return. The next sale starts from zero.</p></li>
    </ol>
  </section>

  <section class="sheet lt sec" id="inside" aria-labelledby="inside-h">
    <div class="head"><div><p class="kick">What's inside</p><h2 class="d2 mt-24" id="inside-h">Four stages. One system.</h2></div>
      <p class="lead">Each stage uses services we also sell on their own. In Fledge they are built together and share the same information, so each one makes the next work better.</p></div>
    <ol class="stack stg2 mt-96">${STAGES.map((s, i) => `
      <li class="st card" style="--i:${i}">
        <figure class="im r16x11"><img src="${s[0]}" alt="" width="${s[1]}" height="${s[2]}" loading="lazy"></figure>
        <div class="tx2">
          <div class="row"><div><h3 class="h3">${s[3]}</h3><p class="tx mt-8">${s[4]}</p></div><p class="num">${s[5]}</p></div>
          <ul class="items">${s[6]}</ul>
        </div>
      </li>`).join('')}
    </ol>
  </section>

  <section class="sheet dk sec" aria-labelledby="path-h">
    <p class="kick">How it works together</p>
    <h2 class="d2 mt-24" id="path-h" style="max-width:13ch">One customer, start to finish.</h2>
    <div class="mt-96">
      <ol class="path"><i class="line" aria-hidden="true"><i></i></i>${PATH.map((p, i) => `<li><span class="nd">${i + 1}</span><p>${p}</p></li>`).join('')}</ol>
      <p class="again">${LOOP}And the loop starts again</p>
    </div>
    <p class="lead mt-64" style="max-width:36ch">Every step is recorded in one place, so you can see where each sale came from.</p>
  </section>

  <section class="sheet lt sec" aria-labelledby="runs-h">
    <p class="kick">How Fledge runs</p>
    <h2 class="h2 mt-24" id="runs-h">We build it once.<br>Then we run it with you.</h2>
    <div class="ways2 mt-64" data-r="s">
      <article class="way card">
        <p class="cap">(01) The setup</p>
        <h3 class="h3 mt-24">Built properly, the first time.</h3>
        <p class="tx mt-16">We look at your business first, then build every piece and connect them.</p>
        <ul><li>{{ck}}A close look at your marketing, sales and follow-up today</li><li>{{ck}}Your website, built or rebuilt</li><li>{{ck}}Your brand look, set up or refreshed</li><li>{{ck}}Your Google listing and social pages set up</li><li>{{ck}}CRM, booking and follow-up connected</li><li>{{ck}}Your AI assistant trained on your business</li><li>{{ck}}Tracking, so every enquiry shows where it came from</li></ul>
      </article>
      <article class="way card dk">
        <p class="cap">(02) Every month</p>
        <h3 class="h3 mt-24">Run, measured, improved.</h3>
        <p class="tx mt-16">A full marketing team for your business, without the hiring.</p>
        <ul><li>{{ck}}Posts every week, approved by you</li><li>{{ck}}Ads managed and adjusted</li><li>{{ck}}Replies and follow-up checked</li><li>{{ck}}A report every month, in plain words</li><li>{{ck}}A call every month about your business and what comes next</li><li>{{ck}}Improvements as your business grows</li></ul>
      </article>
    </div>
  </section>

  <section class="sheet dk sec" aria-labelledby="measure-h">
    <div class="inset" data-r="u">
      <div class="head"><div><p class="kick">What we measure</p><h2 class="h2 mt-24" id="measure-h" style="max-width:19ch">The numbers we show you every month.</h2></div>
        <p class="tx">We report on what moves your business.</p></div>
      <dl class="metrics mt-64">
        <div><dt>Enquiries</dt><dd class="tx">How many came in, and from where.</dd></div>
        <div><dt>Reply time</dt><dd class="tx">How fast each one was answered.</dd></div>
        <div><dt>Sales</dt><dd class="tx">How many enquiries became customers.</dd></div>
        <div><dt>Cost per enquiry</dt><dd class="tx">What each enquiry cost you in ads.</dd></div>
        <div><dt>Reviews</dt><dd class="tx">New reviews, and your rating.</dd></div>
        <div><dt>Content</dt><dd class="tx">What we posted, and how people responded.</dd></div>
      </dl>
    </div>
    <p class="sm mt-24">We set targets with you for the paid parts. We never promise numbers we don't control.</p>
  </section>

  <section class="sheet lt sec" aria-labelledby="compare-h">
    <p class="kick">Compare</p>
    <h2 class="h2 mt-24" id="compare-h">Fledge, or marketing in pieces.</h2>
    <table class="cmp mt-64" data-r="u">
      <caption class="sr-only">Fledge, or marketing in pieces.</caption>
      <thead><tr><td></td><th scope="col">Marketing in pieces</th><th scope="col" class="us"><span class="dot">Fledge</span></th></tr></thead>
      <tbody>
        <tr><th scope="row">Who answers for results</th><td data-label="Marketing in pieces">Each supplier points at the others</td><td class="us" data-label="Fledge">One team, one contact</td></tr>
        <tr><th scope="row">Your tools</th><td data-label="Marketing in pieces">A website, a page and a spreadsheet that don't connect</td><td class="us" data-label="Fledge">Website, ads, CRM and follow-up share the same information</td></tr>
        <tr><th scope="row">Enquiries</th><td data-label="Marketing in pieces">Some get lost between inboxes</td><td class="us" data-label="Fledge">Every one lands in one place and gets a reply</td></tr>
        <tr><th scope="row">Reporting</th><td data-label="Marketing in pieces">Several reports, or none</td><td class="us" data-label="Fledge">One report a month, in plain words</td></tr>
        <tr><th scope="row">Your time</th><td data-label="Marketing in pieces">You manage the suppliers</td><td class="us" data-label="Fledge">We manage the work, you approve it</td></tr>
      </tbody>
    </table>
  </section>

  <section class="sheet dk sec" aria-labelledby="fit-h">
    <p class="kick">Is it right for you?</p>
    <h2 class="h2 mt-24" id="fit-h">Fledge, or one service first.</h2>
    <div class="fit mt-64" data-r="s">
      <div class="card us"><h3>Fledge fits if</h3><ul><li>{{ck}}You want more customers and don't want to manage five suppliers</li><li>{{ck}}Your team can handle more work</li><li>{{ck}}You're ready to invest every month in growth</li><li>{{ck}}You want to see where every sale came from</li></ul></div>
      <div class="card"><h3>Start with one service if</h3><ul><li>{{ck}}One problem is costing you the most right now</li><li>{{ck}}You're launching and need the basics first</li><li>{{ck}}You'd rather start with one piece and add the rest</li></ul></div>
    </div>
    <div class="plug">
      <p class="tx">Every service we build plugs into Fledge later, so nothing is built twice.</p>
      <ul><li><a href="/services/web-design">Websites and SEO{{ar}}</a></li><li><a href="/services/social-media-management">Social media{{ar}}</a></li><li><a href="/services/facebook-google-ads">Paid ads{{ar}}</a></li><li><a href="/services/marketing-automation-crm">Automation and CRM{{ar}}</a></li><li><a href="/services/ai-chatbots">AI implementation{{ar}}</a></li></ul>
    </div>
  </section>

  <section class="sheet lt sec ghost name" aria-labelledby="name-h">
    <span class="gl" aria-hidden="true">F</span>
    <p class="cap">Why Fledge</p>
    <h2 class="mt-32" id="name-h">To fledge is to grow your flight feathers and leave the nest.</h2>
    <p class="tx mt-40">It is the moment a young bird stops waiting to be fed and starts flying on its own. That is what this system is for: a business that grows by design, not by luck.</p>
  </section>

  <section class="sheet dk sec" aria-labelledby="faq-h">
    <div class="g12">
      <div class="c1-5"><div class="stick"><p class="kick">Questions</p><h2 class="h2 mt-24" id="faq-h" style="max-width:11ch">Fledge questions, answered.</h2></div></div>
      <div class="faq c7-12">
        <details open><summary><h3>What is Fledge?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans">Fledge is our full marketing system. One team builds your website, social media, ads, CRM, follow-up and AI assistant to work as one, then runs it with you every month.</p></details>
        <details><summary><h3>How is Fledge different from hiring a marketing agency?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans">Most agencies sell one piece: posts, ads or a website. Fledge covers the whole path, from the first time someone sees you to the day they buy again, and connects every step so no enquiry is lost in between.</p></details>
        <details><summary><h3>Do I need everything from day one?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans">No. We start with the problem that costs you the most and build from there. If you start with one service, it plugs into Fledge later, so nothing is built twice.</p></details>
        <details><summary><h3>How much does Fledge cost?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans">It depends on the size of your business and what is already in place. After a free growth call, we send a clear proposal with the setup fee and the monthly fee before any work starts. Ad budgets are paid by you, directly to the platforms.</p></details>
        <details><summary><h3>How long do I commit for?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans"><span class="todo">[3 months, then 30 days' notice, to confirm.]</span></p></details>
        <details><summary><h3>Who owns the website, the pages and the data?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans"><span class="todo">[You do. Your website content, your pages, your ad accounts and your customer list stay in your business's name. To confirm.]</span></p></details>
        <details><summary><h3>Do you work outside Mauritius?</h3><span class="pm" aria-hidden="true"></span></summary><p class="tx ans">Yes. We're based in Mauritius and work with businesses here and abroad, in English and French.</p></details>
      </div>
    </div>
  </section>

  <section class="sheet lt cta" aria-labelledby="cta-h">
    <p class="kick">Get In Touch</p>
    <h2 class="d1 mt-32" id="cta-h">Tell us where your business is leaking customers</h2>
    <div class="btn-row mt-48"><a class="btn btn-p" href="/contact">Book a free growth call{{ar}}</a><a class="btn" href="/services">See all services</a></div>
  </section>
</main>`,
  init: function (R) {
    // the customer path fills as the section crosses the middle of the screen
    var path = R.querySelector('.path'), line = R.querySelector('.path .line');
    if (!path || !line) return;
    var items = path.querySelectorAll('li'), ticking = false;
    var vertical = function () { return innerWidth < 1024; };
    function update() {
      ticking = false;
      var r = path.getBoundingClientRect(), mid = innerHeight * 0.62, p;
      if (vertical()) p = (mid - r.top) / r.height;
      else p = (mid - r.top + r.height) / (innerHeight * 0.55);
      p = Math.min(1, Math.max(0, p));
      line.style.setProperty('--p', p.toFixed(4));
      items.forEach(function (li, i) { li.classList.toggle('on', p >= (i + 0.5) / items.length); });
    }
    addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    addEventListener('resize', update, { passive: true });
    update();
  },
};
