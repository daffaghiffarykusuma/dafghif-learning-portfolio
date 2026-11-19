# Portfolio style guide

The Learning Portfolio Site uses a "night study" theme: deep ink-blue pages, paper-white type, and one highlighter accent. All shared presentation lives in `src/styles/site.css`, which authored and generated pages load after the Lexend font stylesheet from Google Fonts. Case Study Publication writes the same head links, so regeneration keeps the theme.

## Typography

Use Lexend Exa for display headings (h1, h2, section titles) and Lexend for body copy, card titles, and controls. Lexend was designed for reading fluency, which suits a learning portfolio. Display headings use tight negative tracking; body text uses weight 350 with 1.65 line height. Use sentence case for headings and labels, and do not accent single words in headlines. Sizes come from the `--step-*` scale in `site.css`.

## Color

| Token | Role | Color |
| --- | --- | --- |
| `--ink` | Page background | `#141c30` |
| `--ink-deep` | Footer background | `#0f1626` |
| `--desk` | Cards and surfaces | `#1b2540` |
| `--desk-raised` | Hover and raised surfaces | `#232f4e` |
| `--rule` / `--rule-strong` | Dividers and control borders | `#2e3a5a` / `#46547a` |
| `--paper` | Main text | `#eeeae0` |
| `--pencil` | Supporting text | `#a9b2c7` |
| `--marker` | Highlighter accent | `#f4d547` |

The highlighter has fixed meanings. A solid marker fill is a primary action: header contact, hero action, footer and case contact, and the first case jump link. A translucent marker stroke marks evidence: portfolio proof lines and contextual contact titles. It also marks the current nav item and draws the focus ring. Don't use yellow decoratively. Secondary actions are outlined in `--rule-strong`. Evidence limits use a neutral left rule so they are never mistaken for highlighted proof.

## Layout

Use a 1240px content width with `clamp(16px, 5vw, 64px)` gutters. The home hero pairs a large Lexend Exa headline with a tilted 4:5 portrait card on a fading workbook dot grid. The outcome note sits beneath the portrait as a caption. Keep the existing below-fold mobile image loading policy. Selected work is a stack of rows: a 16:9 thumbnail beside the capability, title, summary, and link. About, Credentials, and testimonials use textbook-style margin headings in a left column. Sections are separated by single rules and roomy `--section-space` padding.

Every footer repeats quiet routes to Portfolio, Case studies, the CV, and LinkedIn beside the copyright line. The Blog is titled "Writing". Each post in `assets/blog.json` carries a `topic`; learning, work, and wellbeing writing is grouped first and AI and industry notes second, each in a three-column card grid with clamped descriptions.

Cards use 14px corners, buttons use 8px corners, and filters, practice links, jump links, and the card format/audience tag use pills. Only real sequences carry numbers: case design steps and the contact process.

The hero stacks below 768px, and the portrait becomes a small card beside the outcome note. Preserve the navigation's 1024px mobile breakpoint, expanded state, focus behavior, and mobile contact action. Search fields and mobile filters should remain at least 44px tall.

## Images and evidence

Product Thumbnails remain 16:9 WebP covers with readable titles. Preserve the established navy or deep-teal backgrounds, dotted grid, white title text, and mint, coral, or yellow accents. These covers can contrast with the dark page design. Show the complete thumbnail without cropping away its title. An authentic Evidence Photograph is marked `"kind": "evidence-photograph"` on its source image and may fill its card frame, because it has no title text to lose. Never mark screenshots, stock, or generated imagery this way.

Use only work-relevant motifs. Never invent scores, findings, names, or outcomes inside illustrative interfaces. Keep safe margins around identifying text.

Preserve authentic Evidence Photographs and accurate context. Do not replace them merely because they lack overlaid text. Do not classify generated, staged, or stock imagery as evidence of a real event. The home image is a portrait, not a workshop photograph.

## Interactions

Use restrained hover movement and border changes. Honor reduced-motion preferences. Keep portfolio query state, filters, progressive results, Artifact Preview triggers, modal close and focus behavior, and Engagement Inquiry context under their existing TypeScript owners.

Generated Portfolio Items and Case Studies retain their source-managed markup. Apply shared presentation through the theme, so regeneration preserves the design. Preview documents keep their own artifact presentation.

Home provides the published CV and three selected case studies for an initial review. Portfolio cards lead with evidence review, then offer a contextual inquiry. Show artifact format and an audience label only when the source supports it. Keep inferred proof hints in the catalog; visible card proof requires direct evidence.

Standalone Artifact cards place capability before the title, followed by the source description, directly supported proof when available, format/audience metadata, and actions. Preserve evidence limits in full without clipping or truncation. Capability, proof, and metadata use at least 14px text with comfortable line spacing. Align the action group at the bottom so cards remain easy to compare.

Standalone titles, complete thumbnails, and primary actions are native buttons that announce a dialog and open the same Artifact Preview. Use "Preview PDF" for PDF Artifacts and "Open interactive preview" for interactive Artifacts. Titles and thumbnails keep their editorial appearance with visible keyboard focus; card actions use the outlined button with at least a 44px height, so 76 cards do not form a wall of yellow. Keep "Discuss this work" secondary and carry the public title into contact context. Generate these controls through Portfolio Evidence Workflow and retain the existing preview/discovery owners for state, safety, dismissal, and focus return.

Search remains visible on phones, with secondary filters in a native disclosure. Filter buttons cover the main Practice Areas, and the "More practice areas" menu lists only the rest, so no area is offered twice. Show selected filter labels when collapsed and offer reset for every active search or filter. Preserve format, practice area, search, and progressive results in the URL.

Artifact previews use the complete phone viewport, a compact title, a scrollable reading area, and persistent full-screen and inquiry actions. Use the same artifact name in the heading, iframe title, and inquiry. Contact channels precede the optional message outline.

## Contact invitations

Invite role and project conversations in plain language across Home, Portfolio, Case Studies, and Contact. Use "Get in touch" for a general contact action. Keep "Discuss this work" contextual and secondary to reviewing evidence, with the public work title carried through the existing Engagement Inquiry Journey. Avoid consultation-only invitations, promises of similar results, and internal implementation terms in public invitations.

Keep direct WhatsApp, email, and LinkedIn channels ahead of the optional message outline. Generic Contact visits remain neutral; contextual visits retain the public title in the summary and channel messages. Preserve contact addresses and response commitments. Use existing native links, readable wrapping labels, minimum control sizes, and visible keyboard focus within the night-study theme. Generated Case Study invitations belong to Case Study Publication and must survive Portfolio Evidence Workflow generation.

## Case study reading flow

Home and the Case Studies index lead with Administrative Communication, Learning Organization Strategy, then Entrepreneurship. Keep every other narrative accessible after these index entries. Case Study Publication owns the generated index order.

On Home, Portfolio, and the index, a Case Study's title, complete thumbnail, and primary action are native links to the same narrative. Label the primary action "Read case study" and place it after the scope/evidence summary, aligned at the bottom of the card. Keep any "Discuss this work" action secondary and preserve its public-title context. Narrative links retain browser navigation and visible keyboard focus; they do not activate Artifact Previews.

Use a capability label, title, and concise source-supported description consistently. Meaningful supporting labels on narrative cards use at least 14px text. Preserve authentic Evidence Photographs and contain Product Thumbnails without cropping their identifying text. Scope describes the designed work; assessment materials alone establish neither confirmed delivery nor measured impact. Keep source-owned evidence limits beside the narrative work samples and retain Artifact identities and preview routes during regeneration.

Case study heroes pair the narrative with a compact "at a glance" panel: practice area, work-sample formats, and, for generated pages, the numbered design path from the source `caseFlow`. The authored entrepreneurship panel lists only facts already stated in its lead. Case titles use a smaller display size than page-level headings because they run long. Within the work section, "What this demonstrates" ends in a single "Start here" callout, and the full sample grid follows under its own ruled heading in three columns on wide screens.

Case studies lead with a short overview and a direct route to the work samples or reported outcomes. Generated pages show evidence limits once beside the samples; scope and method live in a native, keyboard-accessible disclosure. Keep one contextual contact section and a simple footer. Preserve every artifact ID, preview trigger, source link, and source-managed record when editing the layout. The entrepreneurship page is authored separately and follows the same reading pattern with outcomes and deliverables before optional methodology and participant feedback.

## Compact homepage

Home follows introduction, three selected cases, a brief About/capability summary, credentials, two attributed testimonials, and contact. Keep Explore selected work and Download CV together, retain the portrait and its mobile loading policy, and keep full-portfolio and relevant Practice Area routes visible. Program management supports the learning-design introduction.

Avoid separate skills, process, outcome, and capability grids that repeat the introduction or selected work. Keep supported scope and outcomes beside the relevant work; detailed method and evidence limits belong in the Case Studies and their authoritative source. Retain selected-work destinations when changing the surrounding homepage layout.

List the existing credential names and issuers in native details/summary disclosures, collapsed initially. Label each action View certificate and keep the existing image and descriptive alternative text inside. Use native keyboard behavior and the shared visible focus outline. Let certificate images expand at their natural aspect ratio rather than clipping them.

Use two existing learning-design-relevant testimonials with their complete original wording and attribution. Use two columns on desktop and one on phones, with 24px phone card padding so quotes and attributions have room to wrap. Contact after this evidence welcomes role and project conversations.

Scope these presentation rules under `.home-page`. Supporting labels, issuers, and attributions are at least 14px; Practice Area and selected-work links have at least 44px control height. Use complete 16:9 selected-work thumbnails, wrapping labels, and the shared reduced-motion policy. The About summary uses two columns on desktop and stacks below 768px; credential disclosures remain a single readable column.
