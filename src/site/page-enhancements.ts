const COPIED_RESET_MS = 2500;

// Copy buttons are progressive: they stay hidden unless the Clipboard API exists,
// and they announce the result through their own label for screen readers.
export function initCopyButtons(root: Document = document) {
    if (!root.defaultView?.navigator.clipboard?.writeText) return;
    root.querySelectorAll<HTMLButtonElement>('button[data-copy-text]').forEach((button) => {
        const idleText = button.textContent?.trim() || 'Copy';
        const idleLabel = button.dataset.copyLabel;
        if (idleLabel) button.setAttribute('aria-label', idleLabel);
        let resetTimer: ReturnType<typeof setTimeout> | undefined;
        const show = (text: string, label?: string) => {
            button.textContent = text;
            if (label) button.setAttribute('aria-label', label);
            else button.removeAttribute('aria-label');
        };
        button.addEventListener('click', async () => {
            clearTimeout(resetTimer);
            try {
                await root.defaultView!.navigator.clipboard.writeText(button.dataset.copyText || '');
                show('Copied');
                button.dataset.copyState = 'copied';
            } catch {
                show('Copy failed', `Copy failed. The address is ${button.dataset.copyText}`);
                button.dataset.copyState = 'failed';
            }
            resetTimer = setTimeout(() => {
                show(idleText, idleLabel);
                delete button.dataset.copyState;
            }, COPIED_RESET_MS);
        });
        button.hidden = false;
    });
}

export function initPageEnhancements() {
    initCopyButtons();

    const revealOnScroll = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                revealOnScroll.unobserve(entry.target);
            }
        });
    }, { root: null, rootMargin: '0px 0px -50px 0px', threshold: 0.1 });

    document.querySelectorAll(
        '.section-heading, .package-card, .spotlight-card, .impact-card, ' +
        '.feature-card, .practice-area-card, .visual-card, .approach-steps li, ' +
        '.case-study-list article, .resource-grid article'
    ).forEach((element) => {
        element.classList.add('reveal-on-scroll');
        revealOnScroll.observe(element);
    });
}
