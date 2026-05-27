import { hasCaseStudyArtifactPreviews, initCaseStudyPage } from './case-study-page.js';
import { initContactPage } from './contact-page.js';
import { initPortfolioPage } from './portfolio-page.js';
import { createPageLifecycle } from '../page-lifecycle.js';
import { getSharedPageInitializers } from './shared-page.js';

const pageNameFromPath = (pathname) => pathname.split('/').pop() || 'index.html';

export function initCurrentPage({ pathname = window.location.pathname } = {}) {
    const pageName = pageNameFromPath(pathname);
    const critical = [];
    if (pageName === 'portfolio.html') {
        critical.push({ name: 'portfolio page', init: initPortfolioPage });
    } else if (hasCaseStudyArtifactPreviews()) {
        critical.push({ name: 'case study page', init: initCaseStudyPage });
    } else if (pageName === 'contact.html') {
        critical.push({ name: 'contact page', init: initContactPage });
    }

    const lifecycle = createPageLifecycle({
        optional: getSharedPageInitializers(),
        critical
    });
    return lifecycle.init();
}
