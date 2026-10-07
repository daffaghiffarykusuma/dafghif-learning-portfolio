# Welcome hiring conversations in the existing contact journey

## Parent

[Specification #23: Hiring-first evidence review and reliable portfolio browsing](https://github.com/daffaghiffarykusuma/dafghif-learning-portfolio/issues/23)

## What to build

A Hiring Reviewer can contact the Portfolio Owner about a role without translating a consulting engagement or proposal flow into hiring language. Potential clients can still inquire about projects on the same page. Direct contact methods remain the first actionable options, and contextual Artifact inquiries retain their public evidence context.

Complete the visible invitation, optional message guidance, next-step expectations, and prepared-channel handoff through the existing contact page and Engagement Inquiry Journey. Preserve generic visits and use only public, explicit context.

## Acceptance criteria

- [ ] The contact introduction explicitly welcomes role conversations and project inquiries on a single page, without requiring a persona selection or a new route.
- [ ] Next-step copy fits hiring conversations and does not promise every visitor a scoped consulting engagement or custom proposal.
- [ ] Existing direct email, WhatsApp, and LinkedIn methods remain available before optional guidance. Optional prompts are useful for role conversations as well as project inquiries and do not gate contact.
- [ ] Existing Portfolio Item or Artifact context remains visible and accurately represented in prepared email and WhatsApp destinations, with safe encoding and no invented context.
- [ ] A direct generic visit remains neutral, without an assumed role, employer, Artifact, budget, availability, or unsupported claim.
- [ ] Existing contact addresses, response commitments, and LinkedIn destination are retained. No real message is sent while validating this ticket.
- [ ] Preserve the Engagement Inquiry Journey interface and its interpretation of public context. No CRM, backend form, new personal-data collection, or separate hiring/client experience is introduced.
- [ ] Extend relevant initialized-page and Engagement Context coverage only where behavior changes; verify generic visits and public Portfolio Item handoff through rendered context and destination URLs. Avoid testing incidental prose verbatim.
- [ ] Inspect generic contact and a contextual handoff against the production preview at desktop and phone sizes, checking action order, keyboard reachability, visible focus, and the prepared destination without sending it.
- [ ] Existing type checks, automated tests, site validation, production build, and performance guards pass. Report browser and automated verification separately.

## Blocked by

None (can start immediately). The existing contextual contact interface already works independently of the homepage, discovery, and preview-history changes.
