import { describe, expect, test } from 'bun:test';
import { createShippedArtifactPolicy } from '../../scripts/shipped-artifact-policy.ts';

describe('Shipped Artifact Policy', () => {
  test('exposes one representation per policy decision', () => {
    const policy = createShippedArtifactPolicy();

    expect(Object.keys(policy).sort()).toEqual([
      'isDeniedPath',
      'isExcludedPath',
      'isPublicPath',
      'productionProbeFacts',
      'rootShippedFiles',
      'shippingManifest'
    ]);
    expect(policy.isPublicPath('assets/pdf/portfolio/example.pdf')).toBe(true);
    expect(policy.isPublicPath('assets/pdf/portfolio/7_habits.pdf')).toBe(false);
    expect(policy.isExcludedPath('assets/pdf/portfolio/7_habits.pdf')).toBe(true);
    expect(policy.isPublicPath('assets/portfolio-viewers/example.html')).toBe(true);
    expect(policy.isPublicPath('assets/data/portfolio-items.json')).toBe(true);
    expect(policy.isPublicPath('assets/spreadsheets/portfolio/example.xlsx')).toBe(false);
    expect(policy.isPublicPath('private/example.pdf')).toBe(false);
    expect(policy.isDeniedPath('assets/raw/example.docx')).toBe(true);
  });

  test('returns production probe facts without overlapping projections', () => {
    const policy = createShippedArtifactPolicy({ rootDir: process.cwd() });
    const facts = policy.productionProbeFacts();

    expect(facts.length).toBeGreaterThan(0);
    expect(facts[0]).toEqual(expect.objectContaining({
      path: expect.any(String),
      requestPath: expect.stringMatching(/^\//),
      existsInSource: expect.any(Boolean),
    }));
  });

  test('derives routed Case Study pages and probes from the Portfolio Item Source', () => {
    const portfolioSource = {
      caseStudies: [
        { id: 'case-one', pagePath: 'case-one.html' },
        { id: 'case-two' }
      ]
    };
    const policy = createShippedArtifactPolicy({
      rootDir: process.cwd(),
      portfolioSource
    });

    expect(policy.shippingManifest.routablePages).toEqual([
      'case-one.html',
      'case-two.html'
    ]);
    expect(policy.productionProbeFacts().map((probe) => probe.path)).toEqual(expect.arrayContaining([
      'case-one.html',
      'case-two.html'
    ]));
    expect(policy.isPublicPath('case-two.html')).toBe(true);
  });

  test('keeps production probes request-shaped', () => {
    const policy = createShippedArtifactPolicy({ rootDir: process.cwd() });
    const requestPaths = policy.productionProbeFacts().map((probe) => probe.requestPath);

    expect(requestPaths.length).toBeGreaterThan(0);
    expect(requestPaths.every((requestPath) => requestPath.startsWith('/'))).toBe(true);
  });

  test('keeps root-specific manifests independent across policy instances', () => {
    const first = createShippedArtifactPolicy({
      rootDir: process.cwd(),
      portfolioSource: {
        caseStudies: [{ id: 'case-one', pagePath: 'case-one.html' }]
      }
    });
    const second = createShippedArtifactPolicy({
      rootDir: process.cwd(),
      portfolioSource: {
        caseStudies: [{ id: 'case-two', pagePath: 'case-two.html' }]
      }
    });

    expect(first.shippingManifest.routablePages).toEqual(['case-one.html']);
    expect(second.shippingManifest.routablePages).toEqual(['case-two.html']);
    expect(first.isPublicPath('case-two.html')).toBe(false);
    expect(second.isPublicPath('case-one.html')).toBe(false);
  });
});
