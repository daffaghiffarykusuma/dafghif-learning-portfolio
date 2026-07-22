import { initEngagementInquiryJourney } from '../engagement-inquiry-journey.js';
import { initNavigation } from '../navigation.js';
import { initPageEnhancements } from '../page-enhancements.js';
import { initTestimonials } from '../testimonials.js';

const sharedPageInitializers = [
    { name: 'navigation', init: initNavigation },
    { name: 'engagement inquiry journey', init: initEngagementInquiryJourney },
    { name: 'testimonials', init: initTestimonials },
    { name: 'page enhancements', init: initPageEnhancements }
];

export function initSharedPage({
    initializers = sharedPageInitializers,
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
