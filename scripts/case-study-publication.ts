import { createArtifactPreviewContract } from '../src/site/artifact-preview-policy.ts';
import {
  createCaseStudyIndexPageIdentity,
  createCaseStudyPageIdentity
} from '../src/site/case-study-page-identity.ts';
import { normalizePortfolioItem, normalizeText, slugify } from './portfolio-item-catalog.ts';
import type { PortfolioItem } from './portfolio-item-catalog.ts';
import type { CaseStudyPageIdentity, PageIdentity } from '../src/site/case-study-page-identity.ts';

type MetadataLink = {
  href: string;
  rel: string;
  title: string;
  type: string;
};

type GeneratedHtmlDocumentOptions = {
  title: string;
  description: string;
  main: string;
  pageIdentity: PageIdentity;
  footer?: string;
  metadataLinks?: readonly MetadataLink[];
};

const escapeHtml = (value: unknown = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const siteNavItems = Object.freeze([
  Object.freeze({ href: 'index.html', label: 'Home' }),
  Object.freeze({ href: 'portfolio.html', label: 'Portfolio' }),
  Object.freeze({ href: 'case-studies.html', label: 'Case Studies' }),
  Object.freeze({ href: 'blog.html', label: 'Blog' }),
  Object.freeze({ href: 'contact.html', label: 'Contact' })
]);

const portfolioAiContextMetadataLink = Object.freeze({
  href: 'assets/data/portfolio-ai-context.json',
  rel: 'alternate',
  title: 'Portfolio AI Context',
  type: 'application/json'
});

const renderMetadataLink = ({ href, rel, title, type }: MetadataLink) =>
  `<link href="${escapeHtml(href)}" rel="${escapeHtml(rel)}" title="${escapeHtml(title)}" type="${escapeHtml(type)}">`;

const renderStylesheetLinks = (metadataLinks: readonly MetadataLink[]) => `${metadataLinks.map(renderMetadataLink).join('\n  ')}${metadataLinks.length ? '\n  ' : ''}<link rel="stylesheet" href="css/style.css">
  <link rel="stylesheet" href="css/improvements.css">
  <link rel="stylesheet" href="css/dark-mode.css">`;

const renderSiteNavigation = (currentPage: string) => `<header>
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
                    ${siteNavItems.map(({ href, label }) => `<li${href === currentPage ? ' class="current"' : ''}><a href="${href}">${label}</a></li>`).join('\n                    ')}
                </ul>
                <a href="contact.html" class="header-cta">Work With Me</a>
            </nav>
        </div>
    </header>`;

const renderPageIdentityAttributes = (pageIdentity: PageIdentity) => [
  ['data-page-kind', pageIdentity.kind],
  ['data-page-path', pageIdentity.pagePath],
  ['data-navigation-page', pageIdentity.navigationPage]
]
  .filter(([, value]) => value)
  .map(([attribute, value]) => `${attribute}="${escapeHtml(value)}"`)
  .join(' ');

const renderGeneratedSiteFooter = () => `<footer>
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

const renderSimpleGeneratedSiteFooter = () => `<footer>
        <div class="container">
            <p>&copy; <span id="current-year"></span> Daffa Ghiffary Kusuma. All rights reserved.</p>
        </div>
    </footer>`;

const renderArtifactPreviewModal = () => `<dialog aria-labelledby="pdf-modal-title" class="pdf-modal" id="pdf-modal">
    <div class="pdf-modal-content" role="document">
      <div class="pdf-modal-header">
        <button type="button" class="close-modal js-close-modal" aria-label="Close artifact preview"></button>
        <div>
          <h2 id="pdf-modal-title">Portfolio Item Details</h2>
          <p id="pdf-modal-meta">Artifact preview</p>
        </div>
      </div>
      <div class="pdf-modal-body">
        <iframe frameborder="0" height="500px" id="pdf-iframe" referrerpolicy="same-origin" src="" title="Artifact preview" width="100%"></iframe>
      </div>
      <div class="pdf-modal-actions">
        <a class="secondary-cta" href="#" id="pdf-open-full">Open full screen</a>
        <a class="cta-button" href="contact.html" id="pdf-discuss">Discuss this Artifact</a>
      </div>
    </div>
  </dialog>`;

const renderGeneratedHtmlDocument = ({
  title,
  description,
  pageIdentity,
  main,
  footer = renderGeneratedSiteFooter(),
  metadataLinks = []
}: GeneratedHtmlDocumentOptions) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  ${renderStylesheetLinks(metadataLinks)}
</head>
<body ${renderPageIdentityAttributes(pageIdentity)}>
  <a href="#main-content" class="skip-nav">Skip to main content</a>
  ${renderSiteNavigation(pageIdentity.navigationPage)}
  ${main}
  ${footer}
  <script type="module" src="src/script.ts"></script>
</body>
</html>
`;

type Image = { src: string; alt: string };
type LabeledValue = { label: string; value: string };

export type CaseStudyArtifact = {
  id: string;
  title: string;
  description: string;
  href: string;
  sourceType: string;
  practiceArea: string;
  tags: string[];
  image: Image;
  linkLabel: string;
};

export type CaseStudy = {
  id: string;
  documentTitle: string;
  title: string;
  portfolioItemTitle: string;
  practiceArea: string;
  eyebrow: string;
  tags: string[];
  description: string;
  summary: string;
  image: Image;
  pagePath: string;
  outputPath: string;
  portfolioItemUrl: string;
  discussUrl: string;
  reviewerContext: LabeledValue[];
  caseFlow: LabeledValue[];
  artifacts: CaseStudyArtifact[];
  absorbedPortfolioItemIds: string[];
};

export type CaseStudyArtifactMetadata = {
  id: string;
  title: string;
  practiceArea: string;
  tags: string[];
  publicDescription: string;
  sourceArtifact: string;
  sourceType: string;
  parentCaseStudy: string;
  image: Image;
};

export type GeneratedCaseStudyPage = { outputPath: string; html: string };

export type CaseStudyPublication = {
  portfolioItems: PortfolioItem[];
  pageIdentities: Readonly<CaseStudyPageIdentity>[];
  pages: GeneratedCaseStudyPage[];
  artifactMetadataByCaseStudyId: Map<string, CaseStudyArtifactMetadata[]>;
};

type CaseStudyCard = Pick<CaseStudy,
  'id' | 'portfolioItemTitle' | 'practiceArea' | 'description' | 'pagePath' | 'image'
> & Partial<Pick<CaseStudy, 'title' | 'summary'>>;

const asRecord = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};

const normalizeStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.map(normalizeText).filter(Boolean) : [];

const normalizeLabeledValues = (value: unknown): LabeledValue[] =>
  Array.isArray(value)
    ? value.map(asRecord).map((item) => ({
      label: normalizeText(item.label),
      value: normalizeText(item.value)
    }))
    : [];

const featuredCaseStudies: readonly CaseStudyCard[] = Object.freeze([
  Object.freeze({
    id: 'case-entrepreneurship-program',
    portfolioItemTitle: 'Entrepreneurship Program for 5,000+ SMK Students',
    practiceArea: 'Custom Training & Workshops',
    description: 'A multi-city entrepreneurship learning journey for vocational students, combining curriculum design, mentor enablement, facilitation, and measurement.',
    pagePath: 'case-entrepreneurship.html',
    image: Object.freeze({
      src: 'assets/images/portfolio/smk.webp',
      alt: 'Entrepreneurship program case study thumbnail'
    })
  })
]);

const pagePathFor = (caseStudy: Pick<CaseStudy, 'pagePath' | 'id'>) =>
  normalizeText(caseStudy.pagePath) || `${normalizeText(caseStudy.id)}.html`;

const normalizeArtifact = (value: unknown): CaseStudyArtifact => {
  const artifact = asRecord(value);
  const image = asRecord(artifact.image);
  const title = normalizeText(artifact.title);
  const href = normalizeText(artifact.href);
  return {
    id: normalizeText(artifact.id) || `artifact-${slugify(title)}`,
    title,
    description: normalizeText(artifact.description),
    href,
    sourceType: normalizeText(artifact.sourceType) || (href.endsWith('.pdf') ? 'pdf' : 'html-viewer'),
    practiceArea: normalizeText(artifact.practiceArea),
    tags: normalizeStringArray(artifact.tags),
    image: {
      src: normalizeText(image.src),
      alt: normalizeText(image.alt) || title
    },
    linkLabel: normalizeText(artifact.linkLabel) || 'Open Artifact'
  };
};

const normalizeCaseStudy = (value: unknown): CaseStudy => {
  const caseStudy = asRecord(value);
  const image = asRecord(caseStudy.image);
  return {
    id: normalizeText(caseStudy.id),
    documentTitle: normalizeText(caseStudy.documentTitle),
    title: normalizeText(caseStudy.title),
    portfolioItemTitle: normalizeText(caseStudy.portfolioItemTitle),
    practiceArea: normalizeText(caseStudy.practiceArea),
    eyebrow: normalizeText(caseStudy.eyebrow),
    tags: normalizeStringArray(caseStudy.tags),
    description: normalizeText(caseStudy.description),
    summary: normalizeText(caseStudy.summary),
    image: { src: normalizeText(image.src), alt: normalizeText(image.alt) },
    pagePath: normalizeText(caseStudy.pagePath),
    outputPath: normalizeText(caseStudy.outputPath),
    portfolioItemUrl: normalizeText(caseStudy.portfolioItemUrl),
    discussUrl: normalizeText(caseStudy.discussUrl),
    reviewerContext: normalizeLabeledValues(caseStudy.reviewerContext),
    caseFlow: normalizeLabeledValues(caseStudy.caseFlow),
    artifacts: Array.isArray(caseStudy.artifacts) ? caseStudy.artifacts.map(normalizeArtifact) : [],
    absorbedPortfolioItemIds: normalizeStringArray(caseStudy.absorbedPortfolioItemIds)
  };
};

const artifactMetadataFor = (caseStudy: CaseStudy): CaseStudyArtifactMetadata[] =>
  caseStudy.artifacts
    .filter((artifact) => artifact.id && artifact.title && artifact.href)
    .map((artifact) => ({
      id: artifact.id,
      title: artifact.title,
      practiceArea: artifact.practiceArea,
      tags: artifact.tags,
      publicDescription: artifact.description,
      sourceArtifact: artifact.href,
      sourceType: artifact.sourceType,
      parentCaseStudy: normalizeText(caseStudy.id),
      image: artifact.image
    }));

const portfolioItemFor = (caseStudy: CaseStudy): PortfolioItem =>
  normalizePortfolioItem({
    id: caseStudy.id,
    title: caseStudy.portfolioItemTitle || `${caseStudy.title} Case Study`,
    practiceArea: caseStudy.practiceArea,
    tags: ['case-study', ...(Array.isArray(caseStudy.tags) ? caseStudy.tags : [])],
    description: caseStudy.description,
    image: caseStudy.image,
    sourceArtifact: pagePathFor(caseStudy),
    sourceType: 'case-study-page',
    portfolioItemUrl: caseStudy.portfolioItemUrl || pagePathFor(caseStudy),
    discussUrl: caseStudy.discussUrl || `contact.html?portfolioItem=${encodeURIComponent(caseStudy.portfolioItemTitle || caseStudy.title)}`
  });

const expandPortfolioItems = (
  portfolioSource: Record<string, unknown>,
  caseStudies: CaseStudy[]
): PortfolioItem[] => {
  const caseStudyItems = caseStudies.map(portfolioItemFor);
  const caseStudyIds = new Set(caseStudyItems.map((item) => item.id));
  const absorbedItemIds = new Set(
    caseStudies
      .flatMap((caseStudy) => caseStudy.absorbedPortfolioItemIds)
      .map(normalizeText)
  );
  const sourceItems = Array.isArray(portfolioSource.portfolioItems)
    ? portfolioSource.portfolioItems.map(normalizePortfolioItem)
    : [];
  return [
    ...caseStudyItems,
    ...sourceItems.filter((item) => {
      const id = normalizeText(item.id);
      return !caseStudyIds.has(id) && !absorbedItemIds.has(id);
    })
  ];
};

const renderCaseStudyCards = (caseStudies: CaseStudy[]) =>
  [...featuredCaseStudies, ...caseStudies]
    .map((caseStudy) => {
      const pagePath = pagePathFor(caseStudy);
      const title = normalizeText(caseStudy.portfolioItemTitle || `${caseStudy.title} Case Study`);
      return `<article class="case-study-card">
                    <a href="${escapeHtml(pagePath)}" class="case-study-card-image">
                        <img src="${escapeHtml(caseStudy.image?.src)}" alt="${escapeHtml(caseStudy.image?.alt || title)}" loading="lazy" decoding="async">
                    </a>
                    <div class="case-study-card-body">
                        <p class="portfolio-item-practice-label">${escapeHtml(caseStudy.practiceArea)}</p>
                        <h2><a href="${escapeHtml(pagePath)}">${escapeHtml(title)}</a></h2>
                        <p>${escapeHtml(caseStudy.description || caseStudy.summary)}</p>
                        <a class="cta-button" href="${escapeHtml(pagePath)}">Read Case Study</a>
                    </div>
                </article>`;
    })
    .join('\n                ');

const renderIndexHtml = (caseStudies: CaseStudy[]) => renderGeneratedHtmlDocument({
  title: 'Case Studies | Daffa Ghiffary Kusuma',
  description: 'Selected learning design case studies by Daffa Ghiffary Kusuma, grouped into decision-ready narratives with artifacts, assumptions, and evidence limits.',
  pageIdentity: createCaseStudyIndexPageIdentity(),
  footer: renderSimpleGeneratedSiteFooter(),
  main: `<main id="main-content" role="main" aria-label="Main content">
        <section class="service-hero service-hero-compact">
            <div class="container">
                <p class="service-eyebrow">Case Studies</p>
                <h1>Selected Learning Design Cases</h1>
                <p class="lead">Explore learning programs, assessment tools, and practical materials. Open a case to see the work and how it was designed.</p>
            </div>
        </section>
        <section class="case-study-index">
            <div class="container">
                <div class="case-study-card-grid">
                ${renderCaseStudyCards(caseStudies)}
                </div>
            </div>
        </section>
    </main>`
});

const renderApproachSteps = (items: LabeledValue[] = []) =>
  items
    .map((item) => `<li>
                            <h3>${escapeHtml(item.label)}</h3>
                            <p>${escapeHtml(item.value)}</p>
                        </li>`)
    .join('\n                        ');

const renderPreviewAttributes = (artifact: CaseStudyArtifact) => {
  const previewContract = createArtifactPreviewContract({
    sourceArtifact: artifact.href,
    sourceType: artifact.sourceType
  });
  return Object.entries(previewContract?.triggerAttributes || {})
    .map(([attribute, value]) => `${attribute}="${escapeHtml(value)}"`)
    .join(' ');
};

const renderArtifactItems = (artifacts: CaseStudyArtifact[] = []) =>
  artifacts
    .map((item, index) => {
      const previewData = renderPreviewAttributes(item);
      const imageLoading = index === 0
        ? 'loading="eager" fetchpriority="high" width="660" height="400"'
        : 'loading="lazy"';
      return `<article id="${escapeHtml(item.id)}" class="card portfolio-item case-artifact-card" data-category="${escapeHtml(item.tags.join(' '))}">
            <div class="card-image">
              <a class="portfolio-item-thumbnail-link" href="#${escapeHtml(item.id)}">
                <img src="${escapeHtml(item.image.src)}" alt="${escapeHtml(item.image.alt)}" ${imageLoading} decoding="async">
              </a>
            </div>
            <div class="card-content">
              <h3><a class="portfolio-item-title-link" href="#${escapeHtml(item.id)}">${escapeHtml(item.title)}</a></h3>
              <p>${escapeHtml(item.description)}</p>
              <div class="card-actions">
                <button class="view-details-button" type="button" ${previewData}>Preview work sample</button>
              </div>
            </div>
          </article>`;
    })
    .join('\n        ');

const renderCaseStudyHtml = (caseStudy: CaseStudy) => {
  const title = normalizeText(caseStudy.title);
  const reviewerContext = Array.isArray(caseStudy.reviewerContext) ? caseStudy.reviewerContext : [];
  const caseFlow = Array.isArray(caseStudy.caseFlow) ? caseStudy.caseFlow : [];
  const artifacts = Array.isArray(caseStudy.artifacts) ? caseStudy.artifacts : [];
  const evidenceNotes = reviewerContext.filter((item) => /limit/i.test(item.label));
  const scope = reviewerContext.filter((item) => !/limit|use case/i.test(item.label));
  const ctaHref = normalizeText(caseStudy.discussUrl) || `contact.html?portfolioItem=${encodeURIComponent(caseStudy.portfolioItemTitle || title)}`;
  const main = `<main id="main-content" class="case-reading-page" role="main" aria-label="Main content">
    <section class="service-hero generated-case-hero" id="overview">
      <div class="container">
        <a class="case-back" href="case-studies.html">&larr; All case studies</a>
        <p class="service-eyebrow">${escapeHtml(caseStudy.practiceArea || 'Case Study')}</p>
        <h1>${escapeHtml(title)}</h1>
        <p class="lead">${escapeHtml(caseStudy.summary)}</p>
        <nav class="case-jump-links" aria-label="On this page">
          <a href="#work-samples">View ${artifacts.length} work samples &darr;</a>
          ${caseFlow.length ? '<a href="#approach">How it was designed</a>' : ''}
        </nav>
      </div>
    </section>

    <section class="generated-case-artifacts" id="work-samples">
      <div class="container">
        <div class="case-section-heading">
          <h2>Explore the work</h2>
          <p>Open any sample to inspect it without leaving this page.</p>
        </div>
        ${evidenceNotes.map((item) => `<p class="case-evidence-note"><strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(item.value)}</p>`).join('')}
        <div class="resource-grid artifact-list">
          ${renderArtifactItems(artifacts)}
        </div>
      </div>
    </section>

    ${caseFlow.length || scope.length ? `<section class="generated-case-flow" id="approach">
      <div class="container">
        <details class="case-approach-details">
          <summary>How it was designed <span>Scope and approach</span></summary>
          ${scope.map((item) => `<p class="case-scope"><strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(item.value)}</p>`).join('')}
          <ol class="case-steps">${renderApproachSteps(caseFlow)}</ol>
        </details>
      </div>
    </section>` : ''}

    ${renderArtifactPreviewModal()}

    <section class="generated-case-cta">
      <div class="container case-next-step">
        <div><h2>Have a similar challenge?</h2><p>Tell me what your learners or team need.</p></div>
        <a href="${escapeHtml(ctaHref)}" class="cta-button">Discuss this work</a>
      </div>
    </section>
  </main>`;

  return renderGeneratedHtmlDocument({
    title: caseStudy.documentTitle || title,
    description: caseStudy.description || caseStudy.summary,
    pageIdentity: createCaseStudyPageIdentity(pagePathFor(caseStudy)),
    main,
    metadataLinks: [portfolioAiContextMetadataLink],
    footer: renderSimpleGeneratedSiteFooter()
  });
};

export const createCaseStudyPublication = (value: unknown = {}): CaseStudyPublication => {
  const portfolioSource = asRecord(value);
  const caseStudies = Array.isArray(portfolioSource.caseStudies)
    ? portfolioSource.caseStudies.map(normalizeCaseStudy)
    : [];
  return {
    portfolioItems: expandPortfolioItems(portfolioSource, caseStudies),
    pageIdentities: caseStudies.map((caseStudy) => createCaseStudyPageIdentity(pagePathFor(caseStudy))),
    pages: [
      { outputPath: 'case-studies.html', html: renderIndexHtml(caseStudies) },
      ...caseStudies.map((caseStudy) => ({
        outputPath: pagePathFor(caseStudy),
        html: renderCaseStudyHtml(caseStudy)
      }))
    ],
    artifactMetadataByCaseStudyId: new Map(
      caseStudies.map((caseStudy) => [
        normalizeText(caseStudy.id),
        artifactMetadataFor(caseStudy)
      ])
    )
  };
};
