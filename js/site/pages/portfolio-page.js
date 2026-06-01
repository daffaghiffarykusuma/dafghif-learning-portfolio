import { initPortfolioItemFilters } from '../../portfolio-item-filters.js';
import { initPortfolioItemModals } from '../portfolio-item-modals.js';
import { createPortfolioItemPreviewExperience } from '../artifact-preview-experience.js';

export function createPortfolioPageLifecycle() {
    let modalLifecycle = null;
    let previewLifecycle = null;
    let filtersReady = false;
    let initialized = false;

    const init = () => {
        if (initialized) {
            return getState();
        }

        modalLifecycle = initPortfolioItemModals();
        previewLifecycle = createPortfolioItemPreviewExperience(modalLifecycle.closeActiveModal);
        initPortfolioItemFilters();
        filtersReady = document.querySelector('#portfolio-item-filters')?.dataset.filtersInitialized === 'true';
        initialized = true;
        openFromHash();

        return getState();
    };

    const openFromHash = () => previewLifecycle?.openPreviewFromHash() || false;

    const closeModals = () => {
        modalLifecycle?.closeActiveModal();
        previewLifecycle?.closePdfModal();
    };

    const destroy = () => {
        closeModals();
        previewLifecycle?.destroy();
        modalLifecycle = null;
        previewLifecycle = null;
        initialized = false;
        filtersReady = false;
    };

    const portfolioItemFromHash = () => {
        if (!window.location.hash || window.location.hash === '#') return null;
        try {
            return document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
        } catch {
            return null;
        }
    };

    const getState = () => ({
        initialized,
        filtersReady,
        hasHashPreview: Boolean(portfolioItemFromHash()?.querySelector('.view-details-button'))
    });

    return {
        init,
        openFromHash,
        closeModals,
        destroy,
        getState
    };
}

export function initPortfolioPage() {
    const lifecycle = createPortfolioPageLifecycle();
    lifecycle.init();
    return lifecycle;
}
