import { afterEach, expect, test } from 'bun:test';
import { createDom, resetDom } from '../helpers/dom.mjs';
import { createPdfPagePreview } from '../../src/site/pdf-page-preview.ts';

afterEach(resetDom);
const settle = async () => { for (let i = 0; i < 10; i += 1) await Promise.resolve(); };

test('renders pages, bounds navigation, and releases the PDF on close', async () => {
  createDom('<div id="host"></div>');
  const rendered = [];
  let destroyed = false;
  const dispose = createPdfPagePreview(document.querySelector('#host'), '/sample.pdf', async () => ({
    promise: Promise.resolve({
      numPages: 2,
      getPage: async (number) => ({
        getViewport: ({ scale }) => ({ width: 600 * scale, height: 800 * scale }),
        render: () => { rendered.push(number); return { promise: Promise.resolve(), cancel() {} }; },
        cleanup() {}
      })
    }),
    destroy: async () => { destroyed = true; }
  }));
  await settle();
  const [previous, next] = document.querySelectorAll('button');
  expect(rendered).toEqual([1]);
  expect(document.querySelector('canvas').hidden).toBe(false);
  expect(previous.disabled).toBe(true);
  next.click();
  await settle();
  expect(rendered).toEqual([1, 2]);
  expect(document.querySelector('[role="status"]').textContent).toBe('Page 2 of 2');
  expect(next.disabled).toBe(true);
  previous.click();
  await settle();
  expect(rendered).toEqual([1, 2, 1]);
  dispose();
  expect(destroyed).toBe(true);
  expect(document.querySelector('canvas')).toBeNull();
});

test('shows a recovery message when the PDF cannot load', async () => {
  createDom('<div id="host"></div>');
  const dispose = createPdfPagePreview(document.querySelector('#host'), '/missing.pdf', async () => {
    throw new Error('Failed to fetch');
  });
  await settle();
  expect(document.querySelector('[role="status"]').textContent).toContain('Open full screen');
  expect(document.querySelector('canvas').hidden).toBe(true);
  expect([...document.querySelectorAll('button')].every((button) => button.disabled)).toBe(true);
  dispose();
});

test('closing during loading destroys the late document without rendering it', async () => {
  createDom('<div id="host"></div>');
  let finish;
  let destroyed = false;
  const dispose = createPdfPagePreview(document.querySelector('#host'), '/sample.pdf', () => new Promise((resolve) => { finish = resolve; }));
  await settle();
  dispose();
  finish({ promise: Promise.reject(new Error('Worker was destroyed')), destroy: async () => { destroyed = true; } });
  await settle();
  expect(destroyed).toBe(true);
  expect(document.querySelector('.pdf-page-preview')).toBeNull();
});
