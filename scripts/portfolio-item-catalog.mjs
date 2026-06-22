export const PORTFOLIO_ITEM_SCHEMA_VERSION = 1;

export const normalizeText = (value = '') => String(value).replace(/\s+/g, ' ').trim();

export const slugify = (value) =>
  normalizeText(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const normalizePortfolioItem = (sourceItem) => {
  const title = normalizeText(sourceItem.title);
  const practiceArea = normalizeText(sourceItem.practiceArea);

  return {
    id: normalizeText(sourceItem.id) || slugify(title),
    title,
    practiceArea,
    tags: Array.isArray(sourceItem.tags) ? sourceItem.tags.map(normalizeText).filter(Boolean) : [],
    description: normalizeText(sourceItem.description),
    image: {
      src: normalizeText(sourceItem.image?.src),
      alt: normalizeText(sourceItem.image?.alt) || title
    },
    sourceArtifact: normalizeText(sourceItem.sourceArtifact),
    sourceType: normalizeText(sourceItem.sourceType),
    portfolioItemUrl: normalizeText(sourceItem.portfolioItemUrl),
    discussUrl: normalizeText(sourceItem.discussUrl),
    proof: sourceItem.proof || {
      visibleProofLine: '',
      workQuality: [],
      impact: []
    }
  };
};

export const createPortfolioCatalogData = ({ generatedFrom, portfolioItems, generatedAt = new Date().toISOString() }) => ({
  schemaVersion: PORTFOLIO_ITEM_SCHEMA_VERSION,
  generatedFrom,
  generatedAt,
  portfolioItemCount: portfolioItems.length,
  portfolioItems
});
