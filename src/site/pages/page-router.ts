import { initPortfolioDiscovery } from '../../portfolio-discovery.ts';
import { initEngagementInquiryJourney } from '../engagement-inquiry-journey.ts';
import { initNavigation } from '../navigation.ts';
import { initPageEnhancements } from '../page-enhancements.ts';
import {
    createCaseStudyArtifactPreviewExperience,
    createPortfolioItemPreviewExperience
} from '../artifact-preview-experience.ts';
import { SITE_PAGE_KINDS, isCaseStudyPageIdentity, readPageIdentity } from '../site-page-identity.ts';

// Site Page Identity, serialized onto <body> by the Site Page Shell, is the only
// routing input: no pathname or markup sniffing.
export function initCurrentPage() {
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

    const pageIdentity = readPageIdentity();
    if (pageIdentity.kind === SITE_PAGE_KINDS.portfolio) {
        const preview = createPortfolioItemPreviewExperience();
        // Discovery reveals the requested batch first, so a hash can target any card.
        initPortfolioDiscovery();
        preview.openPreviewFromHash();
        return preview;
    }

    if (isCaseStudyPageIdentity(pageIdentity)) {
        return createCaseStudyArtifactPreviewExperience();
    }

    return null;
}
