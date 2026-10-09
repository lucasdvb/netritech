"""Copy pass v3: shopper-facing voice (Kylie-style directness inside the brand's warm, poised, sensorial voice).
Replaces exact JSON string values in templates and section groups. Fails loudly if a source string is missing."""
import json, sys, pathlib
T = pathlib.Path(__file__).resolve().parent.parent / 'theme'

R = {
 'sections/header-group.json': [
  ("Free delivery across Mauritius on orders above Rs 1,500", "Free delivery all over Mauritius when you spend more than Rs 1,500"),
  ("Delivered in 1 to 3 working days · Pay by card at checkout", "At your door in 1 to 3 working days · Pay by card"),
  ("The launch collection", "Fresh drops, all in one place"),
  ("The routine guide", "New to K-beauty?"),
  ("Korean skincare, step by step", "Your routine, step by step"),
 ],
 'sections/footer-group.json': [
  ("Authentic Korean skincare, chosen for island skin and delivered across Mauritius.", "Korean skincare for island skin, delivered all over Mauritius."),
 ],
 'templates/index.json': [
  ("Korean skincare · Mauritius", "K-beauty, delivered in Mauritius"),
  ("Skin care, <em>chosen</em> for island skin", "Skin that loves <em>island</em> life"),
  ("Authentic Korean formulas for skin that lives with sun, salt and humidity. Every ingredient listed, every price honest, delivered across the island.",
   "The Korean skincare everyone keeps talking about, picked for sun, salt and humidity. Every ingredient listed, and at your door in 1 to 3 days."),
  ("Shop skincare", "Shop now"),
  ("Island-wide delivery", "Delivered island-wide"),
  ("Full ingredient lists", "Every ingredient listed"),
  ("Why shop with us", "Why you'll love it here"),
  ("Free delivery above Rs 1,500", "Free delivery over Rs 1,500"),
  ("Rs 100 anywhere in Mauritius below that.", "Below that, it's Rs 100 anywhere on the island."),
  ("1 to 3 working days", "At your door in 1 to 3 days"),
  ("Or collect in Mon Gout, by arrangement.", "Working days. Or collect in Mon Gout, just ask."),
  ("Every ingredient listed", "Every ingredient, listed"),
  ("The full list is on every product page.", "The full list is on every product page. No guessing."),
  ("Write to us by email or on WhatsApp.", "Message us on WhatsApp or by email. A person answers."),
  ("Every step of the routine", "Find your next favourite"),
  ("The launch collection", "Just landed"),
  ("Our first picks. Chosen, not gathered.", "Our first drop is <em>here</em>"),
  ("We open with a small, careful range. Each product answers one need, for skin that lives with sun, salt and humidity.",
   "A small, very edited range to start. Every pick has one job, and every one suits skin that lives with sun, salt and humidity."),
  ("Shop all", "Shop all new in"),
  ("Start with what your skin is asking for", "What's your skin <em>asking</em> for?"),
  ("Every product is tagged by the concern it treats and the skin it suits, so you can find yours in two taps.",
   "Tap a concern or your skin type and we'll show you what fits. Two taps, done."),
  ("Or by skin type", "Or shop by skin type"),
  ("Thirsty, tight or flaky skin", "Thirsty, tight or flaky"),
  ("When skin has lost its glow", "Looking a little tired"),
  ("Skin that breaks out easily", "Breaks out easily"),
  ("Lines and loss of firmness", "Lines and less bounce"),
  ("Skin that reddens easily", "Reddens easily"),
  ("Daily SPF50+ for the island sun", "Daily SPF for the island sun"),
  ("Tired, puffy-looking eyes", "Tired-looking eyes"),
  ("Five steps. Ten quiet minutes.", "Five steps. Ten minutes. <em>All yours.</em>"),
  ("Cleanse, tone, treat, moisturise, protect. The routine behind Korean skin, taken slowly, with the right product at every step.",
   "Cleanse, tone, treat, moisturise, protect. The famous Korean routine, made easy, with a pick for every step."),
  ("A low-foam cleanser lifts sunscreen, salt and the day without stripping the oils your skin makes for itself.",
   "A gentle, low-foam cleanser takes off sunscreen, salt and the whole day, without that tight feeling after."),
  ("Nothing like the alcohol splash you remember: a thin layer of water and calming extracts that puts moisture back.",
   "Forget the alcohol splash you remember. A Korean toner is a thin layer of water and calming extracts that puts moisture back."),
  ("Where the routine does its real work. One job per serum: hydrate, brighten or calm. On island skin, hydration comes first.",
   "The step that does the heavy lifting. Pick a serum for one job: hydrate, brighten or calm. Island skin? Start with hydration."),
  ("A cream seals everything in and supports the barrier that sun, salt and air conditioning wear down.",
   "Seal it all in. A cream looks after the skin barrier that sun, salt and aircon wear down."),
  ("Sunscreen every morning, rain or shine. Korean formulas make it a pleasure to wear.",
   "Sunscreen every morning, rain or shine. The one step you never skip."),
  ("Sixteen Korean houses, one careful edit", "The Korean brands, <em>hand-picked</em>"),
  ("All brands", "Shop all brands"),
  ("For every woman who lives on an island", "Made for every woman who calls the island home"),
  ("<p>Moana Beauté began with a simple frustration: the Korean skincare everyone talked about online was hard to find in Mauritius, or sold by people who could not say where it came from.</p><p>So we set out to do it properly. Real products, honest prices, and delivery anywhere on the island.</p>",
   "<p>It started with a simple frustration. The Korean skincare everyone was talking about online was hard to find in Mauritius, or sold by people who couldn't say where it came from.</p><p>So we did it properly. Real products, honest prices, every ingredient listed, and delivery anywhere on the island.</p>"),
  ("Our story", "Read our story"),
  ("Questions, answered", "You asked. We answered."),
  ("<p>Anything else? <a href=\"/pages/contact\">Write to us</a>.</p>", "<p>Still wondering? <a href=\"/pages/contact\">Message us</a>, we're happy to help.</p>"),
  ("<p>Rs 100 anywhere in Mauritius. Delivery is free when your order is above Rs 1,500.</p>", "<p>Rs 100 anywhere in Mauritius, and free when your order is over Rs 1,500.</p>"),
  ("<p>Orders usually arrive in 1 to 3 working days.</p>", "<p>Usually 1 to 3 working days.</p>"),
  ("<p>Yes, in Mon Gout, by arrangement. Write to us by email or on WhatsApp and we will agree a time with you.</p>", "<p>Yes, in Mon Gout. Message us on WhatsApp or by email and we'll find a time that works for you.</p>"),
  ("<p>By card at checkout. Card payments are processed by MIPS, so we never see your full card number.</p>", "<p>By card at checkout. Payments go through MIPS, so we never see your full card number.</p>"),
  ("<p>Yes. We buy from wholesale suppliers, and every product page shows the full ingredient list, so you can compare it with the brand's own.</p>", "<p>Always. Every product page shows the full ingredient list, so you can check it against the brand's own.</p>"),
  ("<p>Unopened products in their original packaging can be returned within seven days of delivery. Opened skincare cannot be returned for hygiene reasons, unless it is faulty or not what you ordered. See <a href=\"/pages/delivery\">Delivery &amp; returns</a>.</p>",
   "<p>Yes, if it's unopened and in its original packaging, within seven days of delivery. Opened skincare can't come back for hygiene reasons, unless it's faulty or not what you ordered. All the details are on <a href=\"/pages/delivery\">Delivery &amp; returns</a>.</p>"),
  ("Is a new product safe for my skin?", "How do I try something new?"),
  ("<p>We advise a patch test before using any new product. Our product information is not medical advice.</p>", "<p>Patch test first: a little on your inner arm or behind your ear, then wait a day. Our product info is not medical advice.</p>"),
 ],
 'templates/page.about.json': [
  ("For every woman who lives on an <em>island</em>", "Made for every woman who calls the <em>island</em> home"),
  ("Authentic Korean skincare, chosen by hand and delivered across Mauritius.", "Korean skincare, picked by hand and delivered all over Mauritius."),
  ("Where it began", "How it started"),
  ("<p>Moana Beauté began with a simple frustration. The Korean skincare everyone was talking about online was either impossible to find in Mauritius, or sold by people who could not say where it came from.</p><p>So we registered a company in Mon Gout and set out to do it properly. Real products, honest prices, and delivery anywhere on the island.</p><p>We are small and we are new. That is why we chose every product by hand, so there is nothing to decode. Each one was chosen for skin that lives with sun, salt and humidity.</p>",
   "<p>It started with a simple frustration. The Korean skincare everyone was talking about online was either impossible to find in Mauritius, or sold by people who couldn't say where it came from.</p><p>So we set up in Mon Gout and did it properly. Real products, honest prices, and delivery anywhere on the island.</p><p>We're small and we're new, and we like it that way. Every product is picked by hand, for skin that lives with sun, salt and humidity. Nothing to decode, nothing you don't need.</p>"),
  ("What we stand by", "What we promise you"),
  ("The real product, with its full ingredient list on its page. If we are not sure about a product, we do not sell it.", "The real product, with its full ingredient list on its page. If we're not sure about something, we don't sell it."),
  ("Korean beauty is not priced like luxury in Korea. It should not be here either.", "In Korea, great skincare isn't priced like luxury. It shouldn't be here either."),
  ("Every skin tone, every budget, on every part of the island, in a climate that never cools down.", "Every skin tone, every budget, every corner of the island. You already belong here."),
  ("The launch collection", "Just landed"),
  ("Begin with our first picks", "Start with our first drop"),
  ("Shop all", "Shop all new in"),
 ],
 'templates/page.brands.json': [
  ("The Korean houses we carry", "The Korean brands you <em>love</em>"),
  ("Choose a brand to see its products. Every one is bought from wholesale suppliers and sold with its full ingredient list.", "Tap a brand to shop it. Every product comes with its full ingredient list."),
  ("Brands and distributors", "Missing a favourite?"),
  ("Supply Moana Beauté", "Tell us what to stock next"),
  ("<p>Moana Beauté is opening supply accounts for the Mauritian market. If you represent a Korean beauty house or its regional distributor, we would like to talk.</p>", "<p>Is there a Korean brand you can't find in Mauritius? Tell us. Your requests shape what we bring in next.</p>"),
  ("Write to us", "Request a brand"),
 ],
 'templates/page.contact.json': [
  ("Talk to us", "We're here for you"),
  ("A question about a product, an order, or a skin worry you want to think through. Send a message and you will get an answer by email, or write to us on WhatsApp.",
   "A question about a product, your order, or which serum is right for you? Send a message and we'll answer by email, or chat with us on WhatsApp."),
  ("Brands and distributors", ""),
  ("<p>Moana Beauté is opening supply accounts for the Mauritian market. If you represent a Korean beauty house or its regional distributor, we would like to talk.</p>", ""),
 ],
 'templates/page.delivery.json': [
  ("Delivered across the island", "From us to your <em>door</em>"),
  ("Everything you need to know about getting your order, and what to do if something is not right.", "Everything about getting your order, and what to do if something isn't right."),
  ("<p>Questions about a delivery? Write to us by email or on WhatsApp.</p>", "<p>Question about a delivery? Message us on WhatsApp or by email.</p>"),
  ("<p>Rs 100 per order. Free when your order is above Rs 1,500.</p>", "<p>Rs 100 per order, and free when your order is over Rs 1,500.</p>"),
  ("<p>By arrangement in Mon Gout. Contact us by email or on WhatsApp and we will agree a time.</p>", "<p>In Mon Gout, by arrangement. Message us on WhatsApp or by email and we'll find a time.</p>"),
  ("<p>By card at checkout. Card payments are processed by MIPS.</p>", "<p>By card at checkout. Payments go through MIPS.</p>"),
  ("<p>Unopened products in their original packaging can be returned within seven days of delivery. Send us a message with your order number and the reason, and we will arrange it.</p>",
   "<p>Unopened products in their original packaging can come back within seven days of delivery. Send us your order number and the reason, and we'll sort it.</p>"),
  ("<p>Opened skincare cannot be returned, for hygiene reasons, unless it is faulty or not what you ordered.</p>", "<p>Opened skincare can't be returned for hygiene reasons, unless it's faulty or not what you ordered.</p>"),
  ("<p>Once we have the product back and have checked it, we refund you on the card you paid with.</p>", "<p>Once it's back with us and checked, we refund the card you paid with.</p>"),
 ],
 'templates/page.faq.json': [
  ("Frequently asked questions", "You asked. We <em>answered</em>."),
  ("<p>Rs 100 anywhere in Mauritius. Delivery is free when your order is above Rs 1,500.</p>", "<p>Rs 100 anywhere in Mauritius, and free when your order is over Rs 1,500.</p>"),
  ("<p>Orders usually arrive in 1 to 3 working days.</p>", "<p>Usually 1 to 3 working days.</p>"),
  ("<p>Yes, in Mon Gout, by arrangement. Write to us by email or on WhatsApp and we will agree a time with you.</p>", "<p>Yes, in Mon Gout. Message us on WhatsApp or by email and we'll find a time that works for you.</p>"),
  ("<p>By card at checkout. Card payments are processed by MIPS, so we never see your full card number.</p>", "<p>By card at checkout. Payments go through MIPS, so we never see your full card number.</p>"),
  ("<p>Yes. We buy from wholesale suppliers, and every product page shows the full ingredient list, so you can compare it with the brand's own.</p>", "<p>Always. Every product page shows the full ingredient list, so you can check it against the brand's own.</p>"),
  ("Is a new product safe for my skin?", "How do I try something new?"),
  ("<p>We advise a patch test before using any new product. Our product information is not medical advice.</p>", "<p>Patch test first: a little on your inner arm or behind your ear, then wait a day. Our product info is not medical advice.</p>"),
  ("<p>From the supplier. If anything looks different from the pack you receive, tell us.</p>", "<p>From the brand's own packaging information. If anything looks different from the pack you receive, tell us.</p>"),
  ("<p>Unopened products in their original packaging can be returned within seven days of delivery. Opened skincare cannot be returned for hygiene reasons, unless it is faulty or not what you ordered. See <a href=\"/pages/delivery\">Delivery &amp; returns</a>.</p>",
   "<p>Yes, if it's unopened and in its original packaging, within seven days of delivery. Opened skincare can't come back for hygiene reasons, unless it's faulty or not what you ordered. All the details are on <a href=\"/pages/delivery\">Delivery &amp; returns</a>.</p>"),
 ],
 'templates/page.kbeauty.json': [
  ("Korean beauty, <em>step by step</em>, for island skin", "Your K-beauty routine, <em>step by step</em>"),
  ("Korean beauty is a way of caring for skin, not a shelf of products. Gentle ingredients, thin layers, and the habit of returning to it every day.",
   "K-beauty isn't a shelf full of products. It's a ritual: gentle formulas, thin layers, and a few minutes for you, every day."),
  ("Why it suits island skin", "Why island skin loves it"),
  ("<p>It was built for skin that lives with heat and humidity, which is exactly what island skin does. Sun, salt and air conditioning wear the barrier down. The routine builds it back.</p>",
   "<p>It was made for heat and humidity, which is island life in a sentence. Sun, salt and aircon wear your skin barrier down. This routine is all about building it back.</p>"),
  ("Morning and evening, in this order. Thin layers, patted in, a few seconds between each.", "Morning and night, in this order. Thin layers, patted in, a few seconds between each."),
  ("Shop skincare", "Shop the routine"),
  ("A Korean routine begins clean. A low-foam cleanser lifts sunscreen, salt and the whole day without stripping the oils your skin makes for itself, which is what keeps it from going tight and then oily.",
   "Start clean. A gentle, low-foam cleanser takes off sunscreen, salt and the whole day without stripping your skin, so it doesn't feel tight and then turn oily."),
  ("A toner here is nothing like the alcohol splash you remember. It is a thin layer of water and calming plant extracts that puts moisture back and opens the way for everything after it.",
   "Forget the alcohol splash you remember. A Korean toner is a thin layer of water and calming plant extracts that puts moisture back and preps your skin for everything after it."),
  ("The serum is where the routine does its real work. Small molecules, high concentration, one job: to hydrate, to brighten, or to calm. On island skin, hydration comes first.",
   "This is the step that does the heavy lifting. Pick a serum for one job: hydrate, brighten or calm. Island skin? Start with hydration."),
  ("A cream seals everything in and supports the barrier that sun, salt and air conditioning wear down. Light in the morning, richer at night.",
   "Seal it all in. A cream looks after the skin barrier that sun, salt and aircon wear down. Go light in the morning and richer at night."),
  ("Sunscreen every morning, rain or shine, indoors or out. It is the one step that decides how your skin looks in ten years, and Korean formulas make it a pleasure to wear.",
   "Sunscreen every morning, rain or shine, indoors or out. If you only do one step, make it this one."),
  ("Begin with three steps, not five", "Start with three steps, not five"),
  ("Cleanse, tone, protect. Do that for a month, then add the serum and the cream when it feels natural.", "Cleanse, tone, protect. Do that for a month, then add a serum and a cream when you're ready."),
  ("Why authentic matters", "Why the real thing matters"),
  ("The real formula, or nothing", "The real formula, or nothing"),
  ("<p>A lot of Korean beauty in Mauritius arrives in a suitcase, or through a reseller who cannot say where it was kept, for how long, or whether it is the real thing.</p><p>Moana Beauté exists to change that. On every product you see the full ingredient list, so you can check it against the brand's own. And when you have a question, write to us.</p>",
   "<p>A lot of K-beauty in Mauritius arrives in a suitcase, or through someone who can't say where it was kept, for how long, or whether it's the real thing.</p><p>We're here to change that. Every product shows its full ingredient list, so you can check it against the brand's own. And if you have a question, just ask.</p>"),
  ("Ask us anything", "Ask us anything"),
 ],
 'templates/product.json': [
  ("Complete the routine", "Complete your routine"),
  ("You may also like", "Pairs well with"),
 ],
}

def apply():
    for rel, pairs in R.items():
        p = T / rel
        s = p.read_text()
        for old, new in pairs:
            if old == new:
                continue
            a = json.dumps(old, ensure_ascii=False)
            b = json.dumps(new, ensure_ascii=False)
            n = s.count(a)
            if n == 0:
                sys.exit(f'MISSING in {rel}: {old[:70]}')
            s = s.replace(a, b)
        json.loads(s)  # still valid JSON
        p.write_text(s)
    print('copy v3 applied')

if __name__ == '__main__':
    apply()
