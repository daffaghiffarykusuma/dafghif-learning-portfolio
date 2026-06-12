import { describe, expect, test } from 'bun:test';
import path from 'node:path';
import {
  createShippedArtifactPolicy,
  getRoutableCaseStudyPagePaths,
  toRequestPath
} from '../../scripts/shipped-artifact-policy.mjs';

describe('Shipped Artifact Policy', () => {
  test('keeps request paths URL-shaped across platforms', () => {
    expect(toRequestPath(path.join('assets', 'pdf', 'portfolio', 'example.pdf'))).toBe('/assets/pdf/portfolio/example.pdf');
  });

  test('exposes public path and denied Artifact decisions through one interface', () => {
    const policy = createShippedArtifactPolicy();

    expect(policy.isPublicPath('assets/pdf/portfolio/example.pdf')).toBe(true);
    expect(policy.isPublicPath('assets/portfolio-viewers/example.html')).toBe(true);
    expect(policy.isPublicPath('assets/data/portfolio-items.json')).toBe(true);
    expect(policy.isPublicPath('assets/spreadsheets/portfolio/example.xlsx')).toBe(false);
    expect(policy.isPublicPath('private/example.pdf')).toBe(false);
    expect(policy.isDeniedPath('assets/raw/example.docx')).toBe(true);
    expect(policy.deniedArtifactFacts([
      'assets/pdf/portfolio/example.pdf',
      'assets/raw/example.docx',
      'assets/raw/example.xlsx'
    ])).toEqual([
      {
        path: 'assets/raw/example.docx',
        rule: 'editable Office source files must not ship',
      },
      {
        path: 'assets/raw/example.xlsx',
        rule: 'editable Office source files must not ship',
      }
    ]);
  });

  test('returns source and dist validation facts without caller-owned policy assembly', () => {
    const policy = createShippedArtifactPolicy({ rootDir: process.cwd() });
    const facts = policy.validationFacts({
      distRelativePaths: [
        'assets/pdf/portfolio/example.pdf',
        'assets/raw/editable-source.pptx'
      ]
    });

    expect(facts.productionProbes.length).toBeGreaterThan(0);
    expect(facts.productionProbes[0]).toEqual(expect.objectContaining({
      path: expect.any(String),
      requestPath: expect.stringMatching(/^\//),
      existsInSource: expect.any(Boolean),
    }));
    expect(facts.deniedArtifacts).toEqual([
      {
        path: 'assets/raw/editable-source.pptx',
        rule: 'editable Office source files must not ship',
      }
    ]);
    expect(facts.publicRoots).toContain('assets/pdf');
    expect(facts.publicFiles).toContain('assets/blog.json');
    expect(facts.routablePages).toContain('case-ybb-mentoring-workbook.html');
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

    expect(getRoutableCaseStudyPagePaths({ portfolioSource })).toEqual([
      'case-one.html',
      'case-two.html'
    ]);
    expect(policy.validationFacts().routablePages).toEqual([
      'case-one.html',
      'case-two.html'
    ]);
    expect(policy.productionProbeFacts().map((probe) => probe.path)).toEqual(expect.arrayContaining([
      'case-one.html',
      'case-two.html'
    ]));
    expect(policy.isPublicPath('case-two.html')).toBe(true);
  });

  test('keeps production asset probe paths request-shaped and source-filtered', () => {
    const policy = createShippedArtifactPolicy({ rootDir: process.cwd() });
    const requestPaths = policy.productionAssetProbePaths();

    expect(requestPaths.length).toBeGreaterThan(0);
    expect(requestPaths.every((requestPath) => requestPath.startsWith('/'))).toBe(true);
  });
});
