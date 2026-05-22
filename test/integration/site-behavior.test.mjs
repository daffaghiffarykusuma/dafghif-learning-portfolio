import { afterEach, describe, expect, test } from 'bun:test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createDom, fireDOMContentLoaded, importFresh, projectRoot, resetDom } from '../helpers/dom.mjs';

const readPage = (fileName) => readFile(path.join(projectRoot, fileName), 'utf8');

afterEach(() => {
  resetDom();
});

describe('site browser behavior', () => {
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

    safeButton.click();
    expect(modal.hidden).toBe(false);
    expect(iframe.src.startsWith('http://127.0.0.1/assets/pdf/portfolio/')).toBe(true);
    expect(iframe.hasAttribute('sandbox')).toBe(false);

    modal.querySelector('.close-modal').click();
    expect(modal.hidden).toBe(true);
    expect(iframe.getAttribute('src')).toBe('');

    safeButton.dataset.pdf = 'https://example.com/file.pdf';
    safeButton.removeAttribute('data-viewer');
    safeButton.click();
    expect(modal.hidden).toBe(true);
    expect(warnings.some((message) => message.includes('Blocked unsafe portfolio preview path'))).toBe(true);
  });

  test('portfolio page opens an artifact preview from a direct hash link', async () => {
    const html = await readPage('portfolio.html');
    createDom(html, 'http://127.0.0.1/portfolio.html#project-administrative-communication-training-needs-analysis');
    globalThis.console = window.console;

    await importFresh('../../js/script.js');
    fireDOMContentLoaded();

    const modal = document.getElementById('pdf-modal');
    const title = document.getElementById('pdf-modal-title');
    const iframe = document.getElementById('pdf-iframe');

    expect(modal.hidden).toBe(false);
    expect(title.textContent).toBe('Administrative Communication Training Needs Analysis');
    expect(iframe.src).toContain('/assets/pdf/portfolio/bnsp4_training_need_analysis.pdf');
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
});
