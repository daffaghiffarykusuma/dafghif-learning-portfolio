import { initPortfolioPage } from './portfolio-page.js';
import { initSharedPage } from './shared-page.js';
import { createCaseStudyArtifactPreviewExperience } from '../artifact-preview-experience.js';
import { isCaseStudyPageIdentity, readPageIdentity } from '../case-study-page-identity.js';
import { initContactPrefill } from '../contact-prefill.js';

const pageNameFromPath = (pathname) => pathname.split('/').pop() || 'index.html';

export function initCurrentPage({ pathname = window.location.pathname } = {}) {
    initSharedPage();

    const pageName = pageNameFromPath(pathname);
    const pageIdentity = readPageIdentity({ pathname });
    if (pageName === 'portfolio.html') {
        return initPortfolioPage();
    }

    if (
        isCaseStudyPageIdentity(pageIdentity)
        || document.querySelector('.case-artifact-card .view-details-button')
    ) {
        return createCaseStudyArtifactPreviewExperience();
    }

    if (pageName === 'contact.html') {
        initContactPrefill();
    }

    return null;
}
