import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { findStalePortfolioEvidenceOutputs } from '../portfolio-generation-command.ts';
import { validatePortfolioItemSource, type ValidatedPortfolioItemSource } from '../portfolio/portfolio-item-source-validator.ts';
import { createShippedArtifactPolicy } from '../site/shipped-artifact-policy.ts';

type PortfolioEvidenceRecord = Record<string, unknown>;

export type PortfolioEvidenceValidationResult = {
  failures: string[];
  portfolioItemCount: number;
  portfolioSourceItemCount: number;
};

type ValidatePortfolioEvidenceDataOptions = {
  portfolioSourceData: unknown;
  validatedSource: ValidatedPortfolioItemSource;
  portfolioCatalog: unknown;
  portfolioAiContext: unknown;
  root: string;
};

const asRecord = (value: unknown): PortfolioEvidenceRecord =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as PortfolioEvidenceRecord
    : {};

const getPortfolioEvidenceItems = (portfolioData: unknown): PortfolioEvidenceRecord[] => {
  const source = asRecord(portfolioData);
  return Array.isArray(source.portfolioItems)
    ? source.portfolioItems.map(asRecord)
    : [];
};

const assetExists = async (absolutePath: string) => {
  try {
    await stat(absolutePath);
    return true;
  } catch {
    return false;
  }
};

const createRootGuard = (root: string) => (targetPath: string) => {
  const relativePath = path.relative(root, targetPath);
  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
};

const validatePortfolioEvidenceData = async ({
  portfolioSourceData,
  validatedSource,
  portfolioCatalog,
  portfolioAiContext,
  root
}: ValidatePortfolioEvidenceDataOptions): Promise<PortfolioEvidenceValidationResult> => {
  const failures: string[] = [];
  const shippedArtifacts = createShippedArtifactPolicy({
    rootDir: root,
    portfolioSource: asRecord(portfolioSourceData)
  });
  const isInsideRoot = createRootGuard(root);
  const decodeUrlPart = (file: string, attr: string, value: string): string | null => {
    try {
      return decodeURIComponent(value);
    } catch {
      failures.push(`${file}: ${attr} uses invalid percent-encoding: ${value}`);
      return null;
    }
  };

  const sourceItems = validatedSource.portfolioItems;
  if (sourceItems.length === 0) {
    failures.push('assets/data/portfolio-source.json: expected at least one Portfolio Item source record');
  }

  const portfolioItems = getPortfolioEvidenceItems(portfolioCatalog);
  if (portfolioItems.length === 0) {
    failures.push('assets/data/portfolio-items.json: expected at least one portfolio item');
  }

  for (const [index, portfolioItem] of portfolioItems.entries()) {
    const label = `assets/data/portfolio-items.json: portfolio item ${index + 1}`;
    for (const key of ['id', 'title', 'practiceArea', 'description', 'sourceArtifact']) {
      if (!portfolioItem[key]) {
        failures.push(`${label} is missing ${key}`);
      }
    }

    const image = asRecord(portfolioItem.image);
    for (const value of [image.src, portfolioItem.sourceArtifact].filter(Boolean).map(String)) {
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

    const sourceArtifact = portfolioItem.sourceArtifact
      ? String(portfolioItem.sourceArtifact)
      : '';
    if (sourceArtifact) {
      if (shippedArtifacts.isDeniedPath(sourceArtifact)) {
        failures.push(`${label} references a denied shipped Artifact source type: ${sourceArtifact}`);
      } else if (!shippedArtifacts.isPublicPath(sourceArtifact)) {
        failures.push(`${label} sourceArtifact is outside the Shipped Artifact Policy: ${sourceArtifact}`);
      }
    }

    const proof = asRecord(portfolioItem.proof);
    if (!proof.visibleProofLine) {
      failures.push(`${label} is missing proof.visibleProofLine`);
    }
    if (!Array.isArray(proof.workQuality) || proof.workQuality.length === 0) {
      failures.push(`${label} is missing proof.workQuality evidence`);
    }
    if (Array.isArray(proof.impact)) {
      proof.impact.map(asRecord).forEach((entry, proofIndex) => {
        if (!entry.claim || entry.confidence !== 'direct') {
          failures.push(`${label} impact proof ${proofIndex + 1} must be a direct, explicitly supported claim`);
        }
      });
    }
  }

  const aiContextItems = portfolioAiContext ? getPortfolioEvidenceItems(portfolioAiContext) : [];
  aiContextItems.forEach((portfolioItem, index) => {
    const label = `assets/data/portfolio-ai-context.json: portfolio item ${index + 1}`;
    const aiContext = asRecord(portfolioItem.aiContext);
    const outcomeEvidence = aiContext.outcomeEvidence;
    if (!Array.isArray(outcomeEvidence)) {
      failures.push(`${label} is missing aiContext.outcomeEvidence array`);
      return;
    }
    outcomeEvidence.map(asRecord).forEach((entry, evidenceIndex) => {
      if (!entry.claim || entry.confidence !== 'direct') {
        failures.push(`${label} Outcome Evidence ${evidenceIndex + 1} must be a direct Proof Point impact entry`);
      }
    });
    const aiHint = asRecord(aiContext.aiHint);
    if (aiContext.aiHint && aiHint.evidenceLevel !== 'inferred non-proof drafting hint') {
      failures.push(`${label} aiHint must be labeled as an inferred non-proof drafting hint`);
    }
  });

  return {
    failures,
    portfolioItemCount: portfolioItems.length,
    portfolioSourceItemCount: sourceItems.length
  };
};

export const validatePortfolioEvidence = async ({
  root = process.cwd()
}: { root?: string } = {}): Promise<PortfolioEvidenceValidationResult> => {
  const portfolioSourceData: unknown = JSON.parse(await readFile(path.join(root, 'assets/data/portfolio-source.json'), 'utf8'));
  const proofSource: unknown = JSON.parse(await readFile(path.join(root, 'assets/data/portfolio-proof-points.json'), 'utf8'));
  const portfolioCatalog: unknown = JSON.parse(await readFile(path.join(root, 'assets/data/portfolio-items.json'), 'utf8'));
  const portfolioAiContext: unknown = JSON.parse(await readFile(path.join(root, 'assets/data/portfolio-ai-context.json'), 'utf8'));

  const sourceValidation = validatePortfolioItemSource({
    portfolioSource: portfolioSourceData,
    proofSource
  });
  const evidenceValidation = await validatePortfolioEvidenceData({
    portfolioSourceData,
    validatedSource: sourceValidation,
    portfolioCatalog,
    portfolioAiContext,
    root
  });
  // Generated outputs correspond to the source exactly when they match a fresh
  // generation, so one freshness check replaces field-by-field comparison.
  const freshnessFailures = sourceValidation.failures.length
    ? []
    : await findStalePortfolioEvidenceOutputs({ rootDir: root })
      .then((stale) => stale.map((file) => `${file} is stale; run bun run generate:portfolio`))
      .catch((error: Error) => [`Portfolio Evidence Workflow could not regenerate outputs: ${error.message}`]);
  return {
    ...evidenceValidation,
    failures: [...sourceValidation.failures, ...evidenceValidation.failures, ...freshnessFailures]
  };
};
