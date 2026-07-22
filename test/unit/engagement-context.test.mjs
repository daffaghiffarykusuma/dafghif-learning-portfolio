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
    const { initEngagementInquiryJourney } = await importFresh('../../src/site/engagement-inquiry-journey.ts');

    initEngagementInquiryJourney();

    expect(document.getElementById('contact-context').textContent).toBe('Regarding: Score Audit Corrections');
    expect(decodeURIComponent(document.querySelector('.whatsapp').href)).toContain('Score Audit Corrections');
    expect(decodeURIComponent(document.querySelector('.email').href)).toContain('Score Audit Corrections');
  });

  test('clears malformed stored inquiry context after reaching the contact form', async () => {
    createDom('<form class="contact-form"></form>', 'http://127.0.0.1/contact.html');
    sessionStorage.setItem('engagementInquiry', JSON.stringify([]));
    const { initEngagementInquiryJourney } = await importFresh('../../src/site/engagement-inquiry-journey.ts');

    initEngagementInquiryJourney();

    expect(sessionStorage.getItem('engagementInquiry')).toBeNull();
  });
});
