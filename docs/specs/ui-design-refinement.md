# Refine the hiring-first UI with a compact homepage and consistent evidence cards

## Problem Statement

A Hiring Reviewer assessing Daffa for a learning design or instructional design role needs to establish relevance, compare selected work, inspect credible evidence, and decide whether to start a conversation. The Learning Portfolio Site already provides selected Case Studies, a CV, Portfolio Item Discovery, Artifact Previews, and direct contact channels.

The remaining design opportunity is to reduce the reading and interpretation required to use those capabilities. Home repeats capability and outcome messages across About, Core Work, process, skills, credentials, and testimonials. Work cards present descriptions and evidence with uneven emphasis, and their titles, thumbnails, and primary actions do not consistently lead to the same kind of destination. The Case Studies index begins in a different order from Home's selected work. Some meaningful supporting labels are styled at 11-12px, and some public copy uses internal implementation terminology or consulting-oriented invitations.

These observations come from current source inspection, not a newly captured visual or usability audit. The implementation must visually verify the proposed improvements on desktop and mobile.

## Solution

Retain the hiring-first focus and the existing dark editorial identity. Learning design leads, with program management providing supporting breadth.

Shorten Home to the introduction, selected work, a brief About/capability summary, compact credentials with expandable certificate images, two existing attributed testimonials, and contact. Retain Explore selected work and Download CV as the lead actions and preserve access to the full portfolio. Remove repeated capability and outcome sections, retaining supported evidence with the relevant work and placing detailed method explanations alongside relevant Case Studies.

Make work cards easier to compare through a predictable capability label, one supported scope or evidence statement where available, and a clear primary action. Align each card's title, thumbnail, and primary action with the same destination. A Case Study opens its narrative; a standalone PDF or interactive Artifact opens its Artifact Preview. Keep contextual discussion secondary.

Lead the Case Studies index with Administrative Communication, Learning Organization Strategy, and Entrepreneurship, matching Home. Refine typography, spacing, and public language across the affected pages while preserving evidence limits and existing discovery, preview, and inquiry behavior.

## User Stories

1. As a Hiring Reviewer, I want Home to lead with learning design, so that I can quickly assess relevance to the role I am filling.
2. As a Hiring Reviewer, I want program management presented as supporting breadth, so that I understand Daffa's capabilities without losing the learning-design focus.
3. As a Hiring Reviewer, I want a concise introduction, so that I can understand the portfolio's relevance before reading supporting detail.
4. As a Hiring Reviewer, I want Explore selected work to remain the primary homepage action, so that I can begin with a manageable set of evidence.
5. As a Hiring Reviewer, I want Download CV beside the selected-work action, so that I can obtain conventional application information immediately.
6. As a Hiring Reviewer, I want the existing three selected Case Studies retained, so that I can compare instructional design, strategy, and program-analysis evidence.
7. As a Hiring Reviewer, I want a clear route to the full portfolio, so that curation does not hide other relevant Portfolio Items.
8. As a Hiring Reviewer, I want a short About/capability summary, so that I can understand the Portfolio Owner's background without reading repeated claims.
9. As a Hiring Reviewer, I want repeated capability and outcome sections removed, so that the homepage takes less effort to scan.
10. As a Hiring Reviewer, I want supported scope and evidence statements retained with the relevant work, so that a shorter homepage still lets me assess credibility.
11. As a Hiring Reviewer, I want detailed method explanations alongside relevant Case Studies, so that I can inspect the approach in context.
12. As a Hiring Reviewer, I want compact credential names, so that I can identify relevant qualifications without scrolling through large certificate images.
13. As a Hiring Reviewer, I want certificate images available through clearly labeled disclosures, so that I can inspect them when useful.
14. As a keyboard Reviewer, I want certificate disclosures to open and close with standard keyboard controls, so that supporting evidence is accessible without a mouse.
15. As a Hiring Reviewer, I want two relevant existing testimonials with their attributions, so that supporting testimony remains concise and attributable.
16. As a Reviewer, I want testimonial wording preserved accurately, so that editing the layout does not strengthen someone else's statement.
17. As a Hiring Reviewer, I want a clear contact invitation after the supporting content, so that I can act once I have enough information.
18. As a Reviewer, I want each work card to identify the capability it demonstrates, so that I can compare it with the work I need.
19. As a Reviewer, I want one concise supported scope or evidence statement where available, so that I can understand the substance of a Portfolio Item quickly.
20. As a Reviewer, I want cards without supported outcome evidence to describe the work accurately, so that I do not mistake a deliverable's scope for measured impact.
21. As a Reviewer, I want essential evidence limits to remain legible and available, so that shorter copy does not misrepresent delivery, contribution, or results.
22. As a Reviewer, I want card content and actions placed consistently, so that I can scan several Portfolio Items without relearning the layout.
23. As a Reviewer, I want a card's title, thumbnail, and primary action to lead to the same destination, so that choosing a different part of the card does not change the expected task.
24. As a Reviewer, I want a Case Study card to open its narrative, so that I understand the work before selecting an included Artifact.
25. As a Reviewer, I want the Case Study primary action labeled "Read case study", so that its destination is clear.
26. As a Reviewer, I want a standalone PDF card to open its Artifact Preview, so that I can inspect the deliverable directly.
27. As a Reviewer, I want the standalone PDF primary action labeled "Preview PDF", so that I know what will open.
28. As a Reviewer, I want an interactive Artifact card to open its Artifact Preview, so that I can inspect the browser-readable work.
29. As a Reviewer, I want the interactive primary action labeled "Open interactive preview", so that its behavior is clear.
30. As a Reviewer, I want "Discuss this work" to remain secondary and contextual, so that I can inspect evidence first and refer to it in a conversation.
31. As a Hiring Reviewer, I want the Case Studies index to begin with the same three cases as Home, so that the recommended starting path remains consistent.
32. As a Reviewer, I want the remaining Case Studies accessible after the lead cases, so that changing the order does not remove evidence.
33. As a mobile Reviewer, I want meaningful supporting labels and card actions to remain readable, so that I can review the work on a phone.
34. As a Reviewer, I want Product Thumbnails shown completely with readable identifying text, so that cropping does not obscure the work's identity.
35. As a Reviewer, I want authentic Evidence Photographs preserved in context, so that illustrative images are not substituted for evidence of real work.
36. As a returning Reviewer, I want the dark green, editorial serif, and sage visual identity retained, so that the refined site remains recognizable.
37. As a keyboard Reviewer, I want visible focus and correctly operable card controls, so that I can reach the same evidence as a mouse user.
38. As a Reviewer opening an Artifact Preview, I want dismissal and focus return preserved, so that I can continue reviewing from a sensible position.
39. As a Reviewer, I want search, filters, progressive results, and their URL state preserved while inspecting previews, so that the visual refinement does not reset my review.
40. As a Hiring Reviewer, I want contact invitations to welcome role conversations, so that I do not need to reinterpret consulting language.
41. As a potential client, I want the same invitations to welcome project conversations, so that the hiring emphasis preserves my route to contact.
42. As a Reviewer, I want public copy to explain useful capabilities and deliverables, so that internal phrases such as "Source-managed Portfolio Items" do not distract from the work.
43. As a Reviewer arriving at Contact from a Portfolio Item or Artifact Preview, I want its public title preserved, so that I do not need to reconstruct what I was reviewing.
44. As a mobile or motion-sensitive Reviewer, I want existing usable control sizes and reduced-motion behavior preserved, so that presentation changes do not make navigation harder.
45. As the Portfolio Owner, I want card actions, evidence copy, and Case Study order to survive portfolio generation, so that routine content updates do not undo the refinement.
46. As the Portfolio Owner, I want the existing publication, validation, and performance guards preserved, so that a more readable site still ships valid and appropriately scoped artifacts.

## Implementation Decisions

- Refine the existing Home presentation, shared theme, Portfolio Item listings, Case Studies index, and contact invitations. Use the existing modules and public page structure rather than introducing a new application architecture.
- Retain the current dark editorial design system: dark green surfaces, editorial serif headings, sage accents, existing portrait, complete Product Thumbnails, and authentic Evidence Photographs.
- Keep the homepage sequence focused on introduction, selected work, short About/capability summary, compact credentials, two attributed testimonials, and contact. Retain the lead CV and selected-work routes and access to the full catalogue and relevant Practice Areas.
- Present existing credential names compactly with expandable certificate images using native, keyboard-operable disclosures. Select two existing attributed testimonials for relevance to hiring-first learning-design review, preserving their meaning and wording.
- Remove duplicated capability and outcome sections. Retain supported evidence in its relevant work context. Place detailed method explanations alongside relevant Case Studies without inventing new claims.
- Keep the agreed lead Case Study order consistent across Home and the index: Administrative Communication, Learning Organization Strategy, Entrepreneurship. Preserve the remaining cases.
- Give cards a predictable hierarchy for capability, title, concise supported scope/evidence, and primary action. Retain useful supported format or audience metadata without adding unsupported labels. Final typography and spacing must be checked in rendered desktop and mobile layouts.
- Treat card consistency as destination and task consistency, not a requirement to use an identical element type for all formats. Narrative destinations retain native links. Preview activators use semantic keyboard-operable controls connected to the existing Artifact Preview Experience.
- Use the labels "Read case study", "Preview PDF", and "Open interactive preview" according to destination. The title, thumbnail, and primary action on each card lead to that same destination.
- Keep "Discuss this work" secondary on applicable cards and preserve its public Portfolio Item context through the existing Engagement Inquiry Journey. Use consistent, plain contact invitations welcoming both roles and projects.
- Use Portfolio Item Source and directly supported Proof Points for public evidence copy. Do not promote inferred drafting hints into visible factual claims. Preserve distinctions between designed materials, confirmed delivery, work quality, and measured impact.
- Make generated card and index changes through the existing Portfolio Evidence Workflow and Case Study Publication owners. Generation must retain intended order, labels, destinations, Artifact identities, and evidence constraints.
- Preserve Portfolio Item Discovery, Artifact Preview Experience, and Engagement Inquiry Journey ownership. No new routing framework, modal implementation, schema expansion, backend, or API is planned.
- Update the existing style guide to capture the final presentation rules. The existing glossary already distinguishes the relevant concepts, and these reversible presentation decisions do not require a new ADR.

## Testing Decisions

The user confirmed the following existing boundaries for this specification. Prefer the highest existing behavior boundary and avoid adding a production testing interface.

- Use the site browser-behavior integration boundary for homepage reading paths, certificate disclosures, card activation, native Case Study navigation, Artifact Preview interaction, and contextual contact handoff. Existing prior art covers selected work and CV routes, native Case Study links, preview Back/Forward behavior, focus recovery, and public-title propagation into contact channels.
- Use the Portfolio Evidence Workflow boundary for generated Case Study ordering and consistent card output. Existing prior art publishes a complete featured-order output set, verifies lead-case guidance, and keeps Case Study pages and nested Artifact metadata together. Check the published behavior and source-supported facts rather than internal helper calls.
- Good tests exercise Reviewer-observable destinations, interaction results, essential evidence limits, and generated output contracts. Do not test private methods, arbitrary CSS selectors, exact paragraph wording, or a snapshot of the entire layout merely to mirror the implementation. Exact agreed action labels are user-facing contracts.
- Verify title, thumbnail, and primary action for each destination type. Case Study activation must remain narrative navigation; standalone PDF and interactive activators must open the intended preview. Include keyboard activation and secondary discussion context.
- Verify that certificate disclosures expose the correct existing images when opened and leave credential names available while collapsed. Do not add tests solely to prove trivial styling changes.
- Reuse existing preview and discovery regression coverage for close, Escape, focus return, browser history, URL state, filters, and progressive results. Extend coverage only where changed activation behavior creates a meaningful gap.
- Run portfolio generation and check that the new order, card destinations, supported copy, and relevant evidence limits survive. Preserve all existing Artifact identities and reachable destinations.
- Inspect Home, Portfolio, the Case Studies index, representative narrative and standalone cards, affected Case Studies, and Contact in a real browser at desktop and phone widths. Use the existing 1280 by 800 and 390 by 844 CSS-pixel review sizes as starting checks, with additional widths where a layout issue needs investigation.
- Visually inspect supporting-text readability, complete thumbnail titles, card hierarchy, wrapping, certificate disclosures, contact invitations, keyboard focus, preview readability, and motion preferences. DOM simulation and source inspection do not establish visual quality.
- Reuse existing production-site checks for bundled presentation, routed page and preview reachability, and click-triggered Artifact loading. These checks complement browser inspection and do not replace it.
- During implementation, run the Bun test suite with sufficient time for production-build setup, site validation, a production build including type checks, performance budgets, and diff whitespace checks. Do not weaken guards to accommodate the refinement.
- Separate automated results, source review, browser observations, and blocked verification in the implementation report. No tests or fresh browser checks were run as part of writing this specification.

## Out of Scope

- A visual rebrand, new color or typography family, replacement portrait, generated evidence imagery, or decorative animation project.
- Changing the agreed primary audience or learning-design positioning, creating separate hiring and client sites, or requiring persona selection.
- New claims about authorship, client commissioning, delivery, adoption, learner impact, commercial outcomes, testimonials, or credentials without supporting evidence.
- A catalogue-wide rewrite, changes to source Artifact contents, or hiding material evidence limits through clipping or truncation.
- A new About page solely to hold displaced homepage content.
- Replacing the discovery, preview, routing, or contact architecture; adding personalization, fuzzy search, authentication, a CRM, or a backend contact form.
- Publishing editable Office sources or weakening Artifact Preview policy, Shipped Artifact Policy, security constraints, or performance guards.
- Sending inquiries or changing contact addresses, response commitments, availability, or other business facts.
- Analytics instrumentation, conversion-uplift claims, formal user research, or accessibility certification.
- Implementing unrelated tracker work, closing existing issues as part of spec publication, committing or pushing code, deployment, or treating this specification as completed UI implementation.

## Further Notes

- The user accepted both rounds of design recommendations and then requested synthesis and issue-tracker publication through the to-spec skill. The testing boundaries were explicitly confirmed during specification preparation.
- Existing hiring-reviewer UX decisions and the portfolio style guide provide continuity. The agreed refinements extend those decisions rather than proposing already-present selected-work, CV, preview, or direct-contact capabilities as missing.
- Current source inspection informed the opportunities. Exact perceived density, readable font sizes, and responsive spacing require fresh rendering during implementation; no measured usability or conversion benefit is claimed.
- No new domain term or hard-to-reverse architectural decision was resolved, so no glossary change or ADR is needed.
- Publish this implementation specification to the configured GitHub Issues tracker with the existing ready-for-agent label. Follow the tracker policy for an integration branch, linked implementation tickets, and a pull request when implementation is requested. Spec publication alone does not authorize deployment.
