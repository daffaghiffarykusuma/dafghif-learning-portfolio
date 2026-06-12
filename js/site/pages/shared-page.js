import { initEngagementInquiryForms } from '../contact-prefill.js';
import { initNavigation } from '../navigation.js';
import { initPageEnhancements } from '../page-enhancements.js';
import { initTestimonials } from '../testimonials.js';

export const getSharedPageInitializers = () => [
    { name: 'navigation', init: initNavigation },
    { name: 'engagement inquiry forms', init: initEngagementInquiryForms },
    { name: 'testimonials', init: initTestimonials },
    { name: 'page enhancements', init: initPageEnhancements }
];

export function initSharedPage({
    initializers = getSharedPageInitializers(),
    warn = console.warn
} = {}) {
    initializers.forEach((initializer) => {
        try {
            initializer.init();
        } catch (error) {
            warn(`Optional page initializer failed: ${initializer.name}`, error);
        }
    });
}
