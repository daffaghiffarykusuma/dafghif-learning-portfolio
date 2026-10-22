import { describe, expect, test } from 'bun:test';
import { copyFile, cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { projectRoot } from '../helpers/dom.mjs';
import {
  validateLearningPortfolioSite
} from '../../scripts/validation/learning-portfolio-site-validation.ts';

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
            <h3>Publication Title 2</h3>
            <a href="missing.html">Missing</a>
            <a href="https://unreviewed.example/work">External</a>
            <a href="#missing-fragment">Fragment</a>
            <a href="https://medium.com" target="_blank">Read</a>
          </main>
          <script>window.inline = true;</script>
        `),
        writeFile(path.join(rootDir, 'css/style.css'), 'body { background: url(../assets/missing.webp); }'),
        writeFile(path.join(rootDir, '_headers'), "/*\n  Content-Security-Policy: script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"),
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
        'index.html: contains unfinished publication placeholder copy',
        'index.html: contains inline script; use an external JS file so CSP can block inline execution',
        'index.html: contains inline event handler; use external JavaScript instead',
        'index.html: missing local href target: missing.html',
        'index.html: href uses unreviewed external host: unreviewed.example',
        'index.html: broken fragment in href: #missing-fragment',
        'css/style.css: missing CSS asset target: ../assets/missing.webp',
        "_headers /*: script-src must be 'self'",
        "_headers /*: style-src must be 'self' https://fonts.googleapis.com",
        "_headers /*: connect-src must be 'self'",
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

  test('checks every hosting CSP independently through the public validator', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'portfolio-security-headers-'));
    const headers = await readFile(path.join(projectRoot, '_headers'), 'utf8');
    const vercel = JSON.parse(await readFile(path.join(projectRoot, 'vercel.json'), 'utf8'));
    try {
      // Keep unrelated site evidence real while replacing only the header configs.
      await cp(path.join(projectRoot, 'assets/data'), path.join(rootDir, 'assets/data'), { recursive: true });
      await copyFile(path.join(projectRoot, 'assets/blog.json'), path.join(rootDir, 'assets/blog.json'));
      const cases = [
        {
          name: 'valid configs with reordered directives',
          headers: headers.replace("script-src 'self'; connect-src 'self'", "connect-src 'self'; script-src 'self'"),
          vercel,
          expected: []
        },
        {
          name: 'weakened viewer policy in _headers',
          headers: headers.replace("script-src 'none'", "script-src 'self'"),
          vercel,
          expected: ["_headers /assets/portfolio-viewers/*: script-src must be 'none'"]
        },
        {
          name: 'weakened PDF policy in _headers',
          headers: headers.replace("default-src 'none'", "default-src 'self'"),
          vercel,
          expected: ["_headers /assets/pdf/portfolio/*: default-src must be 'none'"]
        },
        {
          name: 'missing viewer policy',
          headers: headers.replace(/\/assets\/portfolio-viewers\/\*[\s\S]*?(?=\/assets\/pdf\/portfolio\/\*)/, ''),
          vercel,
          expected: ['_headers /assets/portfolio-viewers/*: expected exactly one Content-Security-Policy; found 0']
        },
        {
          name: 'duplicate CSP directive',
          headers: headers.replace("script-src 'none'", "script-src 'self'; script-src 'none'"),
          vercel,
          expected: ['_headers /assets/portfolio-viewers/*: duplicate CSP directive script-src']
        },
        {
          name: 'new script override',
          headers: `${headers}\n/assets/portfolio-viewers/unsafe.html\n  Content-Security-Policy: script-src *\n`,
          vercel,
          expected: ['_headers /assets/portfolio-viewers/unsafe.html: CSP route has no reviewed publication contract']
        },
        ...vercel.headers.map((rule, index) => {
          const modified = structuredClone(vercel);
          const csp = modified.headers[index].headers.find((header) => header.key === 'Content-Security-Policy');
          csp.value += "; script-src-elem 'unsafe-inline'";
          return {
            name: `Vercel override in ${rule.source}`,
            headers,
            vercel: modified,
            expected: [`vercel.json ${rule.source.replace(/\(\.\*\)$/, '*')}: unreviewed CSP directive script-src-elem`]
          };
        }),
        {
          name: 'removed Vercel PDF policy',
          headers,
          vercel: { headers: vercel.headers.filter((rule) => !rule.source.startsWith('/assets/pdf/')) },
          expected: ['vercel.json /assets/pdf/portfolio/*: expected exactly one Content-Security-Policy; found 0']
        },
        {
          name: 'duplicate Vercel policy',
          headers,
          vercel: { headers: [...vercel.headers, vercel.headers[0]] },
          expected: ['vercel.json /assets/portfolio-viewers/*: expected exactly one Content-Security-Policy; found 2']
        }
      ];
      for (const scenario of cases) {
        await writeFile(path.join(rootDir, '_headers'), scenario.headers);
        await writeFile(path.join(rootDir, 'vercel.json'), JSON.stringify(scenario.vercel));
        const result = await validateLearningPortfolioSite({ rootDir });
        const headerFailures = result.failures.filter((failure) => /^(?:_headers|vercel\.json)\b/.test(failure));
        expect(headerFailures, scenario.name).toEqual(scenario.expected);
      }
      await writeFile(path.join(rootDir, 'vercel.json'), '{');
      const malformed = await validateLearningPortfolioSite({ rootDir });
      expect(malformed.failures).toContain('vercel.json: cannot read or parse security header configuration');
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
