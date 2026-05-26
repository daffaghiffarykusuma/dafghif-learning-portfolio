import { Window } from 'happy-dom';
import {
  PORTFOLIO_ITEM_SCHEMA_VERSION,
  createAiContextPortfolioItem,
  createPortfolioCatalogData,
  getPortfolioItemSourceItems,
  normalizePortfolioItem,
  normalizeText,
  parsePortfolioItemsFromDocument,
  practiceAreaProfiles
} from './portfolio-item-catalog.mjs';

export const createPortfolioDocument = (html) => {
  const window = new Window();
  window.SyntaxError = window.SyntaxError || SyntaxError;
  window.document.write(html);
  window.document.close();
  return window.document;
};

export const getPortfolioSourceItems = (portfolioSource) =>
  getPortfolioItemSourceItems(portfolioSource).map(normalizePortfolioItem);

export const normalizeProofEntry = (entry = {}) => ({
  claim: normalizeText(entry.claim),
  sourceBasis: normalizeText(entry.sourceBasis),
  confidence: normalizeText(entry.confidence)
});

export const normalizeProof = (proof = {}) => ({
  visibleProofLine: normalizeText(proof.visibleProofLine),
  workQuality: Array.isArray(proof.workQuality) ? proof.workQuality.map(normalizeProofEntry).filter((entry) => entry.claim) : [],
  impact: Array.isArray(proof.impact) ? proof.impact.map(normalizeProofEntry).filter((entry) => entry.claim) : []
});

export const applyProofPoints = (portfolioItems, proofSource = {}) =>
  portfolioItems.map((portfolioItem) => {
    const item = normalizePortfolioItem(portfolioItem);
    const defaultProof = normalizeProof(proofSource.practiceAreaDefaults?.[item.practiceArea]);
    const overrideProof = normalizeProof(proofSource.itemOverrides?.[item.id]);
    const proof = {
      visibleProofLine: overrideProof.visibleProofLine || defaultProof.visibleProofLine,
      workQuality: overrideProof.workQuality.length ? overrideProof.workQuality : defaultProof.workQuality,
      impact: overrideProof.impact
    };

    return {
      ...item,
      proof
    };
  });

export const renderProofLines = (document, portfolioItems) => {
  const proofById = new Map(portfolioItems.map((item) => [item.id, item.proof.visibleProofLine]));
  let renderedCount = 0;

  document.querySelectorAll('.card.portfolio-item').forEach((card) => {
    if (card.classList.contains('portfolio-item-placeholder')) return;
    const proofLine = proofById.get(card.id || card.dataset.portfolioItemId);
    if (!proofLine) return;

    const existingProof = card.querySelector('.portfolio-item-proof');
    if (existingProof) {
      existingProof.textContent = `Proof of quality: ${proofLine}`;
      renderedCount += 1;
      return;
    }

    const description = card.querySelector('.card-content p');
    if (!description) return;

    const proofElement = document.createElement('p');
    proofElement.className = 'portfolio-item-proof';
    proofElement.textContent = `Proof of quality: ${proofLine}`;
    description.insertAdjacentElement('afterend', proofElement);
    renderedCount += 1;
  });

  return renderedCount;
};

export const renderPortfolioItemCard = (document, portfolioItem, index = 0) => {
  const item = normalizePortfolioItem(portfolioItem);
  const card = document.createElement('div');
  card.className = 'card portfolio-item';
  card.id = item.id;
  card.dataset.category = item.tags.join(' ');
  card.dataset.portfolioItemId = item.id;
  card.dataset.portfolioItemUrl = item.portfolioItemUrl;

  const imageWrapper = document.createElement('div');
  imageWrapper.className = 'card-image';
  const imageLink = document.createElement('a');
  imageLink.className = 'portfolio-item-thumbnail-link';
  imageLink.href = item.portfolioItemUrl;
  imageLink.setAttribute('aria-label', `Open ${item.title} portfolio item details`);
  const image = document.createElement('img');
  image.src = item.image.src;
  image.alt = item.image.alt || item.title;
  image.decoding = 'async';
  image.loading = index === 0 ? 'eager' : 'lazy';
  if (index === 0) {
    image.fetchPriority = 'high';
    image.width = 660;
    image.height = 400;
  }
  imageLink.append(image);
  imageWrapper.append(imageLink);

  const content = document.createElement('div');
  content.className = 'card-content';
  const title = document.createElement('h3');
  const titleLink = document.createElement('a');
  titleLink.className = 'portfolio-item-title-link';
  titleLink.href = item.portfolioItemUrl;
  titleLink.textContent = item.title;
  title.append(titleLink);

  const practiceLabel = document.createElement('span');
  practiceLabel.className = 'portfolio-item-practice-label';
  const practiceLink = document.createElement('a');
  practiceLink.href = 'portfolio.html';
  practiceLink.title = 'View Portfolio';
  practiceLink.textContent = item.practiceArea;
  practiceLabel.append(practiceLink);

  const description = document.createElement('p');
  description.textContent = item.description;

  const proof = document.createElement('p');
  proof.className = 'portfolio-item-proof';
  proof.textContent = `Proof of quality: ${item.proof.visibleProofLine}`;

  const actions = document.createElement('div');
  actions.className = 'card-actions';
  const discussLink = document.createElement('a');
  discussLink.className = 'cta-button';
  discussLink.href = item.discussUrl;
  discussLink.textContent = 'Discuss Similar Engagement';
  const detailsButton = document.createElement('button');
  detailsButton.className = 'view-details-button';
  detailsButton.type = 'button';
  detailsButton.textContent = 'View Details';
  if (item.sourceType === 'html-viewer') {
    detailsButton.dataset.viewer = item.sourceArtifact;
  } else {
    detailsButton.dataset.pdf = item.sourceArtifact;
  }
  actions.append(discussLink, detailsButton);
  content.append(title, practiceLabel, description, proof, actions);
  card.append(imageWrapper, content);

  return card;
};

export const renderPortfolioItemCards = (document, portfolioItems) => {
  const grid = document.querySelector('.portfolio-items-grid');
  if (!grid) return 0;

  Array.from(grid.querySelectorAll(':scope > .card.portfolio-item:not(.portfolio-item-placeholder)')).forEach((card) => {
    card.remove();
  });

  const placeholder = grid.querySelector(':scope > .portfolio-item-placeholder');
  portfolioItems.forEach((item, index) => {
    const card = renderPortfolioItemCard(document, item, index);
    if (placeholder) {
      grid.insertBefore(card, placeholder);
    } else {
      grid.append(card);
    }
  });

  return portfolioItems.length;
};

export const serializePortfolioDocument = (document) => `<!DOCTYPE html>\n${document.documentElement.outerHTML}\n`;

export const createPortfolioAiContextData = ({
  portfolioSource,
  generatedFrom,
  generatedAt = new Date().toISOString()
}) => {
  const portfolioItems = getPortfolioItemSourceItems(portfolioSource).map(createAiContextPortfolioItem);

  return {
    schemaVersion: PORTFOLIO_ITEM_SCHEMA_VERSION,
    generatedFrom,
    generatedAt,
    owner: 'Daffa Ghiffary Kusuma',
    positioning:
      'Learning Designer and Program Manager focused on competency-based training, learning assets, evaluation systems, mentoring, and learning analytics.',
    usage:
      'Use this file as AI-readable context for tailored CVs, cover letters, recruiter summaries, and portfolio item matching when the original portfolio artifacts are unavailable.',
    evidenceNote:
      'Portfolio item titles, practice areas, descriptions, tags, source artifact paths, proof points, and outcome evidence are read from structured portfolio sources. Outcome evidence is limited to direct Proof Point impact entries. Role, audience, deliverables, skills, tools, AI hints, and CV bullets may include inferred fields and should be refined when exact Portfolio Item details are available.',
    portfolioItemCount: portfolioItems.length,
    practiceAreaProfiles,
    portfolioItems
  };
};

export const createPortfolioEvidencePipeline = ({
  portfolioHtml,
  portfolioSource,
  proofSource,
  generatedFrom,
  generatedAt = new Date().toISOString()
}) => {
  const document = createPortfolioDocument(portfolioHtml);
  const sourceItems = portfolioSource ? getPortfolioSourceItems(portfolioSource) : parsePortfolioItemsFromDocument(document);
  const portfolioItems = applyProofPoints(sourceItems, proofSource);
  const catalogData = createPortfolioCatalogData({
    generatedFrom,
    generatedAt,
    portfolioItems
  });

  return {
    document,
    portfolioItems,
    catalogData,
    renderPortfolioItems: () => renderPortfolioItemCards(document, portfolioItems),
    renderProofLines: () => renderProofLines(document, portfolioItems),
    serializeDocument: () => serializePortfolioDocument(document),
    createAiContextData: (options = {}) => createPortfolioAiContextData({
      portfolioSource: catalogData,
      generatedFrom: options.generatedFrom || generatedFrom,
      generatedAt: options.generatedAt || generatedAt
    })
  };
};
