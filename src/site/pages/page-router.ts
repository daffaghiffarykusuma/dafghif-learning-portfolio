import { initPortfolioDiscovery } from '../../portfolio-discovery.ts';
import { initSharedPage } from './shared-page.ts';
import {
    createCaseStudyArtifactPreviewExperience,
    createPortfolioItemPreviewExperience
} from '../artifact-preview-experience.ts';
import { isCaseStudyPageIdentity, readPageIdentity } from '../case-study-page-identity.ts';

const pageNameFromPath = (pathname: string) => pathname.split('/').pop() || 'index.html';

export function initCurrentPage({ pathname = window.location.pathname }: { pathname?: string } = {}) {
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
