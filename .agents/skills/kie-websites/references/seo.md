# SEO

Everything here is static, local-code SEO for a React (Vite) or plain HTML site:
head tags, static `robots.txt`/`sitemap.xml`, JSON-LD, entity and GEO copy rules,
and a self-contained audit. There is no server layer in this workflow, so headers,
redirects and HTTPS are the host's job and out of scope.

For SPM sites, read `docs/spm-brand-brief.md` first: name, tagline, voice and
positioning come from the brief, not from invention.

## Meta tags & OG

The scaffold ships placeholder meta (default title, no description). This section
ensures those placeholders NEVER reach the hand-over. Every page has real,
keyword-targeted meta tags.

**Site URL.** Absolute URLs are required for `og:image`, `og:url`, canonical and
schema. Use the user's production domain when they have one. Keep it in ONE place
(a `SITE_URL` constant in `site/src/site.ts`, or one find-and-replace-able string in
plain HTML) and never invent a domain. If it is unknown, say in the hand-over that
`SITE_URL` is the one value to set before the site goes public.

### Global head (plain HTML, or React's `site/index.html`)

Static tags in the HTML file are what crawlers and link unfurlers read first.

```html
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Acme Studio | Creative Agency for Bold Brands</title>
  <meta name="description" content="Acme Studio builds brand identities, websites, and campaigns that stand out. Based in NYC, working worldwide." />
  <meta name="author" content="Acme Studio" />
  <meta name="theme-color" content="#0D141F" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <link rel="canonical" href="https://acme-studio.com/" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Acme Studio" />
  <meta property="og:locale" content="en_US" />
  <meta property="og:title" content="Acme Studio | Creative Agency for Bold Brands" />
  <meta property="og:description" content="Brand identities, websites, and campaigns that stand out." />
  <meta property="og:url" content="https://acme-studio.com/" />
  <meta property="og:image" content="https://acme-studio.com/assets/og.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="icon" href="/favicon.ico" sizes="32x32" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <link rel="manifest" href="/site.webmanifest" />
</head>
```

The favicon/icon/manifest/OG files come from `references/asset-system.md` items 6-7.
(Plain HTML pages in `site/` use root-relative paths only if served from a domain
root; otherwise relative paths.)

### Per-page meta

- **Plain HTML / multi-page:** each `*.html` file carries its own `<title>`,
  description, canonical, `og:*` and `twitter:*` tags. No shared copy-paste.
- **React, one page:** the static tags in `index.html` are enough.
- **React, several routes:** set title/description/canonical per route with
  `react-helmet-async` (or React 19 native `<title>`/`<meta>` in the route
  component), and prefer build-time prerendering when SEO matters, because a client-
  rendered SPA exposes per-route tags only to crawlers that run JS.

```tsx
import { Helmet } from "react-helmet-async";
import { SITE_URL } from "../site";

export function ServicesPage() {
  return (
    <>
      <Helmet>
        <title>Services | Acme Studio</title>
        <meta name="description" content="Brand identity, web design, and digital campaigns. See what Acme Studio can build for you." />
        <link rel="canonical" href={`${SITE_URL}/services`} />
        <meta property="og:title" content="Services | Acme Studio" />
        <meta property="og:description" content="Brand identity, web design, and digital campaigns." />
        <meta property="og:url" content={`${SITE_URL}/services`} />
        <meta property="og:image" content={`${SITE_URL}/assets/og-services.png`} />
      </Helmet>
      {/* page */}
    </>
  );
}
```

### Title Formula

- **Homepage:** `[Brand] | [Tagline]` → `Acme Studio | Creative Agency for Bold Brands`
- **Subpages:** `[Page] | [Brand]` → `Services | Acme Studio`

Use ` | ` as the separator: the em-dash ban (`design-recipe.md` §5) covers titles too.
Keep titles under 60 characters. The brand always appears.

### Description Rules

- 150-160 characters max. Google truncates beyond that.
- Primary keyword in the first 100 characters.
- Write for humans — it shows in search result snippets.
- Derive from intake: the user's stated purpose/service IS the description seed.

### Canonical URL Pattern

`https://<domain>/<path>` — homepage `https://acme-studio.com/`, subpage
`https://acme-studio.com/services`. No trailing slash on subpages. No query params.
No fragments. Multi-page plain HTML that serves `services.html` should canonicalize
to the URL the host will actually serve; say which form you chose in the brief.

### Robots Directive

| Page type | `robots` value |
|---|---|
| Public pages (homepage, services, about, blog) | `index, follow, max-image-preview:large` |
| Admin, dashboard, login UI mockups | `noindex, nofollow` |
| Legal (privacy, terms) | `index, nofollow` |

### Deriving Values from Intake

Map user input directly:

| Intake field | Meta target |
|---|---|
| Brand / business name | `title` (brand part), `og:site_name`, `author` |
| Purpose / tagline | `title` (tagline part), homepage `description` |
| Primary service / product | Subpage `description` seed |
| Brand color | `theme-color` |
| Logo / hero image | `og:image` (the generated OG card) |

A cover **clip** is not a meta tag: it is an optional, permission-gated asset
(`references/cover-animator.md`).

### Pitfalls

1. **Duplicate titles across pages.** Every page needs a unique `title` and `description`. Copy-paste from the home page is the #1 SEO mistake.
2. **Missing `og:image`.** Social shares without an image get 80% less engagement. Use the 1200x630 OG card from the asset kit.
3. **Placeholder text in the hand-over.** Grep `index.html` and every page for the scaffold title, `App Title`, `MyApp`, `Vite + React`, or `Lorem` before hand-over (also in review-rubric §A item 1).
4. **Description too short or generic.** "Welcome to our website" is not a description. It must describe what the user gets.
5. **Canonical mismatch.** The canonical URL must exactly match the URL the page will be served from. Wrong canonical = Google ignores the page.

## Technical SEO

Static files and page-level patterns that search engines expect.

### robots.txt (static file)

Create `site/public/robots.txt` (React) or `site/robots.txt` (plain HTML):

```text
User-agent: *
Allow: /

Sitemap: https://acme-studio.com/sitemap.xml
```

Use the site's real `SITE_URL` in the `Sitemap:` line.

### sitemap.xml (static file)

Create `site/public/sitemap.xml` (React) or `site/sitemap.xml` (plain HTML). One
`<url>` per page. Update it whenever a page is added; keep paths in sync with the
actual pages.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://acme-studio.com/</loc>
    <lastmod>2026-01-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://acme-studio.com/services</loc>
    <lastmod>2026-01-15</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

Set `lastmod` to the real build date. A single-page site lists just the homepage.

### Links and URLs

Link internally in ONE form (no trailing slash on subpages, or always with one for
directory-style plain HTML) so the host never has to redirect duplicates. Hosting
concerns (security headers, HTTPS, compression, redirects) are outside this skill;
mention in the hand-over that they belong to whoever hosts the site.

### Canonical URLs

Every page has a canonical link (see "Meta tags & OG"). Routes with params
(`/blog/:slug`) must build the canonical from the param value, not a static string.

### Performance hints

Performance feeds Core Web Vitals. In the `<head>`:

```html
<link rel="preload" as="image" href="/assets/hero.webp" fetchpriority="high" />
```

- Self-host fonts (`@font-face` + `font-display: swap`) and preload the one display
  face; if Google Fonts are unavoidable, add `preconnect` to `fonts.googleapis.com`
  and `fonts.gstatic.com` (crossorigin) BEFORE the stylesheet link.
- Give every `<img>`/`<video>` explicit `width`/`height` (or `aspect-ratio`),
  `loading="lazy"` below the fold, a `poster` on videos, modern formats (WebP/AVIF)
  for photos.
- Keep scrub clips within the brief's byte budget (`scroll-scrub.md`).

### Crawlability of client-rendered pages

Search engines and AI crawlers read the initial HTML most reliably. Keep critical
content (headline, intro paragraph, section headings, FAQ) in that HTML: plain HTML
does this by default; a Vite React SPA does not unless it prerenders at build time.
For SEO-critical multi-page sites choose plain HTML or add prerendering, and state
the choice in `design-brief.md`. Never inject chapter copy or headings only after a
viewport callback.

### Pitfalls

1. **Forgetting to update the sitemap.** Every new page needs a corresponding sitemap entry. Dead sitemap URLs actively hurt crawl efficiency.
2. **Hardcoded origins scattered through the code.** Keep `SITE_URL` in one place.
3. **Missing canonical on dynamic routes.** Build the canonical from the param value.
4. **Blocking CSS/JS in robots.txt.** Never `Disallow` asset folders; crawlers need them to render the page.
5. **Client-only content.** Copy that exists only after JS runs is fragile for crawlers; see above.

## Schema markup

Apply this to any website build with a public face. Structured data (JSON-LD) is how search engines understand what a page *is* — without it, rich results are off the table.

### Schema Type Decision Matrix

| Site type | Schema types to apply |
|---|---|
| Agency / studio / company | `Organization` + `ProfessionalService` + `WebSite` |
| Product / e-commerce | `Product` + `Organization` + `WebSite` |
| SaaS / app | `SoftwareApplication` + `Organization` + `WebSite` |
| Local business | `LocalBusiness` + `WebSite` |
| Blog / content site | `Article` or `BlogPosting` + `WebSite` |
| Any site | `WebSite` (always include) |
| Page has FAQ section | Add `FAQPage` to the above |

### Reusable Component

**React:** create `site/src/components/StructuredData.tsx`:

```tsx
export function StructuredData({ json }: { json: string }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
```

No client JS needed. The `json` prop is a pre-stringified JSON-LD object.
**Plain HTML:** paste the same JSON inside `<script type="application/ld+json">…</script>` in the page `<head>`.

### Usage Pattern

1. Define schema objects as module-level constants — `JSON.stringify` runs once at import time, not per render.
2. Place `<StructuredData>` at the top of the page JSX, before any visible content.

```tsx
import { StructuredData } from '~/components/StructuredData';

const ORG_SCHEMA = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Acme Studio',
  url: 'https://acme-studio.com',
  logo: 'https://acme-studio.com/logo.png',
});

export function HomePage() {
  return (
    <>
      <StructuredData json={ORG_SCHEMA} />
      {/* visible content */}
    </>
  );
}
```

### Required Fields Per Schema Type

#### Organization

| Field | Value |
|---|---|
| `@type` | `"Organization"` |
| `name` | Brand name |
| `url` | Canonical site URL |
| `logo` | Absolute URL to logo image |
| `sameAs` | Array of social profile URLs (optional but recommended) |

#### WebSite

| Field | Value |
|---|---|
| `@type` | `"WebSite"` |
| `name` | Site name |
| `url` | Canonical homepage URL |
| `potentialAction` | `SearchAction` with `query-input` (if site has search) |

#### ProfessionalService

| Field | Value |
|---|---|
| `@type` | `"ProfessionalService"` |
| `name` | Business name |
| `url` | Canonical URL |
| `description` | One-sentence service description |
| `areaServed` | Geographic area or `"Worldwide"` |
| `serviceType` | Primary service category |
| `priceRange` | e.g. `"$$"` or `"$$$"` |

#### SoftwareApplication

| Field | Value |
|---|---|
| `@type` | `"SoftwareApplication"` |
| `name` | App name |
| `url` | Canonical URL |
| `applicationCategory` | e.g. `"BusinessApplication"` |
| `operatingSystem` | `"Web"` for web apps |
| `offers` | `{ "@type": "Offer", "price": "0", "priceCurrency": "USD" }` |

#### Product

| Field | Value |
|---|---|
| `@type` | `"Product"` |
| `name` | Product name |
| `description` | Short product description |
| `image` | Product image URL |
| `offers` | `Offer` with `price`, `priceCurrency`, `availability` |

#### FAQPage

| Field | Value |
|---|---|
| `@type` | `"FAQPage"` |
| `mainEntity` | Array of `{ "@type": "Question", "name": "...", "acceptedAnswer": { "@type": "Answer", "text": "..." } }` |

### Complete Example: Agency Site

This goes in the homepage component. All three schemas in one `@graph`:

```tsx
const SCHEMA = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://acme-studio.com/#org',
      name: 'Acme Studio',
      url: 'https://acme-studio.com',
      logo: 'https://acme-studio.com/logo.png',
      sameAs: [
        'https://twitter.com/acmestudio',
        'https://linkedin.com/company/acmestudio',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://acme-studio.com/#website',
      name: 'Acme Studio',
      url: 'https://acme-studio.com',
      publisher: { '@id': 'https://acme-studio.com/#org' },
    },
    {
      '@type': 'ProfessionalService',
      '@id': 'https://acme-studio.com/#service',
      name: 'Acme Studio',
      url: 'https://acme-studio.com',
      description: 'Full-service creative agency specializing in brand identity and web design.',
      areaServed: 'Worldwide',
      serviceType: 'Creative Agency',
      priceRange: '$$$',
      provider: { '@id': 'https://acme-studio.com/#org' },
    },
  ],
});
```

### Pitfalls

1. **No relative URLs.** Every `url`, `logo`, `image` field must be an absolute `https://` URL. Schema validators reject relative paths silently.
2. **Don't duplicate schemas.** Use `@graph` to bundle multiple types in one `<script>` tag. Multiple `<script type="application/ld+json">` blocks are valid but harder to maintain.
3. **Match visible content.** Schema `name`/`description` must match what the user sees on the page. Google penalizes mismatches.
4. **Test with Google Rich Results Test** (https://search.google.com/test/rich-results) before shipping. Schema syntax errors are invisible to users but block rich results.
5. **Keep schemas on the pages they describe.** Organization schema goes on the homepage. Product schema goes on the product page. Don't dump everything on every page.

## Entity SEO

### What It Is

Entity optimization establishes the site's primary entity (business, person, product) as a distinct node in knowledge graphs used by Google, Bing, and AI search engines. The goal is unambiguous machine identification — when an AI engine mentions your entity, it should pull the correct name, description, and links.

### Entity Data Model

Collect these fields during the business intake (the "Schema markup" section above handles the base schema; this section enriches it):

| Field          | Example                                      | Required |
|----------------|----------------------------------------------|----------|
| name           | Acme Corp                                    | Yes      |
| description    | Automated invoicing for logistics companies  | Yes      |
| url            | https://acmecorp.com                         | Yes      |
| logo           | https://acmecorp.com/logo.png                | Yes      |
| sameAs[]       | [LinkedIn URL, Instagram URL, ...]           | Yes      |
| foundingDate   | 2019-03-15                                   | If known |
| industry       | Financial Technology                         | If known |
| areaServed     | North America, Europe                        | If known |

### sameAs Strategy

`sameAs` tells search engines which external profiles belong to this entity. Include URLs from:

- **LinkedIn** — company page URL (e.g. `https://linkedin.com/company/acmecorp`)
- **Instagram** — `https://instagram.com/acmecorp`
- **X (Twitter)** — `https://x.com/acmecorp`
- **GitHub** — `https://github.com/acmecorp` (if applicable)
- **Crunchbase** — `https://crunchbase.com/organization/acmecorp` (if listed)
- **Wikidata** — `https://wikidata.org/wiki/Q12345` (if an entry exists)

During intake, ask the client for all active social/professional profiles. Verify each URL resolves (don't include dead links). Order from highest authority to lowest. Only include profiles the entity actually controls.

### Consistent NAP

Name, Address, and Phone must be identical across:

1. **JSON-LD structured data** — the Organization schema on the page
2. **Visible page content** — the footer or contact section
3. **External listings** — Google Business Profile, Yelp, LinkedIn, etc.

Even minor differences ("St." vs "Street", "+1 555" vs "555") fragment the entity in knowledge graphs. Pick one canonical format and enforce it everywhere. If the business has no physical address, omit `address` entirely rather than using a fake or partial one.

### Multi-Entity @graph Pattern

When a page represents multiple entities (the company, its founder, and its product), use the `@graph` array to define them in a single JSON-LD block with cross-references:

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://acmecorp.com/#org",
      "name": "Acme Corp",
      "url": "https://acmecorp.com",
      "logo": "https://acmecorp.com/logo.png",
      "founder": { "@id": "https://acmecorp.com/#founder" },
      "sameAs": [
        "https://linkedin.com/company/acmecorp",
        "https://instagram.com/acmecorp"
      ]
    },
    {
      "@type": "Person",
      "@id": "https://acmecorp.com/#founder",
      "name": "Jane Smith",
      "jobTitle": "CEO & Founder",
      "worksFor": { "@id": "https://acmecorp.com/#org" },
      "sameAs": ["https://linkedin.com/in/janesmith"]
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://acmecorp.com/#product",
      "name": "Acme Invoicing",
      "applicationCategory": "BusinessApplication",
      "offers": {
        "@type": "Offer",
        "price": "99",
        "priceCurrency": "USD"
      },
      "provider": { "@id": "https://acmecorp.com/#org" }
    }
  ]
}
```

Key rules: each entity gets a unique `@id` (use URL fragments like `/#org`, `/#founder`). Cross-reference via `{ "@id": "..." }` rather than nesting the full object. This lets search engines build a connected graph rather than treating each entity as isolated.

### Implementation

Use the `StructuredData` component from the "Schema markup" section above. Build the JSON-LD string at module level with all entity fields populated, then pass it as the `json` prop:

```tsx
import { StructuredData } from '~/components/StructuredData';

const entityJson = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [ /* entities as above */ ]
});

export default function Page() {
  return (
    <>
      <StructuredData json={entityJson} />
      {/* visible page content */}
    </>
  );
}
```

The visible page content must reflect every claim in the schema — name, description, address, founding date. Don't put data in JSON-LD that visitors can't see.

### Pitfalls

1. **Dead sameAs links** — Including social URLs that 404 or redirect to a login wall. Verify every URL before adding it to the schema.
2. **NAP fragmentation** — Using "Acme Corp" in schema but "Acme Corporation" in the footer. Pick one canonical name.
3. **Missing @id cross-references** — Defining Organization and Person in the same @graph but not linking them via `founder`/`worksFor`. Without links, search engines treat them as unrelated.
4. **Over-claiming sameAs** — Listing profiles the entity doesn't own (e.g. a Wikipedia article about a different "Acme"). Every sameAs URL must be a profile controlled by or specifically about this entity.
5. **Invisible schema data** — Putting industry, areaServed, or founding date in JSON-LD without showing it anywhere on the page. Search engines increasingly penalize schema that has no visible counterpart.

## GEO / content

### What is GEO

Generative Engine Optimization (GEO) is the practice of structuring website content so AI-powered search engines (ChatGPT, Perplexity, Gemini, Copilot) can extract, cite, and surface it in generated answers. Traditional SEO gets you ranked; GEO gets you quoted.

### 7 Principles

#### 1. Direct Answer Structure

Lead every section with the answer, not a buildup. AI engines extract the first sentence that resolves the query — if your answer is buried in paragraph three, it won't be selected. Write the topic sentence as a standalone factual statement, then add supporting detail below. Pattern: "X is Y. It works by Z. This matters because W."

#### 2. Entity Clarity

Name and type the primary entity within the first 100 words of the page. "Acme Corp is a B2B SaaS company that provides automated invoicing for mid-market logistics firms." This gives AI engines the subject, category, and scope immediately. Avoid opening with generic statements like "Welcome to our website" or "In today's fast-paced world."

#### 3. Factual Specificity

Replace vague claims with concrete, verifiable data points. AI engines prefer citable facts over marketing language. "Trusted by many clients" → "Used by 200+ logistics companies across 14 countries since 2019." "Industry-leading uptime" → "99.97% uptime over the trailing 12 months, verified by StatusPage." Every stat should be something you can back up if challenged.

#### 4. Schema-Content Alignment

The JSON-LD structured data must reflect what's visible on the page — not aspirational content, not a different description, not extra services not mentioned in the copy. If the Organization schema says `"description": "AI-powered invoicing platform"`, those words must appear in the visible hero or about section. AI engines cross-reference schema against page text; mismatches reduce trust signals.

#### 5. FAQ Sections

Add a FAQ section with direct question-and-answer pairs. Each answer should be 1-3 sentences — long enough to be useful, short enough to be extractable. Wrap in FAQPage schema.

Component pattern:

```tsx
function FAQ({ items }: { items: { q: string; a: string }[] }) {
  return (
    <section>
      <h2>Frequently Asked Questions</h2>
      {items.map((item, i) => (
        <details key={i}>
          <summary>{item.q}</summary>
          <p>{item.a}</p>
        </details>
      ))}
    </section>
  );
}
```

Matching FAQPage schema (add to the page's JSON-LD):

```json
{
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What does Acme Corp do?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Acme Corp provides automated invoicing software for mid-market logistics companies, handling billing, compliance, and payment reconciliation."
      }
    }
  ]
}
```

#### 6. Citation-Friendly Headings

Write H2 and H3 headings that match the queries people (and AI) actually ask. Not "Our Approach" but "How Acme Corp Automates Invoice Processing." Not "Features" but "Key Features of Acme Invoicing Software." The heading should be a valid search query on its own. AI engines use headings as section identifiers when constructing citations — a descriptive heading increases the chance your section gets attributed.

#### 7. Topical Authority

Demonstrate depth through internal linking, consistent entity naming, and expertise signals. Link related sections to each other (e.g. the pricing page links to the features page with descriptive anchor text). Use the exact same entity name everywhere — don't alternate between "Acme", "Acme Corp", "ACME Corporation", and "our company." Include an expertise section (team credentials, years in operation, certifications) to strengthen E-E-A-T signals that AI engines evaluate.

---

### Before / After Example

**Before (vague, buried answer):**
```
Welcome to Acme Corp. We've been in business for years and pride
ourselves on excellent service. Our innovative platform helps
companies manage their finances. Many organizations trust us.
Contact us to learn more about what we can do for you.
```

**After (GEO-optimized):**
```
Acme Corp is an automated invoicing platform for mid-market
logistics companies, processing over 2M invoices annually across
14 countries. Founded in 2019, the platform reduces manual billing
time by 73% through AI-powered line-item matching and compliance
checks. Acme serves 200+ customers including DHL Freight and Kuehne+Nagel.
```

---

### Pitfalls

1. **Keyword stuffing for AI** — Repeating the same phrase unnaturally hoping AI will pick it up. AI engines detect and penalize this the same way traditional search does.
2. **Schema without matching content** — Adding FAQPage schema for questions never shown on the page. This is structured-data spam and triggers trust penalties.
3. **Walls of text with no structure** — AI engines rely on headings, lists, and paragraphs to segment content. A 2000-word block with no subheadings is effectively invisible to extraction.
4. **Answering questions indirectly** — "Contact us for pricing" instead of showing actual pricing. AI engines skip sections that don't contain an answer.
5. **Inconsistent entity naming** — Switching between "Acme Corp", "Acme", "the company", and "we" makes it harder for AI to build a coherent entity profile. Pick one primary name and use it consistently, especially in headings and first sentences.

## Audit

### When to Run

Run this audit after building any website and before the hand-over. It is the SEO quality gate. Do not hand the site over until every FAIL is resolved. The audit is self-contained — read the project source files directly, no external tools or browser needed.

### Audit Procedure

Read every page: each `site/*.html` file (plain HTML) or every page/route component under `site/src/` plus `site/index.html` (React). For each file, evaluate the 10 checks below. Collect results, print the summary table, fix any FAILs, then re-run until clean.

---

#### 1. Heading Hierarchy

Verify exactly one `<h1>` per page. Sections use `<h2>`, subsections `<h3>`, etc. No skipped levels (e.g. `<h1>` followed by `<h3>` with no `<h2>`). The `<h1>` must contain or closely match the page's primary keyword.

FAIL if: multiple `<h1>` tags, zero `<h1>` tags, or any skipped heading level.

#### 2. Image Alt Text

Every `<img>` element must have a non-empty `alt` attribute. For generated images, derive `alt` from the generation prompt (e.g. prompt "modern office interior" → `alt="Modern office interior"`). Decorative images use `alt=""` with `role="presentation"`.

FAIL if: any `<img>` lacks `alt`. WARN if: `alt` is generic like "image" or "photo".

#### 3. Link Text Quality

Anchor text must describe the destination. Flag any `<a>` whose visible text is "click here", "read more", "learn more", "here", or "link". Replace with descriptive text that makes sense out of context.

FAIL if: any non-descriptive anchor text found.

#### 4. Content-to-Code Ratio

Scan each page component for visible text content vs. JS/markup overhead. A page should have at least 200 words of visible text (excluding nav/footer boilerplate). Flag pages that are mostly animations, images, or interactive JS with minimal readable text.

WARN if: visible text is under 200 words. FAIL if: under 50 words.

#### 5. Keyword Alignment

Identify the page's primary keyword (from the business intake or page purpose). Verify it appears in: the `<title>` tag, the `<h1>`, the first paragraph of body text, and the `<meta name="description">` content. Phrasing can vary but the core term must be present.

FAIL if: keyword missing from title or H1. WARN if: missing from first paragraph or meta description.

#### 6. Mobile Readability

Check CSS/Tailwind classes for: no `font-size` below 16px on body text (12px acceptable only for captions/labels), `line-height` at least 1.5 on paragraphs, sufficient color contrast (no light gray on white). Verify the viewport meta tag is present.

FAIL if: viewport meta missing. WARN if: body text under 16px or line-height under 1.4.

#### 7. Keyboard Navigation

All interactive elements (`<button>`, `<a>`, `<input>`, custom clickable `<div>`s) must be keyboard-focusable. Any `<div>` or `<span>` with an `onClick` must also have `role="button"`, `tabIndex={0}`, and a keyboard handler. Check for visible focus indicators (no `outline-none` without a replacement).

FAIL if: clickable element lacks keyboard support. WARN if: `outline-none` used without custom focus style.

#### 8. Fragment Integrity

Find all `href="#..."` links in the page. For each fragment identifier, verify a matching `id` exists in the rendered DOM of the same page. Check both static IDs and dynamically generated ones (section slugs, etc.).

FAIL if: any fragment link points to a non-existent ID.

#### 9. Form Accessibility

Every `<input>`, `<select>`, and `<textarea>` must have an associated `<label>` (via `htmlFor`/`id` pairing) or an `aria-label`/`aria-labelledby`. Required fields must have the `required` attribute or `aria-required="true"`. Error messages must be linked via `aria-describedby`.

FAIL if: any input lacks a label. WARN if: required fields not marked.

#### 10. Social Preview

Verify `<meta property="og:title">`, `<meta property="og:description">`, and `<meta property="og:image">` exist. The `og:image` must be an absolute URL (starts with `https://`), not a relative path. Also check for `<meta name="twitter:card">`.

FAIL if: `og:image` missing or relative. WARN if: `og:title` or `og:description` missing.

---

### Output Format

After scanning, print this table to the build log:

```
┌─────────────────────────┬────────┬──────────────────────────────────┐
│ Check                   │ Status │ Detail                           │
├─────────────────────────┼────────┼──────────────────────────────────┤
│ Heading hierarchy       │ PASS   │                                  │
│ Image alt text          │ FAIL   │ 2 images missing alt in Hero.tsx │
│ Link text quality       │ PASS   │                                  │
│ Content-to-code ratio   │ WARN   │ 120 words on /pricing            │
│ Keyword alignment       │ PASS   │                                  │
│ Mobile readability      │ PASS   │                                  │
│ Keyboard navigation     │ PASS   │                                  │
│ Fragment integrity      │ FAIL   │ #team target missing             │
│ Form accessibility      │ PASS   │                                  │
│ Social preview          │ PASS   │                                  │
├─────────────────────────┼────────┼──────────────────────────────────┤
│ RESULT                  │ BLOCK  │ 2 FAIL — fix before hand-over    │
└─────────────────────────┴────────┴──────────────────────────────────┘
```

Status values: **PASS** (good), **WARN** (acceptable, note for improvement), **FAIL** (must fix before hand-over).

### Fix-and-Recheck Loop

1. For each FAIL, open the source file and apply the fix directly.
2. After fixing all FAILs, re-run the full 10-item audit from the top.
3. Repeat until the table shows zero FAILs.
4. WARNs are acceptable but should be noted in the hand-over report.
5. Only after a clean pass (zero FAILs), hand the site over (local preview + report).
