import { afterEach, describe, expect, test } from 'bun:test';
import blogData from '../../assets/blog.json';
import { renderBlogCards } from '../../src/site/blog-cards.ts';
import { createPublicationSourceFacts } from '../../src/site/publication-source-facts.ts';
import { createDom, fireDOMContentLoaded, importFresh, resetDom } from '../helpers/dom.mjs';

// Generation renders the cards into blog.html; this mirrors that, then runs the page script.
// happy-dom never loads images, so covers report as already failed unless they are
// marked as still loading, which is what a browser shows while the script starts.
const createBlogPage = async ({ coversStillLoading = true } = {}) => {
  createDom('<main><section id="blog-cards"></section></main>', 'http://127.0.0.1/blog.html');
  const { publications } = createPublicationSourceFacts(blogData);
  document.getElementById('blog-cards').append(renderBlogCards(document, publications));
  Object.defineProperty(window.HTMLImageElement.prototype, 'complete', { configurable: true, get: () => !coversStillLoading });
  await importFresh('../../src/blog.ts');
  fireDOMContentLoaded();
};

afterEach(() => {
  resetDom();
});

describe('blog card rendering', () => {
  test('renders Medium posts with safe outbound links and images', async () => {
    await createBlogPage();

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
    expect(image.getAttribute('fetchpriority')).toBe('high');
    // 400px cards on 1x screens take the smaller rendition; 2x screens and phones the 800px one.
    expect(image.getAttribute('srcset')).toMatch(/resize:fit:400\/format:webp\/.+ 400w, .+resize:fit:800\/format:webp\/.+ 800w$/);
    expect(image.getAttribute('sizes')).toBeTruthy();
    expect(document.querySelectorAll('img[loading="eager"]')).toHaveLength(1);
  });

  test('labels each post language and marks it for assistive technology', async () => {
    await createBlogPage();

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
    await createBlogPage();

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

  test('swaps a cover that fails to load for the empty media state', async () => {
    await createBlogPage();
    const media = document.querySelector('.blog-card-media');
    media.querySelector('img').dispatchEvent(new window.Event('error'));
    expect(media.classList.contains('blog-card-media-empty')).toBe(true);
    expect(media.querySelector('img')).toBeNull();
    expect(document.querySelectorAll('.blog-card-media img').length).toBeGreaterThan(0);
  });

  test('also swaps covers that failed before the script ran', async () => {
    await createBlogPage({ coversStillLoading: false });
    const media = [...document.querySelectorAll('.blog-card-media')];
    expect(media.length).toBeGreaterThan(0);
    expect(media.every((item) => item.classList.contains('blog-card-media-empty') && !item.querySelector('img'))).toBe(true);
  });

  test('renders an empty state when there are no publications', () => {
    createDom('<main><section id="blog-cards"></section></main>', 'http://127.0.0.1/blog.html');
    document.getElementById('blog-cards').append(renderBlogCards(document, []));
    expect(document.getElementById('blog-cards').textContent).toBe('No publications found.');
  });

  test('does nothing when the blog page has no cards', async () => {
    createDom('<main></main>', 'http://127.0.0.1/blog.html');

    await expect(importFresh('../../src/blog.ts')).resolves.toBeDefined();
    expect(() => fireDOMContentLoaded()).not.toThrow();
  });
});
