# UI verification

- All 82 repository tests passed with `bun test --timeout 30000`.
- `bun run validate` passed for 30 HTML files, 3 CSS files, 34 publications, 75 Portfolio Items, and 14 shipped Artifact probes.
- `bun run build` passed, including both TypeScript checks.
- Required performance budgets passed: 114.67 MB shipped, 11.14 KB gzipped JavaScript, 15.72 KB gzipped CSS.
- Portfolio HTML remains 16.06 KB gzipped, below its 16.2 KB guard. Its optional 14.22 KB stretch target remains unmet.
- `git diff --check` passed.
- Browser checks at 1440px and 390px found no horizontal overflow on home, portfolio, case-study index, a generated case-study detail, blog, and contact pages.
- Live search for training returned 19 results. Filtering updated the URL. Show more expanded the visible list from 9 to 18. A nonexistent search showed the empty state.
- Mobile navigation opened and closed with Escape. Artifact Preview opened and closed with Escape.
- Direct contact visits no longer show or transmit a literal null inquiry context.
- Reviewed desktop and mobile screenshots, including the preview modal and lower home sections.

Screenshots are in `output/playwright/`. The local development server is available at http://127.0.0.1:5173/.

## Dark theme revision

Switched shared pages and preview controls to dark green surfaces with off-white text and sage actions. Browser checks at 1440px and 390px verified no horizontal overflow across five page types. The full-screen preview link previously had zero padding; it now measures 50px tall with 12px vertical and 24px horizontal padding, with centered text. Preview open and Escape close behavior passed at both widths. The 14 integration tests and site validation passed. Current screenshots use the `dark-` prefix.

## Testimonial and footer correction

Removed fixed pale testimonial and service-impact backgrounds in favor of the shared surface token. Removed forced turquoise/coral footer button colors in favor of the shared primary-action tokens. At 1440px and 390px, browser checks confirmed dark testimonial backgrounds, off-white headings, sage footer buttons, and lighter sage hover states. All eight home sections resolve to dark backgrounds. Site validation, production build, and whitespace checks passed.
