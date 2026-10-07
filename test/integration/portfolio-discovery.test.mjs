import { afterEach, describe, expect, test } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { createDom, resetDom } from '../helpers/dom.mjs';
import { createPortfolioEvidenceWorkflow } from '../../scripts/portfolio/portfolio-evidence-workflow.ts';
import { initPortfolioDiscovery } from '../../src/portfolio-discovery.ts';

afterEach(resetDom);

const portfolioHtml = await readFile(new URL('../../portfolio.html', import.meta.url), 'utf8');
const source = JSON.parse(await readFile(new URL('../../assets/data/portfolio-source.json', import.meta.url), 'utf8'));
const proofSource = JSON.parse(await readFile(new URL('../../assets/data/portfolio-proof-points.json', import.meta.url), 'utf8'));
const generate = (portfolioSource = source) => createPortfolioEvidenceWorkflow({
  portfolioHtml, portfolioSource, proofSource, generatedFrom: 'assets/data/portfolio-source.json'
}).outputs.find((output) => output.type === 'portfolio-html').contents;

const initialize = (html, query = '') => {
  createDom(html, `http://127.0.0.1/portfolio.html${query}`);
  initPortfolioDiscovery();
};

const visibleItemIds = () => Array.from(document.querySelectorAll('#portfolio-items .portfolio-item'))
  .filter((item) => !item.hidden).map((item) => item.id);

const searchFor = (query) => {
  const search = document.getElementById('portfolio-search');
  search.value = query;
  search.dispatchEvent(new window.Event('input'));
};

describe('Generated Portfolio Item Discovery', () => {
  test('finds communication assessments with all query words in any order', () => {
    initialize(generate());
    const search = document.getElementById('portfolio-search');

    for (const query of ['communication assessment', 'assessment communication', '  CoMMuniCATion   ASSESSMENT  ']) {
      search.value = query;
      search.dispatchEvent(new window.Event('input'));

      expect(document.getElementById('project-need-assessment-cross-department-communication').hidden).toBe(false);
      expect(document.getElementById('project-need-assessment-manager-communication-to-staff').hidden).toBe(false);
      expect(document.getElementById('project-recruitment-assessment-blueprint').hidden).toBe(true);
    }
    expect(search.value).toBe('CoMMuniCATion ASSESSMENT');
    expect(new URLSearchParams(window.location.search).get('q')).toBe('CoMMuniCATion ASSESSMENT');
  });

  test('matches title and description words together while preserving single-word substrings', () => {
    initialize(generate());
    searchFor('friction commun');
    expect(visibleItemIds()).toEqual(['project-need-assessment-cross-department-communication']);
    expect(document.getElementById('portfolio-result-summary').textContent).toBe('Showing all 1 matching Portfolio Items');

    searchFor('friction');
    expect(visibleItemIds()).toEqual(['project-need-assessment-cross-department-communication']);
    searchFor('communication friction unavailable');
    expect(visibleItemIds()).toEqual([]);
    expect(document.getElementById('portfolio-result-summary').textContent)
      .toBe('No matching Portfolio Items. Try another search or clear the filters.');
  });

  test('combines all search words with area, topic, and format, restores the URL, and resets zero results', () => {
    const html = generate();
    const hash = '#project-need-assessment-cross-department-communication';
    initialize(html, hash);
    const initialItems = visibleItemIds();
    const initialSummary = document.getElementById('portfolio-result-summary').textContent;
    searchFor('communication assessment');
    expect(document.getElementById('project-manager-coaching-report').hidden).toBe(false);

    for (const [id, value] of [
      ['portfolio-area-filter', 'training-needs-analysis'],
      ['portfolio-more-filter', 'curriculum-development'],
      ['portfolio-format-filter', 'pdf']
    ]) {
      const select = document.getElementById(id);
      select.value = value;
      select.dispatchEvent(new window.Event('change'));
    }
    const matchingItems = [
      'project-need-assessment-cross-department-communication',
      'project-need-assessment-manager-communication-to-staff'
    ];
    expect(visibleItemIds()).toEqual(matchingItems);
    expect(document.getElementById('portfolio-result-summary').textContent).toBe('Showing all 2 matching Portfolio Items');
    expect(window.location.search).toBe('?q=communication+assessment&area=training-needs-analysis&tag=curriculum-development&format=pdf');
    expect(window.location.hash).toBe(hash);

    const savedUrl = window.location.search + window.location.hash;
    resetDom();
    initialize(html, savedUrl);
    expect(document.getElementById('portfolio-search').value).toBe('communication assessment');
    expect(document.getElementById('portfolio-area-filter').value).toBe('training-needs-analysis');
    expect(document.getElementById('portfolio-more-filter').value).toBe('curriculum-development');
    expect(document.getElementById('portfolio-format-filter').value).toBe('pdf');
    expect(visibleItemIds()).toEqual(matchingItems);

    const format = document.getElementById('portfolio-format-filter');
    format.value = 'html-viewer';
    format.dispatchEvent(new window.Event('change'));
    expect(visibleItemIds()).toEqual([]);
    expect(document.getElementById('portfolio-result-summary').textContent)
      .toBe('No matching Portfolio Items. Try another search or clear the filters.');
    expect(document.getElementById('portfolio-show-more').hidden).toBe(true);
    expect(document.getElementById('portfolio-clear-filters').hidden).toBe(false);
    document.getElementById('portfolio-clear-filters').click();
    expect(visibleItemIds()).toEqual(initialItems);
    expect(document.getElementById('portfolio-result-summary').textContent).toBe(initialSummary);
    expect(document.getElementById('portfolio-search').value).toBe('');
    expect(document.getElementById('portfolio-area-filter').value).toBe('all');
    expect(document.getElementById('portfolio-more-filter').value).toBe('');
    expect(format.value).toBe('');
    expect(document.activeElement).toBe(document.getElementById('portfolio-search'));
    expect(window.location.search).toBe('');
    expect(window.location.hash).toBe(hash);
  });

  test('reveals multiword matches in catalogue order and restores the revealed batch', () => {
    const html = generate();
    initialize(html);
    const initialItems = visibleItemIds();
    searchFor('material learning');
    expect(visibleItemIds()).toHaveLength(9);
    expect(visibleItemIds().slice(0, 3)).toEqual([
      'case-administrative-communication-learning-program',
      'project-self-leadership-career-transition',
      'project-learning-from-abroad-education-and-career-pathways'
    ]);
    expect(document.getElementById('portfolio-result-summary').textContent).toBe('Showing 9 of 48 matching Portfolio Items');
    const firstBatch = visibleItemIds();
    document.getElementById('portfolio-show-more').click();
    expect(visibleItemIds()).toHaveLength(18);
    expect(visibleItemIds().slice(0, 9)).toEqual(firstBatch);
    expect(document.getElementById('portfolio-result-summary').textContent).toBe('Showing 18 of 48 matching Portfolio Items');
    expect(window.location.search).toBe('?q=material+learning&show=18');

    const revealedItems = visibleItemIds();
    const savedQuery = window.location.search;
    resetDom();
    initialize(html, savedQuery);
    expect(document.getElementById('portfolio-search').value).toBe('material learning');
    expect(visibleItemIds()).toEqual(revealedItems);
    expect(document.getElementById('portfolio-result-summary').textContent).toBe('Showing 18 of 48 matching Portfolio Items');
    searchFor('learning material');
    expect(visibleItemIds()).toEqual(firstBatch);
    expect(window.location.search).toBe('?q=learning+material');
    searchFor('   ');
    expect(visibleItemIds()).toEqual(initialItems);
    expect(document.getElementById('portfolio-search').value).toBe('');
    expect(window.location.search).toBe('');
  });

  test.each([
    ['case-administrative-communication-learning-program', 'Instructional Design', 'instructional-design'],
    ['case-ybb-mentoring-workbook', 'Mentoring & Coaching', 'mentoring'],
    ['case-learning-organization-strategy-evaluation-system', 'L&D Strategy', 'learning-strategy']
  ])('restores the declared Practice Area link for %s', (id, label, token) => {
    const html = generate();
    createDom(html);
    const link = document.querySelector(`#${id} .portfolio-item-practice-label a`);
    expect(link.textContent).toBe(label);
    expect(link.getAttribute('href')).toBe(`portfolio.html?area=${token}`);
    resetDom();
    initialize(html, `?area=${token}`);

    expect(document.getElementById('portfolio-area-filter').value).toBe(token);
    expect(document.getElementById('portfolio-active-filters').textContent).toBe(label);
    expect(document.getElementById(id).hidden).toBe(false);
  });

  test('includes declared membership without a matching tag and preserves related tagged work', () => {
    const modified = structuredClone(source);
    const declared = modified.portfolioItems.find((item) => item.id === 'project-manager-coaching-report');
    declared.tags = ['reporting'];
    const related = modified.portfolioItems.find((item) => item.practiceArea === 'Learning Materials');
    related.tags = ['mentoring', ...related.tags];
    initialize(generate(modified), '?area=mentoring&show=99');

    expect(document.getElementById(declared.id).hidden).toBe(false);
    expect(document.getElementById(related.id).hidden).toBe(false);
    expect(document.querySelector(`#${related.id} .portfolio-item-practice-label a`).getAttribute('href'))
      .toBe('portfolio.html?area=learning-materials');
  });

  test('keeps area, topic, format, URL state, and reset independent', () => {
    initialize(generate(), '?area=mentoring&tag=worksheet&format=html-viewer&show=99#work');
    const area = document.getElementById('portfolio-area-filter');
    const topic = document.getElementById('portfolio-more-filter');
    expect(area.value).toBe('mentoring');
    expect(topic.value).toBe('worksheet');
    expect(document.getElementById('portfolio-active-filters').textContent)
      .toContain('Mentoring & Coaching · Topic: Worksheets');

    area.value = 'training-needs-analysis';
    area.dispatchEvent(new window.Event('change'));
    expect(window.location.search).toBe('?area=training-needs-analysis&tag=worksheet&format=html-viewer');
    expect(window.location.hash).toBe('#work');
    expect(topic.value).toBe('worksheet');
    document.querySelector('[data-filter="learning-analytics"]').click();
    expect(area.value).toBe('learning-analytics');
    expect(document.querySelector('[data-filter="learning-analytics"]').getAttribute('aria-pressed')).toBe('true');
    topic.value = '';
    topic.dispatchEvent(new window.Event('change'));
    expect(window.location.search).toBe('?area=learning-analytics&format=html-viewer');
    document.getElementById('portfolio-clear-filters').click();
    expect(area.value).toBe('all');
    expect(topic.value).toBe('');
    expect(window.location.search).toBe('');
    expect(document.getElementById('portfolio-active-filters').textContent).toBe('');
  });

  test('keeps legacy topic URLs visible without treating the topic as a declared Practice Area', () => {
    initialize(generate(), '?area=worksheet&tag=quality-assurance');
    expect(document.getElementById('portfolio-area-filter').value).toBe('worksheet');
    expect(document.getElementById('portfolio-more-filter').value).toBe('quality-assurance');
    expect(document.getElementById('portfolio-active-filters').textContent).toBe('Worksheets · Topic: quality assurance');
  });
});
