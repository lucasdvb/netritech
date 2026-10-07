# Life OS typography system (owner's rules)

The owner's typography brief, kept as the source of truth. The implementation lives in
`css/tokens.css` (tokens and responsive overrides) and `css/type.css` (semantic classes).

## Principles

Typography is part of the interaction architecture, information hierarchy, usability, perceived quality and personality of Life OS. It should feel premium, modern, calm, highly legible, sophisticated, restrained, spacious, precise and effortless. Take inspiration from the clarity, hierarchy and restraint of Apple's best interfaces, but stay an original Life OS design, never an imitation.

- **Typeface:** Inter everywhere. Stack: `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`. Load only the weights used: 400 Regular, 500 Medium, 600 SemiBold, 700 Bold.
- **Weights:** 400 for body, descriptions, journal content and secondary information. 500 for navigation, metadata, labels, buttons, selected states and moderate emphasis. 600 for H1–H4, card titles, important metrics, primary buttons, selected navigation and completed states. 700 only for exceptional numerical emphasis, major achievement moments or genuinely critical information. SemiBold is the heading weight, not Bold. No arbitrary weights.
- **Tokens first:** every typography choice uses a semantic token or class, so the system can be adjusted globally. No hard-coded font sizes in components. The same semantic element always uses the same style (every habit title is H4).
- **Responsive:** the hierarchy works intentionally on mobile, tablet and desktop, not a shrunk desktop. Fluid sizing only for major display type; body, captions and footnotes stay predictable.

## Semantic hierarchy

| Style | Desktop | Tablet | Mobile | Weight | Line height | Tracking | Use |
|---|---|---|---|---|---|---|---|
| Display XL | 56 | 48 | 40 | 600 | 1.05 | −1.8 / −1.5 / −1.2px | Exceptional metrics, large progress moments, full-screen states. Never ordinary headings. |
| Display Large | 48 | 42 | 36 | 600 | ~1.08 | −1.5 / −1.2 / −1px | Major dashboard metrics, important statistics |
| Display Medium | 40 | 36 | 32 | 600 | 1.1 | slightly negative | Large metrics: percentages, weight, streaks, measurements |
| H1 | 32 | 30 | 28 | 600 | 1.15 | −0.7 / −0.6 / −0.5px | Primary page titles (Today, Goals, Journal, Insights, Progress) |
| H2 | 26 | 24 | 23 | 600 | 1.2 | slightly negative | Major sections, primary content groups |
| H3 | 22 | 21 | 20 | 600 | 1.25 | minimal negative | Subsections, grouped content |
| H4 | 19 | 18 | 17 | 600 | 1.3 | minimal negative | Card titles, habit names, task titles, list titles, small headings |
| Body Large | 17 | 17 | 17 | 400 | 1.5 | 0 | Important descriptions, introductions, longer supporting and writing-related text |
| Body | 15 | 15 | 15 | 400 | ~1.45 | 0 | The primary text size |
| Body Medium | 15 | 15 | 15 | 500 | 1.4 | 0 | Navigation, moderate emphasis, metadata, selected states |
| Body Strong | 15 | 15 | 15 | 600 | 1.4 | 0 | Strong inline emphasis, important values, selected information; never whole paragraphs |
| Caption | 13 | 13 | 13 | 400 | 1.35 | 0 | Secondary metadata, timestamps, supporting info, chart labels |
| Caption Medium | 13 | 13 | 13 | 500 | 1.35 | 0 | More prominent metadata, status and contextual labels |
| Footnote | 12 | 12 | 12 | 400 | 1.35 | 0 | Genuinely secondary info, helper text |
| Micro | 11 | 11 | 11 | 500 | 1.3 | +0.02–0.04em when uppercase | Only where necessary: TODAY, THIS WEEK, PROGRESS, MORNING, EVENING |

Uppercase labels are rare. Ordinary UI content is never uppercase.

## Numbers

Use `font-variant-numeric: tabular-nums` where stable alignment helps: timers, counters, statistics, tables, calendars, progress metrics. Large metrics use weight 600, tight tracking and a Display size, not Bold. A metric reads number → quieter label → quieter comparison ("76%" · "Daily completion" · "+8% from last week"). The label is never louder than the metric.

## Patterns

- **Page titles:** H1 followed by concise context, then content ("Today" · "Wednesday, October 8"). Desktop 32/600, mobile 28/600; context 15/400. The home greeting ("Good morning, Lucas") uses the same sizes and must never dominate the user's data.
- **Habit cards:** name ~17/600, supporting 15/400, metadata 13/400 or 500 ("Workout" · "45 min · Strength" · "4 of 5 exercises").
- **Tasks:** title 15/500 or 600, metadata 13/400. Completed tasks stay legible: a subtle contrast reduction or completion treatment, never near-invisible.
- **Navigation:** desktop primary 15/500, selected 15/600; secondary 13/500. Mobile bottom navigation labels 11–12/500, selected 600; icons carry recognition.
- **Buttons:** large 16/600, standard 15/600, small 13/500–600. Buttons must feel substantial.
- **Forms:** labels 13/500. Input text 15/400 on desktop, at least 16/400 on mobile; placeholders same size, 400. Helper text 13/400; errors 13/500.
- **Journal:** a calm writing environment, not a form. Titles 32/600 desktop, 28/600 mobile. Body 18/400 desktop and 17/400 mobile, line height ~1.65. Never compress journal line height.
- **Analytics:** primary metric 32–40/600, metric labels 13/500, chart labels 11–12/400–500, comparisons 13/500, explanations 15/400. Don't surround charts with competing numbers ("86%" · "Weekly consistency" · "+8% from last week").
- **Calendar:** month 17–20/600, day labels 11–12/500, dates 15/500, selected 15/600, secondary metadata 11–13/400.
- **Settings:** sections 17–19/600, setting titles 15/500, descriptions 13/400, values 15/500. Not a wall of bold labels.
- **Empty states:** heading 22/600 desktop or 20/600 mobile, description 15/400 at ~1.5, primary CTA 15/600. Useful and encouraging, never "Nothing here."
- **Error states:** heading 17–19/600, description 15/400, action 15/600. Calm, human, actionable.

## Layout rules

- **Line length:** 45–75 characters per line; 55–75 for journal and long-form. Use `max-width`. Desktop paragraphs never span the viewport.
- **Alignment:** left by default. Centre only for empty states, onboarding, achievement moments, isolated metrics or specific modals.
- **Tracking:** Display −0.02 to −0.04em; H1 and H2 −0.01 to −0.02em; body 0; small uppercase labels +0.02 to +0.04em.
- **Colour:** don't solve hierarchy with colour. Size and weight establish it (primary 15/600, secondary 15/400, metadata 13/400); colour reinforces.
- **Rhythm:** Display, then 16–24px of supporting space, then 24–40px before the next major section, and 12–20px between a section heading and its content. Typography and spacing are one system; no random margins on individual elements.
- **Density:** comfortable, neither cramped like an admin dashboard nor wastefully sparse. Mobile prioritises vertical rhythm and scanability; desktop uses whitespace for grouping.
- **Scale:** large type signals importance; don't overuse it. A meaningful scale (32, 20, 17, 15, 13) beats many near-identical sizes. Don't overuse SemiBold either.
- **Devices:** the same product on mobile, tablet and desktop, not the same layout stretched. Tablet adds whitespace and width; desktop adds stronger spatial hierarchy, larger display type, controlled line lengths and richer grouping.

## Motion and accessibility

- Typography participates in motion: a habit card's title flows into the detail title; completion updates typography, state and progress smoothly. No abrupt changes unless a hierarchy change is intended.
- Respect `prefers-reduced-motion`. Never communicate state by size, weight or colour alone: add icons, labels, structure or accessible attributes. Keep contrast adequate: premium does not mean faint.

## Review checklist (every screen)

Can I immediately tell what matters? Do the same semantic elements use the same typography? Can I read this comfortably for several minutes? Does the interface breathe? Is anything unnecessarily large or bold? Is secondary text still readable? Does the hierarchy work on mobile, tablet and desktop? Are numbers visually stable? Does typography support state transitions? Does it feel premium without being sterile?

Typography must feel like one engineered system across the whole Life OS: tokens, semantic hierarchy, responsive behaviour and component rules first, then every screen built on top (Today, Habits, Routines, Goals, Tasks, Projects, Journal, Health, Workouts, Reading, Reviews, Analytics, Insights, Settings, modals, sheets, forms, empty and error states, notifications, navigation).
