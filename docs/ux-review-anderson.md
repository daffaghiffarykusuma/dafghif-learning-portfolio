# Hiring reviewer UX review

Status: review complete. The user confirmed the five-change proposal and its evidence boundary on 2026-10-07. No product changes implemented.

The agreed plan is published as [implementation specification #23](https://github.com/daffaghiffarykusuma/dafghif-learning-portfolio/issues/23), labeled ready-for-agent. The [local specification](specs/hiring-reviewer-ux.md) includes the confirmed test boundaries and acceptance checks.

## Agreed direction

- Prioritize Hiring Reviewers over prospective consulting clients for this review.
- Lead with learning design and instructional design. Present program management as supporting breadth.
- Support the initial shortlist decision first, with deeper evidence available in Case Studies.
- Make selected work the primary homepage action, retain Download CV beside it, and keep the full catalogue accessible through navigation and after selected cases.
- Add factual contribution and use summaries where supported. Agreement with this format does not establish artifact ownership or delivery status.

These choices were agreed during the grill-with-docs discussion. They are reversible content and journey choices; no ADR is needed yet.

## Framework

Use Stephen P. Anderson's six levels: functional, reliable, usable, convenient, pleasurable, and meaningful. His model is a continuum, not a mandatory sequence that postpones meaning until every lower-level issue is solved.

Sources: [original diagram](https://poetpainter.com/thoughts/files/UX-Hierarchy-Model-StephenPAnderson.pdf) and [Seductive Interaction Design, chapter 1, pages 11-13](https://starzer.net/is1/docs/seductive-ixd-chapter-1.pdf).

For this portfolio, the working question is whether a Hiring Reviewer can connect relevant work to a vacancy and find enough credible evidence to consider a conversation. This is our application of the framework, not a measured visitor outcome.

## Current evidence

| Journey step | Observed state | Opportunity or limit |
| --- | --- | --- |
| 1. Home, desktop and phone | The main action is View Portfolio; Download CV is secondary; selected hiring work is a smaller text link. The page rendered at 1280 x 800 and 390 x 844 CSS pixels. | Consider making selected work the primary route for the agreed audience. This is a priority choice, not a broken-link finding. |
| 2. Selected work | Three cases already cover learning design, strategy/evaluation, and program analysis. | Preserve the curated route and make its purpose clearer. Do not add another competing list. The first section screenshot was captured during movement and is not accepted as stable visual evidence. |
| 3. Administrative Communication case | The rendered introduction leads to seven work samples and an optional design explanation. The visible evidence limit correctly avoids claiming learner impact. | Explain what the work demonstrates, the owner's contribution, and which artifact to inspect first. Confirm contribution and delivery status before drafting claims. |
| 4. Catalogue search | Searching for communication assessment returns no matching items, although existing items include Need Assessment: Cross-Department Communication and Need Assessment: Manager Communication to Staff. | Confirmed discoverability problem. Match all query words across the existing searchable text, independent of their order, while preserving filters and the reset action. |
| 5. Artifact preview from catalogue | The Cross-Department Communication PDF opened and rendered. Browser Back removed its hash but left the dialog open. The close button closed it and returned focus to View PDF Artifact. | Confirmed history/state mismatch. Preserve the working close/focus behavior. Case-page previews and close-then-reload behavior remain unverified. |
| 6. Contact | Direct channels are visible, but the introduction asks about a learning engagement and later steps promise a custom proposal. | Working contact options, mismatched hiring context. No message was sent and external channel handoff was not tested. |

The browser initially failed to capture screenshots, then recovered. Home, case introduction, search, loaded PDF preview after Back, and contact screenshots were saved and visually inspected. The initially blank PDF area later rendered successfully; it is not evidence of a failed document. This is a sampled journey review, not a complete accessibility or end-to-end audit. No production build, automated suite, screen-reader assessment, contrast measurement, or external contact delivery test was run.

## Source-supported candidates

- Reliable: catalogue previews add a hash, and Back does not close the dialog. Browser reproduction confirms the source-based finding. Case-study previews use a different option and do not add a hash on opening. Source: `src/site/artifact-preview-experience.ts`.
- Usable and convenient: search matches the whole query as a contiguous substring. The communication assessment example reproduces the discoverability problem. Source: `src/portfolio-discovery.ts`.
- Convenient and meaningful: contact copy asks for a learning engagement and proposal despite the hiring route. Consider hiring-appropriate contact wording. Source: `contact.html`.
- Meaningful: generated case pages omit the source's Use case context. Consider a concise capability summary based only on supported source facts. Sources: `assets/data/portfolio-source.json`, `scripts/portfolio/case-study-publication.ts`.
- Reliable: the Administrative Communication proposal explicitly states a BNSP certification-assessment purpose on page 1. Whether it also represents commissioned or delivered training, and the owner's personal contribution, still need clarification. Source: `assets/pdf/portfolio/bnsp4_program_proposal.pdf`.

## Agreed first pass

| Order | Change | Anderson level | Acceptance evidence |
| --- | --- | --- | --- |
| 1 | Synchronize catalogue preview history and visible state. Back closes an opened preview, Forward restores it, and explicit close leaves a URL that does not reopen it on reload. Preserve direct artifact links and return focus. | Reliable, usable | Browser checks for open, Back, Forward, close, reload, and direct-link arrival, preserving active search and filters. |
| 2 | Make multiword search require all words anywhere in existing searchable text, independent of order. Keep exact-term behavior and existing filters. | Usable, convenient | communication assessment returns the relevant assessment samples; irrelevant items remain excluded; reset and URL state still work. |
| 3 | Promote Explore selected work to the main home action, with Download CV beside it. | Convenient | Desktop and phone visitors reach the selected cases directly and can still reach the full catalogue. |
| 4 | Add a concise What this demonstrates summary and a suggested starting artifact to the lead design cases. | Meaningful, convenient | Every statement is traceable to existing source content; no personal ownership, actual delivery, or measured impact is inferred. |
| 5 | Use a single contact page that explicitly welcomes role conversations and project inquiries. Keep direct channels ahead of optional prompts. | Meaningful, convenient | A hiring reviewer can understand what to send without translating learner/project proposal language. Existing contextual links still work. |

Functional checks remain part of each change. For pleasure, retain the current visual language and aim for a calmer review flow; there is no evidence yet that a visual redesign or extra animation would help. The priority above is our judgment for this agreed audience, not measured conversion uplift.

## Unresolved facts and scope boundary

Personal contribution and actual delivery for Administrative Communication and Learning Organization Strategy have not been supplied. The first pass should use source-supported descriptions of the artifacts and defer any new ownership or delivery claims. The proposal's certification-assessment purpose can be described accurately without assuming it was its only use.

The user confirmed all five changes as the intended first pass, using supported claims and deferring unconfirmed contribution details. No discovery decisions remain open within this scope. Implementation and its acceptance checks remain future work. A broader brand redesign, a new contact backend, fuzzy search, or new outcome claims are outside this proposal.

Preserve the current evidence limits. Do not turn designed assessments into measured results or label team outputs as individual work without support.
