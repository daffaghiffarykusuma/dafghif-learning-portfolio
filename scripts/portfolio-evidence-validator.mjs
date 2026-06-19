import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { validatePortfolioItemSource } from './portfolio-item-source-validator.mjs';
import { createShippedArtifactPolicy } from './shipped-artifact-policy.mjs';

export const getPortfolioEvidenceItems = (portfolioData = {}) => {
  if (Array.isArray(portfolioData.portfolioItems)) return portfolioData.portfolioItems;
  if (Array.isArray(portfolioData.projects)) return portfolioData.projects;
  return [];
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
  portfolioSourceItems,
  portfolioCatalog,
  portfolioAiContext,
  root = process.cwd(),
  assetExists = defaultAssetExists,
  shippedArtifacts = createShippedArtifactPolicy({
    rootDir: root,
    portfolioSource: portfolioSourceData
  })
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

  const sourceItems = Array.isArray(portfolioSourceItems)
    ? portfolioSourceItems
    : getPortfolioEvidenceItems(portfolioSourceData);
  if (sourceItems.length === 0) {
    failures.push('assets/data/portfolio-source.json: expected at least one Portfolio Item source record');
  }

  const portfolioItems = getPortfolioEvidenceItems(portfolioCatalog);
  if (portfolioItems.length === 0) {
    failures.push('assets/data/portfolio-items.json: expected at least one portfolio item');
  }
  if (sourceItems.length !== portfolioItems.length) {
    failures.push(`Portfolio Item source/catalog count mismatch: source=${sourceItems.length}, catalog=${portfolioItems.length}`);
  }

  const portfolioSourceIds = sourceItems.map((item) => item.id).join('|');
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
      if (shippedArtifacts.isDeniedPath(portfolioItem.sourceArtifact)) {
        failures.push(`${label} references a denied shipped Artifact source type: ${portfolioItem.sourceArtifact}`);
      } else if (!shippedArtifacts.isPublicPath(portfolioItem.sourceArtifact)) {
        failures.push(`${label} sourceArtifact is outside the Shipped Artifact Policy: ${portfolioItem.sourceArtifact}`);
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
    portfolioSourceItemCount: sourceItems.length
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
    portfolioSourceItems: sourceValidation.portfolioItems,
    portfolioCatalog,
    portfolioAiContext,
    root
  });
  return {
    ...evidenceValidation,
    failures: [...sourceValidation.failures, ...evidenceValidation.failures]
  };
};
