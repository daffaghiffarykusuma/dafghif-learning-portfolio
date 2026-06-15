import { afterEach, describe, expect, test } from 'bun:test';
import { createDom, importFresh, resetDom } from '../helpers/dom.mjs';

afterEach(() => {
  resetDom();
});

describe('Portfolio Discovery', () => {
  test('treats absent query parameters as empty state instead of literal null text', async () => {
    const { parsePortfolioDiscoveryState } = await importFresh('../../js/portfolio-discovery.js');
    expect(parsePortfolioDiscoveryState({ search: '?area=learning-analytics' })).toEqual({
      query: '',
      area: 'learning-analytics',
      tag: '',
      visibleCount: 9
    });
  });

  test('round-trips normalized discovery state through query parameters', async () => {
    createDom('', 'http://127.0.0.1/portfolio.html?q=assessment&area=learning-analytics&tag=quality-assurance&show=18#project-score-audit-corrections');

    const {
      parsePortfolioDiscoveryState,
      serializePortfolioDiscoveryState
    } = await importFresh('../../js/portfolio-discovery.js');

    const state = parsePortfolioDiscoveryState(window.location);
    expect(state).toEqual({
      query: 'assessment',
      area: 'learning-analytics',
      tag: 'quality-assurance',
      visibleCount: 18
    });

    expect(serializePortfolioDiscoveryState(state)).toBe(
      '?q=assessment&area=learning-analytics&tag=quality-assurance&show=18'
    );
  });

  test('matches Portfolio Items across search, Practice Area, and additional tag', async () => {
    createDom(`
      <article class="portfolio-item"
        data-category="learning-analytics assessment quality-assurance"
        data-search-text="Score Audit Corrections redacted manual review">
      </article>
    `);

    const { matchesPortfolioItem } = await importFresh('../../js/portfolio-discovery.js');
    const item = document.querySelector('.portfolio-item');

    expect(matchesPortfolioItem(item, {
      query: 'manual review',
      area: 'learning-analytics',
      tag: 'quality-assurance',
      visibleCount: 9
    })).toBe(true);
    expect(matchesPortfolioItem(item, {
      query: 'facilitation',
      area: 'learning-analytics',
      tag: '',
      visibleCount: 9
    })).toBe(false);
  });

  test('restores discovery state, reports results, and reveals matching items in batches', async () => {
    createDom(`
      <div id="portfolio-discovery">
        <input id="portfolio-search">
        <button class="filter-button" data-filter="all">All</button>
        <button class="filter-button" data-filter="learning-analytics">Learning Analytics</button>
        <select id="portfolio-more-filter">
          <option value="">All types</option>
          <option value="assessment">Assessment</option>
        </select>
        <p id="portfolio-result-summary" aria-live="polite"></p>
        <button id="portfolio-show-more">Show more</button>
      </div>
      <section id="portfolio-items">
        ${Array.from({ length: 12 }, (_, index) => `
          <article class="portfolio-item"
            data-category="learning-analytics assessment"
            data-search-text="Assessment dashboard ${index + 1}">
          </article>
        `).join('')}
        <article class="portfolio-item" data-category="mentoring" data-search-text="Mentoring workbook"></article>
      </section>
    `, 'http://127.0.0.1/portfolio.html?q=assessment&area=learning-analytics&tag=assessment');

    const { initPortfolioDiscovery } = await importFresh('../../js/portfolio-discovery.js');
    initPortfolioDiscovery();

    expect(document.getElementById('portfolio-search').value).toBe('assessment');
    expect(document.querySelector('[data-filter="learning-analytics"]').getAttribute('aria-pressed')).toBe('true');
    expect(document.getElementById('portfolio-more-filter').value).toBe('assessment');
    expect(document.getElementById('portfolio-result-summary').textContent).toBe('Showing 9 of 12 matching Portfolio Items');
    expect(Array.from(document.querySelectorAll('.portfolio-item')).filter((item) => !item.hidden).length).toBe(9);

    document.getElementById('portfolio-show-more').click();
    expect(document.getElementById('portfolio-result-summary').textContent).toBe('Showing all 12 matching Portfolio Items');
    expect(Array.from(document.querySelectorAll('.portfolio-item')).filter((item) => !item.hidden).length).toBe(12);
  });
});
