import { initNavigation } from './site/navigation.js';
import { initProjectModals } from './site/project-modals.js';
import { initPortfolioPreview } from './site/portfolio-preview.js';
import { initTestimonials } from './site/testimonials.js';
import { initContactPrefill } from './site/contact-prefill.js';
import { initPageEnhancements } from './site/page-enhancements.js';

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    const { closeActiveModal } = initProjectModals();
    initPortfolioPreview(closeActiveModal);
    initTestimonials();
    initContactPrefill();
    initPageEnhancements();
});
