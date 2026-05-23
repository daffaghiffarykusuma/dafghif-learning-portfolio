import { initEngagementInquiryForms } from '../contact-prefill.js';
import { initNavigation } from '../navigation.js';
import { initPageEnhancements } from '../page-enhancements.js';
import { initTestimonials } from '../testimonials.js';

export function initSharedPage() {
    initNavigation();
    initEngagementInquiryForms();
    initTestimonials();
    initPageEnhancements();
}
