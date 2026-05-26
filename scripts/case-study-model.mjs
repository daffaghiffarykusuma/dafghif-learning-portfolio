import { normalizePortfolioItem, normalizeText } from './portfolio-item-catalog.mjs';

export const featuredCaseStudies = Object.freeze([
  Object.freeze({
    id: 'case-entrepreneurship-program',
    portfolioItemTitle: 'Entrepreneurship Program for 5,000+ SMK Students',
    practiceArea: 'Custom Training & Workshops',
    description: 'A multi-city entrepreneurship learning journey for vocational students, combining curriculum design, mentor enablement, facilitation, and measurement.',
    pagePath: 'case-entrepreneurship.html',
    image: Object.freeze({
      src: 'assets/images/portfolio/smk.webp',
      alt: 'Entrepreneurship program case study thumbnail'
    })
  })
]);

export const normalizeArtifact = (artifact = {}) => ({
  title: normalizeText(artifact.title),
  description: normalizeText(artifact.description),
  href: normalizeText(artifact.href),
  linkLabel: normalizeText(artifact.linkLabel) || 'Open Artifact'
});

export const getCaseStudyPagePath = (caseStudy = {}) =>
  normalizeText(caseStudy.pagePath) || `${normalizeText(caseStudy.id)}.html`;

export const getCaseStudySources = (portfolioSource = {}) =>
  Array.isArray(portfolioSource.caseStudies) ? portfolioSource.caseStudies : [];

export const getFeaturedCaseStudies = () => [...featuredCaseStudies];

export const getIndexCaseStudies = (caseStudies = []) => [
  ...getFeaturedCaseStudies(),
  ...caseStudies
];

export const createCaseStudyPortfolioItem = (caseStudy = {}) =>
  normalizePortfolioItem({
    id: caseStudy.id,
    title: caseStudy.portfolioItemTitle || `${caseStudy.title} Case Study`,
    practiceArea: caseStudy.practiceArea,
    tags: ['case-study', ...(Array.isArray(caseStudy.tags) ? caseStudy.tags : [])],
    description: caseStudy.description,
    image: caseStudy.image,
    sourceArtifact: getCaseStudyPagePath(caseStudy),
    sourceType: 'case-study-page',
    portfolioItemUrl: caseStudy.portfolioItemUrl || getCaseStudyPagePath(caseStudy),
    discussUrl: caseStudy.discussUrl || `contact.html?portfolioItem=${encodeURIComponent(caseStudy.portfolioItemTitle || caseStudy.title)}`
  });

export const getAbsorbedPortfolioItemIds = (caseStudies = []) =>
  new Set(
    caseStudies
      .flatMap((caseStudy) => Array.isArray(caseStudy.absorbedPortfolioItemIds) ? caseStudy.absorbedPortfolioItemIds : [])
      .map(normalizeText)
  );

export const expandCaseStudyPortfolioSource = (portfolioSource = {}) => {
  const caseStudies = getCaseStudySources(portfolioSource);
  const caseStudyItems = caseStudies.map(createCaseStudyPortfolioItem);
  const caseStudyIds = new Set(caseStudyItems.map((item) => item.id));
  const absorbedItemIds = getAbsorbedPortfolioItemIds(caseStudies);
  const portfolioItems = Array.isArray(portfolioSource.portfolioItems) ? portfolioSource.portfolioItems : [];
  const nonCaseStudyItems = portfolioItems.filter((item) => {
    const id = normalizeText(item.id);
    return !caseStudyIds.has(id) && !absorbedItemIds.has(id);
  });

  return {
    ...portfolioSource,
    portfolioItems: [...caseStudyItems, ...nonCaseStudyItems],
    portfolioItemCount: caseStudyItems.length + nonCaseStudyItems.length
  };
};

