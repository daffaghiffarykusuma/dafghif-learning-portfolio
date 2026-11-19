import { describe, expect, test } from 'bun:test';
import { Window } from 'happy-dom';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { SITE_NAVIGATION, parseSitePageSource, renderSitePage } from '../../scripts/site/site-page-shell.ts';
import { createSitePageIdentity } from '../../src/site/site-page-identity.ts';
import { projectRoot } from '../helpers/dom.mjs';

const parse = (html) => {
  const document = new Window().document;
  document.write(html);
  return document;
};

const source = (frontMatter, content = '<main id="main-content"><h1>Page</h1></main>') =>
  `<!--site-page\n${JSON.stringify(frontMatter)}\n-->\n${content}`;

describe('Site Page Shell', () => {
  test('renders identity, navigation, skip links, invitation, and scripts from one page description', () => {
    const document = parse(renderSitePage({
      identity: createSitePageIdentity({ kind: 'case-study', pagePath: 'case-sample.html' }),
      title: 'Sample <Case>',
      description: 'A sample & case.',
      content: '<main id="main-content"><h1>Sample</h1></main>',
      skipLinks: [{ href: '#work', label: 'Skip to work' }],
      closingInvitation: { heading: 'Talk roles or projects', body: 'Get in touch.', label: 'Get in touch' },
      artifactPreview: true,
      scripts: ['src/extra.ts']
    }));

    expect(document.title).toBe('Sample <Case>');
    expect(document.body.dataset).toMatchObject({ pageKind: 'case-study', pagePath: 'case-sample.html', navigationPage: 'case-studies.html' });
    expect([...document.querySelectorAll('header nav li a')].map((link) => link.getAttribute('href')))
      .toEqual(SITE_NAVIGATION.map(({ href }) => href));
    expect([...document.querySelectorAll('header nav li.current a')].map((link) => link.getAttribute('href'))).toEqual(['case-studies.html']);
    expect([...document.querySelectorAll('.skip-nav')].map((link) => link.getAttribute('href'))).toEqual(['#main-content', '#work']);
    expect(document.querySelector('footer .footer-cta a').getAttribute('href')).toBe('contact.html');
    expect(document.querySelector('footer .footer-meta').textContent).toContain('All Rights Reserved.');
    expect(document.getElementById('pdf-modal')).toBeTruthy();
    expect([...document.querySelectorAll('script')].map((script) => script.getAttribute('src'))).toEqual(['src/script.ts', 'src/extra.ts']);
  });

  test('ends a page without an invitation or modal at the copyright line', () => {
    const document = parse(renderSitePage({
      identity: createSitePageIdentity({ kind: 'contact', pagePath: 'contact.html' }),
      title: 'Contact', description: 'Contact.', content: '<main></main>'
    }));
    expect(document.querySelector('.footer-cta')).toBeNull();
    expect(document.getElementById('pdf-modal')).toBeNull();
    expect(document.querySelector('footer .footer-meta')).toBeTruthy();
  });

  test('rejects Site Page Sources it cannot render faithfully', () => {
    const valid = { kind: 'home', title: 'Home', description: 'Home page.' };
    expect(parseSitePageSource({ pagePath: 'index.html', source: source(valid) }).identity)
      .toEqual({ kind: 'home', pagePath: 'index.html', navigationPage: 'index.html' });
    expect(() => parseSitePageSource({ pagePath: 'index.html', source: '<main></main>' })).toThrow('front matter comment');
    expect(() => parseSitePageSource({ pagePath: 'index.html', source: '<!--site-page\n{ nope }\n-->' })).toThrow('not valid JSON');
    expect(() => parseSitePageSource({ pagePath: 'index.html', source: source({ ...valid, kind: 'landing' }) })).toThrow('not a Site Page Identity kind');
    expect(() => parseSitePageSource({ pagePath: 'index.html', source: source({ ...valid, footer: 'x' }) })).toThrow('unknown Site Page Source field(s): footer');
    expect(() => parseSitePageSource({ pagePath: 'index.html', source: source({ ...valid, title: '' }) })).toThrow('missing title');
  });

  test('every committed Site Page Source parses', async () => {
    const dir = path.join(projectRoot, 'page-sources');
    for (const pagePath of (await readdir(dir)).filter((name) => name.endsWith('.html'))) {
      const pageSource = await readFile(path.join(dir, pagePath), 'utf8');
      expect(() => parseSitePageSource({ pagePath, source: pageSource })).not.toThrow();
    }
    expect(await readFile(path.join(dir, 'portfolio.html'), 'utf8')).toContain('<div class="grid grid-cols-3 portfolio-items-grid"></div>');
  });

  test('renders a root base and noindex only for pages that ask for them', () => {
    const render = (extra) => parse(renderSitePage({
      identity: createSitePageIdentity({ kind: 'not-found', pagePath: '404.html' }),
      title: 'Not found',
      description: 'Missing page.',
      content: '<main id="main-content"><h1>Missing</h1></main>',
      ...extra
    }));

    const notFound = render({ rootRelative: true, noindex: true });
    expect(notFound.querySelector('base').getAttribute('href')).toBe('/');
    // The base must precede every relative URL in the head.
    expect(notFound.head.firstElementChild.nextElementSibling.tagName).toBe('BASE');
    expect(notFound.querySelector('meta[name="robots"]').getAttribute('content')).toBe('noindex');

    const ordinary = render({});
    expect(ordinary.querySelector('base')).toBeNull();
    expect(ordinary.querySelector('meta[name="robots"]')).toBeNull();
  });
});
