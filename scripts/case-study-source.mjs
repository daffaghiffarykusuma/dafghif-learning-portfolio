export {
  createCaseStudyPortfolioItem,
  expandCaseStudyPortfolioSource,
  getCaseStudyPagePath,
  getCaseStudySources
} from './case-study-model.mjs';
export {
  renderCaseStudyCards,
  renderCaseStudyIndexHtml
} from './case-study-index-renderer.mjs';
export {
  renderCaseStudyHtml,
  renderCaseStudyPreviews
} from './case-study-page-renderer.mjs';
import { getCaseStudySources } from './case-study-model.mjs';
import { renderCaseStudyIndexHtml } from './case-study-index-renderer.mjs';
import { renderCaseStudyPreviews } from './case-study-page-renderer.mjs';

export const renderCaseStudyPages = (portfolioSource = {}) => [
  {
    outputPath: 'case-studies.html',
    html: renderCaseStudyIndexHtml(getCaseStudySources(portfolioSource))
  },
  ...renderCaseStudyPreviews(portfolioSource)
];
