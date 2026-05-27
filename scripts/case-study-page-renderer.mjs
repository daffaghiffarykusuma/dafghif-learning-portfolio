import { normalizeText } from './portfolio-item-catalog.mjs';
import { createCaseStudyArtifactPreviewModel, getCaseStudyPagePath, getCaseStudySources } from './case-study-model.mjs';
import { createArtifactPreviewContract } from '../js/site/artifact-preview-policy.js';
import {
  escapeHtml,
  portfolioAiContextMetadataLink,
  renderArtifactPreviewModal,
  renderGeneratedHtmlDocument
} from './generated-site-chrome.mjs';

const renderContextCards = (items = []) =>
  items
    .map((item) => `<article class="feature-card">
                        <h3>${escapeHtml(item.label)}</h3>
                        <p><strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(item.value)}</p>
                    </article>`)
    .join('\n                    ');

const renderEvidenceCards = (items = []) =>
  items
    .map((item) => `<div class="impact-card">
                        <span class="impact-value">${escapeHtml(item.label)}</span>
                        <span class="impact-label">${escapeHtml(item.value)}</span>
                    </div>`)
    .join('\n                    ');

const renderApproachSteps = (items = []) =>
  items
    .map((item) => `<li>
                            <h3>${escapeHtml(item.label)}</h3>
                            <p>${escapeHtml(item.value)}</p>
                        </li>`)
    .join('\n                        ');

const renderPreviewAttributes = (artifact = {}) => {
  const previewContract = createArtifactPreviewContract({
    sourceArtifact: artifact.href,
    sourceType: artifact.sourceType
  });
  return Object.entries(previewContract?.triggerAttributes || {})
    .map(([attribute, value]) => `${attribute}="${escapeHtml(value)}"`)
    .join(' ');
};

const renderArtifactItems = (artifacts = []) =>
  artifacts
    .map((artifact, index) => {
      const item = createCaseStudyArtifactPreviewModel(artifact);
      const previewData = renderPreviewAttributes(item);
      const imageLoading = index === 0
        ? 'loading="eager" fetchpriority="high" width="660" height="400"'
        : 'loading="lazy"';
      return `<article id="${escapeHtml(item.id)}" class="card portfolio-item case-artifact-card" data-category="${escapeHtml(item.categories)}">
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

export const renderCaseStudyHtml = (caseStudy = {}) => {
  const title = normalizeText(caseStudy.title);
  const pagePath = getCaseStudyPagePath(caseStudy);
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

    <section class="service-impact generated-case-evidence">
      <div class="container">
        <div class="section-heading">
          <h2 class="section-title">Evidence and Review Limits</h2>
          <p>These notes separate artifact-visible evidence from assumptions, so reviewers can judge the case without overreading the claims.</p>
        </div>
        <div class="impact-grid">
          ${renderEvidenceCards(reviewerContext)}
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
    currentPage: pagePath,
    main,
    metadataLinks: [portfolioAiContextMetadataLink]
  });
};

export const renderCaseStudyPreviews = (portfolioSource = {}) =>
  getCaseStudySources(portfolioSource).map((caseStudy) => ({
    outputPath: getCaseStudyPagePath(caseStudy),
    html: renderCaseStudyHtml(caseStudy)
  }));
