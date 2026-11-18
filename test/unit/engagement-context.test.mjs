import { afterEach, describe, expect, test } from 'bun:test';
import { createDom, importFresh, resetDom } from '../helpers/dom.mjs';

afterEach(() => {
  resetDom();
});

describe('Engagement Context', () => {
  test('keeps direct contact visits free of invented inquiry context', async () => {
    createDom(`
      <p id="contact-context" hidden></p>
      <a class="contact-method-card whatsapp" href="https://wa.link/rn7fa4"></a>
      <a class="contact-method-card email" href="mailto:daffaghifarykusuma@gmail.com"></a>
    `, 'http://127.0.0.1/contact.html');
    const { initEngagementInquiryJourney } = await importFresh('../../src/site/engagement-inquiry-journey.ts');
    initEngagementInquiryJourney();
    expect(document.getElementById('contact-context').hidden).toBe(true);
    expect(document.querySelector('.whatsapp').href).toBe('https://wa.link/rn7fa4');
    expect(document.querySelector('.email').href).toBe('mailto:daffaghifarykusuma@gmail.com');
  });

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
});

describe('Engagement Inquiry links', () => {
  test('builds the links its contact page reads back', async () => {
    const { createEngagementInquiryHref, readEngagementInquiryLabel } = await import('../../src/site/engagement-inquiry-journey.ts');
    for (const label of ["UMKM's Simple Financial Management", 'Recruitment & Assessment Blueprint', 'SMK Program']) {
      const href = createEngagementInquiryHref({ portfolioItem: label });
      expect(href.startsWith('contact.html?portfolioItem=')).toBe(true);
      expect(readEngagementInquiryLabel(new URL(href, 'https://portfolio.test').search)).toBe(label);
    }
    expect(createEngagementInquiryHref({ engagement: 'Coaching engagement' })).toBe('contact.html?engagement=Coaching+engagement');
    expect(createEngagementInquiryHref({ portfolioItem: '   ' })).toBe('contact.html');
    expect(readEngagementInquiryLabel('?service=Legacy%20link')).toBe('Legacy link');
  });
});
