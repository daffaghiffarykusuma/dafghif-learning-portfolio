import { initPortfolioDiscovery } from '../../portfolio-discovery.js';
import { initSharedPage } from './shared-page.js';
import {
    createCaseStudyArtifactPreviewExperience,
    createPortfolioItemPreviewExperience
} from '../artifact-preview-experience.js';
import { isCaseStudyPageIdentity, readPageIdentity } from '../case-study-page-identity.ts';

const pageNameFromPath = (pathname) => pathname.split('/').pop() || 'index.html';

export function initCurrentPage({ pathname = window.location.pathname } = {}) {
    initSharedPage();

    const pageName = pageNameFromPath(pathname);
    const pageIdentity = readPageIdentity({ pathname });
    if (pageName === 'portfolio.html') {
        const preview = createPortfolioItemPreviewExperience();
        initPortfolioDiscovery();
        preview.openPreviewFromHash();
        return preview;
    }

    if (
        isCaseStudyPageIdentity(pageIdentity)
        || document.querySelector('.case-artifact-card .view-details-button')
    ) {
        return createCaseStudyArtifactPreviewExperience();
    }

    return null;
}
