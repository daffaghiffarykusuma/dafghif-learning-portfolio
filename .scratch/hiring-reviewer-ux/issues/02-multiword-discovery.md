# Find Portfolio Items using all search words in any order

## Parent

[Specification #23: Hiring-first evidence review and reliable portfolio browsing](https://github.com/daffaghiffarykusuma/dafghif-learning-portfolio/issues/23)

## What to build

A Hiring Reviewer searching for a capability and context can find Portfolio Items containing every entered word, even when those words occur in a different order or across different searchable fields of the same item. Existing filters, result counts, progressive results, and shareable discovery URLs continue working.

Complete the change through Portfolio Item Discovery and the existing generated-page integration boundary. Reuse existing searchable content rather than introducing a new index or service.

## Acceptance criteria

- [ ] The queries communication assessment and assessment communication include the Cross-Department Communication and Manager Communication to Staff assessment items.
- [ ] Matching ignores case and surrounding or repeated whitespace, and requires every nonempty whitespace-separated token to occur in the same item's existing searchable text.
- [ ] A token in the title and another in a different existing searchable field can match the same Portfolio Item. Items missing any requested token are excluded.
- [ ] Existing single-token substring behavior, empty-query browsing, and default ordering remain intact. No fuzzy matching, synonyms, ranking, remote search, or second content source is introduced.
- [ ] Search combines correctly with Practice Area, topic, and Artifact format filters. Counts and progressive results describe the actual matches.
- [ ] Current and restored URL state reproduce the same query and results; reset clears active discovery choices and recovers from zero results.
- [ ] Existing Artifact identity hashes are preserved when discovery query state changes, without changing preview lifecycle behavior in this ticket.
- [ ] Extend the generated Portfolio Item Discovery integration tests through visible controls and result state. Cover the reproduced query, reversed order, case and whitespace, split-field matching, missing tokens, empty queries, combined filters, progressive results, URL restoration, and reset without duplicating lower-level implementation tests.
- [ ] Verify the query and reset behavior in the production preview on desktop and phone, preserving existing labels, result feedback, keyboard access, and focus styling.
- [ ] Existing type checks, automated tests, site validation, production build, and performance guards pass. Distinguish automated results from browser observations.

## Blocked by

None (can start immediately). Artifact Preview history changes are not a prerequisite for correcting search matching.
