import { describe, expect, test } from 'bun:test';
import {
  createArtifactPreviewContract,
  resolveArtifactPreview,
  safeArtifactPreviewPath
} from '../../js/site/artifact-preview-policy.js';

const baseUrl = 'http://127.0.0.1/portfolio.html';
const outsidePreviewLinkPolicy = {
  target: '_blank',
  rel: 'noopener noreferrer',
  opensOutsidePreviewFrame: true
};

describe('artifact preview policy', () => {
  test('creates one Artifact Preview contract for renderers and runtime resolution', () => {
    expect(createArtifactPreviewContract({
      sourceArtifact: 'assets/pdf/portfolio/sample.pdf',
      sourceType: 'pdf'
    }, baseUrl)).toMatchObject({
      type: 'pdf',
      triggerAttributes: {
        'data-pdf': 'assets/pdf/portfolio/sample.pdf'
      },
      frameAttributes: {},
      src: 'http://127.0.0.1/assets/pdf/portfolio/sample.pdf#toolbar=0&navpanes=0&scrollbar=0&view=FitH&zoom=page-width&statusbar=0&messages=0&pagemode=none'
    });

    expect(createArtifactPreviewContract({
      sourceArtifact: 'assets/portfolio-viewers/sample.html',
      sourceType: 'html-viewer'
    }, baseUrl)).toMatchObject({
      type: 'viewer',
      triggerAttributes: {
        'data-viewer': 'assets/portfolio-viewers/sample.html'
      },
      frameAttributes: {
        sandbox: 'allow-same-origin allow-popups allow-popups-to-escape-sandbox'
      },
      src: 'http://127.0.0.1/assets/portfolio-viewers/sample.html'
    });
  });

  test('allows same-origin portfolio PDFs and returns frame and navigation expectations', () => {
    const preview = resolveArtifactPreview({
      pdfPath: 'assets/pdf/portfolio/sample.pdf'
    }, baseUrl);

    expect(preview).toEqual({
      type: 'pdf',
      url: 'http://127.0.0.1/assets/pdf/portfolio/sample.pdf',
      src: 'http://127.0.0.1/assets/pdf/portfolio/sample.pdf#toolbar=0&navpanes=0&scrollbar=0&view=FitH&zoom=page-width&statusbar=0&messages=0&pagemode=none',
      frameAttributes: {},
      linkPolicy: outsidePreviewLinkPolicy,
      navigationPolicy: {
        allowedOrigin: 'http://127.0.0.1',
        allowedPathPrefix: 'assets/pdf/portfolio/',
        allowedExtension: '.pdf',
        previewFrameNavigation: 'validated-artifact-src-only',
        artifactLinks: 'open-outside-preview-frame'
      }
    });
  });

  test('allows same-origin HTML artifact viewers with frame and link expectations', () => {
    const preview = resolveArtifactPreview({
      viewerPath: 'assets/portfolio-viewers/sample.html'
    }, baseUrl);

    expect(preview).toEqual({
      type: 'viewer',
      url: 'http://127.0.0.1/assets/portfolio-viewers/sample.html',
      src: 'http://127.0.0.1/assets/portfolio-viewers/sample.html',
      frameAttributes: {
        sandbox: 'allow-same-origin allow-popups allow-popups-to-escape-sandbox'
      },
      linkPolicy: outsidePreviewLinkPolicy,
      navigationPolicy: {
        allowedOrigin: 'http://127.0.0.1',
        allowedPathPrefix: 'assets/portfolio-viewers/',
        allowedExtension: '.html',
        previewFrameNavigation: 'validated-artifact-src-only',
        artifactLinks: 'open-outside-preview-frame'
      }
    });
  });

  test('rejects cross-origin, wrong-prefix, wrong-extension, and control-character paths', () => {
    const rejectedPaths = [
      'https://example.com/file.pdf',
      'assets/pdf/private/file.pdf',
      'assets/pdf/portfolio/file.html',
      'assets/pdf/portfolio/file.pdf\n',
      'assets/pdf/portfolio/%2e%2e/private.pdf',
      'assets/pdf/portfolio/%2fprivate.pdf',
      'assets/pdf/portfolio/%5cprivate.pdf'
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
