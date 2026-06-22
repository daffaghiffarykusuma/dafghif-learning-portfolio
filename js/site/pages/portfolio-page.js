import { initPortfolioDiscovery } from '../../portfolio-discovery.js';
import { initPortfolioItemModals } from '../portfolio-item-modals.js';
import { createPortfolioItemPreviewExperience } from '../artifact-preview-experience.js';

export function initPortfolioPage() {
    const modals = initPortfolioItemModals();
    const preview = createPortfolioItemPreviewExperience(modals.closeActiveModal);
    initPortfolioDiscovery();
    preview.openPreviewFromHash();
    return preview;
}
