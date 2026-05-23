import { initPortfolioItemFilters } from '../../portfolio-item-filters.js';
import { initPortfolioItemModals } from '../portfolio-item-modals.js';
import { initPortfolioPreview } from '../portfolio-preview.js';

export function initPortfolioPage() {
    const { closeActiveModal } = initPortfolioItemModals();
    initPortfolioPreview(closeActiveModal);
    initPortfolioItemFilters();
}
