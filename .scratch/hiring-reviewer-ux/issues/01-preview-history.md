# Keep Artifact Preview state consistent with browser history

## Parent

[Specification #23: Hiring-first evidence review and reliable portfolio browsing](https://github.com/daffaghiffarykusuma/dafghif-learning-portfolio/issues/23)

## What to build

A Hiring Reviewer can open a catalogue Artifact Preview, use browser Back and Forward, close it, or reload without the dialog disagreeing with the URL or losing the current discovery context. Valid direct Artifact links keep working, including safe local dismissal when the Reviewer arrived from another site.

Complete this behavior through the existing Artifact Preview Experience and its page adapters. Keep the existing initialized-page test boundary and verify native browser behavior against the production preview. No preparatory refactor or second modal controller is required.

## Acceptance criteria

- [ ] Opening a catalogue preview preserves discovery query parameters and exposes the existing Artifact identity in the URL.
- [ ] Back closes an opened catalogue preview; Forward restores it. Reconciling history does not push new history entries.
- [ ] Close-button, Escape, and backdrop dismissal leave a closed dialog and a URL that does not reopen it on reload. Search, filters, and the revealed result batch remain intact.
- [ ] Direct Artifact links open the correct preview. Closing a directly linked preview is a local action and does not send the Reviewer to an unrelated previous site.
- [ ] Unknown or malformed Artifact identities do not break initialization or prevent subsequent browsing.
- [ ] Focus enters the preview and returns to a valid visible initiating control on dismissal, with an appropriate visible fallback when the initiator is unavailable.
- [ ] Existing Case Study preview behavior, including no added hash on ordinary opening, valid direct links, and native Case Study navigation, remains intact.
- [ ] PDF and HTML Artifact Previews retain their existing safety policy, accessible titles, full-screen links, and contextual discussion actions.
- [ ] Extend the existing initialized-page behavior tests with observable dialog, URL, focus, and discovery-state assertions. Preserve relevant adapter regression coverage without mirroring private implementation.
- [ ] Demonstrate open, Back, Forward, each dismissal path, reload after close, and direct-link arrival in a real browser against the production preview. Check affected behavior at desktop 1280 by 800 and phone 390 by 844 CSS pixels. DOM tests alone do not establish native history or focus correctness.
- [ ] Existing type checks, automated tests, site validation, production build, and performance guards pass without weakening policy. Report browser checks separately from automated results and identify anything unverified.

## Blocked by

None (can start immediately). Multiword search improvements are not a prerequisite; preserve the existing discovery contract.
