const CONTACT_EMAIL = 'daffaghifarykusuma@gmail.com';
const CONTACT_WHATSAPP_NUMBER = '62895329473179';

const normalizePublicContext = (value: unknown = '') => String(value)
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);

const applyPublicContext = () => {
    const params = new URLSearchParams(window.location.search);
    const portfolioItem = normalizePublicContext(params.get('portfolioItem'));
    const engagement = normalizePublicContext(params.get('engagement') || params.get('service'));
    const label = portfolioItem || engagement;
    if (!label) return;

    const type = portfolioItem ? 'Portfolio Item' : 'engagement';
    const message = `Hello Daffa, I am interested in discussing the ${type}: ${label}. Please share availability and next steps.`;
    const summary = document.getElementById('contact-context');
    const whatsappLink = document.querySelector<HTMLAnchorElement>('.contact-method-card.whatsapp');
    const emailLink = document.querySelector<HTMLAnchorElement>('.contact-method-card.email');
    if (summary) {
        summary.textContent = `Regarding: ${label}`;
        summary.removeAttribute('hidden');
    }
    if (whatsappLink) whatsappLink.href = `https://wa.me/${CONTACT_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    if (emailLink) emailLink.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Inquiry about ${label}`)}&body=${encodeURIComponent(message)}`;
};

export const initEngagementInquiryJourney = applyPublicContext;
