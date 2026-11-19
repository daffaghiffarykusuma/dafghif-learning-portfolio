import { applyArtifactPreviewFramePolicy, resolveArtifactPreview } from './artifact-preview-policy.ts';
import {
    ARTIFACT_PREVIEW_CLOSE_CLASS,
    ARTIFACT_PREVIEW_ELEMENT_IDS as ids,
    ARTIFACT_PREVIEW_TRIGGER_CLASS
} from './artifact-preview-markup.ts';
import { createEngagementInquiryHref } from './engagement-inquiry-journey.ts';
import { createPdfPagePreview } from './pdf-page-preview.ts';

const triggerSelector = `.${ARTIFACT_PREVIEW_TRIGGER_CLASS}`;
const closeSelector = `.${ARTIFACT_PREVIEW_CLOSE_CLASS}`;

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
    const pdfModal = root.getElementById(ids.modal) as HTMLDialogElement | null;
    const pdfModalTitle = root.getElementById(ids.title);
    const pdfModalMeta = root.getElementById(ids.meta);
    const pdfOpenFull = root.getElementById(ids.openFull) as HTMLAnchorElement | null;
    const pdfDiscuss = root.getElementById(ids.discuss) as HTMLAnchorElement | null;
    let pdfIframe = root.getElementById(ids.frame) as HTMLIFrameElement | null;
    const hasPreviewTriggers = Boolean(root.querySelector(triggerSelector));
    const hasPreviewMarkup = pdfModal || pdfModalTitle || pdfIframe || hasPreviewTriggers;
    let lastPreviewTrigger: HTMLElement | null = null;
    let disposePdfPreview: (() => void) | undefined;
    let activePreviewButton: HTMLElement | null = null;

    const clearPreview = () => {
        disposePdfPreview?.();
        disposePdfPreview = undefined;
        if (!pdfIframe) return;
        pdfIframe.parentElement?.removeAttribute('data-loading');
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
            : [root.querySelector<HTMLElement>('#portfolio-search'), ...root.querySelectorAll<HTMLElement>(triggerSelector)]
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
            if (!pdfModal) warn(`Artifact Preview modal (#${ids.modal}) not found.`);
            if (!pdfModalTitle) warn(`Artifact Preview title (#${ids.title}) not found.`);
            if (!pdfIframe) warn(`Artifact Preview frame (#${ids.frame}) not found.`);
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

        const preview = resolveArtifactPreview(pdfPath ? { pdfPath } : { viewerPath });
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
            // Show a loading note behind the frame until its document arrives,
            // so a slow PDF never reads as an empty, broken preview.
            const frame = pdfIframe;
            const frameHost = frame.parentElement;
            frameHost?.setAttribute('data-loading', '');
            frame.addEventListener('load', () => {
                if (frame === pdfIframe) frameHost?.removeAttribute('data-loading');
            }, { once: true });
            frame.src = preview.src;
        }
        const artifactType = preview.type === 'pdf' ? 'PDF work sample' : 'Interactive work sample';
        if (pdfModalMeta) {
            pdfModalMeta.textContent = `${artifactType}. It shows the design, not measured results.`;
        }
        if (pdfOpenFull) {
            pdfOpenFull.href = preview.url;
            pdfOpenFull.target = preview.linkPolicy.target;
            pdfOpenFull.rel = preview.linkPolicy.rel;
        }
        if (pdfDiscuss) {
            pdfDiscuss.href = new URL(createEngagementInquiryHref({ portfolioItem: previewTitle }), window.location.href).href;
        }

        const portfolioItemCard = button.closest('.portfolio-item');
        if (updateHashOnOpen && portfolioItemCard?.id && options.updateHash !== false) {
            history.pushState(null, '', `#${portfolioItemCard.id}`);
        }

        if (!pdfModal.open) pdfModal.showModal();
        pdfModal.querySelector<HTMLElement>(closeSelector)?.focus();
        return true;
    };

    const openPreviewFromHash = () => {
        const previewButton = previewItemFromHash(window.location.hash, root)?.querySelector<HTMLElement>(triggerSelector) || null;
        if (!isPreviewTrigger(previewButton)) {
            if (updateHashOnOpen) closePdfModal(false);
            return false;
        }
        if (pdfModal.open && activePreviewButton === previewButton) return true;
        return openPreview(previewButton, { trigger: previewButton, updateHash: false });
    };

    const handlePreviewClick = (event: MouseEvent) => {
        const eventTarget = isElement(event.target) ? event.target : null;
        const control = eventTarget?.closest<HTMLElement>(`${triggerSelector}, .portfolio-preview-trigger`) || null;
        const button = control?.matches('.portfolio-preview-trigger')
            ? control.closest('.portfolio-item')?.querySelector<HTMLElement>(triggerSelector) || null
            : control;
        if (button && isPreviewTrigger(button)) {
            event.preventDefault();
            event.stopPropagation();
            openPreview(button, { trigger: control || button });
            return;
        }

        const link = eventTarget?.closest<HTMLAnchorElement>('.portfolio-item-title-link, .portfolio-item-thumbnail-link');
        if (!link) return;
        const targetHash = new URL(link.href, window.location.href).hash;
        const previewButton = previewItemFromHash(targetHash, root)?.querySelector<HTMLElement>(triggerSelector)
            || link.closest('.portfolio-item')?.querySelector<HTMLElement>(triggerSelector)
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
    pdfModal.querySelector<HTMLElement>(closeSelector)?.addEventListener('click', handleModalCloseClick);
    pdfModal.addEventListener('click', handleModalBackdropClick);
    pdfModal.addEventListener('close', handleModalClose);
    if (openHashOnInit) openPreviewFromHash();

    const destroy = () => {
        closePdfModal();
        root.removeEventListener('click', handlePreviewClick, true);
        window.removeEventListener('hashchange', openPreviewFromHash);
        window.removeEventListener('popstate', openPreviewFromHash);
        pdfModal.querySelector<HTMLElement>(closeSelector)?.removeEventListener('click', handleModalCloseClick);
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
