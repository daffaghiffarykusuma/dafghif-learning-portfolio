# Performance audit, 18 September 2026

Audited the 12 site pages at desktop and mobile widths, all 18 HTML Artifact Previews, the 82 shipped preview PDFs, image delivery, scripts/styles, and portfolio interactions. Implemented the confirmed improvements locally. Nothing was deployed.

## Changes and measured results

| Finding | Before | After |
| --- | --- | --- |
| Homepage portrait | 253,795 bytes, PNG | 144,478 bytes, lossless WebP, 43% smaller |
| Faxtor SVG embedded image | 436,561 bytes | 122,503 bytes, lossless embedded WebP, 72% smaller |
| Large preview PDFs | 36 documents lacked fast-web-view structure | All 36 linearized; largest first-page section 198.59 KiB |
| Largest PDF, 131 pages | 15.91 MB, not linearized | 15.93 MB, first-page section ends at byte 76,524 |
| Blog shift with its script delayed one second | CLS 0.508 | CLS 0 |
| Mobile contact layout shift | CLS 0.032 | CLS 0 |
| Portfolio image priority | Stale preload prioritized the previous featured image | Removed; current first thumbnail retains eager/high priority |

The portrait and embedded logo retain identical decoded RGBA pixels. The original portrait PNG remains available. Blog cards now reserve one viewport of space, preventing the footer from jumping when articles load. Contact and the entrepreneurship case study use the same system-font fallback as the other pages instead of fetching two legacy Google font families.

PDF changes preserve page counts and extracted text across all 3,876 affected pages. First, middle, and last pages in every changed PDF produced identical rendered pixels, 108 page comparisons. Linearization checks passed for all 36 files. The first page of the largest file was also visually inspected. No image downsampling or lossy PDF recompression was applied.

Linearization orders PDF content so compatible readers can display it progressively. First-page-section bytes are a structural measurement, not a guarantee of total network bytes or time to first visible page. Readers may also fetch cross-reference and other ranges. See [QPDF's explanation](https://qpdf.readthedocs.io/en/11.5/cli.html#option-linearize).

## Browser measurements

Production Vite preview, Chromium, 1440 x 900 and 390 x 844, cache disabled, 150 ms latency, 200,000 bytes/second download, and 4x CPU slowdown. Three final runs per main page yielded these median largest-contentful-paint times:

| Page | Desktop | Mobile |
| --- | ---: | ---: |
| Home | 1.37 s | 0.78 s |
| Portfolio | 1.50 s | 1.57 s |

These are local lab observations, not field Core Web Vitals or a Lighthouse score. Earlier single-run timings varied with machine/browser activity, so they are retained as diagnostics rather than used to claim a percentage speed improvement. The first full after-run had zero measured layout shift on 11 of 12 pages; portfolio mobile measured 0.003.

All 18 HTML previews returned HTTP 200, contained no scripts, and had no page-width overflow at 390 px. Local unthrottled navigation took 43-79 ms. The largest preview has 2,199 DOM elements and about 74 KB of HTML. Horizontal scrolling inside workbook tables remains intentional.

Search returned the expected single result; show-more revealed 18 of 76 items; the analytics filter returned six items. Mobile navigation, preview loading, closing, and image decoding passed with no page JavaScript errors. Preview iframes remain unloaded on initial page load. Closing an HTML preview generated no additional network requests.

## Remaining limits

- Complete PDFs still total substantial download weight. The production directory is 114.70 MiB, largely on-demand documents. Linearization improves access order, not full-download cost. More size reduction would require separately approved content or image-quality tradeoffs.
- Portfolio startup still showed roughly 0.27-0.31 seconds median of accumulated long-task time beyond the 50 ms threshold under 4x CPU slowdown. This is not an INP measurement. Filtering did not fail or visibly stall in the functional checks; deeper tracing is the next step if users report interaction lag.
- Blog cover images remain on Medium's servers. Cross-origin Resource Timing reports zero transfer sizes without timing permission, so the captured byte totals undercount those images.
- Production CDN caching, compression, HTTP range support, and real-device PDF rendering were not measured. The local production server supports byte ranges; the deployment must preserve them to benefit from progressive PDF access.
- Portfolio HTML is 16.38 KiB gzip, within the 16.5 KiB guard but above the 14.22 KiB stretch target. JavaScript is 11.14 KiB gzip and CSS 17.81 KiB by the existing aggregate budget calculation.

## Verification and reproduction

83 tests pass with 678 assertions. The suite builds and type-checks the production site. `bun run validate`, `bun run budget`, and `git diff --check` pass. The budget now rejects preview PDFs at or above 1 MB without a linearized first-page section under 256 KiB. A production test verifies HTTP 206 range delivery and the largest PDF's first-page section.

Run `bun run build`, then `bun run preview -- --port 4173`. With a Playwright CLI session open, run `npx.cmd --yes --package @playwright/cli playwright-cli -s=perf-audit run-code --filename output/playwright/performance-audit.js` for the full page sweep. Run timing checks without other active browser/CPU work.

[Raw measurements](../output/playwright/performance-audit-data.json), [desktop homepage](../output/playwright/performance-home-desktop.png), and [mobile preview](../output/playwright/performance-preview-mobile.png) are saved alongside the reusable browser measurement script.

Concurrent workspace reorganization moved styles to `src/styles` and inventory code to `scripts/site`. Those changes and unrelated entrepreneurship-preview edits were preserved; the final test run checks the combined workspace.
