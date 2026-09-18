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
| `test/` | Unit, integration, and production system checks |
| `docs/` | [Portfolio style guide](docs/portfolio-style-guide.md) |
| `output/`, `tmp/` | Review artifacts and local working files |
| `dist/` | Generated production build, ignored by Git |

HTML entry pages stay at the repository root so their public URLs remain stable. Edit `index.html`, `blog.html`, and `contact.html` directly. Portfolio listings and Case Study pages come from `assets/data/portfolio-source.json` and `assets/data/portfolio-proof-points.json`; use `bun run generate:portfolio` after changing them. `cv/Profile.pdf` is the published CV, while editable documents and `unpublished portfolio/` are working material.

For site terminology, see [CONTEXT.md](CONTEXT.md). Run the commands below from the repository root.

## Commands

Install dependencies and start the Vite development server:

```bash
bun install
bun run dev
```

The default local URL is `http://127.0.0.1:5173/`. Directly opening source HTML files is unsupported. Use Bun `1.3.14` or newer.

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

This command validates the source first, then updates `portfolio.html`, generated Case Study pages, `assets/data/portfolio-items.json`, and `assets/data/portfolio-ai-context.json` together.

Check production performance budgets after a build:

```bash
bun run budget
```

## Security Notes

Deployment headers live in `_headers`. Top-level pages use external JavaScript so the site can run with `script-src 'self'`. Generated portfolio viewers have a narrower no-script CSP in `_headers` because they are generated static previews from document/spreadsheet content.

When adding public assets, prefer lowercase kebab-case filenames without spaces or brackets. Keep portfolio preview paths under `assets/pdf/portfolio/` or `assets/portfolio-viewers/` so the preview modal allowlist continues to block unexpected sources.
