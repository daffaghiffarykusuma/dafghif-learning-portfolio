import { afterEach, describe, expect, test } from 'bun:test';
import { createDom, importFresh, resetDom } from '../helpers/dom.mjs';

const previewFixture = (url = 'http://127.0.0.1/portfolio.html') => {
  createDom(`
    <article id="sample-item" class="card portfolio-item">
      <div class="card-image">
        <a class="portfolio-item-thumbnail-link" href="#sample-item">Sample thumbnail</a>
      </div>
      <div class="card-content">
        <h3>Sample Artifact</h3>
        <button class="view-details-button" data-pdf="assets/pdf/portfolio/sample.pdf">View</button>
      </div>
    </article>
    <div id="pdf-modal" hidden>
      <button class="close-modal">Close</button>
      <h2 id="pdf-modal-title"></h2>
      <iframe id="pdf-iframe"></iframe>
    </div>
  `, url);
  globalThis.console = window.console;
};

afterEach(() => {
  resetDom();
});

describe('Artifact Preview Experience', () => {
  test('opens Portfolio Item previews with hash updates and legacy modal cleanup', async () => {
    previewFixture();
    let legacyModalClosed = 0;
    const { createPortfolioItemPreviewExperience } = await importFresh('../../js/site/artifact-preview-experience.js');

    createPortfolioItemPreviewExperience(() => {
      legacyModalClosed += 1;
    });
    document.querySelector('.portfolio-item-thumbnail-link').click();

    expect(legacyModalClosed).toBe(1);
    expect(window.location.hash).toBe('#sample-item');
    expect(document.getElementById('pdf-modal').hidden).toBe(false);
    expect(document.getElementById('pdf-modal-title').textContent).toBe('Sample Artifact');
    expect(document.getElementById('pdf-iframe').src).toContain('/assets/pdf/portfolio/sample.pdf#toolbar=0');
  });

  test('opens Case Study Artifact previews without hash updates', async () => {
    previewFixture('http://127.0.0.1/case-sample.html');
    document.querySelector('.view-details-button').dataset.viewer = 'assets/portfolio-viewers/sample.html';
    document.querySelector('.view-details-button').removeAttribute('data-pdf');
    const { createCaseStudyArtifactPreviewExperience } = await importFresh('../../js/site/artifact-preview-experience.js');

    createCaseStudyArtifactPreviewExperience();
    document.querySelector('.view-details-button').click();

    expect(window.location.hash).toBe('');
    expect(document.getElementById('pdf-modal').hidden).toBe(false);
    expect(document.getElementById('pdf-iframe').src).toBe('http://127.0.0.1/assets/portfolio-viewers/sample.html');
    expect(document.getElementById('pdf-iframe').getAttribute('sandbox')).toBe('allow-same-origin allow-popups allow-popups-to-escape-sandbox');
  });

  test('destroy removes preview click, hash, close, backdrop, and escape listeners', async () => {
    previewFixture();
    const { createArtifactPreviewExperience } = await importFresh('../../js/site/artifact-preview-experience.js');

    const experience = createArtifactPreviewExperience();
    experience.destroy();
    document.querySelector('.view-details-button').click();
    window.dispatchEvent(new window.HashChangeEvent('hashchange'));
    document.querySelector('.close-modal').click();
    document.getElementById('pdf-modal').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(document.getElementById('pdf-modal').hidden).toBe(true);
    expect(document.getElementById('pdf-iframe').getAttribute('src')).toBeNull();
  });
});
