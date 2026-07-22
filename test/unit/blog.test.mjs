import { afterEach, describe, expect, test } from 'bun:test';
import { createDom, fireDOMContentLoaded, importFresh, resetDom } from '../helpers/dom.mjs';

afterEach(() => {
  resetDom();
});

describe('blog card rendering', () => {
  test('renders Medium posts with safe outbound links and images', async () => {
    createDom('<main><section id="blog-cards"></section></main>', 'http://127.0.0.1/blog.html');

    await importFresh('../../src/blog.js');
    fireDOMContentLoaded();

    const cards = document.querySelectorAll('.blog-card');
    expect(cards.length).toBeGreaterThan(0);

    const firstCard = cards[0];
    expect(firstCard.querySelector('.blog-card-body > h2.blog-card-title')).toBeTruthy();
    const links = firstCard.querySelectorAll('a');
    expect(links.length).toBe(2);
    for (const link of links) {
      expect(link.href.startsWith('https://medium.com/')).toBe(true);
      expect(link.target).toBe('_blank');
      expect(link.rel).toBe('noopener noreferrer');
    }

    const image = firstCard.querySelector('img');
    expect(image).toBeTruthy();
    expect(['cdn-images-1.medium.com', 'miro.medium.com']).toContain(new URL(image.src).hostname);
    expect(image.loading).toBe('eager');
    expect(image.referrerPolicy).toBe('no-referrer');
  });

  test('does nothing when the blog container is missing', async () => {
    createDom('<main></main>', 'http://127.0.0.1/blog.html');

    await expect(importFresh('../../src/blog.js')).resolves.toBeDefined();
    expect(() => fireDOMContentLoaded()).not.toThrow();
  });
});
