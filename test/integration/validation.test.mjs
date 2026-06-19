import { describe, expect, test } from 'bun:test';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { projectRoot } from '../helpers/dom.mjs';
import {
  formatLearningPortfolioSiteValidationSummary,
  validateLearningPortfolioSite
} from '../../scripts/learning-portfolio-site-validation.mjs';

const run = (command, args) => new Promise((resolve) => {
  const child = spawn(command, args, {
    cwd: projectRoot,
    shell: process.platform === 'win32',
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => {
    stdout += chunk;
  });
  child.stderr.on('data', (chunk) => {
    stderr += chunk;
  });
  child.on('close', (code) => {
    resolve({ code, stdout, stderr });
  });
});

describe('Learning Portfolio Site Validation', () => {
  test('returns structured validation facts for the repository', async () => {
    const result = await validateLearningPortfolioSite({
      rootDir: projectRoot
    });

    expect(result.failures).toEqual([]);
    expect(result.counts).toEqual({
      htmlFiles: 27,
      cssFiles: 10,
      blogPosts: 34,
      portfolioItems: 69,
      shippedArtifactProbes: 12
    });
    expect(formatLearningPortfolioSiteValidationSummary(result))
      .toContain('Validated 27 HTML files');
  });

  test('keeps validation failures and counts behind the module interface', async () => {
    const indexPath = path.join(projectRoot, 'index.html');
    const result = await validateLearningPortfolioSite({
      rootDir: projectRoot,
      adapters: {
        createSourceSiteInventory: async () => ({
          htmlPages: [
            {
              filePath: indexPath,
              relPath: 'index.html',
              source: '<main id="main"></main>',
              ids: ['main'],
              urlAttributes: [
                { attr: 'href', value: 'missing.html' },
                { attr: 'href', value: 'https://unreviewed.example/work' },
                { attr: 'href', value: '#missing-fragment' }
              ],
              blankTargetTags: ['<a href="https://medium.com" target="_blank">Read</a>'],
              hasInlineScript: true,
              hasInlineEventHandler: true
            }
          ],
          cssFiles: [
            {
              filePath: path.join(projectRoot, 'css/style.css'),
              relPath: 'css/style.css',
              urls: ['../assets/missing.webp']
            }
          ]
        }),
        pathExists: async () => false,
        readText: async (filePath) => {
          if (filePath.endsWith('_headers')) {
            return "Content-Security-Policy: script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'";
          }
          if (filePath.endsWith('assets\\blog.json') || filePath.endsWith('assets/blog.json')) {
            return JSON.stringify([
              {
                url: 'http://example.com/post',
                image: 'https://example.com/image.webp'
              }
            ]);
          }
          return '';
        },
        validatePortfolioEvidence: async () => ({
          failures: ['Portfolio Evidence failed'],
          portfolioItemCount: 2
        }),
        createShippedArtifactPolicy: () => ({
          validationFacts: () => ({
            productionProbes: [
              { path: 'required.pdf', existsInSource: false }
            ]
          })
        })
      }
    });

    expect(result.counts).toEqual({
      htmlFiles: 1,
      cssFiles: 1,
      blogPosts: 1,
      portfolioItems: 2,
      shippedArtifactProbes: 1
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
      'Portfolio Evidence failed',
      'Shipped Artifact Policy production probe missing from source: required.pdf'
    ]));
  });

  test('keeps the Bun command as a thin passing adapter', async () => {
    const result = await run('bun', ['scripts/validate-site.mjs']);

    expect(result.code).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('Validated');
  });
});
