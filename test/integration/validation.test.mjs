import { describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { projectRoot } from '../helpers/dom.mjs';
import {
  formatLearningPortfolioSiteValidationSummary,
  validateLearningPortfolioSite
} from '../../scripts/learning-portfolio-site-validation.ts';

const run = async (command, args) => {
  const child = Bun.spawn([command, ...args], {
    cwd: projectRoot,
    stdout: 'pipe',
    stderr: 'pipe'
  });
  const [code, stdout, stderr] = await Promise.all([
    child.exited,
    new Response(child.stdout).text(),
    new Response(child.stderr).text()
  ]);
  return { code, stdout, stderr };
};

describe('Learning Portfolio Site Validation', () => {
  test('returns structured validation facts for the repository', async () => {
    const result = await validateLearningPortfolioSite({
      rootDir: projectRoot
    });

    expect(result.failures).toEqual([]);
    expect(result.counts).toEqual({
      htmlFiles: 28,
      cssFiles: 3,
      blogPosts: 34,
      portfolioItems: 72,
      shippedArtifactProbes: 13
    });
    expect(formatLearningPortfolioSiteValidationSummary(result))
      .toContain('Validated 28 HTML files');
  });

  test('validates a temporary Learning Portfolio Site through the public interface', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'learning-portfolio-validation-'));
    try {
      await Promise.all([
        mkdir(path.join(rootDir, 'assets/data'), { recursive: true }),
        mkdir(path.join(rootDir, 'css'), { recursive: true })
      ]);
      await Promise.all([
        writeFile(path.join(rootDir, 'index.html'), `
          <main id="main" onclick="return false">
            <a href="missing.html">Missing</a>
            <a href="https://unreviewed.example/work">External</a>
            <a href="#missing-fragment">Fragment</a>
            <a href="https://medium.com" target="_blank">Read</a>
          </main>
          <script>window.inline = true;</script>
        `),
        writeFile(path.join(rootDir, 'css/style.css'), 'body { background: url(../assets/missing.webp); }'),
        writeFile(path.join(rootDir, '_headers'), "Content-Security-Policy: script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"),
        writeFile(path.join(rootDir, 'assets/blog.json'), JSON.stringify([{
          url: 'http://example.com/post',
          image: 'https://example.com/image.webp'
        }])),
        writeFile(path.join(rootDir, 'assets/data/portfolio-source.json'), JSON.stringify({
          schemaVersion: 1,
          portfolioItemCount: 0,
          featuredPortfolioItemIds: [],
          portfolioItems: [],
          caseStudies: []
        })),
        writeFile(path.join(rootDir, 'assets/data/portfolio-proof-points.json'), JSON.stringify({
          practiceAreaDefaults: {},
          itemOverrides: {}
        })),
        writeFile(path.join(rootDir, 'assets/data/portfolio-items.json'), JSON.stringify({ portfolioItems: [] })),
        writeFile(path.join(rootDir, 'assets/data/portfolio-ai-context.json'), JSON.stringify({ portfolioItems: [] }))
      ]);

      const result = await validateLearningPortfolioSite({ rootDir });

      expect(result.counts).toEqual({
        htmlFiles: 1,
        cssFiles: 1,
        blogPosts: 1,
        portfolioItems: 0,
        shippedArtifactProbes: 8
      });
      expect(result.failures).toEqual(expect.arrayContaining([
        'index.html: contains inline script; use an external JS file so CSP can block inline execution',
        'index.html: contains inline event handler; use external JavaScript instead',
        'index.html: missing local href target: missing.html',
        'index.html: href uses unreviewed external host: unreviewed.example',
        'index.html: broken fragment in href: #missing-fragment',
        'css/style.css: missing CSS asset target: ../assets/missing.webp',
        '_headers: script-src still allows unsafe-inline',
        '_headers: top-level style-src still allows unsafe-inline',
        '_headers: CSP should declare connect-src for fetch destinations',
        'assets/blog.json: post 1 url is not HTTPS',
        'assets/blog.json: post 1 URL is not a Medium host',
        'assets/blog.json: post 1 image host is not allowlisted',
        'assets/data/portfolio-source.json: expected at least one Portfolio Item source record',
        'assets/data/portfolio-items.json: expected at least one portfolio item',
        'Shipped Artifact Policy production probe missing from source: cv/Profile.pdf'
      ]));
    } finally {
      await rm(rootDir, { recursive: true, force: true });
    }
  });

  test('keeps the Bun command as a thin passing adapter', async () => {
    const result = await run('bun', ['scripts/validate-site.ts']);

    expect(result.code).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('Validated');
  });
});
