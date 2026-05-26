import { describe, expect, test } from 'bun:test';
import path from 'node:path';
import {
  getDeniedShippedArtifactFacts,
  getProductionProbeFacts,
  isDeniedShippedArtifactPath,
  isPublicShippedArtifactPath,
  toRequestPath
} from '../../scripts/shipped-artifact-inventory.mjs';

describe('Shipped Artifact Inventory', () => {
  test('keeps request paths URL-shaped across platforms', () => {
    expect(toRequestPath(path.join('assets', 'pdf', 'portfolio', 'example.pdf'))).toBe('/assets/pdf/portfolio/example.pdf');
  });

  test('accepts only public shipped Artifact paths', () => {
    expect(isPublicShippedArtifactPath('assets/pdf/portfolio/example.pdf')).toBe(true);
    expect(isPublicShippedArtifactPath('assets/portfolio-viewers/example.html')).toBe(true);
    expect(isPublicShippedArtifactPath('assets/data/portfolio-items.json')).toBe(true);
    expect(isPublicShippedArtifactPath('assets/spreadsheets/portfolio/example.xlsx')).toBe(false);
    expect(isPublicShippedArtifactPath('private/example.pdf')).toBe(false);
  });

  test('reports denied editable Office source files as validation facts', () => {
    expect(isDeniedShippedArtifactPath('assets/raw/example.docx')).toBe(true);
    expect(getDeniedShippedArtifactFacts([
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

  test('exposes source-oriented production probe facts without reading dist', () => {
    const probes = getProductionProbeFacts(process.cwd());

    expect(probes.length).toBeGreaterThan(0);
    expect(probes[0]).toEqual(expect.objectContaining({
      path: expect.any(String),
      requestPath: expect.stringMatching(/^\//),
      existsInSource: expect.any(Boolean),
    }));
  });
});
