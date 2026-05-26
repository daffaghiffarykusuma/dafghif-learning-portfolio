import { normalizePortfolioItem, normalizeText } from './portfolio-item-catalog.mjs';

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const normalizeArtifact = (artifact = {}) => ({
  title: normalizeText(artifact.title),
  description: normalizeText(artifact.description),
  href: normalizeText(artifact.href),
  linkLabel: normalizeText(artifact.linkLabel) || 'Open Artifact'
});

export const getCaseStudySources = (portfolioSource = {}) =>
  Array.isArray(portfolioSource.caseStudies) ? portfolioSource.caseStudies : [];

export const createCaseStudyPortfolioItem = (caseStudy = {}) =>
  normalizePortfolioItem({
    id: caseStudy.id,
    title: caseStudy.portfolioItemTitle || `${caseStudy.title} Case Study`,
    practiceArea: caseStudy.practiceArea,
    tags: ['case-study', ...(Array.isArray(caseStudy.tags) ? caseStudy.tags : [])],
    description: caseStudy.description,
    image: caseStudy.image,
    sourceArtifact: caseStudy.outputPath,
    sourceType: 'html-viewer',
    portfolioItemUrl: caseStudy.portfolioItemUrl || `portfolio.html#${caseStudy.id}`,
    discussUrl: caseStudy.discussUrl || `contact.html?portfolioItem=${encodeURIComponent(caseStudy.portfolioItemTitle || caseStudy.title)}`
  });

export const expandCaseStudyPortfolioSource = (portfolioSource = {}) => {
  const caseStudyItems = getCaseStudySources(portfolioSource).map(createCaseStudyPortfolioItem);
  const caseStudyIds = new Set(caseStudyItems.map((item) => item.id));
  const portfolioItems = Array.isArray(portfolioSource.portfolioItems) ? portfolioSource.portfolioItems : [];
  const nonCaseStudyItems = portfolioItems.filter((item) => !caseStudyIds.has(normalizeText(item.id)));

  return {
    ...portfolioSource,
    portfolioItems: [...caseStudyItems, ...nonCaseStudyItems],
    portfolioItemCount: caseStudyItems.length + nonCaseStudyItems.length
  };
};

const renderListItems = (items = []) =>
  items
    .map((item) => `<li><strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(item.value)}</li>`)
    .join('\n        ');

const renderFlowItems = (items = []) =>
  items
    .map((item) => `<li><strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(item.value)}</li>`)
    .join('\n        ');

const renderArtifactItems = (artifacts = []) =>
  artifacts
    .map((artifact) => {
      const item = normalizeArtifact(artifact);
      return `<li>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.description)}</p>
          <a href="${escapeHtml(item.href)}"${item.href.startsWith('http') || item.href.endsWith('.pdf') ? ' target="_blank" rel="noopener noreferrer"' : ''}>${escapeHtml(item.linkLabel)}</a>
        </li>`;
    })
    .join('\n        ');

export const renderCaseStudyHtml = (caseStudy = {}) => {
  const title = normalizeText(caseStudy.title);
  const accent = normalizeText(caseStudy.accentColor) || '#0f766e';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(caseStudy.documentTitle || title)}</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #1f2933;
      --muted: #52606d;
      --line: #d9e2ec;
      --surface: #ffffff;
      --accent: ${escapeHtml(accent)};
    }

    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: #f7f9fb;
      color: var(--ink);
      line-height: 1.55;
    }

    main {
      max-width: 920px;
      margin: 0 auto;
      padding: 32px 20px 44px;
    }

    header,
    section {
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 18px;
    }

    h1,
    h2,
    h3 {
      margin: 0 0 12px;
      line-height: 1.2;
    }

    p {
      margin: 0 0 12px;
      color: var(--muted);
    }

    ul,
    ol {
      margin: 0;
      padding-left: 22px;
    }

    li {
      margin-bottom: 10px;
    }

    a {
      color: var(--accent);
      font-weight: 700;
    }

    .eyebrow {
      margin-bottom: 8px;
      color: var(--accent);
      font-size: 0.82rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .artifact-list {
      display: grid;
      gap: 12px;
      padding-left: 0;
      list-style: none;
    }

    .artifact-list li {
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 14px;
      background: #fbfdff;
    }

    .artifact-list p {
      margin-bottom: 8px;
    }
  </style>
</head>
<body>
  <main>
    <header>
      <p class="eyebrow">${escapeHtml(caseStudy.eyebrow || 'Case Study')}</p>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(caseStudy.summary)}</p>
    </header>

    <section>
      <h2>Reviewer Context</h2>
      <ul>
        ${renderListItems(caseStudy.reviewerContext)}
      </ul>
    </section>

    <section>
      <h2>Case Flow</h2>
      <ol>
        ${renderFlowItems(caseStudy.caseFlow)}
      </ol>
    </section>

    <section>
      <h2>Included Artifacts</h2>
      <ul class="artifact-list">
        ${renderArtifactItems(caseStudy.artifacts)}
      </ul>
    </section>
  </main>
</body>
</html>
`;
};

export const renderCaseStudyPreviews = (portfolioSource = {}) =>
  getCaseStudySources(portfolioSource).map((caseStudy) => ({
    outputPath: normalizeText(caseStudy.outputPath),
    html: renderCaseStudyHtml(caseStudy)
  }));
