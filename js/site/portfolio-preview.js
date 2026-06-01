import { createArtifactPreviewExperience } from './artifact-preview-experience.js';

export function initPortfolioPreview(closeActiveModal = () => {}, { openHashOnInit = true, updateHashOnOpen = true } = {}) {
    return createArtifactPreviewExperience({
        closeActiveModal,
        openHashOnInit,
        updateHashOnOpen
    });
}
