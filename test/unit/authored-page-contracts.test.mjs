import { describe, expect, test } from 'bun:test';
import {
  validateContactChannels,
  validateHomeSelectedWork,
  validateOwnedLinks
} from '../../scripts/validation/authored-page-contracts.ts';
import { urlAttributesForSource } from '../../scripts/site/site-inventory.ts';

const page = (source, relPath = 'index.html') => ({ relPath, source, urlAttributes: urlAttributesForSource(source) });

describe('authored page contracts', () => {
  test('holds discovery and inquiry links to the modules that own them', () => {
    expect(validateOwnedLinks(page(`
      <a href="portfolio.html?area=learning-analytics">ok</a>
      <a href="portfolio.html?area=worksheet&amp;tag=mentoring">ok</a>
      <a href="contact.html?portfolioItem=SMK+Program">ok</a>
      <a href="contact.html">ok</a>
    `))).toEqual([]);

    expect(validateOwnedLinks(page(`
      <a href="portfolio.html?area=learning-analytic">typo</a>
      <a href="portfolio.html?tag=nope">unknown</a>
      <a href="contact.html?portfolioItem=SMK Program">raw space</a>
    `))).toEqual([
      'index.html: portfolio.html?area=learning-analytic uses a area value that Portfolio Item Discovery does not define',
      'index.html: portfolio.html?tag=nope uses a tag value that Portfolio Item Discovery does not define',
      'index.html: inquiry link contact.html?portfolioItem=SMK Program must be contact.html?portfolioItem=SMK+Program, as built by the Engagement Inquiry Journey'
    ]);
    expect(validateOwnedLinks(page('<a href="portfolio.html?area=nope">', 'assets/viewer.html'))).toEqual([]);
  });

  test('requires the contact page channels to be the Engagement Inquiry Journey channels', () => {
    const cards = (whatsapp) => `
      <a href="${whatsapp}" class="contact-method-card whatsapp"></a>
      <a href="mailto:daffaghifarykusuma@gmail.com" class="contact-method-card email"></a>
      <a href="https://www.linkedin.com/in/daffa-ghiffary-kusuma" class="contact-method-card linkedin"></a>`;
    expect(validateContactChannels(cards('https://wa.link/rn7fa4'))).toEqual([]);
    expect(validateContactChannels(cards('https://wa.me/123'))).toEqual([
      'contact.html: whatsapp channel must link to https://wa.link/rn7fa4, the Engagement Inquiry Journey channel'
    ]);
  });

  test('requires Home selected work to follow the featured Case Study order', () => {
    const home = '<a class="selected-work-link" href="case-a.html"></a><a class="selected-work-link" href="case-b.html"></a>';
    expect(validateHomeSelectedWork(home, ['case-a.html', 'case-b.html'])).toEqual([]);
    expect(validateHomeSelectedWork(home, ['case-b.html', 'case-a.html'])).toHaveLength(1);
  });
});
