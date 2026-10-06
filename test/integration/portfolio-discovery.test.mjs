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

describe('Generated Portfolio Item Discovery', () => {
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
