const ENGAGEMENT_INQUIRY_STORAGE_KEY = 'engagementInquiry';
const CONTACT_EMAIL = 'daffaghifarykusuma@gmail.com';
const CONTACT_WHATSAPP_NUMBER = '62895329473179';

const engagementAliases = new Map([
    ['custom-training', 'training'], ['training', 'training'],
    ['learning-materials', 'learning-materials'], ['powerpoint', 'learning-materials'],
    ['learning-powerpoint', 'learning-materials'], ['mentoring', 'mentoring'],
    ['speaking', 'speaking']
]);

const engagementNames: Record<string, string> = {
    training: 'a custom training programme',
    'custom-training': 'a custom training programme',
    'learning-materials': 'a learning-materials engagement',
    powerpoint: 'a learning-materials engagement',
    'learning-powerpoint': 'a learning-materials engagement',
    mentoring: 'a mentoring or speaking engagement',
    speaking: 'an event speaking engagement'
};

type StoredInquiry = {
    engagementType: string;
    name: string;
    email: string;
    organisation: string;
    goal: string;
};

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

const initInquiryForms = () => {
    document.querySelectorAll<HTMLFormElement>('.engagement-inquiry-form').forEach((form) => {
        if (form.dataset.inquiryInitialized === 'true') return;
        form.dataset.inquiryInitialized = 'true';
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const formData = new FormData(form);
            const payload = {
                engagementType: form.dataset.engagementType || form.dataset.service || formData.get('engagement') || formData.get('service') || '',
                name: formData.get('name') || '',
                email: formData.get('email') || '',
                organisation: formData.get('organisation') || '',
                timeline: formData.get('timeline') || '',
                goal: formData.get('goal') || ''
            };
            try {
                sessionStorage.setItem(ENGAGEMENT_INQUIRY_STORAGE_KEY, JSON.stringify(payload));
            } catch (error) {
                console.warn('Unable to store inquiry context', error);
            }
            window.location.href = form.getAttribute('action') || 'contact.html';
        });
    });
};

const initContactForm = () => {
    applyPublicContext();
    const contactForm = document.querySelector<HTMLFormElement>('.contact-form');
    if (!contactForm) return;

    const params = new URLSearchParams(window.location.search);
    const engagementFromQuery = params.get('engagement') || params.get('service');
    const nameField = contactForm.querySelector<HTMLInputElement>('#name');
    const emailField = contactForm.querySelector<HTMLInputElement>('#email');
    const organisationField = contactForm.querySelector<HTMLInputElement>('input[name="organisation"], #company');
    const messageField = contactForm.querySelector<HTMLTextAreaElement>('#message');
    const engagementField = contactForm.querySelector<HTMLSelectElement>('#service-interest');
    const banner = document.getElementById('contact-prefill-message');
    const setEngagement = (value: string | null | undefined) => {
        if (!engagementField || !value) return;
        engagementField.value = engagementAliases.get(value.toLowerCase()) || value.toLowerCase();
    };
    const applyStoredInquiry = (data: StoredInquiry) => {
        if (nameField && data.name) nameField.value = data.name;
        if (emailField && data.email) emailField.value = data.email;
        if (organisationField && data.organisation) organisationField.value = data.organisation;
        if (messageField && data.goal?.trim()) messageField.value = data.goal.trim();
        setEngagement(data.engagementType || engagementFromQuery);
        banner?.removeAttribute('hidden');
        try {
            sessionStorage.removeItem(ENGAGEMENT_INQUIRY_STORAGE_KEY);
        } catch (error) {
            console.warn('Unable to clear stored inquiry context', error);
        }
    };

    let storedInquiry: StoredInquiry | null = null;
    try {
        const raw = sessionStorage.getItem(ENGAGEMENT_INQUIRY_STORAGE_KEY);
        const parsed: unknown = raw ? JSON.parse(raw) : null;
        if (parsed) {
            const value = (key: keyof StoredInquiry) => {
                if (typeof parsed !== 'object' || Array.isArray(parsed)) return '';
                const field = Reflect.get(parsed, key);
                return typeof field === 'string' ? field : '';
            };
            storedInquiry = {
                engagementType: value('engagementType'),
                name: value('name'),
                email: value('email'),
                organisation: value('organisation'),
                goal: value('goal')
            };
        }
    } catch (error) {
        console.warn('Unable to parse stored inquiry context', error);
    }

    if (storedInquiry) {
        applyStoredInquiry(storedInquiry);
    } else if (engagementFromQuery) {
        setEngagement(engagementFromQuery);
        if (messageField) {
            const name = engagementNames[engagementFromQuery.toLowerCase()] || engagementFromQuery || 'this engagement';
            messageField.value = `Interested in ${name}. Please share availability and next steps.`;
        }
    }
};

export function initEngagementInquiryJourney() {
    initInquiryForms();
    initContactForm();
}
