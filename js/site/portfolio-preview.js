import { applyArtifactPreviewFramePolicy, createArtifactPreviewContract } from './artifact-preview-policy.js';

export function initPortfolioPreview(closeActiveModal = () => {}, { openHashOnInit = true, updateHashOnOpen = true } = {}) {
    const pdfModal = document.getElementById('pdf-modal');
    const pdfModalTitle = document.getElementById('pdf-modal-title');
    const pdfIframe = document.getElementById('pdf-iframe');
    const hasPreviewTriggers = Boolean(document.querySelector('.view-details-button'));
    const hasPortfolioPreviewMarkup = pdfModal || pdfModalTitle || pdfIframe || hasPreviewTriggers;
    let activePdfModal = null;
    let lastPreviewTrigger = null;

    const portfolioItemFromHash = (hash) => {
        if (!hash || hash === '#') return null;
        try {
            return document.getElementById(decodeURIComponent(hash.slice(1)));
        } catch {
            return null;
        }
    };

    const isPreviewTrigger = (button) => Boolean(button?.dataset.pdf || button?.dataset.viewer);

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

    if (!(pdfModal && pdfModalTitle && pdfIframe && hasPreviewTriggers)) {
        if (hasPortfolioPreviewMarkup) {
            if (!pdfModal) console.warn('PDF Modal element (#pdf-modal) not found.');
            if (!pdfModalTitle) console.warn('PDF Modal title element (#pdf-modal-title) not found.');
            if (!pdfIframe) console.warn('PDF iframe element (#pdf-iframe) not found.');
            if (!hasPreviewTriggers) console.warn('No view details buttons found.');
        }
        return {
            closePdfModal,
            openPreviewFromHash: () => false,
            destroy: closePdfModal
        };
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

        const preview = createArtifactPreviewContract({
            sourceArtifact: pdfPath || viewerPath,
            sourceType: pdfPath ? 'pdf' : 'html-viewer'
        });
        if (!preview) {
            console.warn('Blocked unsafe portfolio preview path.');
            return;
        }

        applyArtifactPreviewFramePolicy(pdfIframe, preview);
        pdfIframe.src = preview.src;

        if (updateHashOnOpen && portfolioItemCard?.id && options.updateHash !== false) {
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

    const handlePreviewClick = (event) => {
        const eventTarget = event.target?.closest ? event.target : null;
        const button = eventTarget?.closest('.view-details-button');
        if (button && isPreviewTrigger(button)) {
            event.preventDefault();
            event.stopPropagation();
            openPortfolioPreview(button, { trigger: button });
            return;
        }

        const link = eventTarget?.closest('.portfolio-item-title-link, .portfolio-item-thumbnail-link');
        if (!link) return;
        const targetHash = new URL(link.href, window.location.href).hash;
        const previewButton = portfolioItemFromHash(targetHash)?.querySelector('.view-details-button')
            || link.closest('.portfolio-item')?.querySelector('.view-details-button');
        if (!isPreviewTrigger(previewButton)) return;
        event.preventDefault();
        event.stopPropagation();
        openPortfolioPreview(previewButton, { trigger: link });
    };

    const openPreviewFromHash = () => {
        const previewButton = portfolioItemFromHash(window.location.hash)?.querySelector('.view-details-button');
        if (!previewButton) return false;
        openPortfolioPreview(previewButton, { trigger: previewButton, updateHash: false });
        return true;
    };

    document.addEventListener('click', handlePreviewClick);
    window.addEventListener('hashchange', openPreviewFromHash);
    if (openHashOnInit) openPreviewFromHash();

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

    const destroy = () => {
        closePdfModal();
        document.removeEventListener('click', handlePreviewClick);
        window.removeEventListener('hashchange', openPreviewFromHash);
    };

    return { closePdfModal, openPreviewFromHash, destroy };
}
