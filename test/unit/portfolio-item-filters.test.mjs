import { afterEach, describe, expect, test } from 'bun:test';
import { createDom, fireDOMContentLoaded, importFresh, resetDom } from '../helpers/dom.mjs';

afterEach(() => {
  resetDom();
});

describe('portfolio item filters', () => {
  test('sets pressed state and filters portfolio items by tag', async () => {
    createDom(`
      <div id="portfolio-item-filters">
        <button class="filter-button active" data-filter="all">All</button>
        <button class="filter-button" data-filter="training">Training</button>
        <button class="filter-button" data-filter="coaching">Coaching</button>
      </div>
      <section id="portfolio-items">
        <article id="project-a" class="portfolio-item" data-category="training coaching"></article>
        <article id="project-b" class="portfolio-item" data-category="coaching"></article>
        <article id="project-c" class="portfolio-item portfolio-item-placeholder" data-category="training"></article>
      </section>
    `, 'http://127.0.0.1/portfolio.html');

    await importFresh('../../js/portfolio-item-filters.js');
    fireDOMContentLoaded();

    const [allButton, trainingButton, coachingButton] = document.querySelectorAll('.filter-button');
    expect(allButton.getAttribute('aria-pressed')).toBe('true');
    expect(trainingButton.getAttribute('aria-pressed')).toBe('false');

    trainingButton.click();
    expect(trainingButton.classList.contains('active')).toBe(true);
    expect(trainingButton.getAttribute('aria-pressed')).toBe('true');
    expect(allButton.getAttribute('aria-pressed')).toBe('false');
    expect(document.getElementById('project-a').hidden).toBe(false);
    expect(document.getElementById('project-b').hidden).toBe(true);
    expect(document.getElementById('project-c').hidden).toBe(false);

    allButton.click();
    expect(document.getElementById('project-a').hidden).toBe(false);
    expect(document.getElementById('project-b').hidden).toBe(false);
    expect(document.getElementById('project-c').hidden).toBe(true);

    coachingButton.click();
    expect(document.getElementById('project-a').hidden).toBe(false);
    expect(document.getElementById('project-b').hidden).toBe(false);
    expect(document.getElementById('project-c').hidden).toBe(true);
  });

  test('returns cleanly when required markup is absent', async () => {
    createDom('<section id="portfolio-items"></section>', 'http://127.0.0.1/portfolio.html');

    await expect(importFresh('../../js/portfolio-item-filters.js')).resolves.toBeDefined();
    expect(() => fireDOMContentLoaded()).not.toThrow();
  });
});
