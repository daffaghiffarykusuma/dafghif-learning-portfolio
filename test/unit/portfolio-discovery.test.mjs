import { afterEach, describe, expect, test } from 'bun:test';
import { createDom, importFresh, resetDom } from '../helpers/dom.mjs';

afterEach(() => {
  resetDom();
});

const portfolioItem = ({ id, categories, searchText }) => `
  <article id="${id}" class="portfolio-item"
    data-category="${categories}"
    data-search-text="${searchText}">
  </article>
`;

const discoveryMarkup = (items) => `
  <div id="portfolio-discovery">
    <input id="portfolio-search">
    <button class="filter-button" data-filter="all">All</button>
    <button class="filter-button" data-filter="learning-analytics">Learning Analytics</button>
    <select id="portfolio-more-filter">
      <option value="">All types</option>
      <option value="assessment">Assessment</option>
      <option value="quality-assurance">Quality assurance</option>
    </select>
    <p id="portfolio-result-summary" aria-live="polite"></p>
    <button id="portfolio-clear-filters" hidden>Clear search and filters</button>
    <button id="portfolio-show-more">Show more</button>
  </div>
  <section id="portfolio-items">${items.join('')}</section>
`;

const initializeDiscovery = async (items, url = 'http://127.0.0.1/portfolio.html') => {
  createDom(discoveryMarkup(items), url);
  const { initPortfolioDiscovery } = await importFresh('../../src/portfolio-discovery.ts');
  initPortfolioDiscovery();
};

describe('Portfolio Item Discovery', () => {
  test('treats absent query parameters as empty Reviewer state', async () => {
    await initializeDiscovery([
      portfolioItem({
        id: 'analytics-item',
        categories: 'learning-analytics assessment',
        searchText: 'Assessment dashboard'
      })
    ], 'http://127.0.0.1/portfolio.html?area=learning-analytics');

    expect(document.getElementById('portfolio-search').value).toBe('');
    expect(document.getElementById('portfolio-more-filter').value).toBe('');
    expect(document.querySelector('[data-filter="learning-analytics"]').getAttribute('aria-pressed')).toBe('true');
  });

  test('restores and rewrites normalized discovery state through the URL', async () => {
    const items = Array.from({ length: 20 }, (_, index) => portfolioItem({
      id: `assessment-${index + 1}`,
      categories: 'learning-analytics assessment quality-assurance',
      searchText: `Assessment dashboard ${index + 1}`
    }));
    await initializeDiscovery(
      items,
      'http://127.0.0.1/portfolio.html?q=assessment&area=learning-analytics&tag=quality-assurance&show=18#assessment-1'
    );

    expect(document.getElementById('portfolio-search').value).toBe('assessment');
    expect(Array.from(document.querySelectorAll('.portfolio-item')).filter((item) => !item.hidden).length).toBe(18);

    document.getElementById('portfolio-show-more').click();

    expect(window.location.search).toBe('?q=assessment&area=learning-analytics&tag=quality-assurance&show=27');
    expect(window.location.hash).toBe('#assessment-1');
  });

  test('matches Portfolio Items across search, Practice Area, and additional tag', async () => {
    await initializeDiscovery([
      portfolioItem({
        id: 'score-audit',
        categories: 'learning-analytics assessment quality-assurance',
        searchText: 'Score Audit Corrections redacted manual review'
      }),
      portfolioItem({
        id: 'assessment-dashboard',
        categories: 'learning-analytics assessment',
        searchText: 'Assessment dashboard'
      })
    ], 'http://127.0.0.1/portfolio.html?q=manual%20review&area=learning-analytics&tag=quality-assurance');

    expect(document.getElementById('score-audit').hidden).toBe(false);
    expect(document.getElementById('assessment-dashboard').hidden).toBe(true);
    expect(document.getElementById('portfolio-result-summary').textContent).toBe('Showing all 1 matching Portfolio Items');
  });

  test('reports results and reveals matching Portfolio Items in batches', async () => {
    const items = [
      ...Array.from({ length: 12 }, (_, index) => portfolioItem({
        id: `assessment-${index + 1}`,
        categories: 'learning-analytics assessment',
        searchText: `Assessment dashboard ${index + 1}`
      })),
      portfolioItem({
        id: 'mentoring-workbook',
        categories: 'mentoring',
        searchText: 'Mentoring workbook'
      })
    ];
    await initializeDiscovery(
      items,
      'http://127.0.0.1/portfolio.html?q=assessment&area=learning-analytics&tag=assessment'
    );

    expect(document.getElementById('portfolio-result-summary').textContent).toBe('Showing 9 of 12 matching Portfolio Items');
    expect(Array.from(document.querySelectorAll('.portfolio-item')).filter((item) => !item.hidden).length).toBe(9);

    document.getElementById('portfolio-show-more').click();

    expect(document.getElementById('portfolio-result-summary').textContent).toBe('Showing all 12 matching Portfolio Items');
    expect(Array.from(document.querySelectorAll('.portfolio-item')).filter((item) => !item.hidden).length).toBe(12);
  });

  test('offers a focused reset when no Portfolio Items match', async () => {
    await initializeDiscovery([
      portfolioItem({
        id: 'mentoring-workbook',
        categories: 'mentoring',
        searchText: 'Mentoring workbook'
      })
    ], 'http://127.0.0.1/portfolio.html?q=unavailable');

    const searchInput = document.getElementById('portfolio-search');
    const clearButton = document.getElementById('portfolio-clear-filters');
    expect(document.getElementById('portfolio-result-summary').textContent).toBe(
      'No matching Portfolio Items. Try another search or clear the filters.'
    );
    expect(clearButton.hidden).toBe(false);

    clearButton.click();

    expect(searchInput.value).toBe('');
    expect(document.activeElement).toBe(searchInput);
    expect(window.location.search).toBe('');
    expect(document.querySelector('.portfolio-item').hidden).toBe(false);
  });
});
