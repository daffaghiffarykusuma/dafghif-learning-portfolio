import { afterEach, describe, expect, test } from 'bun:test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createDom, fireDOMContentLoaded, importFresh, projectRoot, resetDom } from '../helpers/dom.mjs';

const readPage = (fileName) => readFile(path.join(projectRoot, fileName), 'utf8');

afterEach(() => {
  resetDom();
});

describe('site browser behavior', () => {
  test('contact welcomes role and project inquiries with direct channels before optional guidance', async () => {
    const window = createDom(await readPage('contact.html'), 'http://127.0.0.1/contact.html');
    await importFresh('../../src/script.ts');
    fireDOMContentLoaded();

    // These are audience contracts, not a snapshot of the editorial wording.
    const invitation = document.querySelector('.contact-hero-content').textContent;
    expect(invitation).toMatch(/\b(role|hiring|employment)\b/i);
    expect(invitation).toMatch(/\bprojects?\b/i);
    const guidance = document.querySelector('.contact-message-outline');
    expect(guidance.open).toBe(false);
    const channels = Array.from(document.querySelectorAll('.contact-method-card'));
    expect(channels.map((link) => link.href)).toEqual([
      'https://wa.link/rn7fa4',
      'mailto:daffaghifarykusuma@gmail.com',
      'https://www.linkedin.com/in/daffa-ghiffary-kusuma'
    ]);
    for (const channel of channels) {
      expect(channel.closest('details, [hidden]')).toBeNull();
      expect(channel.compareDocumentPosition(guidance) & window.Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
    expect(document.getElementById('contact-context').hidden).toBe(true);
  });

  test('an Artifact inquiry carries its public title from preview into both contact channels', async () => {
    createDom(await readPage('case-administrative-communication.html'), 'http://127.0.0.1/case-administrative-communication.html');
    await importFresh('../../src/script.ts');
    fireDOMContentLoaded();
    document.querySelector('.case-artifact-card .view-details-button').click();
    const title = 'Administrative Communication Training Needs Analysis';
    expect(document.getElementById('pdf-modal-title').textContent).toBe(title);
    const inquiryUrl = document.getElementById('pdf-discuss').href;

    createDom(await readPage('contact.html'), inquiryUrl);
    await importFresh('../../src/script.ts');
    fireDOMContentLoaded();
    const context = document.getElementById('contact-context');
    expect(context.hidden).toBe(false);
    expect(context.textContent).toContain(title);
    const email = new URL(document.querySelector('.contact-method-card.email').href);
    const whatsapp = new URL(document.querySelector('.contact-method-card.whatsapp').href);
    expect(email.protocol).toBe('mailto:');
    expect(email.pathname).toBe('daffaghifarykusuma@gmail.com');
    expect(email.searchParams.get('subject')).toContain(title);
    expect(email.searchParams.get('body')).toContain(title);
    expect(whatsapp.origin + whatsapp.pathname).toBe('https://wa.me/62895329473179');
    expect(whatsapp.searchParams.get('text')).toBe(email.searchParams.get('body'));
    expect(document.querySelector('.contact-method-card.linkedin').href).toBe('https://www.linkedin.com/in/daffa-ghiffary-kusuma');
  });

  test('catalogue preview follows Back and Forward without resetting discovery', async () => {
    const window = createDom(await readPage('portfolio.html'), 'http://127.0.0.1/portfolio.html?q=communication&area=assessment&format=pdf&show=18');
    await importFresh('../../src/script.ts');
    fireDOMContentLoaded();
    const modal = document.getElementById('pdf-modal');
    const button = document.querySelector('.portfolio-item:not([hidden]) button.view-details-button');
    expect(button).toBeTruthy();
    const visibleIds = () => Array.from(document.querySelectorAll('.portfolio-item:not([hidden])'), (item) => item.id);
    const initialIds = visibleIds();
    const query = window.location.search;
    button.click();
    const previewHash = window.location.hash;
    const historyLength = window.history.length;
    expect(modal.open).toBe(true);
    expect(window.location.search).toBe(query);
    expect(document.activeElement).toBe(modal.querySelector('.close-modal'));

    window.history.back();
    await window.happyDOM.waitUntilComplete();
    expect(window.location.hash).toBe('');
    expect(modal.open).toBe(false);
    expect(document.activeElement).toBe(button);
    expect(visibleIds()).toEqual(initialIds);
    expect(window.location.search).toBe(query);

    window.history.forward();
    await window.happyDOM.waitUntilComplete();
    expect(window.location.hash).toBe(previewHash);
    expect(modal.open).toBe(true);
    expect(window.history.length).toBe(historyLength);
    expect(window.location.search).toBe(query);
    expect(visibleIds()).toEqual(initialIds);
  });

  test.each(['close button', 'Escape', 'backdrop'])('catalogue %s dismissal stays closed on reload and preserves discovery', async (dismissal) => {
    const html = await readPage('portfolio.html');
    const window = createDom(html, 'http://127.0.0.1/portfolio.html?q=communication&area=assessment&format=pdf&show=18');
    await importFresh('../../src/script.ts');
    fireDOMContentLoaded();
    const modal = document.getElementById('pdf-modal');
    const button = document.querySelector('.portfolio-item:not([hidden]) button.view-details-button');
    const query = window.location.search;
    const visibleIds = () => Array.from(document.querySelectorAll('.portfolio-item:not([hidden])'), (item) => item.id);
    const initialIds = visibleIds();
    button.click();
    if (dismissal === 'close button') modal.querySelector('.close-modal').click();
    if (dismissal === 'backdrop') modal.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    if (dismissal === 'Escape') {
      // The DOM helper cannot press native Escape. Follow the dialog cancel/close contract.
      if (modal.dispatchEvent(new window.Event('cancel', { cancelable: true }))) modal.close();
    }
    expect(modal.open).toBe(false);
    expect(window.location.hash).toBe('');
    expect(window.location.search).toBe(query);
    expect(document.activeElement).toBe(button);
    expect(visibleIds()).toEqual(initialIds);

    createDom(html, window.location.href);
    await importFresh('../../src/script.ts');
    fireDOMContentLoaded();
    expect(document.getElementById('pdf-modal').open).toBe(false);
    expect(visibleIds()).toEqual(initialIds);
  });

  test('a direct preview closes locally and returns to search when its Artifact is filtered out', async () => {
    const window = createDom(await readPage('portfolio.html'), 'http://127.0.0.1/portfolio.html?q=unmatched-query#project-manager-coaching-report');
    await importFresh('../../src/script.ts');
    fireDOMContentLoaded();
    const modal = document.getElementById('pdf-modal');
    const historyLength = window.history.length;
    expect(document.getElementById('project-manager-coaching-report').hidden).toBe(true);
    expect(modal.open).toBe(true);
    expect(document.getElementById('pdf-modal-title').textContent).toBe('Manager Coaching Report');
    modal.querySelector('.close-modal').click();
    expect(window.location.href).toBe('http://127.0.0.1/portfolio.html?q=unmatched-query');
    expect(window.history.length).toBe(historyLength);
    expect(modal.open).toBe(false);
    expect(document.activeElement?.id).toBe('portfolio-search');
  });

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

    expect(document.querySelector('.modal')).toBeNull();
    await importFresh('../../src/script.ts');
    fireDOMContentLoaded();

    const modal = document.getElementById('pdf-modal');
    let iframe = document.getElementById('pdf-iframe');
    const safeButton = Array.from(document.querySelectorAll('.view-details-button'))
      .find((button) => button.dataset.pdf);
    expect(safeButton).toBeTruthy();

    const safeCard = safeButton.closest('.portfolio-item');
    safeCard.querySelector('.portfolio-item-thumbnail-link').click();
    expect(modal.open).toBe(true);
    expect(window.location.hash).toBe(`#${safeCard.id}`);
    expect(iframe.src.startsWith('http://127.0.0.1/assets/pdf/portfolio/')).toBe(true);
    expect(iframe.src).toContain('#toolbar=0');
    expect(iframe.hasAttribute('sandbox')).toBe(false);
    const expectedTitle = safeCard.querySelector('h2').textContent;
    expect(document.getElementById('pdf-modal-title').textContent).toBe(expectedTitle);
    expect(iframe.title).toBe(`${expectedTitle} preview`);
    expect(new URL(document.getElementById('pdf-discuss').href).searchParams.get('portfolioItem')).toBe(expectedTitle);

    modal.querySelector('.close-modal').click();
    expect(modal.open).toBe(false);
    iframe = document.getElementById('pdf-iframe');
    expect(iframe.getAttribute('src')).toBe('');
    expect(document.activeElement === safeCard.querySelector('.portfolio-item-thumbnail-link')).toBe(true);

    const safeViewerButton = Array.from(document.querySelectorAll('.view-details-button'))
      .find((button) => button.dataset.viewer);
    expect(safeViewerButton).toBeTruthy();

    safeViewerButton.click();
    expect(modal.open).toBe(true);
    expect(iframe.src.startsWith('http://127.0.0.1/assets/portfolio-viewers/')).toBe(true);
    expect(iframe.src).not.toContain('#toolbar=0');
    expect(iframe.getAttribute('sandbox')).toBe('allow-same-origin allow-popups allow-popups-to-escape-sandbox');

    modal.querySelector('.close-modal').click();

    safeButton.dataset.pdf = 'https://example.com/file.pdf';
    safeButton.removeAttribute('data-viewer');
    safeButton.click();
    expect(modal.open).toBe(false);
    expect(warnings.some((message) => message.includes('Blocked unsafe portfolio preview path'))).toBe(true);
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
      'case-ybb-mentoring-workbook.html',
      'case-applied-leadership-development.html',
      'case-career-readiness-toolkit.html'
    ]));
    expect(document.querySelectorAll('.case-study-card').length).toBe(7);

    const caseHtml = await readPage('case-ybb-mentoring-workbook.html');
    createDom(caseHtml, 'http://127.0.0.1/case-ybb-mentoring-workbook.html');
    globalThis.console = window.console;

    await importFresh('../../src/script.ts');
    fireDOMContentLoaded();

    expect(document.querySelector('main h1').textContent).toBe('Youth Mentoring Workbook and Final Pitch Readiness System');
    expect(document.body.dataset.pageKind).toBe('case-study');
    expect(document.body.dataset.navigationPage).toBe('case-studies.html');
    expect(document.querySelector('header nav a[href="case-studies.html"]').parentElement.classList.contains('current')).toBe(true);
    expect(document.querySelector('.service-hero.generated-case-hero')).toBeTruthy();
    expect(document.querySelector('.generated-case-evidence, .generated-case-meaning')).toBeNull();
    expect(document.querySelector('.generated-case-context')).toBeNull();
    expect(document.querySelector('.case-approach-details .case-steps')).toBeTruthy();
    expect(document.querySelector('.case-approach-details').open).toBe(false);
    expect(document.querySelector('#work-samples.generated-case-artifacts')).toBeTruthy();
    expect(document.querySelectorAll('.case-evidence-note')).toHaveLength(1);
    expect(document.querySelector('footer .footer-cta')).toBeNull();
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

    await importFresh('../../src/script.ts');
    fireDOMContentLoaded();

    expect(document.body.dataset.pageKind).toBe('case-study');
    expect(document.querySelector('header nav a[href="case-studies.html"]').parentElement.classList.contains('current')).toBe(true);
  });

  test('case study card links keep native navigation instead of being intercepted as previews', async () => {
    const html = await readPage('portfolio.html');
    createDom(html, 'http://127.0.0.1/portfolio.html');
    globalThis.console = window.console;

    await importFresh('../../src/script.ts');
    fireDOMContentLoaded();

    const caseCard = document.querySelector('#case-learning-organization-strategy-evaluation-system');
    const caseStudyButton = caseCard.querySelector('a.view-details-button');
    const caseStudyTitle = caseCard.querySelector('.portfolio-item-title-link');

    expect(caseStudyButton.getAttribute('href')).toBe('case-learning-organization-strategy.html');
    expect(caseStudyTitle.getAttribute('href')).toBe('case-learning-organization-strategy.html');
    expect(caseStudyButton.textContent).toBe('Read Case Study');
    expect(caseCard.querySelector('button.view-details-button')).toBeNull();

    const buttonClick = new window.MouseEvent('click', { bubbles: true, cancelable: true });
    const titleClick = new window.MouseEvent('click', { bubbles: true, cancelable: true });

    expect(caseStudyButton.dispatchEvent(buttonClick)).toBe(true);
    expect(buttonClick.defaultPrevented).toBe(false);
    expect(caseStudyTitle.dispatchEvent(titleClick)).toBe(true);
    expect(titleClick.defaultPrevented).toBe(false);
    expect(document.getElementById('pdf-modal').open).toBe(false);
  });

  test('case study artifact cards open same-origin previews without visible direct artifact links', async () => {
    const html = await readPage('case-administrative-communication.html');
    const window = createDom(html, 'http://127.0.0.1/case-administrative-communication.html');
    globalThis.console = window.console;

    await importFresh('../../src/script.ts');
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

    expect(document.getElementById('pdf-modal').open).toBe(true);
    expect(document.getElementById('pdf-modal-title').textContent).toBe('Administrative Communication Training Needs Analysis');
    expect(document.getElementById('pdf-iframe').src).toContain('/assets/pdf/portfolio/bnsp4_training_need_analysis.pdf#toolbar=0');

    document.querySelector('.close-modal').click();
    artifactCards[1].querySelector('.portfolio-item-thumbnail-link').click();
    expect(document.getElementById('pdf-modal').open).toBe(true);
    expect(document.getElementById('pdf-modal-title').textContent).toBe('Competency-Based Communication Training Proposal');
    expect(window.location.hash).toBe('');
  });

  test.each(['case-administrative-communication.html', 'case-learning-organization-strategy.html'])('Case Study section navigation stays native on %s', async (page) => {
    const html = await readPage(page);
    const window = createDom(html, `http://127.0.0.1/${page}`);
    await importFresh('../../src/script.ts');
    fireDOMContentLoaded();

    document.querySelector('a[href="#work-samples"]').click();
    await window.happyDOM.waitUntilComplete();
    expect(window.location.hash).toBe('#work-samples');
    expect(document.getElementById('pdf-modal').open).toBe(false);

    createDom(html, window.location.href);
    await importFresh('../../src/script.ts');
    fireDOMContentLoaded();
    expect(document.getElementById('pdf-modal').open).toBe(false);
    expect(globalThis.window.location.hash).toBe('#work-samples');
  });

  test('Case Study direct Artifact links open and dismiss locally without changing ordinary opening', async () => {
    const window = createDom(await readPage('case-administrative-communication.html'), 'http://127.0.0.1/case-administrative-communication.html');
    const button = document.querySelector('.case-artifact-card .view-details-button');
    window.history.replaceState(null, '', `#${button.closest('.portfolio-item').id}`);
    await importFresh('../../src/script.ts');
    fireDOMContentLoaded();
    const modal = document.getElementById('pdf-modal');
    expect(modal.open).toBe(true);
    expect(document.getElementById('pdf-modal-title').textContent).toBe('Administrative Communication Training Needs Analysis');
    modal.querySelector('.close-modal').click();
    expect(window.location.href).toBe('http://127.0.0.1/case-administrative-communication.html');
    expect(document.activeElement === button).toBe(true);
    button.click();
    expect(modal.open).toBe(true);
    expect(window.location.hash).toBe('');
  });

  test.each(['#project-%5Bbroken', '#%E0%A4%A', '#unknown-artifact'])('portfolio page ignores invalid Artifact hash %s without aborting initialization', async (hash) => {
    const html = await readPage('portfolio.html');
    createDom(html, `http://127.0.0.1/portfolio.html${hash}`);
    globalThis.console = window.console;

    await importFresh('../../src/script.ts');
    expect(() => fireDOMContentLoaded()).not.toThrow();

    const modal = document.getElementById('pdf-modal');
    const safeButton = Array.from(document.querySelectorAll('.view-details-button'))
      .find((button) => button.dataset.pdf);

    expect(modal.open).toBe(false);
    safeButton.click();
    expect(modal.open).toBe(true);
  });

  test('homepage starts with selected cases and preserves CV, catalogue, and practice routes', async () => {
    createDom(await readPage('index.html'), 'http://127.0.0.1/index.html');
    await importFresh('../../src/script.ts');
    fireDOMContentLoaded();

    const primaryAction = document.querySelector('.hero-actions a');
    expect(primaryAction.getAttribute('href')).toBe('#selected-work');
    primaryAction.click();
    expect(window.location.hash).toBe('#selected-work');

    const selectedWork = document.getElementById('selected-work');
    const caseLinks = Array.from(selectedWork.querySelectorAll('h3 a'));
    expect(caseLinks.map((link) => link.getAttribute('href'))).toEqual([
      'case-administrative-communication.html',
      'case-learning-organization-strategy.html',
      'case-entrepreneurship.html'
    ]);
    const cvLink = document.querySelector('.hero-actions a[download]');
    expect(cvLink.getAttribute('href')).toBe('cv/Profile.pdf');
    expect(cvLink.getAttribute('download')).toBe('Daffa_Ghiffary_Kusuma_CV_2026.pdf');
    const catalogueLink = selectedWork.querySelector('a[href="portfolio.html?area=all"]');
    expect(catalogueLink).not.toBeNull();
    expect(document.querySelector('header nav a[href="portfolio.html"]')).not.toBeNull();

    for (const link of [...caseLinks, cvLink, catalogueLink]) {
      const click = new window.MouseEvent('click', { bubbles: true, cancelable: true });
      link.dispatchEvent(click);
      expect(click.defaultPrevented).toBe(false);
    }

    expect(document.querySelector('[data-practice-area="training"] a[href="portfolio.html?area=training-workshop"]')).not.toBeNull();
    expect(document.querySelector('[data-practice-area="learning-materials"] a[href="portfolio.html?area=learning-materials"]')).not.toBeNull();
    expect(document.querySelector('[data-practice-area="analytics"] a[href="portfolio.html?area=learning-analytics"]')).not.toBeNull();
    expect(document.querySelector('#how-i-work h2')?.textContent).toBe('How I Work');
    expect(document.querySelectorAll('#how-i-work .approach-steps > li')).toHaveLength(5);
    expect(document.querySelectorAll('#how-i-work .approach-steps a[href^="case-"]')).toHaveLength(5);
    expect(document.querySelectorAll('#testimonials .testimonial-card')).toHaveLength(12);
  });

  test('homepage keeps its below-fold mobile hero image out of the critical request path', async () => {
    createDom(await readPage('index.html'), 'http://127.0.0.1/index.html');
    const heroImage = document.querySelector('#showcase .hero-visual img');
    const heroPreload = document.querySelector('link[rel="preload"][as="image"][href="dafghif_cover.webp"]');

    expect(heroImage?.getAttribute('loading')).toBe('lazy');
    expect(heroImage?.getAttribute('fetchpriority')).toBe('low');
    expect(heroPreload?.getAttribute('media')).toBe('(min-width: 768px)');
  });
});
