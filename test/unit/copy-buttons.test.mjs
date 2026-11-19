import { afterEach, expect, test } from 'bun:test';
import { createDom, resetDom } from '../helpers/dom.mjs';
import { initCopyButtons } from '../../src/site/page-enhancements.ts';

afterEach(resetDom);

const markup = '<button type="button" data-copy-text="hello@example.com" data-copy-label="Copy email address" hidden>Copy address</button>';
const settle = async () => { for (let i = 0; i < 5; i += 1) await Promise.resolve(); };

test('stays hidden when the Clipboard API is unavailable', () => {
  createDom(markup);
  Object.defineProperty(window.navigator, 'clipboard', { value: undefined, configurable: true });
  initCopyButtons(document);
  expect(document.querySelector('button').hidden).toBe(true);
});

test('copies its text, confirms in place, and reports a failure with the value', async () => {
  createDom(markup);
  const written = [];
  let fail = false;
  Object.defineProperty(window.navigator, 'clipboard', {
    configurable: true,
    value: { writeText: async (text) => { if (fail) throw new Error('denied'); written.push(text); } }
  });
  initCopyButtons(document);
  const button = document.querySelector('button');
  expect(button.hidden).toBe(false);
  expect(button.getAttribute('aria-label')).toBe('Copy email address');

  button.click();
  await settle();
  expect(written).toEqual(['hello@example.com']);
  expect(button.textContent).toBe('Copied');
  expect(button.hasAttribute('aria-label')).toBe(false);

  fail = true;
  button.click();
  await settle();
  expect(button.textContent).toBe('Copy failed');
  expect(button.getAttribute('aria-label')).toContain('hello@example.com');
});
