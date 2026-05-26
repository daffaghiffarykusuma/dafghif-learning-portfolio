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
