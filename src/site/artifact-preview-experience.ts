import { applyArtifactPreviewFramePolicy, createArtifactPreviewContract } from './artifact-preview-policy.ts';
import { createPdfPagePreview } from './pdf-page-preview.ts';

type PreviewOptions = { trigger?: HTMLElement; updateHash?: boolean };
type PreviewExperienceOptions = {
    openHashOnInit?: boolean;
    updateHashOnOpen?: boolean;
    root?: Document;
    warn?: (...data: unknown[]) => void;
};

const isElement = (value: EventTarget | null): value is Element =>
    value !== null && 'closest' in value && typeof value.closest === 'function';

const previewItemFromHash = (hash: string, root: Document = document) => {
    if (!hash || hash === '#') return null;
    try {
        const item = root.getElementById(decodeURIComponent(hash.slice(1)));
        return item?.matches('.portfolio-item') ? item : null;
    } catch {
        return null;
    }
};

const isPreviewTrigger = (button: HTMLElement | null): button is HTMLElement =>
    Boolean(button?.dataset.pdf || button?.dataset.viewer);

const titleForPreviewTrigger = (button: HTMLElement) => {
    const portfolioItemCard = button.closest('.portfolio-item');
    const cardContent = button.closest('.card-content') || portfolioItemCard?.querySelector('.card-content');
    return (button.dataset.artifactTitle || cardContent?.querySelector('.portfolio-item-title-link')?.textContent || cardContent?.querySelector('h2, h3, h4')?.textContent)?.trim() || 'Artifact preview';
};

export function createArtifactPreviewExperience({
    openHashOnInit = true,
    updateHashOnOpen = true,
    root = document,
    warn = console.warn
}: PreviewExperienceOptions = {}) {
    const pdfModal = root.querySelector<HTMLDialogElement>('#pdf-modal');
    const pdfModalTitle = root.querySelector<HTMLElement>('#pdf-modal-title');
    const pdfModalMeta = root.querySelector<HTMLElement>('#pdf-modal-meta');
    const pdfOpenFull = root.querySelector<HTMLAnchorElement>('#pdf-open-full');
    const pdfDiscuss = root.querySelector<HTMLAnchorElement>('#pdf-discuss');
    let pdfIframe = root.querySelector<HTMLIFrameElement>('#pdf-iframe');
    const hasPreviewTriggers = Boolean(root.querySelector('.view-details-button'));
    const hasPreviewMarkup = pdfModal || pdfModalTitle || pdfIframe || hasPreviewTriggers;
    let lastPreviewTrigger: HTMLElement | null = null;
    let disposePdfPreview: (() => void) | undefined;
    let activePreviewButton: HTMLElement | null = null;

    const clearPreview = () => {
        disposePdfPreview?.();
        disposePdfPreview = undefined;
        if (!pdfIframe) return;
        // Discard the old child browsing context instead of navigating it after
        // browser Back, which would erase the parent's Forward history.
        const emptyFrame = pdfIframe.cloneNode(false) as HTMLIFrameElement;
        emptyFrame.removeAttribute('sandbox');
        emptyFrame.src = '';
        emptyFrame.hidden = false;
        pdfIframe.replaceWith(emptyFrame);
        pdfIframe = emptyFrame;
    };

    const restorePreviewFocus = () => {
        const canRestoreFocus = (element: HTMLElement | null): element is HTMLElement => Boolean(
            element?.isConnected
            && !element.closest('[hidden], [inert]')
            && !element.matches(':disabled')
            && element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })
        );
        const target = canRestoreFocus(lastPreviewTrigger)
            ? lastPreviewTrigger
            : [root.querySelector<HTMLElement>('#portfolio-search'), ...root.querySelectorAll<HTMLElement>('.view-details-button')]
                .find(canRestoreFocus);
        target?.focus();
        lastPreviewTrigger = null;
    };

    const closePdfModal = (updateHash = true) => {
        const activeItem = activePreviewButton?.closest('.portfolio-item');
        if (updateHash && activeItem && previewItemFromHash(window.location.hash, root) === activeItem) {
            history.replaceState(history.state, '', `${window.location.pathname}${window.location.search}`);
        }
        activePreviewButton = null;
        if (pdfModal?.open) {
            pdfModal.close();
        }
        if (lastPreviewTrigger) {
            clearPreview();
            restorePreviewFocus();
        }
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

    const openPreview = (button: HTMLElement, options: PreviewOptions = {}) => {
        if (!pdfIframe) return false;
        const pdfPath = button.dataset.pdf;
        const viewerPath = button.dataset.viewer;
        if (!pdfPath && !viewerPath) {
            warn('View Details button clicked has no data-pdf or data-viewer attribute.');
            return false;
        }

        const previewTitle = titleForPreviewTrigger(button);

        const preview = createArtifactPreviewContract({
            sourceArtifact: pdfPath || viewerPath,
            sourceType: pdfPath ? 'pdf' : 'html-viewer'
        });
        if (!preview) {
            warn('Blocked unsafe portfolio preview path.');
            return false;
        }

        if (activePreviewButton) clearPreview();
        pdfModalTitle.textContent = previewTitle;
        pdfIframe.title = `${previewTitle} preview`;
        lastPreviewTrigger = options.trigger || button;
        activePreviewButton = button;
        applyArtifactPreviewFramePolicy(pdfIframe, preview);
        const renderPdfPages = preview.type === 'pdf' && (
            window.matchMedia('(max-width: 767px)').matches
            || window.matchMedia('(pointer: coarse)').matches
            || window.navigator.pdfViewerEnabled === false
        );
        pdfIframe.hidden = renderPdfPages;
        if (renderPdfPages) {
            pdfIframe.removeAttribute('src');
            disposePdfPreview = createPdfPagePreview(pdfIframe.parentElement!, preview.url);
        } else {
            pdfIframe.src = preview.src;
        }
        const artifactType = preview.type === 'pdf' ? 'PDF Artifact' : 'Interactive Artifact Preview';
        if (pdfModalMeta) {
            pdfModalMeta.textContent = `${artifactType}. Outcomes require explicit evidence.`;
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

        if (!pdfModal.open) pdfModal.showModal();
        pdfModal.querySelector<HTMLElement>('.close-modal')?.focus();
        return true;
    };

    const openPreviewFromHash = () => {
        const previewButton = previewItemFromHash(window.location.hash, root)?.querySelector<HTMLElement>('.view-details-button') || null;
        if (!isPreviewTrigger(previewButton)) {
            if (updateHashOnOpen) closePdfModal(false);
            return false;
        }
        if (pdfModal.open && activePreviewButton === previewButton) return true;
        return openPreview(previewButton, { trigger: previewButton, updateHash: false });
    };

    const handlePreviewClick = (event: MouseEvent) => {
        const eventTarget = isElement(event.target) ? event.target : null;
        const button = eventTarget?.closest<HTMLElement>('.view-details-button') || null;
        if (button && isPreviewTrigger(button)) {
            event.preventDefault();
            event.stopPropagation();
            openPreview(button, { trigger: button });
            return;
        }

        const link = eventTarget?.closest<HTMLAnchorElement>('.portfolio-item-title-link, .portfolio-item-thumbnail-link');
        if (!link) return;
        const targetHash = new URL(link.href, window.location.href).hash;
        const previewButton = previewItemFromHash(targetHash, root)?.querySelector<HTMLElement>('.view-details-button')
            || link.closest('.portfolio-item')?.querySelector<HTMLElement>('.view-details-button')
            || null;
        if (!isPreviewTrigger(previewButton)) return;
        event.preventDefault();
        event.stopPropagation();
        openPreview(previewButton, { trigger: link });
    };

    const handleModalCloseClick = (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
        closePdfModal();
    };
    const handleModalBackdropClick = (event: MouseEvent) => {
        if (event.target === pdfModal) closePdfModal();
    };
    const handleModalClose = () => {
        // Native Escape closes before dispatching this event. Ignore an older
        // queued close event if a new preview has already opened.
        if (!pdfModal.open) closePdfModal();
    };

    root.addEventListener('click', handlePreviewClick, true);
    window.addEventListener('hashchange', openPreviewFromHash);
    window.addEventListener('popstate', openPreviewFromHash);
    pdfModal.querySelector<HTMLElement>('.close-modal')?.addEventListener('click', handleModalCloseClick);
    pdfModal.addEventListener('click', handleModalBackdropClick);
    pdfModal.addEventListener('close', handleModalClose);
    if (openHashOnInit) openPreviewFromHash();

    const destroy = () => {
        closePdfModal();
        root.removeEventListener('click', handlePreviewClick, true);
        window.removeEventListener('hashchange', openPreviewFromHash);
        window.removeEventListener('popstate', openPreviewFromHash);
        pdfModal.querySelector<HTMLElement>('.close-modal')?.removeEventListener('click', handleModalCloseClick);
        pdfModal.removeEventListener('click', handleModalBackdropClick);
        pdfModal.removeEventListener('close', handleModalClose);
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
