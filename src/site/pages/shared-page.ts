import { initEngagementInquiryJourney } from '../engagement-inquiry-journey.ts';
import { initNavigation } from '../navigation.ts';
import { initPageEnhancements } from '../page-enhancements.ts';
import { initTestimonials } from '../testimonials.ts';

const sharedPageInitializers = [
    { name: 'navigation', init: initNavigation },
    { name: 'engagement inquiry journey', init: initEngagementInquiryJourney },
    { name: 'testimonials', init: initTestimonials },
    { name: 'page enhancements', init: initPageEnhancements }
];

type SharedPageInitializer = { name: string; init: () => void };

export function initSharedPage({
    initializers = sharedPageInitializers,
    warn = console.warn
}: { initializers?: SharedPageInitializer[]; warn?: (...data: unknown[]) => void } = {}) {
    initializers.forEach((initializer) => {
        try {
            initializer.init();
        } catch (error) {
            warn(`Optional page initializer failed: ${initializer.name}`, error);
        }
    });
}
