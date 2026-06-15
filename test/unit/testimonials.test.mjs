import { afterEach, expect, test } from 'bun:test';
import { createDom, importFresh, resetDom } from '../helpers/dom.mjs';

afterEach(() => resetDom());

test('testimonial slider prioritizes explicitly featured stories', async () => {
  createDom(`
    <div data-testimonial-slider data-autoplay="false">
      <button data-slider-prev></button>
      <div data-slider-track>
        <article data-featured-testimonial>Featured one</article>
        <article>Archive only</article>
        <article data-featured-testimonial>Featured two</article>
      </div>
      <button data-slider-next></button>
      <div data-slider-dots></div>
    </div>
  `);
  const { initTestimonials } = await importFresh('../../js/site/testimonials.js');

  initTestimonials();

  expect(document.querySelectorAll('[data-slider-track] > article:not([hidden])')).toHaveLength(2);
  expect(document.querySelector('[data-slider-track] > article:not([data-featured-testimonial])').hidden).toBe(true);
  expect(document.querySelectorAll('[data-slider-dots] button')).toHaveLength(2);
});
