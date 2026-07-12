import { afterEach, describe, expect, test } from 'bun:test';
import { createDom, importFresh, resetDom } from '../helpers/dom.mjs';

afterEach(() => {
  resetDom();
});

describe('Engagement Context', () => {
  test('keeps public Portfolio Item context behind the Engagement Inquiry interface', async () => {
    createDom(`
      <p id="contact-context" hidden></p>
      <a class="contact-method-card whatsapp"></a>
      <a class="contact-method-card email"></a>
    `, 'http://127.0.0.1/contact.html?portfolioItem=Score%20Audit%20Corrections');
    const { initEngagementInquiryJourney } = await importFresh('../../js/site/engagement-inquiry-journey.js');

    initEngagementInquiryJourney();

    expect(document.getElementById('contact-context').textContent).toBe('Regarding: Score Audit Corrections');
    expect(decodeURIComponent(document.querySelector('.whatsapp').href)).toContain('Score Audit Corrections');
    expect(decodeURIComponent(document.querySelector('.email').href)).toContain('Score Audit Corrections');
  });
});
