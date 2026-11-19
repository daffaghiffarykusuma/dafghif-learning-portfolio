import { portfolioDiscoveryFilters } from '../../src/portfolio-discovery.ts';
import { createArtifactPreviewContract } from '../../src/site/artifact-preview-policy.ts';
import { ARTIFACT_PREVIEW_TRIGGER_CLASS } from '../../src/site/artifact-preview-markup.ts';
import { createEngagementInquiryHref } from '../../src/site/engagement-inquiry-journey.ts';
import {
  createCaseStudyIndexPageIdentity,
  createCaseStudyPageIdentity
} from '../../src/site/site-page-identity.ts';
import { PORTFOLIO_AI_CONTEXT_METADATA_LINK, escapeHtml, renderSitePage } from '../site/site-page-shell.ts';
import { IMAGE_SLOT_SIZES } from '../site/image-slots.ts';
import { imageKindFailure, normalizePortfolioImage, normalizePortfolioItem, normalizeText } from './portfolio-item-catalog.ts';
import type { PortfolioImage, PortfolioItem } from './portfolio-item-catalog.ts';
import type { CaseStudyPageIdentity } from '../../src/site/site-page-identity.ts';

// Case Study Publication: turns Case Study source data into expanded Portfolio
// Items, Case Study Page Identities, generated pages, and nested Artifact
// metadata. It also owns the Case Study part of the Portfolio Item Source schema
// and reports its failures, so no other module restates Case Study rules.

type Image = PortfolioImage;
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
  suggestedArtifactId?: string;
  image: Image;
  pagePath: string;
  portfolioItemUrl: string;
  reviewerContext: LabeledValue[];
  caseFlow: LabeledValue[];
  artifacts: CaseStudyArtifact[];
  absorbedPortfolioItemIds: string[];
};

/** A hand-written Case Study page that Publication lists but does not generate. */
export type AuthoredCaseStudy = Pick<CaseStudy, 'id' | 'portfolioItemTitle' | 'practiceArea' | 'description' | 'pagePath' | 'image'>;

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
  /** Case Study schema failures, prefixed with the Portfolio Item Source path. */
  failures: string[];
  portfolioItems: PortfolioItem[];
  /** Identities for every Case Study page, generated and authored. */
  pageIdentities: Readonly<CaseStudyPageIdentity>[];
  /** Case Study page paths in listing order: featured leads first. */
  featuredPagePaths: string[];
  pages: GeneratedCaseStudyPage[];
  artifactMetadataByCaseStudyId: Map<string, CaseStudyArtifactMetadata[]>;
};

const sourceFile = 'assets/data/portfolio-source.json';
const requiredCaseStudyFields = ['id', 'title', 'portfolioItemTitle', 'practiceArea', 'description', 'summary', 'pagePath'];
const requiredAuthoredCaseStudyFields = ['id', 'portfolioItemTitle', 'practiceArea', 'description', 'pagePath'];
const requiredArtifactFields = ['id', 'title', 'description', 'href', 'sourceType', 'practiceArea'];
// Fields Publication now derives. Leaving them in source would suggest they still steer output.
const derivedCaseStudyFields = ['outputPath', 'discussUrl'];
const rootHtmlPathPattern = /^[^/\\]+\.html$/i;

const asRecord = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};

const asRecords = (value: unknown) => Array.isArray(value) ? value.map(asRecord) : [];

const normalizeStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.map(normalizeText).filter(Boolean) : [];

const normalizeLabeledValues = (value: unknown): LabeledValue[] =>
  asRecords(value).map((item) => ({
    label: normalizeText(item.label),
    value: normalizeText(item.value)
  }));

const normalizeImage = (value: unknown, fallbackAlt = ''): Image => normalizePortfolioImage(value, fallbackAlt);

const pagePathFor = (caseStudy: Pick<CaseStudy, 'pagePath' | 'id'>) =>
  normalizeText(caseStudy.pagePath) || `${normalizeText(caseStudy.id)}.html`;

const inquiryHrefFor = (caseStudy: Pick<CaseStudy, 'portfolioItemTitle' | 'title'>) =>
  createEngagementInquiryHref({ portfolioItem: caseStudy.portfolioItemTitle || caseStudy.title });

const normalizeArtifact = (value: unknown): CaseStudyArtifact => {
  const artifact = asRecord(value);
  const title = normalizeText(artifact.title);
  return {
    id: normalizeText(artifact.id),
    title,
    description: normalizeText(artifact.description),
    href: normalizeText(artifact.href),
    sourceType: normalizeText(artifact.sourceType),
    practiceArea: normalizeText(artifact.practiceArea),
    tags: normalizeStringArray(artifact.tags),
    image: normalizeImage(artifact.image, title),
    linkLabel: normalizeText(artifact.linkLabel) || 'Open Artifact'
  };
};

const normalizeCaseStudy = (value: unknown): CaseStudy => {
  const caseStudy = asRecord(value);
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
    suggestedArtifactId: normalizeText(caseStudy.suggestedArtifactId),
    image: normalizeImage(caseStudy.image),
    pagePath: normalizeText(caseStudy.pagePath),
    portfolioItemUrl: normalizeText(caseStudy.portfolioItemUrl),
    reviewerContext: normalizeLabeledValues(caseStudy.reviewerContext),
    caseFlow: normalizeLabeledValues(caseStudy.caseFlow),
    artifacts: asRecords(caseStudy.artifacts).map(normalizeArtifact),
    absorbedPortfolioItemIds: normalizeStringArray(caseStudy.absorbedPortfolioItemIds)
  };
};

const normalizeAuthoredCaseStudy = (value: unknown): AuthoredCaseStudy => {
  const caseStudy = asRecord(value);
  const portfolioItemTitle = normalizeText(caseStudy.portfolioItemTitle);
  return {
    id: normalizeText(caseStudy.id),
    portfolioItemTitle,
    practiceArea: normalizeText(caseStudy.practiceArea),
    description: normalizeText(caseStudy.description),
    pagePath: normalizeText(caseStudy.pagePath),
    image: normalizeImage(caseStudy.image)
  };
};

// ---------------------------------------------------------------------------
// Schema

const validateCaseStudySource = (source: Record<string, unknown>): string[] => {
  const failures: string[] = [];
  const knownPracticeAreas = new Set(
    portfolioDiscoveryFilters.areas.filter(({ value }) => value !== 'all').map(({ label }) => label)
  );
  const caseStudies = asRecords(source.caseStudies);
  const authoredCaseStudies = asRecords(source.authoredCaseStudies);
  const rawPortfolioItemIds = new Set(asRecords(source.portfolioItems).map((item) => normalizeText(item.id)).filter(Boolean));

  const fail = (message: string) => failures.push(`${sourceFile}: ${message}`);
  const requireFields = (record: Record<string, unknown>, fields: readonly string[], label: string) => {
    for (const field of fields) if (!normalizeText(record[field])) fail(`${label} is missing ${field}`);
  };
  const requireImage = (record: Record<string, unknown>, label: string) => {
    const image = asRecord(record.image);
    if (!normalizeText(image.src)) fail(`${label} is missing image.src`);
    if (!normalizeText(image.alt)) fail(`${label} is missing image.alt`);
    const kindFailure = imageKindFailure(image, label);
    if (kindFailure) fail(kindFailure);
  };
  const requirePracticeArea = (value: unknown, label: string) => {
    const practiceArea = normalizeText(value);
    if (practiceArea && !knownPracticeAreas.has(practiceArea)) fail(`${label} uses unknown Practice Area "${practiceArea}"`);
  };
  const requireRootHtmlPath = (value: unknown, label: string) => {
    if (normalizeText(value) && !rootHtmlPathPattern.test(normalizeText(value))) fail(`${label} pagePath must be a root-level .html path`);
  };
  const rejectDuplicates = (values: unknown[], label: string) => {
    const seen = new Set<string>();
    for (const value of values.map(normalizeText).filter(Boolean)) {
      if (seen.has(value)) fail(`duplicate ${label} "${value}"`);
      seen.add(value);
    }
  };

  if (!Array.isArray(source.caseStudies)) fail('caseStudies must be an array');
  if (source.authoredCaseStudies !== undefined && !Array.isArray(source.authoredCaseStudies)) fail('authoredCaseStudies must be an array');

  const allCaseStudies = [...caseStudies, ...authoredCaseStudies];
  rejectDuplicates(allCaseStudies.map((caseStudy) => caseStudy.id), 'Case Study id');
  rejectDuplicates(allCaseStudies.map((caseStudy) => caseStudy.pagePath), 'Case Study pagePath');

  const absorbedOwners = new Map<string, string>();
  caseStudies.forEach((caseStudy, index) => {
    const id = normalizeText(caseStudy.id) || `record ${index + 1}`;
    const label = `Case Study "${id}"`;
    requireFields(caseStudy, requiredCaseStudyFields, label);
    requireImage(caseStudy, label);
    requirePracticeArea(caseStudy.practiceArea, label);
    requireRootHtmlPath(caseStudy.pagePath, label);
    for (const field of derivedCaseStudyFields) {
      if (field in caseStudy) fail(`${label} ${field} is derived by Case Study Publication; remove it from the source`);
    }
    for (const field of ['reviewerContext', 'caseFlow', 'artifacts']) {
      if (!Array.isArray(caseStudy[field])) fail(`${label} ${field} must be an array`);
    }

    for (const absorbedId of normalizeStringArray(caseStudy.absorbedPortfolioItemIds)) {
      if (!rawPortfolioItemIds.has(absorbedId)) fail(`${label} absorbs missing Portfolio Item "${absorbedId}"`);
      const existingOwner = absorbedOwners.get(absorbedId);
      if (existingOwner) {
        fail(`Portfolio Item "${absorbedId}" is absorbed by both Case Study "${existingOwner}" and "${id}"`);
      } else {
        absorbedOwners.set(absorbedId, id);
      }
    }

    const artifacts = asRecords(caseStudy.artifacts);
    if (caseStudy.suggestedArtifactId !== undefined && (
      typeof caseStudy.suggestedArtifactId !== 'string'
      || !artifacts.some((artifact) => normalizeText(artifact.id) === normalizeText(caseStudy.suggestedArtifactId))
    )) {
      fail(`${label} suggestedArtifactId must reference an Artifact in the same Case Study`);
    }
    rejectDuplicates(artifacts.map((artifact) => artifact.id), `${label} Artifact id`);
    artifacts.forEach((artifact, artifactIndex) => {
      const artifactLabel = `${label} Artifact "${normalizeText(artifact.id) || `record ${artifactIndex + 1}`}"`;
      requireFields(artifact, requiredArtifactFields, artifactLabel);
      requireImage(artifact, artifactLabel);
      requirePracticeArea(artifact.practiceArea, artifactLabel);
      if (!Array.isArray(artifact.tags) || artifact.tags.length === 0) fail(`${artifactLabel} must declare at least one tag`);
    });
  });

  authoredCaseStudies.forEach((caseStudy, index) => {
    const label = `authored Case Study "${normalizeText(caseStudy.id) || `record ${index + 1}`}"`;
    requireFields(caseStudy, requiredAuthoredCaseStudyFields, label);
    requireImage(caseStudy, label);
    requirePracticeArea(caseStudy.practiceArea, label);
    requireRootHtmlPath(caseStudy.pagePath, label);
  });

  if (source.featuredCaseStudyIds !== undefined) {
    if (!Array.isArray(source.featuredCaseStudyIds)) {
      fail('featuredCaseStudyIds must be an array');
    } else {
      const knownIds = new Set(allCaseStudies.map((caseStudy) => normalizeText(caseStudy.id)).filter(Boolean));
      rejectDuplicates(source.featuredCaseStudyIds, 'featured Case Study id');
      for (const featuredId of source.featuredCaseStudyIds.map(normalizeText)) {
        if (!knownIds.has(featuredId)) fail(`featured Case Study "${featuredId}" does not reference a Case Study`);
      }
    }
  }
  return failures;
};

// ---------------------------------------------------------------------------
// Portfolio Items and metadata

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
      parentCaseStudy: caseStudy.id,
      image: artifact.image
    }));

const portfolioItemFor = (caseStudy: CaseStudy): PortfolioItem =>
  normalizePortfolioItem({
    id: caseStudy.id,
    title: caseStudy.portfolioItemTitle || `${caseStudy.title} Case Study`,
    practiceArea: caseStudy.practiceArea,
    tags: ['case-study', ...caseStudy.tags],
    description: caseStudy.description,
    image: caseStudy.image,
    sourceArtifact: pagePathFor(caseStudy),
    sourceType: 'case-study-page',
    portfolioItemUrl: caseStudy.portfolioItemUrl || pagePathFor(caseStudy)
  });

const expandPortfolioItems = (source: Record<string, unknown>, caseStudies: CaseStudy[]): PortfolioItem[] => {
  const caseStudyItems = caseStudies.map(portfolioItemFor);
  const caseStudyIds = new Set(caseStudyItems.map((item) => item.id));
  const absorbedItemIds = new Set(caseStudies.flatMap((caseStudy) => caseStudy.absorbedPortfolioItemIds));
  const sourceItems = asRecords(source.portfolioItems).map(normalizePortfolioItem);
  return [
    ...caseStudyItems,
    ...sourceItems.filter((item) => !caseStudyIds.has(item.id) && !absorbedItemIds.has(item.id))
  ];
};

// ---------------------------------------------------------------------------
// Pages

type CaseStudyListing = AuthoredCaseStudy & Partial<Pick<CaseStudy, 'title' | 'summary'>>;

const orderListings = (listings: CaseStudyListing[], featuredIds: string[]) => {
  const rank = (listing: CaseStudyListing) => {
    const index = featuredIds.indexOf(listing.id);
    return index < 0 ? featuredIds.length : index;
  };
  return [...listings].sort((a, b) => rank(a) - rank(b));
};

const renderCaseStudyCards = (listings: CaseStudyListing[]) =>
  listings
    .map((caseStudy, index) => {
      const pagePath = pagePathFor(caseStudy);
      // The first card is the index page's largest first-viewport element.
      const imageLoading = index === 0 ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"';
      const title = normalizeText(caseStudy.portfolioItemTitle || `${caseStudy.title} Case Study`);
      return `<article class="case-study-card">
          <a href="${escapeHtml(pagePath)}" class="case-study-card-image${caseStudy.image.kind ? ' card-image-photo' : ''}">
            <img src="${escapeHtml(caseStudy.image.src)}" alt="${escapeHtml(caseStudy.image.alt || title)}" ${imageLoading} decoding="async" sizes="${IMAGE_SLOT_SIZES.twoColumnCard}">
          </a>
          <div class="case-study-card-body">
            <p class="portfolio-item-practice-label">${escapeHtml(caseStudy.practiceArea)}</p>
            <h2><a href="${escapeHtml(pagePath)}">${escapeHtml(title)}</a></h2>
            <p>${escapeHtml(caseStudy.description || caseStudy.summary)}</p>
            <a class="cta-button" href="${escapeHtml(pagePath)}">Read case study</a>
          </div>
        </article>`;
    })
    .join('\n        ');

const renderIndexHtml = (listings: CaseStudyListing[]) => renderSitePage({
  identity: createCaseStudyIndexPageIdentity(),
  title: 'Case Studies | Daffa Ghiffary Kusuma',
  description: 'Selected learning design case studies by Daffa Ghiffary Kusuma, grouped into decision-ready narratives with artifacts, assumptions, and evidence limits.',
  content: `<main id="main-content" role="main" aria-label="Main content">
    <section class="service-hero service-hero-compact">
      <div class="container">
        <p class="service-eyebrow">Case studies</p>
        <h1>Selected learning design cases</h1>
        <p class="lead">Explore learning programs, assessment tools, and practical materials. Open a case to see the work and how it was designed.</p>
      </div>
    </section>
    <section class="case-study-index">
      <div class="container">
        <div class="case-study-card-grid">
        ${renderCaseStudyCards(listings)}
        </div>
      </div>
    </section>
  </main>`
});

const renderApproachSteps = (items: LabeledValue[]) =>
  items
    .map((item) => `<li>
              <h3>${escapeHtml(item.label)}</h3>
              <p>${escapeHtml(item.value)}</p>
            </li>`)
    .join('\n            ');

const renderPreviewAttributes = (artifact: CaseStudyArtifact) => {
  const previewContract = createArtifactPreviewContract({
    sourceArtifact: artifact.href,
    sourceType: artifact.sourceType
  });
  return Object.entries(previewContract?.triggerAttributes || {})
    .map(([attribute, value]) => `${attribute}="${escapeHtml(value)}"`)
    .join(' ');
};

const renderArtifactItems = (artifacts: CaseStudyArtifact[]) =>
  artifacts
    .map((item, index) => {
      const imageLoading = index === 0
        ? 'loading="eager" fetchpriority="high" width="660" height="400"'
        : 'loading="lazy"';
      return `<article id="${escapeHtml(item.id)}" class="card portfolio-item case-artifact-card" data-category="${escapeHtml(item.tags.join(' '))}">
            <div class="card-image">
              <a class="portfolio-item-thumbnail-link" href="#${escapeHtml(item.id)}">
                <img src="${escapeHtml(item.image.src)}" alt="${escapeHtml(item.image.alt)}" ${imageLoading} decoding="async" sizes="${IMAGE_SLOT_SIZES.threeColumnCard}">
              </a>
            </div>
            <div class="card-content">
              <h3><a class="portfolio-item-title-link" href="#${escapeHtml(item.id)}">${escapeHtml(item.title)}</a></h3>
              <p>${escapeHtml(item.description)}</p>
              <div class="card-actions">
                <button class="${ARTIFACT_PREVIEW_TRIGGER_CLASS}" type="button" data-artifact-title="${escapeHtml(item.title)}" ${renderPreviewAttributes(item)}>Preview work sample</button>
              </div>
            </div>
          </article>`;
    })
    .join('\n          ');

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

// Summarizes sample formats for the hero, for example "5 PDFs · 3 interactive".
const describeArtifactFormats = (artifacts: CaseStudyArtifact[]) => {
  const pdfCount = artifacts.filter((item) => item.sourceType === 'pdf').length;
  const interactiveCount = artifacts.length - pdfCount;
  return [
    pdfCount ? plural(pdfCount, 'PDF') : '',
    interactiveCount ? `${interactiveCount} interactive` : ''
  ].filter(Boolean).join(' · ');
};

const renderCaseGlance = (caseStudy: CaseStudy) => {
  const { artifacts, caseFlow } = caseStudy;
  return `<aside class="case-glance" aria-label="Case at a glance">
          <dl class="case-glance-facts">
            <div><dt>Practice area</dt><dd>${escapeHtml(caseStudy.practiceArea || 'Case study')}</dd></div>
            <div><dt>Work samples</dt><dd>${escapeHtml(describeArtifactFormats(artifacts))}</dd></div>
          </dl>${caseFlow.length ? `
          <p class="case-glance-label">Design path</p>
          <ol class="case-glance-steps">
            ${caseFlow.map((step) => `<li>${escapeHtml(step.label)}</li>`).join('\n            ')}
          </ol>` : ''}
        </aside>`;
};

const renderCaseStudyHtml = (caseStudy: CaseStudy) => {
  const { title, reviewerContext, caseFlow, artifacts } = caseStudy;
  const suggestedArtifact = artifacts.find((item) => item.id === caseStudy.suggestedArtifactId);
  const useCase = reviewerContext.find((item) => /^use case$/i.test(item.label));
  const evidenceNotes = reviewerContext.filter((item) => /limit/i.test(item.label));
  const scope = reviewerContext.filter((item) => !/limit|use case/i.test(item.label));
  const content = `<main id="main-content" class="case-reading-page" role="main" aria-label="Main content">
    <section class="service-hero generated-case-hero" id="overview">
      <div class="container case-hero-grid">
        <div class="case-hero-copy">
          <a class="case-back" href="case-studies.html">&larr; All case studies</a>
          <p class="service-eyebrow">Case study</p>
          <h1>${escapeHtml(title)}</h1>
          <p class="lead">${escapeHtml(caseStudy.summary)}</p>
          <nav class="case-jump-links" aria-label="On this page">
            <a href="#work-samples">View ${artifacts.length} work samples &darr;</a>
            ${caseFlow.length ? '<a href="#approach">How it was designed</a>' : ''}
          </nav>
        </div>
        ${renderCaseGlance(caseStudy)}
      </div>
    </section>

    <section class="generated-case-artifacts" id="work-samples">
      <div class="container">
        ${suggestedArtifact ? `<div class="case-section-heading case-work-intro">
          <h2>What this demonstrates</h2>
          ${useCase ? `<p>${escapeHtml(useCase.value)}</p>` : ''}
          <p class="case-start-here"><strong>Start here:</strong> <a class="portfolio-item-title-link" href="#${escapeHtml(suggestedArtifact.id)}">Preview ${escapeHtml(suggestedArtifact.title)}</a></p>
        </div>
        ` : ''}<div class="case-section-heading case-work-heading">
          <h2>All work samples</h2>
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

    <section class="generated-case-cta">
      <div class="container case-next-step">
        <div><h2>Let's talk about learning design</h2><p>Get in touch about a role or project, or discuss the work shown here.</p></div>
        <a href="${escapeHtml(inquiryHrefFor(caseStudy))}" class="cta-button">Discuss this work</a>
      </div>
    </section>
  </main>`;

  return renderSitePage({
    identity: createCaseStudyPageIdentity(pagePathFor(caseStudy)),
    title: caseStudy.documentTitle || title,
    description: caseStudy.description || caseStudy.summary,
    metadataLinks: [PORTFOLIO_AI_CONTEXT_METADATA_LINK],
    content,
    artifactPreview: true
  });
};

export const createCaseStudyPublication = (value: unknown = {}): CaseStudyPublication => {
  const source = asRecord(value);
  const caseStudies = asRecords(source.caseStudies).map(normalizeCaseStudy);
  const authoredCaseStudies = asRecords(source.authoredCaseStudies).map(normalizeAuthoredCaseStudy);
  const featuredIds = normalizeStringArray(source.featuredCaseStudyIds);
  const listings = orderListings([...authoredCaseStudies, ...caseStudies], featuredIds);
  return {
    failures: validateCaseStudySource(source),
    portfolioItems: expandPortfolioItems(source, caseStudies),
    pageIdentities: [...caseStudies, ...authoredCaseStudies].map((caseStudy) => createCaseStudyPageIdentity(pagePathFor(caseStudy))),
    featuredPagePaths: listings.filter((listing) => featuredIds.includes(listing.id)).map(pagePathFor),
    pages: [
      { outputPath: 'case-studies.html', html: renderIndexHtml(listings) },
      ...caseStudies.map((caseStudy) => ({
        outputPath: pagePathFor(caseStudy),
        html: renderCaseStudyHtml(caseStudy)
      }))
    ],
    artifactMetadataByCaseStudyId: new Map(
      caseStudies.map((caseStudy) => [caseStudy.id, artifactMetadataFor(caseStudy)])
    )
  };
};
