import { hasCaseStudyArtifactPreviews, initCaseStudyPage } from './case-study-page.js';
import { initContactPage } from './contact-page.js';
import { initPortfolioPage } from './portfolio-page.js';
import { initSharedPage } from './shared-page.js';
import { isCaseStudyPageIdentity, readPageIdentity } from '../case-study-page-identity.js';

const pageNameFromPath = (pathname) => pathname.split('/').pop() || 'index.html';

export function initCurrentPage({ pathname = window.location.pathname } = {}) {
    initSharedPage();

    const pageName = pageNameFromPath(pathname);
    const pageIdentity = readPageIdentity({ pathname });
    if (pageName === 'portfolio.html') {
        return initPortfolioPage();
    }

    if (isCaseStudyPageIdentity(pageIdentity) || hasCaseStudyArtifactPreviews()) {
        return initCaseStudyPage();
    }

    if (pageName === 'contact.html') {
        initContactPage();
    }

    return null;
}
