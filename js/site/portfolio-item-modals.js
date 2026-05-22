export function initPortfolioItemModals() {
    const modalCloseButtons = document.querySelectorAll('.modal .close');
    const portfolioItems = document.querySelectorAll('.portfolio-item');
    let activePortfolioItemModal = null;
    let windowClickEventHandler = null;

    const closeActiveModal = () => {
        if (!activePortfolioItemModal) return;
        activePortfolioItemModal.style.display = 'none';
        activePortfolioItemModal = null;
        if (windowClickEventHandler) {
            window.removeEventListener('click', windowClickEventHandler);
            windowClickEventHandler = null;
        }
    };

    portfolioItems.forEach((portfolioItem) => {
        portfolioItem.addEventListener('click', () => {
            const targetModalId = portfolioItem.dataset.target;
            if (!targetModalId) return;
            const targetModalEl = document.querySelector(targetModalId);
            if (!targetModalEl) {
                console.warn(`Modal with ID ${targetModalId} not found.`);
                return;
            }

            closeActiveModal();
            targetModalEl.style.display = 'block';
            activePortfolioItemModal = targetModalEl;
            windowClickEventHandler = (event) => {
                if (event.target === targetModalEl) closeActiveModal();
            };
            window.addEventListener('click', windowClickEventHandler);

            targetModalEl.querySelectorAll('a[href^="http"], a[href^="https"]').forEach((link) => {
                if (!link.hasAttribute('data-no-blank')) {
                    link.setAttribute('target', '_blank');
                    link.setAttribute('rel', 'noopener noreferrer');
                }
            });
        });
    });

    modalCloseButtons.forEach((button) => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            closeActiveModal();
        });
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeActiveModal();
    });

    return { closeActiveModal };
}
