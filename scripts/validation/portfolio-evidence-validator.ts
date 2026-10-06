import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { validatePortfolioItemSource, type ValidatedPortfolioItemSource } from '../portfolio/portfolio-item-source-validator.ts';
import type { PortfolioItem } from '../portfolio/portfolio-item-catalog.ts';
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

// Compare parsed facts without normalizing away drift or depending on JSON key order.
const validateSourceCorrespondence = (
  source: ValidatedPortfolioItemSource,
  catalogItems: PortfolioEvidenceRecord[],
  aiContextItems: PortfolioEvidenceRecord[]
): string[] => {
  if (source.failures.length) return [];

  const failures: string[] = [];
  const itemsById = new Map(source.portfolioItems.map((item) => [item.id, item]));
  const compare = (label: string, field: string, actual: unknown, expected: unknown) => {
    if (!isDeepStrictEqual(actual, expected)) {
      failures.push(`${label} ${field} does not match Validated Portfolio Item Source`);
    }
  };

  catalogItems.forEach((item, index) => {
    const expected = typeof item.id === 'string' ? itemsById.get(item.id) : undefined;
    if (!expected) return; // The identity/order check reports unmatched records.
    const label = `assets/data/portfolio-items.json: portfolio item ${index + 1}`;
    const fields: (keyof PortfolioItem)[] = [
      'title', 'practiceArea', 'tags', 'description', 'audience', 'image',
      'sourceArtifact', 'sourceType', 'portfolioItemUrl', 'discussUrl', 'proof'
    ];
    for (const field of fields) compare(label, field, item[field], expected[field]);
  });

  if (!isDeepStrictEqual(source.portfolioItems.map((item) => item.id), aiContextItems.map((item) => item.id))) {
    failures.push('Portfolio Item source/AI context id order mismatch; regenerate AI context from assets/data/portfolio-source.json');
  }
  aiContextItems.forEach((item, index) => {
    const expected = typeof item.id === 'string' ? itemsById.get(item.id) : undefined;
    if (!expected) return;
    const label = `assets/data/portfolio-ai-context.json: portfolio item ${index + 1}`;
    for (const field of ['title', 'practiceArea', 'tags', 'sourceArtifact'] as const) {
      compare(label, field, item[field], expected[field]);
    }
    compare(label, 'publicDescription', item.publicDescription, expected.description);
    const aiContext = asRecord(item.aiContext);
    compare(label, 'aiContext.proof', aiContext.proof, expected.proof);
    compare(label, 'aiContext.outcomeEvidence', aiContext.outcomeEvidence,
      expected.proof.impact.filter((entry) => entry.claim && entry.confidence === 'direct'));
    const artifacts = source.caseStudyPublication.artifactMetadataByCaseStudyId.get(expected.id);
    compare(label, 'caseStudyArtifacts', item.caseStudyArtifacts, artifacts?.length ? artifacts : undefined);
  });
  return failures;
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
  if (sourceItems.length !== portfolioItems.length) {
    failures.push(`Portfolio Item source/catalog count mismatch: source=${sourceItems.length}, catalog=${portfolioItems.length}`);
  }

  const portfolioSourceIds = sourceItems.map((item) => item.id);
  const portfolioCatalogIds = portfolioItems.map((item) => item.id);
  if (!isDeepStrictEqual(portfolioSourceIds, portfolioCatalogIds)) {
    failures.push('Portfolio Item source/catalog id order mismatch; regenerate catalog and rendered cards from assets/data/portfolio-source.json');
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
  if (portfolioAiContext && aiContextItems.length !== portfolioItems.length) {
    failures.push(`Portfolio Item catalog/AI context count mismatch: catalog=${portfolioItems.length}, aiContext=${aiContextItems.length}`);
  }
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

  failures.push(...validateSourceCorrespondence(validatedSource, portfolioItems, aiContextItems));

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
  return {
    ...evidenceValidation,
    failures: [...sourceValidation.failures, ...evidenceValidation.failures]
  };
};
