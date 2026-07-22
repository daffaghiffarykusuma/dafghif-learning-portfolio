import { describe, expect, test } from 'bun:test';
import { initSharedPage } from '../../src/site/pages/shared-page.js';

describe('Shared Page', () => {
  test('isolates optional enhancement failures and continues remaining setup', () => {
    const events = [];
    const warnings = [];

    initSharedPage({
      warn: (...args) => warnings.push(args),
      initializers: [
        {
          name: 'navigation',
          init: () => {
            events.push('navigation');
            throw new TypeError('navigation unavailable');
          }
        },
        {
          name: 'testimonials',
          init: () => events.push('testimonials')
        }
      ]
    });

    expect(events).toEqual(['navigation', 'testimonials']);
    expect(warnings).toHaveLength(1);
    expect(warnings[0][0]).toBe('Optional page initializer failed: navigation');
    expect(warnings[0][1]).toBeInstanceOf(TypeError);
  });
});
