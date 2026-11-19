# dafghif-learning-portfolio

Static portfolio site for Daffa Ghiffary Kusuma.

## Development

Browser TypeScript and styles live in `src/`. Repository automation lives in `scripts/`. Bun runs repository commands and Vite serves and builds the browser code. Tests under `test/**/*.mjs` and `vite.config.mjs` intentionally remain JavaScript.

## Folder map

| Location | What belongs here |
| --- | --- |
| `src/` | Browser entry points and portfolio discovery |
| `src/site/` | Browser behavior and shared publication/preview rules |
| `src/styles/` | Shared stylesheets, loaded by authored and generated pages |
| `scripts/` | Command entry points for generation, validation, and budgets |
| `scripts/portfolio/` | Portfolio source validation, catalog, context, and page generation |
| `scripts/validation/` | Site and generated evidence checks |
| `scripts/site/` | Source/build inventory and shipped artifact policy |
| `assets/` | Public data, images, PDFs, and artifact previews |
| `page-sources/` | Authored page content (Site Page Sources) that generation wraps in the shared page shell |
| `test/` | Unit, integration, and production system checks |
| `docs/` | [Portfolio style guide](docs/portfolio-style-guide.md) |
| `output/`, `tmp/`, `.scratch/`, `.playwright-cli/` | Local review artifacts and working files, ignored by Git |
| `dist/` | Generated production build, ignored by Git |

HTML entry pages stay at the repository root so their public URLs remain stable, but every root page is generated: do not edit them directly. Each page shares one shell (head links, navigation, footer, Artifact Preview modal) from `scripts/site/site-page-shell.ts`. Authored copy for Home, Contact, Blog, the hand-written Entrepreneurship Case Study, and the portfolio listing template lives in `page-sources/`, each file starting with a `<!--site-page {…} -->` JSON front matter comment (kind, title, description, closing invitation, and so on). Portfolio listings and generated Case Study pages come from `assets/data/portfolio-source.json` and `assets/data/portfolio-proof-points.json`. Blog cards are rendered into `blog.html` from `assets/blog.json`. Run `bun run generate:portfolio` after changing any of these; validation and `bun test` fail while a committed page is stale. `cv/Profile.pdf` is the published CV, while editable documents and `unpublished portfolio/` are working material. Root-level images are limited to favicons and touch icons; other images go under `assets/images/`.

For site terminology, see [GLOSSARY.md](GLOSSARY.md). Run the commands below from the repository root.

## Commands

Install dependencies and start the Vite development server:

```bash
bun install
bun run dev
```

The default local URL is `http://127.0.0.1:5173/`. Directly opening source HTML files is unsupported. Use Bun `1.4.4` (pinned in `package.json` `packageManager`). The `engines.node` field pins Node.js 24 for the Vercel build runtime; local development only needs Bun.

Type-check both TypeScript programs without emitting files:

```bash
bun run typecheck
```

Run the Bun test suite:

```bash
bun test
```

Build the production site with Vite:

```bash
bun run build
```

Preview the production build:

```bash
bun run preview
```

Run validation before publishing:

```bash
bun run validate
```

The validator checks deployed HTML pages, generated portfolio viewers, CSS asset URLs, missing local assets, broken fragments, unreviewed external hosts, unsafe inline scripts, `target="_blank"` rel attributes, CSP hardening, blog metadata URL allowlists, and structured portfolio item data.

Generate the complete portfolio output set from `assets/data/portfolio-source.json` and curated Proof Points:

```bash
bun run generate:portfolio
```

This command validates the source first, then rewrites every root HTML page, `assets/data/portfolio-items.json`, and `assets/data/portfolio-ai-context.json` together. Regenerating is idempotent: `page-sources/portfolio.html` is a template with an empty card grid, and output is never read back. Discussion links (`discussUrl`) and Case Study page paths are derived, so the source must not declare `discussUrl` or `outputPath`. `featuredCaseStudyIds` sets the Case Study lead order, which Home's selected work must follow; `authoredCaseStudies` lists hand-written Case Study pages.

Portfolio source records may include an optional `audience` label when supported by the artifact. Artifact format is derived from `sourceType`; both appear in generated cards. Portfolio discovery combines search, practice area, and format filters. Validation rejects unfinished publication placeholders and excludes local review files in `output/` and `tmp/`.

Check production performance budgets after a build:

```bash
bun run budget
```

Run every check in one go (validation, all tests, and budgets). `test:system` builds `dist/`, so `budget` measures a fresh build. CI runs this same command on pushes and pull requests to `main`:

```bash
bun run check
```

## Security Notes

Deployment headers live in `_headers` and `vercel.json`. `bun run validate` checks every CSP against the top-level, HTML-preview, and PDF publication contracts in both files, including missing or duplicate policies and unreviewed overrides. Top-level pages use external JavaScript so the site can run with `script-src 'self'`. Generated portfolio viewers have a narrower no-script CSP because they are generated static previews from document/spreadsheet content. Configuration validation does not verify the live host's response headers.

When adding public assets, prefer lowercase kebab-case filenames without spaces or brackets. Keep portfolio preview paths under `assets/pdf/portfolio/` or `assets/portfolio-viewers/` so the preview modal allowlist continues to block unexpected sources. The build copy rejects editable Office files even when placed inside a public asset tree.
