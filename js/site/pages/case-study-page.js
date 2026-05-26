import { initPortfolioPreview } from '../portfolio-preview.js';

export function hasCaseStudyArtifactPreviews(root = document) {
    return Boolean(root.querySelector('.case-artifact-card .view-details-button'));
}

export function initCaseStudyPage() {
    return initPortfolioPreview(() => {}, {
        openHashOnInit: true,
        updateHashOnOpen: false
    });
}
