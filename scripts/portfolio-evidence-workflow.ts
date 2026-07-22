import { Window } from 'happy-dom';
import { createArtifactPreviewContract } from '../src/site/artifact-preview-policy.ts';
import {
  PORTFOLIO_ITEM_SCHEMA_VERSION,
  createPortfolioCatalogData,
  normalizePortfolioItem,
  normalizeText
} from './portfolio-item-catalog.ts';
import { createAiContextPortfolioItem, practiceAreaProfiles } from './portfolio-context-inference.ts';
import { createCaseStudyPublication } from './case-study-publication.ts';
import { assertValidPortfolioItemSource } from './portfolio-item-source-validator.ts';
import type { CaseStudyArtifactMetadata } from './case-study-publication.ts';
import type { PortfolioItem } from './portfolio-item-catalog.ts';

export type ProofPoint = {
  claim: string;
  sourceBasis: string;
  confidence: string;
};

export type PortfolioItemProof = {
  visibleProofLine: string;
  workQuality: ProofPoint[];
  impact: ProofPoint[];
};

export type AppliedProofPortfolioItem = Omit<PortfolioItem, 'proof'> & {
  proof: PortfolioItemProof;
};

type WorkflowPathKey = 'portfolioHtml' | 'catalogOutput' | 'aiContextOutput';
type PortfolioEvidenceOutputType =
  | 'portfolio-html'
  | 'catalog-json'
  | 'case-study-html'
  | 'ai-context-json';

export type PortfolioEvidenceOutput =
  | { type: PortfolioEvidenceOutputType; pathKey: WorkflowPathKey; contents: string }
  | { type: PortfolioEvidenceOutputType; outputPath: string; contents: string };

export type PortfolioEvidenceWorkflowSummary = {
  renderedPortfolioItemCount: number;
  catalogPortfolioItemCount: number;
  aiContextPortfolioItemCount: number;
  caseStudyPageCount: number;
};

export type PortfolioEvidenceWorkflowResult = {
  outputs: PortfolioEvidenceOutput[];
  summary: PortfolioEvidenceWorkflowSummary;
};

export type PortfolioEvidenceWorkflowInput = {
  portfolioHtml: string;
  portfolioSource: unknown;
  proofSource: unknown;
  generatedFrom: string;
  catalogGeneratedFrom?: string;
  generatedAt?: string;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};

const portfolioAreaFilters = new Set([
  'training-workshop',
  'instructional-design',
  'learning-materials',
  'assessment',
  'learning-analytics',
  'training-needs-analysis',
  'curriculum-development',
  'training-proposal',
  'worksheet',
  'learning-strategy',
  'presentation-design',
  'mentoring'
]);

const jsonOutput = (data: unknown) => `${JSON.stringify(data, null, 2)}\n`;

const createPortfolioDocument = (html: string) => {
  const window = new Window();
  window.SyntaxError = window.SyntaxError || SyntaxError;
  window.document.write(html);
  window.document.close();
  return window.document;
};

const getPracticeAreaFilter = (item: PortfolioItem) =>
  item.tags.find((tag) => portfolioAreaFilters.has(tag)) || '';

const normalizeProofEntry = (value: unknown): ProofPoint => {
  const entry = asRecord(value);
  return {
  claim: normalizeText(entry.claim),
  sourceBasis: normalizeText(entry.sourceBasis),
  confidence: normalizeText(entry.confidence)
  };
};

const normalizeProof = (value: unknown): PortfolioItemProof => {
  const proof = asRecord(value);
  return {
    visibleProofLine: normalizeText(proof.visibleProofLine),
    workQuality: Array.isArray(proof.workQuality)
      ? proof.workQuality.map(normalizeProofEntry).filter((entry) => entry.claim)
    : [],
    impact: Array.isArray(proof.impact)
      ? proof.impact.map(normalizeProofEntry).filter((entry) => entry.claim)
    : []
  };
};

const applyProofPoints = (
  portfolioItems: PortfolioItem[],
  proofSourceValue: unknown
): AppliedProofPortfolioItem[] => {
  const proofSource = asRecord(proofSourceValue);
  const practiceAreaDefaults = asRecord(proofSource.practiceAreaDefaults);
  const itemOverrides = asRecord(proofSource.itemOverrides);
  return (
  portfolioItems.map((portfolioItem) => {
    const item = normalizePortfolioItem(portfolioItem);
    const defaultProof = normalizeProof(practiceAreaDefaults[item.practiceArea]);
    const overrideProof = normalizeProof(itemOverrides[item.id]);

    return {
      ...item,
      proof: {
        visibleProofLine: overrideProof.visibleProofLine || defaultProof.visibleProofLine,
        workQuality: overrideProof.workQuality.length
          ? overrideProof.workQuality
          : defaultProof.workQuality,
        impact: overrideProof.impact
      }
    };
  }));
};

const renderPortfolioItemCard = (
  document: ReturnType<typeof createPortfolioDocument>,
  portfolioItem: PortfolioItem,
  index = 0
) => {
  const item = normalizePortfolioItem(portfolioItem);
  const proofData = normalizeProof(item.proof);
  const card = document.createElement('div');
  card.className = 'card portfolio-item';
  card.id = item.id;
  card.dataset.category = item.tags.join(' ');

  const imageWrapper = document.createElement('div');
  imageWrapper.className = 'card-image';
  const imageLink = document.createElement('a');
  imageLink.className = 'portfolio-item-thumbnail-link';
  imageLink.href = item.portfolioItemUrl;
  const image = document.createElement('img');
  image.src = item.image.src;
  image.alt = item.image.alt || item.title;
  image.decoding = 'async';
  image.loading = index === 0 ? 'eager' : 'lazy';
  if (index === 0) {
    image.setAttribute('fetchpriority', 'high');
    image.width = 660;
    image.height = 400;
  }
  imageLink.append(image);
  imageWrapper.append(imageLink);

  const content = document.createElement('div');
  content.className = 'card-content';
  const title = document.createElement('h2');
  const titleLink = document.createElement('a');
  titleLink.className = 'portfolio-item-title-link';
  titleLink.href = item.portfolioItemUrl;
  titleLink.textContent = item.title;
  title.append(titleLink);

  const practiceLabel = document.createElement('span');
  practiceLabel.className = 'portfolio-item-practice-label';
  const practiceLink = document.createElement('a');
  const practiceAreaFilter = getPracticeAreaFilter(item);
  practiceLink.href = practiceAreaFilter
    ? `portfolio.html?area=${practiceAreaFilter}`
    : 'portfolio.html';
  practiceLink.textContent = item.practiceArea;
  practiceLabel.append(practiceLink);

  const description = document.createElement('p');
  description.textContent = item.description;

  const proof = document.createElement('p');
  proof.className = 'portfolio-item-proof';
  proof.textContent = proofData.visibleProofLine;

  const actions = document.createElement('div');
  actions.className = 'card-actions';
  const discussLink = document.createElement('a');
  discussLink.className = 'cta-button';
  discussLink.href = item.discussUrl;
  discussLink.textContent = 'Discuss Similar Engagement';
  if (item.sourceType === 'case-study-page') {
    const caseStudyLink = document.createElement('a');
    caseStudyLink.className = 'view-details-button';
    caseStudyLink.href = item.sourceArtifact;
    caseStudyLink.textContent = 'Read Case Study';
    actions.append(discussLink, caseStudyLink);
  } else {
    const detailsButton = document.createElement('button');
    detailsButton.className = 'view-details-button';
    detailsButton.type = 'button';
    detailsButton.textContent = item.sourceType === 'pdf'
      ? 'View PDF Artifact'
      : 'Open Interactive Preview';
    const previewContract = createArtifactPreviewContract({
      sourceArtifact: item.sourceArtifact,
      sourceType: item.sourceType
    });
    for (const [attribute, value] of Object.entries(previewContract?.triggerAttributes || {})) {
      detailsButton.setAttribute(attribute, value);
    }
    actions.append(discussLink, detailsButton);
  }

  content.append(title, practiceLabel, description, proof, actions);
  card.append(imageWrapper, content);
  return card;
};

const renderPortfolioItemCards = (
  document: ReturnType<typeof createPortfolioDocument>,
  portfolioItems: PortfolioItem[]
): number => {
  const grid = document.querySelector('.portfolio-items-grid');
  if (!grid) return 0;

  Array.from(
    grid.querySelectorAll(':scope > .card.portfolio-item:not(.portfolio-item-placeholder)')
  ).forEach((card) => {
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

const createPortfolioAiContextData = ({
  portfolioItems,
  artifactMetadataByCaseStudyId,
  generatedFrom,
  generatedAt
}: {
  portfolioItems: AppliedProofPortfolioItem[];
  artifactMetadataByCaseStudyId: Map<string, CaseStudyArtifactMetadata[]>;
  generatedFrom: string;
  generatedAt: string;
}) => {
  const aiContextItems = portfolioItems.map(createAiContextPortfolioItem);
  const portfolioItemsWithCaseArtifacts = aiContextItems.map((item) => {
    const caseStudyArtifacts = artifactMetadataByCaseStudyId.get(item.id) || [];
    return caseStudyArtifacts.length ? { ...item, caseStudyArtifacts } : item;
  });
  const caseStudyArtifactCount = [...artifactMetadataByCaseStudyId.values()]
    .reduce((count, artifacts) => count + artifacts.length, 0);

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
    portfolioItemCount: aiContextItems.length,
    caseStudyArtifactCount,
    practiceAreaProfiles,
    portfolioItems: portfolioItemsWithCaseArtifacts
  };
};

export const createPortfolioEvidenceWorkflow = ({
  portfolioHtml,
  portfolioSource,
  proofSource,
  generatedFrom,
  catalogGeneratedFrom = 'assets/data/portfolio-items.json',
  generatedAt = new Date().toISOString()
}: PortfolioEvidenceWorkflowInput): PortfolioEvidenceWorkflowResult => {
  const validatedSource = assertValidPortfolioItemSource({
    portfolioSource,
    proofSource
  });
  const portfolioItems = applyProofPoints(validatedSource.portfolioItems, proofSource);
  const document = createPortfolioDocument(portfolioHtml);
  const renderedPortfolioItemCount = renderPortfolioItemCards(document, portfolioItems);
  const catalogData = createPortfolioCatalogData({
    generatedFrom,
    generatedAt,
    portfolioItems
  });
  const caseStudyPublication = createCaseStudyPublication(portfolioSource);
  const caseStudyPages = caseStudyPublication.pages;
  const aiContextData = createPortfolioAiContextData({
    portfolioItems,
    artifactMetadataByCaseStudyId: caseStudyPublication.artifactMetadataByCaseStudyId,
    generatedFrom: catalogGeneratedFrom,
    generatedAt
  });

  const outputs: PortfolioEvidenceOutput[] = [
    {
      type: 'portfolio-html',
      pathKey: 'portfolioHtml',
      contents: `<!DOCTYPE html>\n${document.documentElement.outerHTML}\n`
    },
    {
      type: 'catalog-json',
      pathKey: 'catalogOutput',
      contents: jsonOutput(catalogData)
    },
    ...caseStudyPages.map((page): PortfolioEvidenceOutput => ({
      type: 'case-study-html',
      outputPath: page.outputPath,
      contents: page.html
    })),
    {
      type: 'ai-context-json',
      pathKey: 'aiContextOutput',
      contents: jsonOutput(aiContextData)
    }
  ];

  return {
    outputs,
    summary: {
      renderedPortfolioItemCount,
      catalogPortfolioItemCount: portfolioItems.length,
      aiContextPortfolioItemCount: portfolioItems.length,
      caseStudyPageCount: caseStudyPages.length
    }
  };
};
