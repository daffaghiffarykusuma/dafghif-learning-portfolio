import { afterEach, describe, expect, test } from 'bun:test';
import { createDom, importFresh, resetDom } from '../helpers/dom.mjs';

afterEach(() => {
  resetDom();
});

describe('Engagement Context', () => {
  test('keeps a public Portfolio Item in visible and prepared contact context', async () => {
    createDom('', 'http://127.0.0.1/contact.html?portfolioItem=Score%20Audit%20Corrections');

    const { readEngagementContext } = await importFresh('../../js/site/contact-prefill.js');
    const context = readEngagementContext();

    expect(context.label).toBe('Score Audit Corrections');
    expect(context.displayText).toBe('Regarding: Score Audit Corrections');
    expect(context.whatsappUrl).toContain('wa.me/62895329473179');
    expect(decodeURIComponent(context.whatsappUrl)).toContain('Score Audit Corrections');
    expect(context.emailUrl).toContain('mailto:daffaghifarykusuma@gmail.com');
    expect(decodeURIComponent(context.emailUrl)).toContain('Score Audit Corrections');
  });
});
