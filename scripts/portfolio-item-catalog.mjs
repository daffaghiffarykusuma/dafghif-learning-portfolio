export const PORTFOLIO_ITEM_SCHEMA_VERSION = 1;

export const normalizeText = (value = '') => String(value).replace(/\s+/g, ' ').trim();

export const slugify = (value) =>
  normalizeText(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const getPortfolioItemSourceItems = (portfolioSource) => {
  if (Array.isArray(portfolioSource?.portfolioItems)) return portfolioSource.portfolioItems;
  if (Array.isArray(portfolioSource?.projects)) return portfolioSource.projects;
  return [];
};

export const parsePortfolioItemsFromDocument = (document) =>
  Array.from(document.querySelectorAll('.card.portfolio-item'))
    .filter((card) => !card.classList.contains('portfolio-item-placeholder'))
    .map(parsePortfolioItemCard);

export const parsePortfolioItemCard = (card) => {
  const title = normalizeText(card.querySelector('h3')?.textContent || '');
  const practiceArea = normalizeText(card.querySelector('.portfolio-item-practice-label')?.textContent || '');
  const description = normalizeText(card.querySelector('.card-content p')?.textContent || '');
  const image = card.querySelector('.card-image img');
  const detailsButton = card.querySelector('.view-details-button');
  const discussLink = card.querySelector('.card-actions a[href^="contact.html"]');

  return normalizePortfolioItem({
    id: card.id || card.dataset.portfolioItemId || card.dataset.projectId || '',
    title,
    practiceArea,
    tags: (card.dataset.category || '').split(/\s+/).filter(Boolean),
    description,
    image: {
      src: image?.getAttribute('src') || '',
      alt: image?.getAttribute('alt') || title
    },
    sourceArtifact: detailsButton?.dataset.pdf || detailsButton?.dataset.viewer || '',
    sourceType: detailsButton?.dataset.pdf ? 'pdf' : detailsButton?.dataset.viewer ? 'html-viewer' : '',
    portfolioItemUrl: card.dataset.portfolioItemUrl || card.dataset.projectUrl || (card.id ? `portfolio.html#${card.id}` : ''),
    discussUrl: discussLink?.getAttribute('href') || ''
  });
};

export const normalizePortfolioItem = (sourceItem) => {
  const title = normalizeText(sourceItem.title);
  const practiceArea = normalizeText(sourceItem.practiceArea || sourceItem.category);

  return {
    id: normalizeText(sourceItem.id) || slugify(title),
    title,
    practiceArea,
    tags: Array.isArray(sourceItem.tags) ? sourceItem.tags.map(normalizeText).filter(Boolean) : [],
    description: normalizeText(sourceItem.description || sourceItem.publicDescription),
    image: {
      src: normalizeText(sourceItem.image?.src),
      alt: normalizeText(sourceItem.image?.alt) || title
    },
    sourceArtifact: normalizeText(sourceItem.sourceArtifact || sourceItem.source),
    sourceType: normalizeText(sourceItem.sourceType),
    portfolioItemUrl: normalizeText(sourceItem.portfolioItemUrl || sourceItem.projectUrl),
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
