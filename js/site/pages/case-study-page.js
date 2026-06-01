import { createCaseStudyArtifactPreviewExperience } from '../artifact-preview-experience.js';

export function hasCaseStudyArtifactPreviews(root = document) {
    return Boolean(root.querySelector('.case-artifact-card .view-details-button'));
}

export function initCaseStudyPage() {
    return createCaseStudyArtifactPreviewExperience();
}
