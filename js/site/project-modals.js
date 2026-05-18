export function initProjectModals() {
    const modalCloseButtons = document.querySelectorAll('.modal .close');
    const projectItems = document.querySelectorAll('.project');
    let activeProjectModal = null;
    let windowClickEventHandler = null;

    const closeActiveModal = () => {
        if (!activeProjectModal) return;
        activeProjectModal.style.display = 'none';
        activeProjectModal = null;
        if (windowClickEventHandler) {
            window.removeEventListener('click', windowClickEventHandler);
            windowClickEventHandler = null;
        }
    };

    projectItems.forEach((project) => {
        project.addEventListener('click', () => {
            const targetModalId = project.dataset.target;
            if (!targetModalId) return;
            const targetModalEl = document.querySelector(targetModalId);
            if (!targetModalEl) {
                console.warn(`Modal with ID ${targetModalId} not found.`);
                return;
            }

            closeActiveModal();
            targetModalEl.style.display = 'block';
            activeProjectModal = targetModalEl;
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
