import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { expandCaseStudyPortfolioSource } from './case-study-model.mjs';
import { validatePortfolioItemSource } from './portfolio-item-source-validator.mjs';
import { isDeniedShippedArtifactPath, isPublicShippedArtifactPath } from './shipped-artifact-inventory.mjs';

export const getPortfolioEvidenceItems = (portfolioData = {}) => {
  if (Array.isArray(portfolioData.portfolioItems)) return portfolioData.portfolioItems;
  if (Array.isArray(portfolioData.projects)) return portfolioData.projects;
  return [];
};

export const getExpandedPortfolioEvidenceItems = (portfolioData = {}) => {
  const items = getPortfolioEvidenceItems(expandCaseStudyPortfolioSource(portfolioData));
  const featuredIds = Array.isArray(portfolioData.featuredPortfolioItemIds)
    ? portfolioData.featuredPortfolioItemIds
    : [];
  const itemsById = new Map(items.map((item) => [item.id, item]));
  const featured = featuredIds.map((id) => itemsById.get(id)).filter(Boolean);
  const featuredIdSet = new Set(featured.map((item) => item.id));
  return [...featured, ...items.filter((item) => !featuredIdSet.has(item.id))];
};

const defaultAssetExists = async (absolutePath) => {
  try {
    await stat(absolutePath);
    return true;
  } catch {
    return false;
  }
};

const createRootGuard = (root) => (targetPath) => {
  const relativePath = path.relative(root, targetPath);
  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
};

export const validatePortfolioEvidenceData = async ({
  portfolioSourceData,
  portfolioCatalog,
  portfolioAiContext,
  root = process.cwd(),
  assetExists = defaultAssetExists
}) => {
  const failures = [];
  const isInsideRoot = createRootGuard(root);
  const decodeUrlPart = (file, attr, value) => {
    try {
      return decodeURIComponent(value);
    } catch {
      failures.push(`${file}: ${attr} uses invalid percent-encoding: ${value}`);
      return null;
    }
  };

  const portfolioSourceItems = getExpandedPortfolioEvidenceItems(portfolioSourceData);
  if (portfolioSourceItems.length === 0) {
    failures.push('assets/data/portfolio-source.json: expected at least one Portfolio Item source record');
  }

  const portfolioItems = getPortfolioEvidenceItems(portfolioCatalog);
  if (portfolioItems.length === 0) {
    failures.push('assets/data/portfolio-items.json: expected at least one portfolio item');
  }
  if (portfolioSourceItems.length !== portfolioItems.length) {
    failures.push(`Portfolio Item source/catalog count mismatch: source=${portfolioSourceItems.length}, catalog=${portfolioItems.length}`);
  }

  const portfolioSourceIds = portfolioSourceItems.map((item) => item.id).join('|');
  const portfolioCatalogIds = portfolioItems.map((item) => item.id).join('|');
  if (portfolioSourceIds !== portfolioCatalogIds) {
    failures.push('Portfolio Item source/catalog id order mismatch; regenerate catalog and rendered cards from assets/data/portfolio-source.json');
  }

  for (const [index, portfolioItem] of portfolioItems.entries()) {
    const label = `assets/data/portfolio-items.json: portfolio item ${index + 1}`;
    for (const key of ['id', 'title', 'practiceArea', 'description', 'sourceArtifact']) {
      if (!portfolioItem[key]) {
        failures.push(`${label} is missing ${key}`);
      }
    }

    for (const value of [portfolioItem.image?.src, portfolioItem.sourceArtifact].filter(Boolean)) {
      const decodedPath = decodeUrlPart('assets/data/portfolio-items.json', 'portfolio asset', value);
      if (decodedPath === null) continue;
      const targetPath = path.resolve(root, decodedPath);
      if (!isInsideRoot(targetPath)) {
        failures.push(`${label} references asset outside the project root: ${value}`);
        continue;
      }
      if (!(await assetExists(targetPath))) {
        failures.push(`${label} references missing asset: ${value}`);
      }
    }

    if (portfolioItem.sourceArtifact) {
      if (isDeniedShippedArtifactPath(portfolioItem.sourceArtifact)) {
        failures.push(`${label} references a denied shipped Artifact source type: ${portfolioItem.sourceArtifact}`);
      } else if (!isPublicShippedArtifactPath(portfolioItem.sourceArtifact)) {
        failures.push(`${label} sourceArtifact is outside the shipped Artifact Inventory: ${portfolioItem.sourceArtifact}`);
      }
    }

    if (!portfolioItem.proof?.visibleProofLine) {
      failures.push(`${label} is missing proof.visibleProofLine`);
    }
    if (!Array.isArray(portfolioItem.proof?.workQuality) || portfolioItem.proof.workQuality.length === 0) {
      failures.push(`${label} is missing proof.workQuality evidence`);
    }
    if (Array.isArray(portfolioItem.proof?.impact)) {
      portfolioItem.proof.impact.forEach((entry, proofIndex) => {
        if (!entry.claim || entry.confidence !== 'direct') {
          failures.push(`${label} impact proof ${proofIndex + 1} must be a direct, explicitly supported claim`);
        }
      });
    }
  }

  const aiContextItems = portfolioAiContext ? getPortfolioEvidenceItems(portfolioAiContext) : [];
  if (portfolioAiContext && aiContextItems.length !== portfolioItems.length) {
    failures.push(`Portfolio Item catalog/AI context count mismatch: catalog=${portfolioItems.length}, aiContext=${aiContextItems.length}`);
  }
  aiContextItems.forEach((portfolioItem, index) => {
    const label = `assets/data/portfolio-ai-context.json: portfolio item ${index + 1}`;
    const outcomeEvidence = portfolioItem.aiContext?.outcomeEvidence;
    if (!Array.isArray(outcomeEvidence)) {
      failures.push(`${label} is missing aiContext.outcomeEvidence array`);
      return;
    }
    outcomeEvidence.forEach((entry, evidenceIndex) => {
      if (!entry.claim || entry.confidence !== 'direct') {
        failures.push(`${label} Outcome Evidence ${evidenceIndex + 1} must be a direct Proof Point impact entry`);
      }
    });
    if (portfolioItem.aiContext?.aiHint && portfolioItem.aiContext.aiHint.evidenceLevel !== 'inferred non-proof drafting hint') {
      failures.push(`${label} aiHint must be labeled as an inferred non-proof drafting hint`);
    }
  });

  return {
    failures,
    portfolioItemCount: portfolioItems.length,
    portfolioSourceItemCount: portfolioSourceItems.length
  };
};

export const validatePortfolioEvidence = async ({ root = process.cwd() } = {}) => {
  const portfolioSourceData = JSON.parse(await readFile(path.join(root, 'assets/data/portfolio-source.json'), 'utf8'));
  const proofSource = JSON.parse(await readFile(path.join(root, 'assets/data/portfolio-proof-points.json'), 'utf8'));
  const portfolioCatalog = JSON.parse(await readFile(path.join(root, 'assets/data/portfolio-items.json'), 'utf8'));
  const portfolioAiContext = JSON.parse(await readFile(path.join(root, 'assets/data/portfolio-ai-context.json'), 'utf8'));

  const sourceValidation = validatePortfolioItemSource({
    portfolioSource: portfolioSourceData,
    proofSource
  });
  const evidenceValidation = await validatePortfolioEvidenceData({
    portfolioSourceData,
    portfolioCatalog,
    portfolioAiContext,
    root
  });
  return {
    ...evidenceValidation,
    failures: [...sourceValidation.failures, ...evidenceValidation.failures]
  };
};
