import { normalizeText } from './portfolio-item-catalog.mjs';
import { getCaseStudyPagePath, getIndexCaseStudies } from './case-study-model.mjs';
import {
  escapeHtml,
  renderGeneratedHtmlDocument,
  renderSimpleGeneratedSiteFooter
} from './generated-site-chrome.mjs';

export const renderCaseStudyCards = (caseStudies = []) =>
  getIndexCaseStudies(caseStudies)
    .map((caseStudy) => {
      const pagePath = getCaseStudyPagePath(caseStudy);
      const title = normalizeText(caseStudy.portfolioItemTitle || `${caseStudy.title} Case Study`);
      return `<article class="case-study-card">
                    <a href="${escapeHtml(pagePath)}" class="case-study-card-image">
                        <img src="${escapeHtml(caseStudy.image?.src)}" alt="${escapeHtml(caseStudy.image?.alt || title)}" loading="lazy" decoding="async">
                    </a>
                    <div class="case-study-card-body">
                        <p class="portfolio-item-practice-label">${escapeHtml(caseStudy.practiceArea)}</p>
                        <h2><a href="${escapeHtml(pagePath)}">${escapeHtml(title)}</a></h2>
                        <p>${escapeHtml(caseStudy.description || caseStudy.summary)}</p>
                        <a class="cta-button" href="${escapeHtml(pagePath)}">Read Case Study</a>
                    </div>
                </article>`;
    })
    .join('\n                ');

export const renderCaseStudyIndexHtml = (caseStudies = []) => renderGeneratedHtmlDocument({
  title: 'Case Studies | Daffa Ghiffary Kusuma',
  description: 'Selected learning design case studies by Daffa Ghiffary Kusuma, grouped into decision-ready narratives with artifacts, assumptions, and evidence limits.',
  currentPage: 'case-studies.html',
  footer: renderSimpleGeneratedSiteFooter(),
  main: `<main id="main-content" role="main" aria-label="Main content">
        <section class="service-hero service-hero-compact">
            <div class="container">
                <p class="service-eyebrow">Case Studies</p>
                <h1>Selected Learning Design Cases</h1>
                <p class="lead">Grouped portfolio evidence shown as reviewable case studies, so each story can explain the audience, decision context, artifacts, and limits without loading every preview inside the portfolio grid.</p>
            </div>
        </section>
        <section class="case-study-index">
            <div class="container">
                <div class="case-study-card-grid">
                ${renderCaseStudyCards(caseStudies)}
                </div>
            </div>
        </section>
    </main>`
});
