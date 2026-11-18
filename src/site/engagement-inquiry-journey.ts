// Engagement Inquiry Journey: owns both halves of the contact link. Generation and
// browser code build inquiry links here; the contact page reads them back here.

export const ENGAGEMENT_INQUIRY_PAGE = 'contact.html';

// The default channel links the contact page ships with. Contextual inquiries
// replace the WhatsApp and email links with prefilled messages to the same owner.
export const ENGAGEMENT_INQUIRY_CHANNELS = Object.freeze({
    whatsapp: 'https://wa.link/rn7fa4',
    email: 'mailto:daffaghifarykusuma@gmail.com',
    linkedin: 'https://www.linkedin.com/in/daffa-ghiffary-kusuma'
});

const CONTACT_EMAIL = 'daffaghifarykusuma@gmail.com';
const CONTACT_WHATSAPP_NUMBER = '62895329473179';
const MAX_CONTEXT_LENGTH = 160;

type EngagementInquiry = {
    /** A Portfolio Item or Artifact title the Reviewer wants to discuss. */
    portfolioItem?: string;
    /** An Engagement Type the Reviewer wants to discuss. */
    engagement?: string;
};

const normalizePublicContext = (value: unknown = '') => String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_CONTEXT_LENGTH);

/** Builds the page-relative contact link for an inquiry, e.g. `contact.html?portfolioItem=…`. */
export const createEngagementInquiryHref = ({ portfolioItem, engagement }: EngagementInquiry = {}) => {
    const params = new URLSearchParams();
    const item = normalizePublicContext(portfolioItem);
    const type = normalizePublicContext(engagement);
    if (item) params.set('portfolioItem', item);
    else if (type) params.set('engagement', type);
    const query = params.toString();
    return query ? `${ENGAGEMENT_INQUIRY_PAGE}?${query}` : ENGAGEMENT_INQUIRY_PAGE;
};

/**
 * Reads the inquiry label from a contact-page query string. `service` is a legacy
 * alias for `engagement`, kept so links shared before the rename still work.
 */
export const readEngagementInquiryLabel = (search = '') => {
    const params = new URLSearchParams(search);
    return normalizePublicContext(params.get('portfolioItem'))
        || normalizePublicContext(params.get('engagement') || params.get('service'));
};

const applyPublicContext = () => {
    const label = readEngagementInquiryLabel(window.location.search);
    if (!label) return;

    const message = `Hello Daffa, I would like to discuss ${label}. Please share availability and next steps.`;
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
