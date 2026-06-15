import { afterEach, describe, expect, test } from 'bun:test';
import { createDom, importFresh, resetDom } from '../helpers/dom.mjs';

afterEach(() => {
  resetDom();
});

describe('site navigation', () => {
  test('opens and closes the mobile navigation as one document-level state', async () => {
    createDom(`
      <header>
        <button class="menu-toggle" aria-expanded="false">Menu</button>
        <nav id="site-navigation">
          <ul>
            <li><a href="portfolio.html">Portfolio</a></li>
          </ul>
        </nav>
      </header>
    `, 'http://127.0.0.1/index.html');

    const { initNavigation } = await importFresh('../../js/site/navigation.js');
    initNavigation();

    const toggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('nav');

    toggle.click();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(nav.classList.contains('active')).toBe(true);
    expect(document.body.classList.contains('navigation-open')).toBe(true);

    nav.querySelector('a').click();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(nav.classList.contains('active')).toBe(false);
    expect(document.body.classList.contains('navigation-open')).toBe(false);
  });
});
