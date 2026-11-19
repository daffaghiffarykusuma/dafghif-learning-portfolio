import { afterEach, describe, expect, test } from 'bun:test';
import { createDom, fireDOMContentLoaded, importFresh, resetDom } from '../helpers/dom.mjs';

afterEach(() => {
  resetDom();
});

describe('blog card rendering', () => {
  test('renders Medium posts with safe outbound links and images', async () => {
    createDom('<main><section id="blog-cards"></section></main>', 'http://127.0.0.1/blog.html');

    await importFresh('../../src/blog.ts');
    fireDOMContentLoaded();

    const cards = document.querySelectorAll('.blog-card');
    expect(cards.length).toBeGreaterThan(0);

    const firstCard = cards[0];
    expect(firstCard.querySelector('.blog-card-body > h3.blog-card-title')).toBeTruthy();
    expect(firstCard.closest('.blog-group').querySelector('h2').textContent).toBe('Learning, work, and wellbeing');
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

  test('labels each post language and marks it for assistive technology', async () => {
    createDom('<main><section id="blog-cards"></section></main>', 'http://127.0.0.1/blog.html');
    await importFresh('../../src/blog.ts');
    fireDOMContentLoaded();

    const cards = [...document.querySelectorAll('.blog-card')];
    const indonesian = cards.find((card) => card.lang === 'id');
    const english = cards.find((card) => card.lang === 'en');
    expect(indonesian.querySelector('.blog-card-language').textContent).toBe('Bahasa Indonesia');
    expect(english.querySelector('.blog-card-language').textContent).toBe('English');
    // The language label and call to action are site chrome, so they stay English.
    expect(indonesian.querySelector('.blog-card-language').lang).toBe('en');
    expect(indonesian.querySelector('.blog-card-cta').lang).toBe('en');
    expect(indonesian.querySelector('.blog-card-cta').textContent).toContain('opens Medium in a new tab');
  });

  test('shows two rows per topic and reveals the rest on request', async () => {
    createDom('<main><section id="blog-cards"></section></main>', 'http://127.0.0.1/blog.html');
    await importFresh('../../src/blog.ts');
    fireDOMContentLoaded();

    for (const group of document.querySelectorAll('.blog-group')) {
      const cards = [...group.querySelectorAll('.blog-card')];
      const button = group.querySelector('.blog-show-more button');
      if (cards.length <= 6) {
        expect(button).toBeNull();
        continue;
      }
      expect(cards.filter((card) => !card.hidden)).toHaveLength(6);
      expect(button.textContent).toBe(`Show all ${cards.length} posts`);
      button.click();
      expect(cards.every((card) => !card.hidden)).toBe(true);
      expect(document.activeElement).toBe(cards[6].querySelector('.blog-card-title a'));
      expect(group.querySelector('.blog-show-more')).toBeNull();
    }
  });

  test('does nothing when the blog container is missing', async () => {
    createDom('<main></main>', 'http://127.0.0.1/blog.html');

    await expect(importFresh('../../src/blog.ts')).resolves.toBeDefined();
    expect(() => fireDOMContentLoaded()).not.toThrow();
  });
});
