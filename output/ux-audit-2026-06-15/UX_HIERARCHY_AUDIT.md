# UX Hierarchy Audit

Date: 2026-06-15

## Audit Scope

Product: Daffa Ghiffary Kusuma Learning Portfolio Site

Primary reviewer goals:

1. Understand Daffa's capabilities and fit.
2. Find relevant evidence quickly.
3. Inspect an Artifact or Case Study.
4. Start a relevant conversation without repeating context.

Framework: Stephen Anderson's six-stage User Experience Hierarchy of Needs: functional, reliable, usable, convenient, pleasurable, and meaningful.

Evidence captured at:

- Desktop: 1280 x 720
- Mobile: 390 x 844
- Local URL: `http://127.0.0.1:5173/`

## Executive Finding

The site is strongest at evidence depth and weakest at decision compression. It proves that a large body of work exists, but it makes reviewers browse, filter, and interpret too much before they can answer, "Is Daffa right for my need?"

Fix the two mobile layout defects first. Then redesign portfolio discovery around reviewer intent rather than the complete 67-item inventory.

## Prioritized Backlog

| Priority | Hierarchy level | Improvement | Evidence | Recommended change |
| --- | --- | --- | --- | --- |
| P0 | Functional | Fix the mobile sticky CTA | The CTA has `position: fixed`, but renders at the bottom of the 18,624 px document instead of the viewport. `body { contain: layout style; }` makes it use the body as its containing block. | Remove layout containment from `body`; apply containment only to bounded components. Add a 390 x 844 regression test confirming the CTA stays inside the viewport. |
| P0 | Functional | Fix the mobile menu viewport | The open menu panel is only about 161 px tall. Only Home is visible; the remaining items require scrolling inside a short panel. The fixed nav sits inside a backdrop-filtered header, which creates an unexpected containing block. | Move the mobile navigation overlay outside the filtered header, or move the blur to a pseudo-element that does not contain the fixed nav. Make the panel fill from the header to the viewport bottom. |
| P0 | Functional | Preserve Portfolio Item context on contact | `Discuss Similar Engagement` sends `?portfolioItem=...`, but the contact page ignores it. The prefill code only handles `engagement` or `service` and exits because this contact page has no `.contact-form`. | Display a visible "Regarding" summary and generate prefilled WhatsApp and email links containing the Portfolio Item title. |
| P1 | Usable | Put a primary action in the first desktop and mobile viewport | At 1280 x 720, the homepage hero CTA is below the fold. At 390 x 844, neither the hero CTA nor the intended sticky CTA is visible. | Reduce hero height and heading scale; keep one primary action and one secondary action visible without scrolling. |
| P1 | Usable | Replace the 13-filter strip with a decision tool | Filters are horizontally clipped on desktop and mobile. The selected state works, but there is no visible result count, search, or cue that more filters are off-screen. | Use search plus 5-6 high-level Practice Area filters and a "More filters" control. Show "5 matching items" and announce changes in an `aria-live` region. |
| P1 | Usable | Reduce the initial portfolio inventory | The page renders 67 Portfolio Items. A mobile card is roughly 745 px tall, making full browsing impractical. | Lead with 6-9 recommended items, then offer "Browse all work." Use compact cards, pagination, or progressive "Show more" batches for the full inventory. |
| P1 | Usable | Correct page heading semantics | The brand name is an `h1` and several pages add another `h1`; the portfolio page uses `h2` for its page title. | Render the logo as non-heading text. Give every page one descriptive `h1`. |
| P1 | Reliable | Persist discovery state | Filtering does not update the URL, so a reviewer cannot share or return to a filtered view. | Store filter and search state in query parameters, restore it on load, and preserve it when closing an Artifact Preview. |
| P2 | Convenient | Add reviewer-intent entry points | Homepage Practice Area links all lead to the unfiltered portfolio, forcing reviewers to repeat the categorization work. | Link each Practice Area to a filtered portfolio URL, such as `portfolio.html?area=learning-analytics`. Add "Hiring manager" and "Client" review paths only if content genuinely differs. |
| P2 | Convenient | Make Artifact Previews actionable | The preview is readable and keyboard focus moves to Close, but it is a large nested-scroll surface without adjacent context or a next action. | Add Artifact type, evidence note, "Open full screen," and "Discuss this Artifact" in the modal header or footer. Avoid adding controls inside the iframe when parent-level controls suffice. |
| P2 | Convenient | Help reviewers compare evidence | Cards repeat similar description/proof structures, so differences are hard to scan. | Standardize a compact evidence row: role, audience, scope, Artifact type, and strongest supported Proof Point. |
| P3 | Pleasurable | Use motion as feedback, not decoration | The visual identity is cohesive, but movement and hover treatments do more work than selection feedback. | Prioritize short transitions for filter changes, modal open/close, and menu state. Keep reduced-motion behavior. Avoid adding playful effects that slow evidence review. |
| P3 | Pleasurable | Curate testimonials by relevance | A 12-item carousel creates volume but weakens focus. | Show 3 testimonials matched to the visible Practice Areas, with an optional full list. Connect each testimonial to a related Case Study or Proof Point. |
| P3 | Meaningful | Turn proof into a reviewer decision | Case Studies responsibly state evidence limits, which is a strong trust signal. They could more directly explain why the work matters to the reviewer's decision. | Add a short "Why this matters" section: decision supported, capability demonstrated, and conditions where the approach fits. |
| P3 | Meaningful | Create a guided portfolio narrative | The site communicates breadth more strongly than a distinctive professional point of view. | Add a concise "How I work" path linking needs analysis, design, delivery, evaluation, and improvement to 3 representative Case Studies. |

## Hierarchy Assessment

### 1. Functional

Health: Needs immediate repair on mobile.

Strengths:

- Main pages, filters, Artifact Previews, and Case Study navigation work.
- Artifact Preview focus moves to the Close button.
- Local validation confirms assets, links, previews, and CSP policies.

Risks:

- The mobile sticky conversion action is not actually sticky.
- The mobile menu behaves like a small scroll container rather than a viewport overlay.
- Portfolio Item context is lost at the contact handoff.

### 2. Reliable

Health: Strong build and content integrity; weak continuity of reviewer state.

Strengths:

- All 88 automated tests pass.
- The build and performance budget pass.
- Artifact Preview paths are constrained to same-origin approved locations.

Risks:

- Current tests do not catch the mobile fixed-position failures.
- Filter state is transient and cannot be shared.
- The contact journey changes from a specific Portfolio Item to a generic channel list.

### 3. Usable

Health: Clear visual system, but high reading and scrolling cost.

Strengths:

- Strong contrast and consistent card styling.
- Clear labels for Portfolio Items, Case Studies, and Proof Points.
- Large touch targets and visible filter selection.

Risks:

- Primary homepage actions are not visible in the first viewport.
- Filter discovery relies on horizontal scrolling.
- The portfolio is too long for practical review, especially on mobile.
- Multiple `h1` elements weaken document structure.

### 4. Convenient

Health: The site provides tools, but reviewers must assemble the path themselves.

Opportunities:

- Route homepage Practice Areas directly to filtered evidence.
- Add search, result counts, and shareable filter state.
- Carry Portfolio Item context into WhatsApp and email.
- Add parent-level actions around Artifact Previews.

### 5. Pleasurable

Health: Visually polished, but delight should come from confidence and momentum.

Opportunities:

- Make filter changes feel immediate and legible.
- Reduce repeated content and long testimonial browsing.
- Use concise, relevant feedback instead of more animation.

### 6. Meaningful

Health: The evidence-limit language already creates unusual credibility.

Opportunities:

- Help reviewers connect each Artifact to a real decision or work situation.
- Present a distinct end-to-end working philosophy, not only a large catalog.
- Let different reviewers see the shortest credible path to fit.

## Captured Flow

| Step | Screen | Health |
| --- | --- | --- |
| 1 | Desktop homepage | Mixed: credible positioning, but primary actions fall below the viewport. |
| 2 | Desktop portfolio | Mixed: strong thumbnails and labels, but filter overflow is unclear. |
| 3 | Filtered portfolio | Good interaction; missing result count and shareable state. |
| 4 | Artifact Preview | Good foundation; nested scrolling and weak next-step context. |
| 5 | Case Study | Strong: clear scope and evidence framing. |
| 6 | Contact handoff | Weak: specific Portfolio Item context is lost. Screenshot capture failed twice; DOM state was inspected instead. |
| 7 | Mobile homepage | Poor: no visible action in the first viewport. |
| 8 | Mobile menu | Broken: only one menu item is visible without internal scrolling. |
| 9 | Mobile portfolio | Poor for long review: large cards and clipped filter strip create heavy scrolling. |

## Checks

- `bun run validate`: passed; 27 HTML files, 10 CSS files, 34 blog posts, and 67 Portfolio Items validated.
- `bun test`: passed; 88 tests, 0 failures.
- `bun run build`: passed.
- `bun run budget`: passed baseline guard; portfolio HTML stretch target was not met.
- Browser console: no warnings or errors observed during the contact handoff.

## Evidence Limits

- This is an expert review, not user research.
- No analytics, conversion data, heatmaps, session recordings, or reviewer interviews were available.
- Accessibility observations are based on DOM, keyboard-relevant states, and screenshots. No screen-reader or real-device audit was performed.
- Contact screenshot capture failed twice, so that step is supported by the live DOM and source inspection rather than a saved image.

## Recommended Sequence

1. Repair mobile fixed-position behavior and add responsive regression checks.
2. Preserve Portfolio Item context through contact.
3. Make the homepage primary action visible immediately.
4. Redesign portfolio discovery around search, fewer filters, result counts, and progressive disclosure.
5. Add reviewer-intent pathways and "Why this matters" framing.

## Source

Stephen Anderson described the model as six stages moving from functionality and reliability through usability and convenience to pleasurable and meaningful experiences:

https://boagworld.com/design/emotional-design/
