import { unknownPortfolioDiscoveryParams } from '../../src/portfolio-discovery.ts';
import {
  ENGAGEMENT_INQUIRY_CHANNELS,
  ENGAGEMENT_INQUIRY_PAGE,
  createEngagementInquiryHref
} from '../../src/site/engagement-inquiry-journey.ts';

// Authored Site Page Sources hold editorial copy, but some of their links encode
// rules another module owns. These checks hold each such link to its owner.

type Page = { relPath: string; source: string; urlAttributes: { attr: string; value: string }[] };

const decodeAttribute = (value: string) => value.replace(/&amp;/g, '&');

const splitHref = (href: string) => {
  const [withoutFragment] = href.split('#');
  const queryIndex = withoutFragment.indexOf('?');
  return queryIndex < 0
    ? { pathname: withoutFragment, search: '' }
    : { pathname: withoutFragment.slice(0, queryIndex), search: withoutFragment.slice(queryIndex) };
};

/** Portfolio Item Discovery owns `area` and `tag` values; the Engagement Inquiry Journey owns contact links. */
export const validateOwnedLinks = (page: Page): string[] => {
  // Only root pages link with these page-relative paths.
  if (page.relPath.includes('/')) return [];
  const failures: string[] = [];
  for (const { attr, value } of page.urlAttributes) {
    if (attr !== 'href') continue;
    const href = decodeAttribute(value.trim());
    const { pathname, search } = splitHref(href);
    if (pathname === 'portfolio.html' && search) {
      for (const name of unknownPortfolioDiscoveryParams(search)) {
        failures.push(`${page.relPath}: ${href} uses a ${name} value that Portfolio Item Discovery does not define`);
      }
    }
    if (pathname === ENGAGEMENT_INQUIRY_PAGE && search) {
      const params = new URLSearchParams(search);
      const expected = createEngagementInquiryHref({
        portfolioItem: params.get('portfolioItem') || undefined,
        engagement: params.get('engagement') || undefined
      });
      if (href !== expected) {
        failures.push(`${page.relPath}: inquiry link ${href} must be ${expected}, as built by the Engagement Inquiry Journey`);
      }
    }
  }
  return failures;
};

/** The contact page's default channel links are the Engagement Inquiry Journey's channels. */
export const validateContactChannels = (contactSource: string): string[] => {
  const failures: string[] = [];
  for (const [channel, expected] of Object.entries(ENGAGEMENT_INQUIRY_CHANNELS)) {
    const card = contactSource.match(new RegExp(`<a\\s[^>]*class="contact-method-card ${channel}"[^>]*>`));
    const href = card?.[0].match(/\bhref="([^"]+)"/)?.[1];
    if (!href) failures.push(`${ENGAGEMENT_INQUIRY_PAGE}: missing the ${channel} contact channel card`);
    else if (decodeAttribute(href) !== expected) {
      failures.push(`${ENGAGEMENT_INQUIRY_PAGE}: ${channel} channel must link to ${expected}, the Engagement Inquiry Journey channel`);
    }
  }
  return failures;
};

/** Home's selected work follows the featured Case Study order from the Portfolio Item Source. */
export const validateHomeSelectedWork = (homeSource: string, featuredPagePaths: readonly string[]): string[] => {
  const linked = Array.from(homeSource.matchAll(/class="selected-work-link" href="([^"]+)"/g), (match) => match[1]);
  return linked.join(' ') === featuredPagePaths.join(' ')
    ? []
    : [`index.html: selected work links (${linked.join(', ') || 'none'}) must follow featuredCaseStudyIds in assets/data/portfolio-source.json (${featuredPagePaths.join(', ')})`];
};
