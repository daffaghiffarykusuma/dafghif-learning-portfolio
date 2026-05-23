import { applyArtifactPreviewFramePolicy, resolveArtifactPreview } from './artifact-preview-policy.js';

export function initPortfolioPreview(closeActiveModal = () => {}) {
    const pdfModal = document.getElementById('pdf-modal');
    const pdfModalTitle = document.getElementById('pdf-modal-title');
    const pdfIframe = document.getElementById('pdf-iframe');
    const viewDetailsButtons = document.querySelectorAll('.view-details-button');
    const portfolioItemAnchorLinks = document.querySelectorAll('.portfolio-item-title-link, .portfolio-item-thumbnail-link');
    const hasPortfolioPreviewMarkup = pdfModal || pdfModalTitle || pdfIframe || viewDetailsButtons.length > 0;
    let activePdfModal = null;
    let lastPreviewTrigger = null;

    const closePdfModal = () => {
        if (!activePdfModal) return;
        activePdfModal.hidden = true;
        activePdfModal.style.display = '';
        pdfIframe.src = '';
        pdfIframe.removeAttribute('sandbox');
        activePdfModal = null;
        lastPreviewTrigger?.focus();
        lastPreviewTrigger = null;
    };

    if (!(pdfModal && pdfModalTitle && pdfIframe && viewDetailsButtons.length > 0)) {
        if (hasPortfolioPreviewMarkup) {
            if (!pdfModal) console.warn('PDF Modal element (#pdf-modal) not found.');
            if (!pdfModalTitle) console.warn('PDF Modal title element (#pdf-modal-title) not found.');
            if (!pdfIframe) console.warn('PDF iframe element (#pdf-iframe) not found.');
            if (viewDetailsButtons.length === 0) console.warn('No view details buttons found.');
        }
        return { closePdfModal };
    }

    const openPortfolioPreview = (button, options = {}) => {
        const pdfPath = button.dataset.pdf;
        const viewerPath = button.dataset.viewer;
        if (!pdfPath && !viewerPath) {
            console.warn('View Details button clicked has no data-pdf or data-viewer attribute.');
            return;
        }

        const portfolioItemCard = button.closest('.portfolio-item');
        const cardContent = button.closest('.card-content') || portfolioItemCard?.querySelector('.card-content');
        const portfolioItemTitle = cardContent?.querySelector('h3, h4')?.textContent || 'Portfolio Item Details';

        closeActiveModal();
        closePdfModal();
        lastPreviewTrigger = options.trigger || button;
        pdfModalTitle.textContent = portfolioItemTitle;

        const preview = resolveArtifactPreview({ pdfPath, viewerPath });
        if (!preview) {
            console.warn('Blocked unsafe portfolio preview path.');
            return;
        }

        applyArtifactPreviewFramePolicy(pdfIframe, preview);
        pdfIframe.src = preview.src;

        if (portfolioItemCard?.id && options.updateHash !== false) {
            history.pushState(null, '', `#${portfolioItemCard.id}`);
        }

        pdfModal.hidden = false;
        pdfModal.style.display = 'block';
        activePdfModal = pdfModal;
        pdfModal.querySelector('.close-modal')?.focus();

        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setTimeout(() => pdfModal.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
        }, 50);
    };

    viewDetailsButtons.forEach((button) => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            openPortfolioPreview(button, { trigger: button });
        });
    });

    portfolioItemAnchorLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
            const targetHash = new URL(link.href, window.location.href).hash;
            const previewButton = targetHash ? document.querySelector(targetHash)?.querySelector('.view-details-button') : null;
            if (!previewButton) return;
            event.preventDefault();
            event.stopPropagation();
            openPortfolioPreview(previewButton, { trigger: link });
        });
    });

    const openPreviewFromHash = () => {
        if (!window.location.hash) return;
        const previewButton = document.querySelector(window.location.hash)?.querySelector('.view-details-button');
        if (previewButton) openPortfolioPreview(previewButton, { trigger: previewButton, updateHash: false });
    };

    window.addEventListener('hashchange', openPreviewFromHash);
    openPreviewFromHash();

    pdfModal.querySelector('.close-modal')?.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        closePdfModal();
    });

    pdfModal.addEventListener('click', (event) => {
        if (event.target === pdfModal) closePdfModal();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closePdfModal();
    });

    console.log(`PDF Viewer initialized with ${viewDetailsButtons.length} buttons`);
    return { closePdfModal };
}
