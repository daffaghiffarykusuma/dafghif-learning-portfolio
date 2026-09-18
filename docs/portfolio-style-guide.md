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

## Case study reading flow

Case studies lead with a short overview and a direct route to the work samples or reported outcomes. Generated pages show evidence limits once beside the samples; scope and method live in a native, keyboard-accessible disclosure. Keep one contextual contact section and a simple footer. Preserve every artifact ID, preview trigger, source link, and source-managed record when editing the layout. The entrepreneurship page is authored separately and follows the same reading pattern with outcomes and deliverables before optional methodology and participant feedback.
