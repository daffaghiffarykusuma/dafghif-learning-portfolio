# Portfolio style guide

The Learning Portfolio Site uses a dark editorial theme. Shared presentation lives in `src/styles/dark-mode.css`; the existing filename is retained because both authored and generated pages already load it last.

## Typography

Use Georgia for large editorial headings, with italic emphasis used sparingly. Body copy and controls use Inter with Segoe UI and sans-serif fallbacks. Keep card headings compact and readable. Hero headings scale from 42px on phones to 76px on wide screens; section headings scale from 34px to 50px.

## Color

| Role | Color |
| --- | --- |
| Page background | `#111a19` |
| Card background | `#1b2825` |
| Main text | `#edf2e8` |
| Supporting text | `#b2bfb4` |
| Section and control background | `#263631` |
| Borders | `#35483e` |
| Highlight | `#b9cf9a` |

Use off-white text on dark surfaces and dark text on sage primary buttons. Category links use pale sage text on dark green badges. Keep visible keyboard focus outlines. Preview actions use centered flex alignment, 12px vertical and 24px horizontal padding, and a minimum 48px height so rounded borders never crowd the label.

## Layout

Use a 1280px maximum container with 5% side gutters. The home hero pairs editorial text with an arched portrait and an offset outcome note. Keep its existing below-fold mobile image loading policy. Sections use thin dividers and 52px to 80px vertical spacing. Cards use restrained 10px corners; primary actions and filters use pill shapes.

The hero stacks below 768px. Preserve the navigation's existing 1024px mobile breakpoint, expanded state, focus behavior, and mobile contact action. Search fields and mobile filters should remain at least 44px tall.

## Images and evidence

Product Thumbnails remain 16:9 WebP covers with readable titles. Preserve the established navy or deep-teal backgrounds, dotted grid, white title text, and mint, coral, or yellow accents. These covers can contrast with the dark page design. Show the complete thumbnail without cropping away its title.

Use only work-relevant motifs. Never invent scores, findings, names, or outcomes inside illustrative interfaces. Keep safe margins around identifying text.

Preserve authentic Evidence Photographs and accurate context. Do not replace them merely because they lack overlaid text. Do not classify generated, staged, or stock imagery as evidence of a real event. The home image is a portrait, not a workshop photograph.

## Interactions

Use restrained hover movement and border changes. Honor reduced-motion preferences. Keep portfolio query state, filters, progressive results, Artifact Preview triggers, modal close and focus behavior, and Engagement Inquiry context under their existing TypeScript owners.

Generated Portfolio Items and Case Studies retain their source-managed markup. Apply shared presentation through the theme, so regeneration preserves the design. Preview documents keep their own artifact presentation.

Home provides the published CV and three selected case studies for an initial review. Portfolio cards lead with evidence review, then offer a contextual inquiry. Show artifact format and an audience label only when the source supports it. Keep inferred proof hints in the catalog; visible card proof requires direct evidence.

Search remains visible on phones, with secondary filters in a native disclosure. Show selected filter labels when collapsed and offer reset for every active search or filter. Preserve format, practice area, search, and progressive results in the URL.

Artifact previews use the complete phone viewport, a compact title, a scrollable reading area, and persistent full-screen and inquiry actions. Use the same artifact name in the heading, iframe title, and inquiry. Contact channels precede the optional message outline.

## Case study reading flow

Home and the Case Studies index lead with Administrative Communication, Learning Organization Strategy, then Entrepreneurship. Keep every other narrative accessible after these index entries. Case Study Publication owns the generated index order.

On Home, Portfolio, and the index, a Case Study's title, complete thumbnail, and primary action are native links to the same narrative. Label the primary action "Read case study" and place it after the scope/evidence summary, aligned at the bottom of the card. Keep any "Discuss this work" action secondary and preserve its public-title context. Narrative links retain browser navigation and visible keyboard focus; they do not activate Artifact Previews.

Use a capability label, title, and concise source-supported description consistently. Meaningful supporting labels on narrative cards use at least 14px text. Preserve authentic Evidence Photographs and contain Product Thumbnails without cropping their identifying text. Scope describes the designed work; assessment materials alone establish neither confirmed delivery nor measured impact. Keep source-owned evidence limits beside the narrative work samples and retain Artifact identities and preview routes during regeneration.

Case studies lead with a short overview and a direct route to the work samples or reported outcomes. Generated pages show evidence limits once beside the samples; scope and method live in a native, keyboard-accessible disclosure. Keep one contextual contact section and a simple footer. Preserve every artifact ID, preview trigger, source link, and source-managed record when editing the layout. The entrepreneurship page is authored separately and follows the same reading pattern with outcomes and deliverables before optional methodology and participant feedback.

## Compact homepage

Home follows introduction, three selected cases, a brief About/capability summary, credentials, two attributed testimonials, and contact. Keep Explore selected work and Download CV together, retain the portrait and its mobile loading policy, and keep full-portfolio and relevant Practice Area routes visible. Program management supports the learning-design introduction.

Avoid separate skills, process, outcome, and capability grids that repeat the introduction or selected work. Keep supported scope and outcomes beside the relevant work; detailed method and evidence limits belong in the Case Studies and their authoritative source. Retain selected-work destinations when changing the surrounding homepage layout.

List the existing credential names and issuers in native details/summary disclosures, collapsed initially. Label each action View certificate and keep the existing image and descriptive alternative text inside. Use native keyboard behavior and the shared visible focus outline. Let certificate images expand at their natural aspect ratio rather than clipping them.

Use two existing learning-design-relevant testimonials with their complete original wording and attribution. Use two columns on desktop and one on phones, with 24px phone card padding so quotes and attributions have room to wrap. Contact after this evidence welcomes role and project conversations.

Scope these presentation rules under `.home-page`. Supporting labels, issuers, and attributions are at least 14px; Practice Area and selected-work links have at least 44px control height. Use complete 16:9 selected-work thumbnails, wrapping labels, and the shared reduced-motion policy. The About summary uses two columns on desktop and stacks below 768px; credential disclosures remain a single readable column.
