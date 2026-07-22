import { createArtifactPreviewContract } from '../src/site/artifact-preview-policy.ts';
import {
  createCaseStudyIndexPageIdentity,
  createCaseStudyPageIdentity
} from '../src/site/case-study-page-identity.ts';
import {
  escapeHtml,
  portfolioAiContextMetadataLink,
  renderArtifactPreviewModal,
  renderGeneratedHtmlDocument,
  renderSimpleGeneratedSiteFooter
} from './generated-site-chrome.ts';
import { normalizePortfolioItem, normalizeText, slugify } from './portfolio-item-catalog.ts';
import type { PortfolioItem } from './portfolio-item-catalog.ts';
import type { CaseStudyPageIdentity } from '../src/site/case-study-page-identity.ts';

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
                <p class="lead">Grouped portfolio evidence shown as reviewable case studies, so each story can explain the audience, decision context, artifacts, and limits without loading every preview inside the portfolio grid.</p>
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

const renderContextCards = (items: LabeledValue[] = []) =>
  items
    .map((item) => `<article class="feature-card">
                        <h3>${escapeHtml(item.label)}</h3>
                        <p><strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(item.value)}</p>
                    </article>`)
    .join('\n                    ');

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
              ${item.practiceArea ? `<span class="portfolio-item-practice-label">${escapeHtml(item.practiceArea)}</span>` : ''}
              <p>${escapeHtml(item.description)}</p>
              <div class="card-actions">
                <button class="view-details-button" type="button" ${previewData}>View Details</button>
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
  const primaryContext = reviewerContext.slice(0, 2);
  const ctaHref = normalizeText(caseStudy.discussUrl) || `contact.html?portfolioItem=${encodeURIComponent(caseStudy.portfolioItemTitle || title)}`;
  const main = `<main id="main-content" role="main" aria-label="Main content">
    <section class="service-hero service-hero-compact generated-case-hero">
      <div class="container">
        <p class="service-eyebrow">${escapeHtml(caseStudy.eyebrow || 'Case Study')}</p>
        <h1>${escapeHtml(title)}</h1>
        <p class="lead">${escapeHtml(caseStudy.summary)}</p>
        <div class="service-hero-meta">
          ${primaryContext.map((item) => `<div>
            <h2>${escapeHtml(item.label)}</h2>
            <ul>
              <li>${escapeHtml(item.value)}</li>
            </ul>
          </div>`).join('\n          ')}
        </div>
      </div>
    </section>

    <section class="service-outcomes generated-case-context">
      <div class="container">
        <div class="section-heading">
          <h2 class="section-title">Reviewer Context</h2>
          <p>What this case is meant to demonstrate, where the evidence is strong, and where claims stay bounded.</p>
        </div>
        <div class="feature-grid">
          ${renderContextCards(reviewerContext)}
        </div>
      </div>
    </section>

    <section class="service-approach generated-case-flow">
      <div class="container">
        <div class="section-heading">
          <h2 class="section-title">Case Flow</h2>
          <p>The work sequence behind the grouped artifacts.</p>
        </div>
        <ol class="approach-steps">
          ${renderApproachSteps(caseFlow)}
        </ol>
      </div>
    </section>

    <section class="service-resources generated-case-artifacts">
      <div class="container">
        <div class="section-heading">
          <h2 class="section-title">Included Artifacts</h2>
          <p>Source materials reviewers can inspect directly.</p>
        </div>
        <div class="resource-grid artifact-list">
          ${renderArtifactItems(artifacts)}
        </div>
      </div>
    </section>

    ${renderArtifactPreviewModal()}

    <section class="service-cta generated-case-cta">
      <div class="container text-center">
        <h2 class="section-title">Discuss a Similar Case</h2>
        <p>${escapeHtml(caseStudy.description || caseStudy.summary)}</p>
        <a href="${escapeHtml(ctaHref)}" class="cta-button">Discuss a Similar Case</a>
      </div>
    </section>
  </main>`;

  return renderGeneratedHtmlDocument({
    title: caseStudy.documentTitle || title,
    description: caseStudy.description || caseStudy.summary,
    pageIdentity: createCaseStudyPageIdentity(pagePathFor(caseStudy)),
    main,
    metadataLinks: [portfolioAiContextMetadataLink]
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
