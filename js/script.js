import { initNavigation } from './site/navigation.js';
import { initPortfolioItemModals } from './site/portfolio-item-modals.js';
import { initPortfolioPreview } from './site/portfolio-preview.js';
import { initTestimonials } from './site/testimonials.js';
import { initContactPrefill } from './site/contact-prefill.js';
import { initPageEnhancements } from './site/page-enhancements.js';

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    const { closeActiveModal } = initPortfolioItemModals();
    initPortfolioPreview(closeActiveModal);
    initTestimonials();
    initContactPrefill();
    initPageEnhancements();
});
