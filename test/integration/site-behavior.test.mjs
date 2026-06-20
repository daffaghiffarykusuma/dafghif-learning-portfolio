import { afterEach, describe, expect, test } from 'bun:test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createDom, fireDOMContentLoaded, importFresh, projectRoot, resetDom } from '../helpers/dom.mjs';

const readPage = (fileName) => readFile(path.join(projectRoot, fileName), 'utf8');

afterEach(() => {
  resetDom();
});

describe('site browser behavior', () => {
  test('top-level pages expose one page heading and keep site identity out of h1', async () => {
    for (const page of ['index.html', 'portfolio.html', 'case-studies.html', 'contact.html', 'blog.html']) {
      createDom(await readPage(page), `http://127.0.0.1/${page}`);
      expect(document.querySelectorAll('main h1').length).toBe(1);
      expect(document.querySelectorAll('header .logo h1').length).toBe(0);
    }
  });

  test('portfolio page opens same-origin previews and blocks unsafe preview paths', async () => {
    const html = await readPage('portfolio.html');
    const window = createDom(html, 'http://127.0.0.1/portfolio.html');
    const warnings = [];
    window.console.warn = (...args) => warnings.push(args.join(' '));
    globalThis.console = window.console;

    await importFresh('../../js/script.js');
    fireDOMContentLoaded();

    const modal = document.getElementById('pdf-modal');
    const iframe = document.getElementById('pdf-iframe');
    const safeButton = Array.from(document.querySelectorAll('.view-details-button'))
      .find((button) => button.dataset.pdf);
    expect(safeButton).toBeTruthy();

    const safeCard = safeButton.closest('.portfolio-item');
    safeCard.querySelector('.portfolio-item-thumbnail-link').click();
    expect(modal.hidden).toBe(false);
    expect(window.location.hash).toBe(`#${safeCard.id}`);
    expect(iframe.src.startsWith('http://127.0.0.1/assets/pdf/portfolio/')).toBe(true);
    expect(iframe.src).toContain('#toolbar=0');
    expect(iframe.hasAttribute('sandbox')).toBe(false);

    modal.querySelector('.close-modal').click();
    expect(modal.hidden).toBe(true);
    expect(iframe.getAttribute('src')).toBe('');

    const safeViewerButton = Array.from(document.querySelectorAll('.view-details-button'))
      .find((button) => button.dataset.viewer);
    expect(safeViewerButton).toBeTruthy();

    safeViewerButton.click();
    expect(modal.hidden).toBe(false);
    expect(iframe.src.startsWith('http://127.0.0.1/assets/portfolio-viewers/')).toBe(true);
    expect(iframe.src).not.toContain('#toolbar=0');
    expect(iframe.getAttribute('sandbox')).toBe('allow-same-origin allow-popups allow-popups-to-escape-sandbox');

    modal.querySelector('.close-modal').click();

    safeButton.dataset.pdf = 'https://example.com/file.pdf';
    safeButton.removeAttribute('data-viewer');
    safeButton.click();
    expect(modal.hidden).toBe(true);
    expect(warnings.some((message) => message.includes('Blocked unsafe portfolio preview path'))).toBe(true);
  });

  test('portfolio cards render concise proof lines without a visible prefix', async () => {
    const html = await readPage('portfolio.html');
    createDom(html, 'http://127.0.0.1/portfolio.html');

    const portfolioItems = Array.from(document.querySelectorAll('.card.portfolio-item:not(.portfolio-item-placeholder)'));
    const proofLines = Array.from(document.querySelectorAll('.portfolio-item-proof'));

    expect(portfolioItems.length).toBe(69);
    expect(proofLines.length).toBe(portfolioItems.length);
    expect(document.querySelector('#case-employee-assessment-bootcamp .portfolio-item-proof').textContent)
      .toBe('Connects observation evidence and scoring to a redacted individual report.');
    expect(proofLines.every((line) => !line.textContent.startsWith('Proof of quality:'))).toBe(true);
  });

  test('case study pages are linked from the main menu and portfolio cards', async () => {
    const indexHtml = await readPage('case-studies.html');
    createDom(indexHtml, 'http://127.0.0.1/case-studies.html');

    expect(document.querySelector('header nav a[href="case-studies.html"]').parentElement.classList.contains('current')).toBe(true);
    expect(Array.from(document.querySelectorAll('.case-study-card a'), (link) => link.getAttribute('href'))).toEqual(expect.arrayContaining([
      'case-entrepreneurship.html',
      'case-employee-assessment-bootcamp.html',
      'case-administrative-communication.html',
      'case-learning-organization-strategy.html',
      'case-ybb-mentoring-workbook.html'
    ]));
    expect(document.querySelectorAll('.case-study-card').length).toBe(5);

    const caseHtml = await readPage('case-ybb-mentoring-workbook.html');
    createDom(caseHtml, 'http://127.0.0.1/case-ybb-mentoring-workbook.html');
    globalThis.console = window.console;

    await importFresh('../../js/script.js');
    fireDOMContentLoaded();

    expect(document.querySelector('main h1').textContent).toBe('Youth Mentoring Workbook and Final Pitch Readiness System');
    expect(document.body.dataset.pageKind).toBe('case-study');
    expect(document.body.dataset.navigationPage).toBe('case-studies.html');
    expect(document.querySelector('header nav a[href="case-studies.html"]').parentElement.classList.contains('current')).toBe(true);
    expect(document.querySelector('.service-hero.generated-case-hero')).toBeTruthy();
    expect(document.querySelector('.service-impact.generated-case-evidence')).toBeTruthy();
    expect(document.querySelector('.service-approach .approach-steps')).toBeTruthy();
    expect(document.querySelector('.service-resources.generated-case-artifacts')).toBeTruthy();
    expect(Array.from(document.querySelectorAll('.artifact-list h3'), (heading) => heading.textContent)).toEqual([
      'Mentoring Workbook: Week 1 Idea Exploration',
      'Mentoring Workbook: Week 2 Concept Development',
      'Mentoring Workbook: Week 3 Presentation Readiness',
      'Pitch Deck Template: Week 4'
    ]);
    expect(document.querySelector('link[rel="alternate"][type="application/json"]')?.getAttribute('href'))
      .toBe('assets/data/portfolio-ai-context.json');

    const featuredCaseHtml = await readPage('case-entrepreneurship.html');
    createDom(featuredCaseHtml, 'http://127.0.0.1/case-entrepreneurship.html');
    globalThis.console = window.console;

    await importFresh('../../js/script.js');
    fireDOMContentLoaded();

    expect(document.body.dataset.pageKind).toBe('case-study');
    expect(document.querySelector('header nav a[href="case-studies.html"]').parentElement.classList.contains('current')).toBe(true);
  });

  test('generated case study hero meta text keeps readable dark-mode contrast', async () => {
    const darkModeCss = await readPage('css/dark-mode.css');

    expect(darkModeCss).toContain('.generated-case-hero .service-hero-meta');
    expect(darkModeCss).toContain('.generated-case-hero .service-hero-meta li');
    expect(darkModeCss).toContain('color: var(--dm-text-secondary) !important');
  });

  test('portfolio links Case Study cards to first-class pages instead of opening the preview frame', async () => {
    const html = await readPage('portfolio.html');
    createDom(html, 'http://127.0.0.1/portfolio.html');

    const caseCards = Array.from(document.querySelectorAll('.card.portfolio-item[data-category~="case-study"]'));
    expect(caseCards.length).toBe(4);
    expect(caseCards.map((card) => card.querySelector('.portfolio-item-title-link').getAttribute('href'))).toEqual([
      'case-employee-assessment-bootcamp.html',
      'case-administrative-communication.html',
      'case-learning-organization-strategy.html',
      'case-ybb-mentoring-workbook.html'
    ]);
    expect(caseCards.every((card) => !card.querySelector('button.view-details-button'))).toBe(true);
    expect(caseCards.every((card) => card.querySelector('a.view-details-button').textContent === 'Read Case Study')).toBe(true);
  });

  test('case study card links keep native navigation instead of being intercepted as previews', async () => {
    const html = await readPage('portfolio.html');
    createDom(html, 'http://127.0.0.1/portfolio.html');
    globalThis.console = window.console;

    await importFresh('../../js/script.js');
    fireDOMContentLoaded();

    const caseCard = document.querySelector('#case-learning-organization-strategy-evaluation-system');
    const caseStudyButton = caseCard.querySelector('a.view-details-button');
    const caseStudyTitle = caseCard.querySelector('.portfolio-item-title-link');

    const buttonClick = new window.MouseEvent('click', { bubbles: true, cancelable: true });
    const titleClick = new window.MouseEvent('click', { bubbles: true, cancelable: true });

    expect(caseStudyButton.dispatchEvent(buttonClick)).toBe(true);
    expect(buttonClick.defaultPrevented).toBe(false);
    expect(caseStudyTitle.dispatchEvent(titleClick)).toBe(true);
    expect(titleClick.defaultPrevented).toBe(false);
    expect(document.getElementById('pdf-modal').hidden).toBe(true);
  });

  test('case study artifact cards open same-origin previews without visible direct artifact links', async () => {
    const html = await readPage('case-administrative-communication.html');
    const window = createDom(html, 'http://127.0.0.1/case-administrative-communication.html');
    globalThis.console = window.console;

    await importFresh('../../js/script.js');
    fireDOMContentLoaded();

    const artifactCards = Array.from(document.querySelectorAll('.case-artifact-card'));
    expect(artifactCards.length).toBe(7);
    expect(artifactCards[0].querySelector('.card-image img').getAttribute('src'))
      .toBe('assets/images/portfolio/bnsp4-training-need-analysis.webp');
    expect(document.querySelectorAll('.generated-case-artifacts a[href$=".pdf"]').length).toBe(0);
    expect(document.querySelector('.generated-case-artifacts').textContent).not.toContain('Open PDF artifact');

    const firstButton = artifactCards[0].querySelector('.view-details-button');
    expect(firstButton.dataset.pdf).toBe('assets/pdf/portfolio/bnsp4_training_need_analysis.pdf');
    firstButton.click();

    expect(document.getElementById('pdf-modal').hidden).toBe(false);
    expect(document.getElementById('pdf-modal-title').textContent).toBe('Administrative Communication Training Needs Analysis');
    expect(document.getElementById('pdf-iframe').src).toContain('/assets/pdf/portfolio/bnsp4_training_need_analysis.pdf#toolbar=0');

    document.querySelector('.close-modal').click();
    artifactCards[1].querySelector('.portfolio-item-thumbnail-link').click();
    expect(document.getElementById('pdf-modal').hidden).toBe(false);
    expect(document.getElementById('pdf-modal-title').textContent).toBe('Competency-Based Communication Training Proposal');
    expect(window.location.hash).toBe('');
  });

  test('portfolio page ignores malformed hash selectors without aborting initialization', async () => {
    const html = await readPage('portfolio.html');
    createDom(html, 'http://127.0.0.1/portfolio.html#project-%5Bbroken');
    globalThis.console = window.console;

    await importFresh('../../js/script.js');
    expect(() => fireDOMContentLoaded()).not.toThrow();

    const modal = document.getElementById('pdf-modal');
    const safeButton = Array.from(document.querySelectorAll('.view-details-button'))
      .find((button) => button.dataset.pdf);

    expect(modal.hidden).toBe(true);
    safeButton.click();
    expect(modal.hidden).toBe(false);
  });

  test('contact page pre-fills inquiry context and clears stored data', async () => {
    const html = await readPage('contact.html');
    createDom(html, 'http://127.0.0.1/contact.html?engagement=mentoring');
    document.body.insertAdjacentHTML('beforeend', `
      <form class="contact-form">
        <input id="name" name="name">
        <input id="email" name="email">
        <input id="company" name="organisation">
        <textarea id="message" name="message"></textarea>
        <select id="service-interest" name="service">
          <option value="training">Training</option>
          <option value="learning-materials">Learning materials</option>
          <option value="mentoring">Mentoring</option>
          <option value="speaking">Speaking</option>
        </select>
      </form>
      <p id="contact-prefill-message" hidden></p>
    `);
    sessionStorage.setItem('engagementInquiry', JSON.stringify({
      engagementType: 'learning-powerpoint',
      name: 'Daffa',
      email: 'daffa@example.com',
      organisation: 'Learning Lab',
      goal: 'Create a facilitator-ready learning deck.'
    }));

    await importFresh('../../js/script.js');
    fireDOMContentLoaded();

    expect(document.querySelector('#name').value).toBe('Daffa');
    expect(document.querySelector('#email').value).toBe('daffa@example.com');
    expect(document.querySelector('#message').value).toBe('Create a facilitator-ready learning deck.');
    expect(document.querySelector('#service-interest').value).toBe('learning-materials');
    expect(document.getElementById('contact-prefill-message').hasAttribute('hidden')).toBe(false);
    expect(sessionStorage.getItem('engagementInquiry')).toBeNull();
  });

  test('engagement inquiry forms save payloads before redirecting to contact page', async () => {
    const window = createDom(`
      <form class="engagement-inquiry-form" data-engagement-type="custom-training" action="contact.html">
        <input name="name" value="Client">
        <input name="email" value="client@example.com">
        <input name="organisation" value="Company">
        <input name="timeline" value="Q2">
        <textarea name="goal">Train managers</textarea>
        <button type="submit">Submit</button>
      </form>
    `, 'http://127.0.0.1/index.html');

    await importFresh('../../js/script.js');
    fireDOMContentLoaded();

    document.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    const payload = JSON.parse(sessionStorage.getItem('engagementInquiry'));

    expect(payload).toEqual({
      engagementType: 'custom-training',
      name: 'Client',
      email: 'client@example.com',
      organisation: 'Company',
      timeline: 'Q2',
      goal: 'Train managers'
    });
    expect(window.location.href.endsWith('/contact.html')).toBe(true);
  });

  test('homepage connects core practices to filtered evidence and explains the working method', async () => {
    createDom(await readPage('index.html'), 'http://127.0.0.1/index.html');

    expect(document.querySelector('.hero-actions a[href="portfolio.html?area=all"]')).not.toBeNull();
    expect(document.querySelector('[data-practice-area="training"] a[href="portfolio.html?area=training-workshop"]')).not.toBeNull();
    expect(document.querySelector('[data-practice-area="learning-materials"] a[href="portfolio.html?area=learning-materials"]')).not.toBeNull();
    expect(document.querySelector('[data-practice-area="analytics"] a[href="portfolio.html?area=learning-analytics"]')).not.toBeNull();
    expect(document.querySelector('#how-i-work h2')?.textContent).toBe('How I Work');
    expect(document.querySelectorAll('#how-i-work .approach-steps > li')).toHaveLength(5);
    expect(document.querySelectorAll('#how-i-work .approach-steps a[href^="case-"]')).toHaveLength(5);
    expect(document.querySelectorAll('[data-featured-testimonial][data-practice-areas]')).toHaveLength(3);
  });

  test('homepage keeps its below-fold mobile hero image out of the critical request path', async () => {
    createDom(await readPage('index.html'), 'http://127.0.0.1/index.html');
    const heroImage = document.querySelector('#showcase .hero-visual img');
    const heroPreload = document.querySelector('link[rel="preload"][as="image"][href="dafghif_cover.png"]');

    expect(heroImage?.getAttribute('loading')).toBe('lazy');
    expect(heroImage?.getAttribute('fetchpriority')).toBe('low');
    expect(heroPreload?.getAttribute('media')).toBe('(min-width: 768px)');
  });
});
