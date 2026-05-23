import { describe, expect, test } from 'bun:test';
import { resolveArtifactPreview, safeArtifactPreviewPath } from '../../js/site/artifact-preview-policy.js';

const baseUrl = 'http://127.0.0.1/portfolio.html';

describe('artifact preview policy', () => {
  test('allows same-origin portfolio PDFs and applies the PDF viewer fragment', () => {
    const preview = resolveArtifactPreview({
      pdfPath: 'assets/pdf/portfolio/sample.pdf'
    }, baseUrl);

    expect(preview).toEqual({
      type: 'pdf',
      url: 'http://127.0.0.1/assets/pdf/portfolio/sample.pdf',
      src: 'http://127.0.0.1/assets/pdf/portfolio/sample.pdf#toolbar=0&navpanes=0&scrollbar=0&view=FitH&zoom=page-width&statusbar=0&messages=0&pagemode=none',
      sandbox: ''
    });
  });

  test('allows same-origin HTML artifact viewers with the viewer sandbox policy', () => {
    const preview = resolveArtifactPreview({
      viewerPath: 'assets/portfolio-viewers/sample.html'
    }, baseUrl);

    expect(preview).toEqual({
      type: 'viewer',
      url: 'http://127.0.0.1/assets/portfolio-viewers/sample.html',
      src: 'http://127.0.0.1/assets/portfolio-viewers/sample.html',
      sandbox: 'allow-same-origin'
    });
  });

  test('rejects cross-origin, wrong-prefix, wrong-extension, and control-character paths', () => {
    const rejectedPaths = [
      'https://example.com/file.pdf',
      'assets/pdf/private/file.pdf',
      'assets/pdf/portfolio/file.html',
      'assets/pdf/portfolio/file.pdf\n'
    ];

    for (const rejectedPath of rejectedPaths) {
      expect(safeArtifactPreviewPath(rejectedPath, 'pdf', baseUrl), rejectedPath).toBe('');
    }
  });

  test('keeps PDF precedence when both preview sources are present', () => {
    const preview = resolveArtifactPreview({
      pdfPath: 'assets/pdf/portfolio/sample.pdf',
      viewerPath: 'assets/portfolio-viewers/sample.html'
    }, baseUrl);

    expect(preview.type).toBe('pdf');
  });
});
