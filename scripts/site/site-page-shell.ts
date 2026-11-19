import { renderArtifactPreviewModal } from '../../src/site/artifact-preview-markup.ts';
import { ENGAGEMENT_INQUIRY_PAGE } from '../../src/site/engagement-inquiry-journey.ts';
import {
  createSitePageIdentity,
  isSitePageKind,
  type PageIdentity
} from '../../src/site/site-page-identity.ts';

// Site Page Shell: everything every Learning Portfolio Site page shares — head links,
// header navigation, skip link, closing invitation, footer, Artifact Preview modal,
// and the browser entry script. Pages supply only their identity and content.

export type MetadataLink = { href: string; rel: string; title: string; type: string };
export type SkipLink = { href: string; label: string };
export type PreloadImage = { href: string; media?: string };
export type ClosingInvitation = { heading: string; body: string; label: string; href?: string };

export type SitePage = {
  identity: PageIdentity;
  title: string;
  description: string;
  /** Markup placed between the site header and the footer, usually one <main>. */
  content: string;
  keywords?: string;
  bodyClass?: string;
  preloadImages?: readonly PreloadImage[];
  metadataLinks?: readonly MetadataLink[];
  skipLinks?: readonly SkipLink[];
  /** Renders the Artifact Preview modal after the content. */
  artifactPreview?: boolean;
  /** Footer call to action; omitted pages end with the copyright line only. */
  closingInvitation?: ClosingInvitation;
  /** Additional module scripts loaded after the shared site entry. */
  scripts?: readonly string[];
};

export const SITE_NAVIGATION = Object.freeze([
  Object.freeze({ href: 'index.html', label: 'Home' }),
  Object.freeze({ href: 'portfolio.html', label: 'Portfolio' }),
  Object.freeze({ href: 'case-studies.html', label: 'Case Studies' }),
  Object.freeze({ href: 'blog.html', label: 'Blog' }),
  Object.freeze({ href: ENGAGEMENT_INQUIRY_PAGE, label: 'Contact' })
]);

// Quiet secondary routes repeated in every footer.
const FOOTER_LINKS = Object.freeze([
  { href: 'portfolio.html', label: 'Portfolio', external: false },
  { href: 'case-studies.html', label: 'Case studies', external: false },
  { href: 'cv/Profile.pdf', label: 'CV (PDF)', external: false },
  { href: 'https://www.linkedin.com/in/daffa-ghiffary-kusuma', label: 'LinkedIn', external: true }
]);

export const PORTFOLIO_AI_CONTEXT_METADATA_LINK: Readonly<MetadataLink> = Object.freeze({
  href: 'assets/data/portfolio-ai-context.json',
  rel: 'alternate',
  title: 'Portfolio AI Context',
  type: 'application/json'
});

export const escapeHtml = (value: unknown = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const attributes = (entries: readonly (readonly [string, string | undefined])[]) => entries
  .filter(([, value]) => value)
  .map(([name, value]) => `${name}="${escapeHtml(value)}"`)
  .join(' ');

const renderHead = (page: SitePage) => [
  '<meta charset="UTF-8">',
  '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
  `<title>${escapeHtml(page.title)}</title>`,
  `<meta name="description" content="${escapeHtml(page.description)}">`,
  ...(page.keywords ? [`<meta name="keywords" content="${escapeHtml(page.keywords)}">`] : []),
  '<link rel="icon" href="favicon.ico" sizes="any">',
  '<link rel="icon" type="image/png" sizes="32x32" href="favicon-32.png">',
  '<link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png">',
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lexend+Exa:wght@400..700&amp;family=Lexend:wght@300..700&amp;display=swap">',
  '<link rel="stylesheet" href="src/styles/site.css">',
  ...(page.preloadImages || []).map(({ href, media }) =>
    `<link ${attributes([['rel', 'preload'], ['as', 'image'], ['href', href], ['fetchpriority', 'high'], ['media', media]])}>`),
  ...(page.metadataLinks || []).map(({ href, rel, title, type }) =>
    `<link ${attributes([['href', href], ['rel', rel], ['title', title], ['type', type]])}>`)
].join('\n  ');

const renderHeader = (navigationPage: string) => `<header>
    <div class="container">
      <div class="header-main">
        <div class="logo">
          <a href="index.html"><span class="site-title">Daffa Ghiffary Kusuma</span></a>
        </div>
        <button type="button" class="menu-toggle" aria-label="Toggle navigation menu" aria-expanded="false">
          <span class="menu-icon"></span>
        </button>
      </div>
      <nav>
        <ul>
          ${SITE_NAVIGATION.map(({ href, label }) => `<li${href === navigationPage ? ' class="current"' : ''}><a href="${href}">${label}</a></li>`).join('\n          ')}
        </ul>
        <a href="${ENGAGEMENT_INQUIRY_PAGE}" class="header-cta">Get in touch</a>
      </nav>
    </div>
  </header>`;

const renderFooter = (invitation: ClosingInvitation | undefined) => `<footer>
    <div class="container">${invitation ? `
      <div class="footer-cta">
        <div class="footer-cta-copy">
          <h2>${escapeHtml(invitation.heading)}</h2>
          <p>${escapeHtml(invitation.body)}</p>
        </div>
        <a href="${escapeHtml(invitation.href || ENGAGEMENT_INQUIRY_PAGE)}" class="cta-button">${escapeHtml(invitation.label)}</a>
      </div>` : ''}
      <div class="footer-meta">
        <p>&copy; <span id="current-year"></span> Daffa Ghiffary Kusuma. All Rights Reserved.</p>
        <ul class="footer-links" aria-label="More from Daffa">
          ${FOOTER_LINKS.map(({ href, label, external }) => `<li><a href="${href}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a></li>`).join('\n          ')}
        </ul>
      </div>
    </div>
  </footer>`;

export const renderSitePage = (page: SitePage) => {
  const { identity } = page;
  const skipLinks = [{ href: '#main-content', label: 'Skip to main content' }, ...(page.skipLinks || [])];
  const scripts = ['src/script.ts', ...(page.scripts || [])];
  return `<!DOCTYPE html>
<html lang="en">
<head>
  ${renderHead(page)}
</head>
<body ${attributes([
  ['class', page.bodyClass],
  ['data-page-kind', identity.kind],
  ['data-page-path', identity.pagePath],
  ['data-navigation-page', identity.navigationPage]
])}>
  ${skipLinks.map(({ href, label }) => `<a href="${escapeHtml(href)}" class="skip-nav">${escapeHtml(label)}</a>`).join('\n  ')}
  ${renderHeader(identity.navigationPage)}
  ${page.content.trim()}
  ${page.artifactPreview ? `${renderArtifactPreviewModal()}\n  ` : ''}${renderFooter(page.closingInvitation)}
  ${scripts.map((src) => `<script type="module" src="${escapeHtml(src)}"></script>`).join('\n  ')}
</body>
</html>
`;
};

// ---------------------------------------------------------------------------
// Site Page Sources: authored pages live in page-sources/ as a front-matter
// comment followed by their content. The shell turns each one into a root page.

export type SitePageSource = { pagePath: string; source: string };

const FRONT_MATTER = /^\s*<!--site-page\s*([\s\S]*?)-->\s*/;
const allowedFrontMatterKeys = new Set([
  'kind', 'navigationPage', 'title', 'description', 'keywords', 'bodyClass',
  'preloadImages', 'metadataLinks', 'skipLinks', 'artifactPreview', 'closingInvitation', 'scripts'
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

export const parseSitePageSource = ({ pagePath, source }: SitePageSource): SitePage => {
  const text = source.replace(/\r\n/g, '\n');
  const match = text.match(FRONT_MATTER);
  if (!match) throw new Error(`${pagePath}: Site Page Source must start with a <!--site-page {…} --> front matter comment`);
  let frontMatter: unknown;
  try {
    frontMatter = JSON.parse(match[1]);
  } catch (error) {
    throw new Error(`${pagePath}: Site Page Source front matter is not valid JSON (${(error as Error).message})`);
  }
  if (!isRecord(frontMatter)) throw new Error(`${pagePath}: Site Page Source front matter must be an object`);
  const unknownKeys = Object.keys(frontMatter).filter((key) => !allowedFrontMatterKeys.has(key));
  if (unknownKeys.length) throw new Error(`${pagePath}: unknown Site Page Source field(s): ${unknownKeys.join(', ')}`);
  const { kind, navigationPage, title, description } = frontMatter;
  if (!isSitePageKind(kind)) throw new Error(`${pagePath}: Site Page Source kind "${String(kind)}" is not a Site Page Identity kind`);
  if (typeof title !== 'string' || !title.trim()) throw new Error(`${pagePath}: Site Page Source is missing title`);
  if (typeof description !== 'string' || !description.trim()) throw new Error(`${pagePath}: Site Page Source is missing description`);

  return {
    ...(frontMatter as Omit<SitePage, 'identity' | 'content'>),
    identity: createSitePageIdentity({
      kind,
      pagePath,
      navigationPage: typeof navigationPage === 'string' ? navigationPage : undefined
    }),
    title,
    description,
    content: text.slice(match[0].length)
  };
};

export const renderSitePageSource = (pageSource: SitePageSource) =>
  renderSitePage(parseSitePageSource(pageSource));
