import { initPortfolioDiscovery } from '../../portfolio-discovery.ts';
import { initEngagementInquiryJourney } from '../engagement-inquiry-journey.ts';
import { initNavigation } from '../navigation.ts';
import { initPageEnhancements } from '../page-enhancements.ts';
import {
    createCaseStudyArtifactPreviewExperience,
    createPortfolioItemPreviewExperience
} from '../artifact-preview-experience.ts';
import { isCaseStudyPageIdentity, readPageIdentity } from '../case-study-page-identity.ts';

const pageNameFromPath = (pathname: string) => pathname.split('/').pop() || 'index.html';

export function initCurrentPage({ pathname = window.location.pathname }: { pathname?: string } = {}) {
    [
        { name: 'navigation', init: initNavigation },
        { name: 'engagement inquiry journey', init: initEngagementInquiryJourney },
        { name: 'page enhancements', init: initPageEnhancements }
    ].forEach(({ name, init }) => {
        try {
            init();
        } catch (error) {
            console.warn(`Optional page initializer failed: ${name}`, error);
        }
    });

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
