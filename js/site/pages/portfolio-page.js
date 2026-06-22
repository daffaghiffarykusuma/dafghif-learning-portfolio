import { initPortfolioDiscovery } from '../../portfolio-discovery.js';
import { createPortfolioItemPreviewExperience } from '../artifact-preview-experience.js';

export function initPortfolioPage() {
    const preview = createPortfolioItemPreviewExperience();
    initPortfolioDiscovery();
    preview.openPreviewFromHash();
    return preview;
}
