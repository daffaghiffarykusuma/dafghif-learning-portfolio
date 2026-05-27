# Portfolio Item Loading Performance Outcome

Date: 2026-05-27

Parent issue: #8

## Decision

Keep all Portfolio Items and Case Study Artifacts as real initial HTML. Do not use skeletons, preview replacement, client-side grid replacement, virtual scrolling, first-pass pagination, or load-more hiding.

## Baseline And Targets

- Earlier measured portfolio page gzip baseline: 15.74 KB.
- Portfolio page baseline guard: 15.80 KB.
- Portfolio page 10% stretch target: 14.22 KB or lower.
- Generated standalone Case Study page target: 5.00 KB gzip or lower per page.
- Shared JavaScript target: 24.00 KB gzip or lower.
- Lighthouse: optional diagnostic only, not the pass/fail gate.

## Final Budget Results

Measured with `bun run build` followed by `bun run budget`.

- Portfolio page gzip: 14.19 KB.
- Portfolio page stretch target: met.
- Case Study page gzip:
  - `case-administrative-communication.html`: 3.15 KB.
  - `case-entrepreneurship.html`: 3.28 KB.
  - `case-learning-organization-strategy.html`: 3.35 KB.
  - `case-ybb-mentoring-workbook.html`: 2.83 KB.
- Shared JavaScript gzip: 11.41 KB.
- Shared CSS gzip: 20.33 KB.
- Initial Artifact Preview iframe sources: empty on portfolio and generated Case Study pages.

## What Changed

- Removed redundant generated Portfolio Item attributes that duplicated `id` and link state already present in native HTML.
- Removed redundant thumbnail link labels where image alt text already provides the accessible link name.
- Removed the duplicate standalone filter module script from the portfolio page.
- Stopped the filter module from registering its own `DOMContentLoaded` listener; page lifecycle now owns initialization.
- Replaced per-card preview click listeners with delegated listeners while preserving hash preview and click-triggered iframe/PDF loading.
- Added first-visible Case Study Artifact image priority and stable dimensions.
- Added page-specific budget output and production checks for real Portfolio Item and Case Study loading contracts.

## Verification

- `bun run validate`: passed.
- `bun run build`: passed.
- `bun run budget`: passed.
- `bun run test:unit`: passed.
- `bun run test:integration`: passed.
- `bun run test`: passed, including production system tests.

## Limits

- The portfolio page still intentionally ships all 62 Portfolio Items as real HTML.
- Further reductions would likely require a separate information-architecture decision or more aggressive content shortening, which is outside this scope.
