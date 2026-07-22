import { applyArtifactPreviewFramePolicy, createArtifactPreviewContract } from './artifact-preview-policy.ts';

const previewItemFromHash = (hash, root = document) => {
    if (!hash || hash === '#') return null;
    try {
        return root.getElementById(decodeURIComponent(hash.slice(1)));
    } catch {
        return null;
    }
};

const isPreviewTrigger = (button) => Boolean(button?.dataset.pdf || button?.dataset.viewer);

const titleForPreviewTrigger = (button) => {
    const portfolioItemCard = button.closest('.portfolio-item');
    const cardContent = button.closest('.card-content') || portfolioItemCard?.querySelector('.card-content');
    return cardContent?.querySelector('h3, h4')?.textContent || 'Portfolio Item Details';
};

export function createArtifactPreviewExperience({
    openHashOnInit = true,
    updateHashOnOpen = true,
    root = document,
    warn = console.warn
} = {}) {
    const pdfModal = root.getElementById('pdf-modal');
    const pdfModalTitle = root.getElementById('pdf-modal-title');
    const pdfModalMeta = root.getElementById('pdf-modal-meta');
    const pdfOpenFull = root.getElementById('pdf-open-full');
    const pdfDiscuss = root.getElementById('pdf-discuss');
    const pdfIframe = root.getElementById('pdf-iframe');
    const hasPreviewTriggers = Boolean(root.querySelector('.view-details-button'));
    const hasPreviewMarkup = pdfModal || pdfModalTitle || pdfIframe || hasPreviewTriggers;
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

    if (!(pdfModal && pdfModalTitle && pdfIframe && hasPreviewTriggers)) {
        if (hasPreviewMarkup) {
            if (!pdfModal) warn('PDF Modal element (#pdf-modal) not found.');
            if (!pdfModalTitle) warn('PDF Modal title element (#pdf-modal-title) not found.');
            if (!pdfIframe) warn('PDF iframe element (#pdf-iframe) not found.');
            if (!hasPreviewTriggers) warn('No view details buttons found.');
        }
        return {
            closePdfModal,
            openPreviewFromHash: () => false,
            destroy: closePdfModal
        };
    }

    const openPreview = (button, options = {}) => {
        const pdfPath = button.dataset.pdf;
        const viewerPath = button.dataset.viewer;
        if (!pdfPath && !viewerPath) {
            warn('View Details button clicked has no data-pdf or data-viewer attribute.');
            return false;
        }

        closePdfModal();
        lastPreviewTrigger = options.trigger || button;
        const previewTitle = titleForPreviewTrigger(button);
        pdfModalTitle.textContent = previewTitle;

        const preview = createArtifactPreviewContract({
            sourceArtifact: pdfPath || viewerPath,
            sourceType: pdfPath ? 'pdf' : 'html-viewer'
        });
        if (!preview) {
            warn('Blocked unsafe portfolio preview path.');
            return false;
        }

        applyArtifactPreviewFramePolicy(pdfIframe, preview);
        pdfIframe.src = preview.src;
        const artifactType = preview.type === 'pdf' ? 'PDF Artifact' : 'Interactive Artifact Preview';
        if (pdfModalMeta) {
            pdfModalMeta.textContent = `${artifactType}. Preview demonstrates structure and content; outcomes are only claimed where explicitly evidenced.`;
        }
        if (pdfOpenFull) {
            pdfOpenFull.href = preview.url;
            pdfOpenFull.target = preview.linkPolicy.target;
            pdfOpenFull.rel = preview.linkPolicy.rel;
        }
        if (pdfDiscuss) {
            const contactUrl = new URL('contact.html', window.location.href);
            contactUrl.searchParams.set('portfolioItem', previewTitle);
            pdfDiscuss.href = contactUrl.href;
        }

        const portfolioItemCard = button.closest('.portfolio-item');
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
        return true;
    };

    const openPreviewFromHash = () => {
        const previewButton = previewItemFromHash(window.location.hash, root)?.querySelector('.view-details-button');
        if (!isPreviewTrigger(previewButton)) return false;
        return openPreview(previewButton, { trigger: previewButton, updateHash: false });
    };

    const handlePreviewClick = (event) => {
        const eventTarget = event.target?.closest ? event.target : null;
        const button = eventTarget?.closest('.view-details-button');
        if (button && isPreviewTrigger(button)) {
            event.preventDefault();
            event.stopPropagation();
            openPreview(button, { trigger: button });
            return;
        }

        const link = eventTarget?.closest('.portfolio-item-title-link, .portfolio-item-thumbnail-link');
        if (!link) return;
        const targetHash = new URL(link.href, window.location.href).hash;
        const previewButton = previewItemFromHash(targetHash, root)?.querySelector('.view-details-button')
            || link.closest('.portfolio-item')?.querySelector('.view-details-button');
        if (!isPreviewTrigger(previewButton)) return;
        event.preventDefault();
        event.stopPropagation();
        openPreview(previewButton, { trigger: link });
    };

    const handleModalCloseClick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        closePdfModal();
    };
    const handleModalBackdropClick = (event) => {
        if (event.target === pdfModal) closePdfModal();
    };
    const handleEscape = (event) => {
        if (event.key === 'Escape') closePdfModal();
    };

    root.addEventListener('click', handlePreviewClick, true);
    window.addEventListener('hashchange', openPreviewFromHash);
    pdfModal.querySelector('.close-modal')?.addEventListener('click', handleModalCloseClick);
    pdfModal.addEventListener('click', handleModalBackdropClick);
    root.addEventListener('keydown', handleEscape);
    if (openHashOnInit) openPreviewFromHash();

    const destroy = () => {
        closePdfModal();
        root.removeEventListener('click', handlePreviewClick, true);
        window.removeEventListener('hashchange', openPreviewFromHash);
        pdfModal.querySelector('.close-modal')?.removeEventListener('click', handleModalCloseClick);
        pdfModal.removeEventListener('click', handleModalBackdropClick);
        root.removeEventListener('keydown', handleEscape);
    };

    return { closePdfModal, openPreviewFromHash, destroy };
}

export const createPortfolioItemPreviewExperience = () =>
    createArtifactPreviewExperience({
        openHashOnInit: false,
        updateHashOnOpen: true
    });

export const createCaseStudyArtifactPreviewExperience = () =>
    createArtifactPreviewExperience({
        openHashOnInit: true,
        updateHashOnOpen: false
    });
