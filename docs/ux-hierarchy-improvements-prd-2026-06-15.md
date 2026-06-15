# PRD: Reviewer-Centered UX Hierarchy Improvements

## Problem Statement

The Learning Portfolio Site contains substantial, reviewable evidence across 67 Portfolio Items, five Case Studies, Artifact Previews, Proof Points, credentials, and testimonials. A Reviewer can verify breadth and inspect individual Artifacts, but the experience requires too much browsing and interpretation before the Reviewer can decide whether Daffa fits a specific hiring, client, or collaboration need.

The current experience also has three foundational failures:

- On mobile, the intended sticky engagement action is positioned at the bottom of the document instead of the viewport.
- On mobile, the navigation opens inside a short scrolling panel that initially exposes only one menu item.
- A Portfolio Item-specific engagement link reaches a generic contact page and loses the Portfolio Item context.

These functional failures must be resolved before higher levels of Stephen Anderson's User Experience Hierarchy of Needs can be improved. After that foundation is stable, the site should reduce portfolio decision effort, preserve Reviewer state, improve evidence comparison, and make the relationship between visible evidence and a Reviewer's decision more explicit.

## Solution

Create a staged Reviewer-centered UX improvement program:

1. Repair mobile navigation and conversion behavior so primary actions work reliably at supported responsive sizes.
2. Preserve Portfolio Item and discovery context across navigation, Artifact Preview, and contact handoff.
3. Replace the long horizontal filter strip with a compact discovery experience that combines search, a smaller set of primary Practice Area filters, result counts, shareable URL state, and progressive disclosure.
4. Reduce the initial portfolio browsing burden by presenting a curated set of recommended Portfolio Items before the complete inventory.
5. Improve comparison and decision support with consistent evidence summaries, more actionable Artifact Previews, and direct Practice Area entry points.
6. Strengthen pleasurable and meaningful experience layers through relevant testimonials, restrained state feedback, a concise working-method narrative, and Case Study explanations of why the demonstrated capability matters.

The solution must preserve the site's existing dark visual identity, Portfolio Item Source as the source of truth, evidence-bounded Proof Point language, first-class Case Study pages, safe same-origin Artifact Preview policy, and Bun-first build and validation workflow.

## User Stories

1. As a mobile Reviewer, I want the primary engagement action to remain visible at the bottom of the viewport, so that I can contact Daffa without reaching the end of a long page.
2. As a mobile Reviewer, I want the navigation panel to use the available viewport below the header, so that I can see and reach every main destination.
3. As a keyboard Reviewer, I want the mobile navigation to expose a clear expanded state and predictable focus behavior, so that I can navigate without relying on a pointer.
4. As a Reviewer who opens the mobile menu, I want page scrolling behind the menu to be controlled, so that the navigation behaves as one coherent surface.
5. As a Reviewer, I want the homepage's primary action visible in the first desktop viewport, so that the next step is immediately clear.
6. As a mobile Reviewer, I want a meaningful primary action visible in the first viewport, so that the page does not begin as a long statement with no apparent next step.
7. As a hiring manager, I want to search Portfolio Items by title, description, Practice Area, and supported evidence language, so that I can find work related to a role quickly.
8. As a potential client, I want a short set of high-level Practice Area filters, so that I can browse without interpreting thirteen similar categories.
9. As a Reviewer, I want access to additional filters only when I need them, so that the default interface remains concise.
10. As a Reviewer, I want to know how many Portfolio Items match my search and filters, so that I understand the effect of each choice.
11. As a screen-reader Reviewer, I want result-count changes announced politely, so that filtering does not silently change the page.
12. As a Reviewer, I want the selected search and filter state represented in the URL, so that I can bookmark or share the same evidence view.
13. As a returning Reviewer, I want a shared or bookmarked portfolio URL to restore its discovery state, so that I do not repeat prior work.
14. As a Reviewer, I want closing an Artifact Preview to preserve my search, filters, and scroll context, so that inspection does not reset discovery.
15. As a Reviewer, I want invalid or obsolete discovery parameters to fall back safely, so that malformed URLs do not break the portfolio.
16. As a Reviewer arriving from a homepage Practice Area, I want to land on a relevant filtered portfolio view, so that I do not have to categorize the work again.
17. As a Reviewer, I want the initial portfolio view to show a concise group of representative Portfolio Items, so that I can judge fit without scanning the complete inventory.
18. As a Reviewer, I want an explicit way to browse the complete Portfolio Item inventory, so that curation does not hide available evidence.
19. As a mobile Reviewer, I want more Portfolio Items revealed in manageable batches, so that the page does not begin as an extremely long sequence of large cards.
20. As a Reviewer, I want curated Portfolio Items to remain derived from structured source data, so that visible recommendations do not drift from the Portfolio Item Source.
21. As a Reviewer, I want each card to summarize role, audience, scope, Artifact type, and strongest supported Proof Point consistently, so that I can compare evidence quickly.
22. As a Reviewer, I want unsupported comparison fields omitted rather than inferred, so that concise cards remain evidence-bounded.
23. As a Reviewer, I want Portfolio Item cards and Case Study cards to remain visibly distinct, so that I understand whether I am opening a single Artifact or a narrative evidence set.
24. As a Reviewer, I want an Artifact Preview to state the Artifact type and evidence limit, so that I understand what the preview can and cannot prove.
25. As a Reviewer, I want an option to open an Artifact Preview in a full browser view, so that I can inspect dense documents and spreadsheets more comfortably.
26. As a Reviewer, I want a direct "Discuss this Artifact" action adjacent to the preview, so that the next step retains the evidence context I am viewing.
27. As a keyboard Reviewer, I want Artifact Preview actions to be reachable in a logical order and focus returned to the opening control when closed, so that the modal remains predictable.
28. As a Reviewer, I want Portfolio Item-specific contact links to show what I am contacting Daffa about, so that I can verify the context before leaving the site.
29. As a Reviewer using WhatsApp, I want the Portfolio Item title included in the prepared message, so that I do not need to retype it.
30. As a Reviewer using email, I want the subject and body to include the Portfolio Item context, so that the inquiry begins with useful detail.
31. As a Reviewer, I want general contact links to remain general when no Portfolio Item context exists, so that the contact page works for open-ended inquiries.
32. As a privacy-conscious Reviewer, I want contact context encoded only from public page data and explicit query parameters, so that no hidden personal information is transmitted.
33. As a Reviewer, I want the site logo to be presented as site identity rather than the page's main heading, so that each page has one clear descriptive heading.
34. As a screen-reader Reviewer, I want each page to expose one meaningful `h1`, so that document structure is clear.
35. As a Reviewer, I want filter controls, result summaries, and content to follow a logical reading order, so that the discovery interface is understandable at different zoom levels.
36. As a Reviewer using reduced motion, I want state changes to remain clear without decorative animation, so that interaction feedback does not depend on motion.
37. As a Reviewer, I want filter and modal transitions to communicate state changes quickly, so that the interface feels responsive without delaying evidence review.
38. As a Reviewer, I want testimonials selected for relevance to the visible Practice Areas, so that social proof reinforces the work I am evaluating.
39. As a Reviewer, I want an optional route to the complete testimonial set, so that focused presentation does not remove supporting evidence.
40. As a Reviewer reading a Case Study, I want a concise "Why this matters" explanation, so that I can connect the demonstrated capability to a real hiring or engagement decision.
41. As a Reviewer, I want each "Why this matters" explanation to distinguish demonstrated capability from unsupported outcome claims, so that trust is preserved.
42. As a Reviewer, I want a concise "How I work" path across needs analysis, design, delivery, evaluation, and improvement, so that I understand Daffa's professional approach rather than only the size of the catalog.
43. As a Reviewer, I want the working-method narrative linked to representative Case Studies, so that each stage is supported by inspectable evidence.
44. As the Portfolio Owner, I want UX additions generated or validated from the Portfolio Item Source and curated Proof Points, so that visible pages and structured metadata remain aligned.
45. As the Portfolio Owner, I want functional mobile fixes protected by responsive regression checks, so that future styling changes do not recreate the defects.
46. As the Portfolio Owner, I want portfolio discovery logic isolated behind a small interface, so that URL state, search, filters, result counts, and progressive disclosure can evolve without being spread across page scripts.
47. As the Portfolio Owner, I want engagement context isolated behind a small interface, so that contact cards, prepared messages, and future contact forms use one interpretation of query state.
48. As the Portfolio Owner, I want existing Artifact Preview safety rules reused, so that new preview actions do not weaken same-origin restrictions.
49. As the Portfolio Owner, I want the production portfolio HTML to remain within its baseline performance guard, so that discovery improvements do not regress initial loading.
50. As the Portfolio Owner, I want all current site validation and production checks to continue passing, so that UX work does not weaken content, asset, security, or deployment integrity.

## Implementation Decisions

- Deliver the work in hierarchy order: functional and reliable foundations first, usable and convenient discovery second, pleasurable and meaningful enhancements last.
- Preserve the current visual system, typography, dark palette, card language, and responsive breakpoints. This is an interaction and information-architecture improvement, not a visual rebrand.
- Remove page-level layout containment that changes fixed-position behavior. If containment remains useful, apply it only to bounded components that do not contain viewport-fixed UI.
- Ensure the mobile navigation overlay is not contained by a filtered or transformed ancestor. The overlay must fill the viewport below the mobile header and remain independently scrollable only when its content genuinely exceeds the available height.
- Navigation continues to own menu expanded state, link-close behavior, current-page highlighting, and mobile open/close behavior through one public initializer.
- Introduce a deep Portfolio Discovery module with a small state-oriented interface. It will own:
  - parsing and normalizing search, Practice Area, additional filters, and visible-batch state;
  - matching normalized Portfolio Items against discovery state;
  - serializing stable state into URL query parameters;
  - restoring valid state from the URL;
  - calculating result and visible counts;
  - exposing state changes to the page adapter.
- Discovery matching must operate on already rendered, source-derived Portfolio Item data or a compact generated discovery index. It must not create a second hand-maintained content source.
- Primary filters will be limited to five or six broad Practice Areas based on current public positioning. More specific tags remain available through progressive disclosure.
- Search and filter state will use query parameters rather than hashes. Hashes remain available for Portfolio Item identity and direct Artifact Preview behavior.
- Unknown query values are ignored or normalized to a safe default. They must not prevent page initialization.
- The default portfolio view will show a curated representative subset before the full inventory. Curation must be explicit structured data or a deterministic source rule, not DOM position maintained by hand.
- The full inventory remains available through a clear action. Progressive disclosure must preserve semantic reading order and must not duplicate Portfolio Item markup.
- Add a visible result summary and a polite live region. The live announcement must be concise and occur after a completed discovery-state change.
- Homepage Practice Area actions will link to stable portfolio query URLs that the Portfolio Discovery module understands.
- Introduce a deep Engagement Context module with a small interface that:
  - reads public context from `portfolioItem`, `engagement`, or `service` query parameters and stored inquiry data;
  - normalizes the context into a display label and prepared-message text;
  - updates visible contact context;
  - builds URL-encoded WhatsApp and email destinations;
  - leaves generic contact methods unchanged when no context exists.
- Portfolio Item context must be visible on the contact page before the Reviewer activates an external contact method.
- Prepared contact text may include only public Portfolio Item or Engagement Type labels and generic inquiry wording. It must not infer budgets, availability, confidential project details, or unsupported claims.
- Extend the parent-level Artifact Preview Experience rather than changing individual generated preview documents. Parent controls will own Artifact metadata, full-screen opening, and contextual discussion actions.
- Full-screen Artifact opening must reuse the approved Artifact Preview Policy. Cross-origin or unapproved paths remain blocked.
- Preserve focus movement to the close control, Escape and backdrop close behavior, and return focus to the opening control.
- Correct heading semantics in shared and generated page chrome: site identity is not an `h1`; each page gets one page-specific `h1`.
- Card comparison fields must come from existing structured Portfolio Item data, Proof Points, Case Study models, or explicit new optional source fields. Missing values are omitted.
- "Why this matters" content must be explicit source content or conservative generated text derived from approved Case Study fields. It must preserve the existing separation between visible evidence, assumptions, and evidence limits.
- The "How I work" narrative will use the established learning-cycle language and link each stage to a small number of representative Case Studies or Portfolio Items.
- Testimonial relevance will be curated through explicit Practice Area associations. It will not be inferred from a person's title alone.
- Motion is used only for state feedback and must respect `prefers-reduced-motion`.
- Keep Bun as the package manager, test runner, script surface, and build entry point.
- Do not modify the editable Office source shipping policy or expose private source Artifacts.

## Testing Decisions

- Tests will assert externally visible behavior and public module contracts, not CSS implementation details or private helper structure.
- Responsive navigation tests will verify:
  - menu expanded state;
  - all navigation destinations remain reachable;
  - the overlay occupies the viewport below the header at a mobile viewport;
  - the sticky engagement action remains inside the viewport while the page is near the top and after scrolling;
  - closing by toggle and navigation link restores the closed state.
- Portfolio Discovery unit tests will verify:
  - default state;
  - search matching;
  - primary and additional filter matching;
  - combined search and filter behavior;
  - result counts;
  - placeholder exclusion;
  - URL parsing, normalization, and serialization;
  - safe handling of unknown and malformed parameters;
  - progressive visible-batch behavior.
- Portfolio Discovery integration tests will verify:
  - query state is restored on page initialization;
  - result text and `aria-pressed` states match visible Portfolio Items;
  - the live region announces a completed update;
  - homepage Practice Area links land in the expected portfolio state;
  - opening and closing an Artifact Preview preserves discovery state.
- Engagement Context unit tests will verify:
  - Portfolio Item, Engagement Type, and stored inquiry normalization;
  - prepared WhatsApp and email encoding;
  - generic fallback behavior;
  - omission of empty or malformed context.
- Contact integration tests will verify:
  - a Portfolio Item-specific URL renders visible context;
  - WhatsApp and email links include the normalized public context;
  - LinkedIn remains unchanged;
  - general contact URLs remain generic.
- Artifact Preview tests will extend existing prior art to verify:
  - full-screen and discussion actions reflect the active Artifact;
  - only approved same-origin paths can be opened;
  - focus order and return behavior remain intact.
- Heading tests will verify one page-specific `h1` per top-level and generated page and non-heading site identity.
- Generation and validation tests will verify any new curation, comparison, testimonial-association, or Case Study meaning fields at the source boundary.
- System tests will verify representative production pages, query-state URLs, generated Case Study content, and preview destinations from the production build.
- Performance checks will retain the current portfolio HTML baseline guard. Any compact discovery index added to initial load must be included in the budget assessment.
- Accessibility verification will include keyboard navigation, focus visibility, reduced-motion behavior, 200% zoom/reflow spot checks, and screen-reader spot checks for menu state, result updates, headings, and Artifact Preview controls.
- Prior art includes the existing navigation initializer tests, Portfolio Item filter unit tests, contact prefill integration tests, Artifact Preview Experience tests, Portfolio Evidence Pipeline tests, production-site system checks, static validation, and performance budget script.

## Out of Scope

- A visual rebrand, new color palette, new typography system, or wholesale page redesign.
- Replacing the static site or Vite build with a new application framework.
- Changing Bun as the package manager or script surface.
- Creating authentication, saved user accounts, server-side personalization, or a CRM.
- Sending contact messages directly from the site or introducing a backend contact form.
- Inventing new Outcome Evidence, testimonials, metrics, client claims, or Case Study results.
- Replacing the Portfolio Item Source, Proof Point workflow, Case Study Model, or Artifact Preview Policy.
- Publishing editable Office source files or weakening the Shipped Artifact Policy.
- Rewriting all Portfolio Item descriptions as part of this work.
- A complete WCAG conformance certification or formal usability study.
- Analytics instrumentation, A/B testing, heatmaps, or conversion attribution unless separately approved.
- Separate hiring-manager and client page variants until there is evidence that their content requirements materially differ.

## Further Notes

- The PRD is grounded in a desktop 1280 x 720 and mobile 390 x 844 audit performed on June 15, 2026.
- The audit found that the site is strongest at evidence depth and weakest at decision compression.
- Existing checks passed before this PRD: 88 automated tests, static validation, production build, and baseline performance budget.
- The portfolio HTML passed its baseline guard but did not meet the existing stretch target. New discovery behavior should avoid increasing initial HTML without a measured reason.
- The contact audit was verified through live DOM and source inspection because screenshot capture failed twice.
- No analytics, user interviews, session recordings, or formal screen-reader audit were available. Product impact assumptions should therefore be validated after the foundational defects are fixed.
- Recommended delivery sequence:
  1. Responsive navigation and sticky engagement repairs.
  2. Engagement Context and contact handoff.
  3. Homepage first-viewport action and heading semantics.
  4. Portfolio Discovery state, search, result counts, and shareable URLs.
  5. Curated inventory and progressive disclosure.
  6. Artifact comparison and preview actions.
  7. Relevant testimonials, "Why this matters," and "How I work."
