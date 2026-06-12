# dafghif-learning-portfolio

Static portfolio site for Daffa Ghiffary Kusuma.

## Development

Open the HTML files directly for quick content checks, or serve the folder locally:

```bash
bun install
bun run dev
```

The default local URL is `http://127.0.0.1:5173/`. Use Bun `1.3.13` or newer.

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

`bun run test` and `bun run lint` currently run the same static validation suite so CI and contributors have conventional commands.

## Security Notes

Deployment headers live in `_headers`. Top-level pages use external JavaScript so the site can run with `script-src 'self'`. Generated portfolio viewers have a narrower no-script CSP in `_headers` because they are generated static previews from document/spreadsheet content.

When adding public assets, prefer lowercase kebab-case filenames without spaces or brackets. Keep portfolio preview paths under `assets/pdf/portfolio/` or `assets/portfolio-viewers/` so the preview modal allowlist continues to block unexpected sources.
