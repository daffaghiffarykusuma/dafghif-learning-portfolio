export const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const siteNavItems = Object.freeze([
  Object.freeze({ href: 'index.html', label: 'Home' }),
  Object.freeze({ href: 'portfolio.html', label: 'Portfolio' }),
  Object.freeze({ href: 'case-studies.html', label: 'Case Studies' }),
  Object.freeze({ href: 'blog.html', label: 'Blog' }),
  Object.freeze({ href: 'contact.html', label: 'Contact' })
]);

export const portfolioAiContextMetadataLink = Object.freeze({
  href: 'assets/data/portfolio-ai-context.json',
  rel: 'alternate',
  title: 'Portfolio AI Context',
  type: 'application/json'
});

export const renderMetadataLink = ({ href = '', rel = '', title = '', type = '' } = {}) =>
  `<link href="${escapeHtml(href)}" rel="${escapeHtml(rel)}" title="${escapeHtml(title)}" type="${escapeHtml(type)}">`;

export const renderStylesheetLinks = ({ metadataLinks = [] } = {}) => `${metadataLinks.map(renderMetadataLink).join('\n  ')}${metadataLinks.length ? '\n  ' : ''}<link rel="stylesheet" href="css/style.css">
  <link rel="stylesheet" href="css/improvements.css">
  <link rel="stylesheet" href="css/dark-mode.css">`;

export const renderSiteNavigation = (currentPage = '') => `<header>
        <div class="container">
            <div class="header-main">
                <div class="logo">
                    <a href="index.html"><h1>Daffa Ghiffary Kusuma</h1></a>
                </div>
                <button type="button" class="menu-toggle" aria-label="Toggle navigation menu" aria-expanded="false">
                    <span class="menu-icon"></span>
                </button>
            </div>
            <nav>
                <ul>
                    ${siteNavItems.map(({ href, label }) => `<li${href === currentPage ? ' class="current"' : ''}><a href="${href}">${label}</a></li>`).join('\n                    ')}
                </ul>
                <a href="contact.html" class="header-cta">Work With Me</a>
            </nav>
        </div>
    </header>`;

export const renderGeneratedSiteFooter = () => `<footer>
    <div class="container">
      <div class="footer-cta">
        <div class="footer-cta-copy">
          <h2>Ready to collaborate?</h2>
          <p>Share your challenge and receive a tailored response within two business days.</p>
        </div>
        <a href="contact.html" class="cta-button">Book a consultation</a>
      </div>
      <div class="footer-meta">
        <p>&copy; <span id="current-year"></span> Daffa Ghiffary Kusuma. All Rights Reserved.</p>
      </div>
    </div>
  </footer>`;

export const renderSimpleGeneratedSiteFooter = () => `<footer>
        <div class="container">
            <p>&copy; <span id="current-year"></span> Daffa Ghiffary Kusuma. All rights reserved.</p>
        </div>
    </footer>`;

export const renderArtifactPreviewModal = () => `<div aria-labelledby="pdf-modal-title" aria-modal="true" class="pdf-modal" hidden id="pdf-modal" role="dialog">
    <div class="pdf-modal-content" role="document">
      <div class="pdf-modal-header">
        <button type="button" class="close-modal js-close-modal" aria-label="Close artifact preview"></button>
        <h2 id="pdf-modal-title">Portfolio Item Details</h2>
      </div>
      <div class="pdf-modal-body">
        <iframe frameborder="0" height="500px" id="pdf-iframe" referrerpolicy="same-origin" src="" title="Artifact preview" width="100%"></iframe>
      </div>
    </div>
  </div>`;

export const renderGeneratedHtmlDocument = ({
  title,
  description,
  currentPage = '',
  main,
  footer = renderGeneratedSiteFooter(),
  metadataLinks = []
} = {}) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  ${renderStylesheetLinks({ metadataLinks })}
</head>
<body>
  <a href="#main-content" class="skip-nav">Skip to main content</a>
  ${renderSiteNavigation(currentPage)}
  ${main}
  ${footer}
  <script type="module" src="js/script.js"></script>
</body>
</html>
`;
