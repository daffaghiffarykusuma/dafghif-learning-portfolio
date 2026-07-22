export const PORTFOLIO_ITEM_SCHEMA_VERSION = 1;

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

export type PortfolioItem = {
  id: string;
  title: string;
  practiceArea: string;
  tags: string[];
  description: string;
  image: { src: string; alt: string };
  sourceArtifact: string;
  sourceType: string;
  portfolioItemUrl: string;
  discussUrl: string;
  proof: PortfolioItemProof;
};

type PortfolioCatalogData = {
  schemaVersion: typeof PORTFOLIO_ITEM_SCHEMA_VERSION;
  generatedFrom: string;
  generatedAt: string;
  portfolioItemCount: number;
  portfolioItems: PortfolioItem[];
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};

export const normalizeText = (value: unknown = '') => String(value).replace(/\s+/g, ' ').trim();

const normalizeProofPoint = (value: unknown): ProofPoint => {
  const entry = asRecord(value);
  return {
    claim: normalizeText(entry.claim),
    sourceBasis: normalizeText(entry.sourceBasis),
    confidence: normalizeText(entry.confidence)
  };
};

export const normalizePortfolioItemProof = (value: unknown): PortfolioItemProof => {
  const proof = asRecord(value);
  return {
    visibleProofLine: normalizeText(proof.visibleProofLine),
    workQuality: Array.isArray(proof.workQuality)
      ? proof.workQuality.map(normalizeProofPoint).filter((entry) => entry.claim)
      : [],
    impact: Array.isArray(proof.impact)
      ? proof.impact.map(normalizeProofPoint).filter((entry) => entry.claim)
      : []
  };
};

export const slugify = (value: unknown) =>
  normalizeText(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const normalizePortfolioItem = (sourceItem: unknown): PortfolioItem => {
  const source = asRecord(sourceItem);
  const image = asRecord(source.image);
  const title = normalizeText(source.title);
  const practiceArea = normalizeText(source.practiceArea);

  return {
    id: normalizeText(source.id) || slugify(title),
    title,
    practiceArea,
    tags: Array.isArray(source.tags) ? source.tags.map(normalizeText).filter(Boolean) : [],
    description: normalizeText(source.description),
    image: {
      src: normalizeText(image.src),
      alt: normalizeText(image.alt) || title
    },
    sourceArtifact: normalizeText(source.sourceArtifact),
    sourceType: normalizeText(source.sourceType),
    portfolioItemUrl: normalizeText(source.portfolioItemUrl),
    discussUrl: normalizeText(source.discussUrl),
    proof: normalizePortfolioItemProof(source.proof)
  };
};

export const createPortfolioCatalogData = ({
  generatedFrom,
  portfolioItems,
  generatedAt = new Date().toISOString()
}: { generatedFrom: string; portfolioItems: PortfolioItem[]; generatedAt?: string }): PortfolioCatalogData => ({
  schemaVersion: PORTFOLIO_ITEM_SCHEMA_VERSION,
  generatedFrom,
  generatedAt,
  portfolioItemCount: portfolioItems.length,
  portfolioItems
});
