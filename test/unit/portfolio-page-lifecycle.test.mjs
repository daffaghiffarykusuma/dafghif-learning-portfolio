import { afterEach, describe, expect, test } from 'bun:test';
import { createDom, importFresh, resetDom } from '../helpers/dom.mjs';

const portfolioFixture = ({ hash = '' } = {}) => {
  createDom(`
    <div id="portfolio-item-filters">
      <button class="filter-button active" data-filter="all">All</button>
      <button class="filter-button" data-filter="learning-materials">Learning materials</button>
    </div>
    <section id="portfolio-items">
      <article id="sample-item" class="portfolio-item" data-category="learning-materials">
        <div class="card-content">
          <h3>Sample Portfolio Item</h3>
          <a class="portfolio-item-title-link" href="portfolio.html#sample-item">Sample</a>
          <button class="view-details-button" data-pdf="assets/pdf/portfolio/sample.pdf">View</button>
        </div>
      </article>
    </section>
    <div id="pdf-modal" hidden>
      <button class="close-modal">Close</button>
      <h2 id="pdf-modal-title"></h2>
      <iframe id="pdf-iframe"></iframe>
    </div>
  `, `http://127.0.0.1/portfolio.html${hash}`);
  globalThis.console = window.console;
};

afterEach(() => {
  resetDom();
});

describe('portfolio page lifecycle', () => {
  test('initializes filters and opens direct hash previews through one lifecycle', async () => {
    portfolioFixture({ hash: '#sample-item' });
    const { createPortfolioPageLifecycle } = await importFresh('../../js/site/pages/portfolio-page.js');

    const lifecycle = createPortfolioPageLifecycle();
    expect(document.getElementById('pdf-iframe').getAttribute('src')).toBeNull();
    const state = lifecycle.init();

    expect(state).toEqual({
      initialized: true,
      filtersReady: true,
      hasHashPreview: true
    });
    expect(document.querySelector('#portfolio-item-filters').dataset.filtersInitialized).toBe('true');
    expect(document.getElementById('pdf-modal').hidden).toBe(false);
    expect(document.getElementById('pdf-modal-title').textContent).toBe('Sample Portfolio Item');
    expect(document.getElementById('pdf-iframe').src).toContain('/assets/pdf/portfolio/sample.pdf');
  });

  test('closes portfolio modals and unregisters hash lifecycle cleanup', async () => {
    portfolioFixture();
    const { createPortfolioPageLifecycle } = await importFresh('../../js/site/pages/portfolio-page.js');

    const lifecycle = createPortfolioPageLifecycle();
    lifecycle.init();
    expect(document.getElementById('pdf-iframe').getAttribute('src')).toBeNull();
    document.querySelector('.view-details-button').click();

    expect(document.getElementById('pdf-modal').hidden).toBe(false);

    lifecycle.destroy();
    expect(document.getElementById('pdf-modal').hidden).toBe(true);
    expect(document.getElementById('pdf-iframe').getAttribute('src')).toBe('');
    expect(lifecycle.getState()).toEqual({
      initialized: false,
      filtersReady: false,
      hasHashPreview: true
    });
  });
});

describe('case study page preview lifecycle', () => {
  test('detects case study preview capability from markup instead of route name', async () => {
    createDom('<article class="case-artifact-card"><button class="view-details-button">View Details</button></article>', 'http://127.0.0.1/case-studies.html');
    const { hasCaseStudyArtifactPreviews } = await importFresh('../../js/site/pages/case-study-page.js');

    expect(hasCaseStudyArtifactPreviews()).toBe(true);

    resetDom();
    createDom('<main><h1>Case Studies</h1></main>', 'http://127.0.0.1/case-studies.html');
    expect(hasCaseStudyArtifactPreviews()).toBe(false);
  });

  test('opens artifact previews without changing the page hash', async () => {
    createDom(`
      <article id="artifact-sample" class="card portfolio-item case-artifact-card">
        <div class="card-image">
          <a class="portfolio-item-thumbnail-link" href="#artifact-sample">Preview sample</a>
        </div>
        <div class="card-content">
          <h3>Sample Case Artifact</h3>
          <button class="view-details-button" data-viewer="assets/portfolio-viewers/sample.html">View Details</button>
        </div>
      </article>
      <div id="pdf-modal" hidden>
        <button class="close-modal">Close</button>
        <h2 id="pdf-modal-title"></h2>
        <iframe id="pdf-iframe"></iframe>
      </div>
    `, 'http://127.0.0.1/case-sample.html');
    globalThis.console = window.console;
    const { initCaseStudyPage } = await importFresh('../../js/site/pages/case-study-page.js');

    initCaseStudyPage();
    document.querySelector('.portfolio-item-thumbnail-link').click();

    expect(window.location.hash).toBe('');
    expect(document.getElementById('pdf-modal').hidden).toBe(false);
    expect(document.getElementById('pdf-modal-title').textContent).toBe('Sample Case Artifact');
    expect(document.getElementById('pdf-iframe').src).toBe('http://127.0.0.1/assets/portfolio-viewers/sample.html');
    expect(document.getElementById('pdf-iframe').getAttribute('sandbox')).toBe('allow-same-origin allow-popups allow-popups-to-escape-sandbox');
  });

  test('opens direct hash artifact previews on case study pages', async () => {
    createDom(`
      <article id="artifact-sample" class="card portfolio-item case-artifact-card">
        <div class="card-content">
          <h3>Sample Case Artifact</h3>
          <button class="view-details-button" data-pdf="assets/pdf/portfolio/sample.pdf">View Details</button>
        </div>
      </article>
      <div id="pdf-modal" hidden>
        <button class="close-modal">Close</button>
        <h2 id="pdf-modal-title"></h2>
        <iframe id="pdf-iframe"></iframe>
      </div>
    `, 'http://127.0.0.1/case-sample.html#artifact-sample');
    globalThis.console = window.console;
    const { initCaseStudyPage } = await importFresh('../../js/site/pages/case-study-page.js');

    initCaseStudyPage();

    expect(window.location.hash).toBe('#artifact-sample');
    expect(document.getElementById('pdf-modal').hidden).toBe(false);
    expect(document.getElementById('pdf-modal-title').textContent).toBe('Sample Case Artifact');
    expect(document.getElementById('pdf-iframe').src).toContain('/assets/pdf/portfolio/sample.pdf#toolbar=0');
  });
});
