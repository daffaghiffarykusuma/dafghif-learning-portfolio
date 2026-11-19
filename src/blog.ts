import { BLOG_SHOW_ALL_ATTRIBUTE } from './site/blog-cards.ts';

// Blog cards arrive pre-rendered in blog.html (src/site/blog-cards.ts). This
// script only reveals a topic's remaining posts when its "Show all" is pressed.
export function initBlogShowAll(root: Document = document) {
    root.querySelectorAll<HTMLButtonElement>(`button[${BLOG_SHOW_ALL_ATTRIBUTE}]`).forEach((button) => {
        const grid = root.getElementById(button.getAttribute('aria-controls') || '');
        if (!grid) return;
        button.addEventListener('click', () => {
            const hiddenCards = [...grid.querySelectorAll<HTMLElement>('.blog-card[hidden]')];
            hiddenCards.forEach((card) => { card.hidden = false; });
            // Move focus to the first newly shown post so keyboard users continue in place.
            hiddenCards[0]?.querySelector<HTMLAnchorElement>('.blog-card-title a')?.focus();
            button.closest('.blog-show-more')?.remove();
        });
    });
}

// A Medium cover that fails to load leaves the card's quiet empty-media state
// instead of a broken image. Images start loading before this module runs, so
// covers that already failed are handled too.
export function initBlogImageFallbacks(root: Document = document) {
    root.querySelectorAll<HTMLImageElement>('.blog-card-media img').forEach((image) => {
        const fallBack = () => {
            image.closest('.blog-card-media')?.classList.add('blog-card-media-empty');
            image.remove();
        };
        if (image.complete && image.naturalWidth === 0 && image.currentSrc) fallBack();
        else image.addEventListener('error', fallBack, { once: true });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initBlogShowAll();
    initBlogImageFallbacks();
});
