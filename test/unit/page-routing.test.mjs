import { afterEach, describe, expect, test } from 'bun:test';
import { createDom, importFresh, resetDom } from '../helpers/dom.mjs';

const portfolioFixture = ({ hash = '' } = {}) => {
  createDom(`
    <div id="portfolio-discovery">
      <input id="portfolio-search" type="search">
      <div id="portfolio-item-filters">
        <button class="filter-button active" data-filter="all">All</button>
        <button class="filter-button" data-filter="learning-materials">Learning materials</button>
      </div>
      <select id="portfolio-more-filter"><option value="">More</option></select>
      <p id="portfolio-result-summary"></p>
      <button id="portfolio-show-more">Show more</button>
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

describe('portfolio page', () => {
  test('initializes filters and opens direct hash previews', async () => {
    portfolioFixture({ hash: '#sample-item' });
    const { initCurrentPage } = await importFresh('../../src/site/pages/page-router.js');

    expect(document.getElementById('pdf-iframe').getAttribute('src')).toBeNull();
    const preview = initCurrentPage();

    expect(document.querySelector('#portfolio-discovery').dataset.discoveryInitialized).toBe('true');
    expect(document.getElementById('pdf-modal').hidden).toBe(false);
    expect(document.getElementById('pdf-modal-title').textContent).toBe('Sample Portfolio Item');
    expect(document.getElementById('pdf-iframe').src).toContain('/assets/pdf/portfolio/sample.pdf');
    preview.destroy();
  });
});

describe('case study page routing', () => {
  test('detects case study preview capability from markup instead of route name', async () => {
    createDom(`
      <article class="case-artifact-card"><button class="view-details-button">View Details</button></article>
      <div id="pdf-modal" hidden>
        <button class="close-modal">Close</button>
        <h2 id="pdf-modal-title"></h2>
        <iframe id="pdf-iframe"></iframe>
      </div>
    `, 'http://127.0.0.1/case-studies.html');
    const { initCurrentPage } = await importFresh('../../src/site/pages/page-router.js');

    expect(initCurrentPage()).toBeTruthy();

    resetDom();
    createDom('<main><h1>Case Studies</h1></main>', 'http://127.0.0.1/case-studies.html');
    expect(initCurrentPage()).toBeNull();
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
    const { initCurrentPage } = await importFresh('../../src/site/pages/page-router.js');

    initCurrentPage();
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
    const { initCurrentPage } = await importFresh('../../src/site/pages/page-router.js');

    initCurrentPage();

    expect(window.location.hash).toBe('#artifact-sample');
    expect(document.getElementById('pdf-modal').hidden).toBe(false);
    expect(document.getElementById('pdf-modal-title').textContent).toBe('Sample Case Artifact');
    expect(document.getElementById('pdf-iframe').src).toContain('/assets/pdf/portfolio/sample.pdf#toolbar=0');
  });
});
