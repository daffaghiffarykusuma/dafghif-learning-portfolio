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

export function initSharedPage() {
    getSharedPageInitializers().forEach((initializer) => initializer.init());
}
