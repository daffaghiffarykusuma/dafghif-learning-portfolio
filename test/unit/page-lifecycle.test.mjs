import { describe, expect, test } from 'bun:test';
import { createPageLifecycle } from '../../js/site/page-lifecycle.js';

describe('Page Lifecycle', () => {
  test('runs optional setup without blocking page setup and cleans up initialized tasks', () => {
    const events = [];
    const warnings = [];
    const lifecycle = createPageLifecycle({
      warn: (...args) => warnings.push(args),
      optional: [
        {
          name: 'shared enhancement',
          init: () => {
            events.push('optional-started');
            throw new TypeError('enhancement unavailable');
          }
        }
      ],
      critical: [
        {
          name: 'portfolio page',
          init: () => {
            events.push('page-started');
            return {
              destroy: () => events.push('page-cleaned')
            };
          }
        }
      ]
    });

    const pageHandle = lifecycle.init();

    expect(events).toEqual(['optional-started', 'page-started']);
    expect(pageHandle).toEqual({ destroy: expect.any(Function) });
    expect(warnings[0][0]).toBe('Optional page initializer failed: shared enhancement');

    lifecycle.destroy();
    expect(events).toEqual(['optional-started', 'page-started', 'page-cleaned']);
  });
});
