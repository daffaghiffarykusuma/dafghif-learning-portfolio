const ENGAGEMENT_INQUIRY_STORAGE_KEY = 'engagementInquiry';
const CONTACT_EMAIL = 'daffaghifarykusuma@gmail.com';
const CONTACT_WHATSAPP_NUMBER = '62895329473179';

const normalizePublicContext = (value = '') =>
    String(value)
        .replace(/[\u0000-\u001f\u007f]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 160);

export function readEngagementContext({
    search = window.location.search
} = {}) {
    const params = new URLSearchParams(search);
    const portfolioItem = normalizePublicContext(params.get('portfolioItem'));
    const engagement = normalizePublicContext(params.get('engagement') || params.get('service'));
    const label = portfolioItem || engagement;
    if (!label) return null;

    const contextType = portfolioItem ? 'Portfolio Item' : 'engagement';
    const message = `Hello Daffa, I am interested in discussing the ${contextType}: ${label}. Please share availability and next steps.`;
    const emailSubject = `Inquiry about ${label}`;

    return {
        label,
        type: contextType,
        displayText: `Regarding: ${label}`,
        whatsappUrl: `https://wa.me/${CONTACT_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
        emailUrl: `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(message)}`
    };
}

export function applyEngagementContext(root = document, context = readEngagementContext()) {
    if (!context) return null;

    const summary = root.getElementById('contact-context');
    const whatsappLink = root.querySelector('.contact-method-card.whatsapp');
    const emailLink = root.querySelector('.contact-method-card.email');

    if (summary) {
        summary.textContent = context.displayText;
        summary.removeAttribute('hidden');
    }
    if (whatsappLink) whatsappLink.href = context.whatsappUrl;
    if (emailLink) emailLink.href = context.emailUrl;
    return context;
}

export function initEngagementInquiryForms() {
    document.querySelectorAll('.engagement-inquiry-form').forEach((form) => {
        if (form.dataset.inquiryInitialized === 'true') {
            return;
        }
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
}

export function initContactPrefill() {
    const currentParams = new URLSearchParams(window.location.search);
    const engagementFromQuery = currentParams.get('engagement') || currentParams.get('service');
    applyEngagementContext();
    const contactForm = document.querySelector('.contact-form');
    if (!contactForm) return;

    const nameField = contactForm.querySelector('#name');
    const emailField = contactForm.querySelector('#email');
    const organisationField = contactForm.querySelector('input[name="organisation"], #company');
    const messageField = contactForm.querySelector('#message');
    const engagementField = contactForm.querySelector('#service-interest');
    const banner = document.getElementById('contact-prefill-message');

    const setSelectValue = (value) => {
        if (!engagementField || !value) return;
        const mapping = new Map([
            ['custom-training', 'training'],
            ['training', 'training'],
            ['learning-materials', 'learning-materials'],
            ['powerpoint', 'learning-materials'],
            ['learning-powerpoint', 'learning-materials'],
            ['mentoring', 'mentoring'],
            ['speaking', 'speaking']
        ]);
        const targetValue = mapping.get(value.toLowerCase()) || value.toLowerCase();
        Array.from(engagementField.options).forEach((option) => {
            option.selected = option.value === targetValue;
        });
    };

    const friendlyEngagementName = (value) => {
        const lookup = {
            training: 'a custom training programme',
            'custom-training': 'a custom training programme',
            'learning-materials': 'a learning-materials engagement',
            powerpoint: 'a learning-materials engagement',
            'learning-powerpoint': 'a learning-materials engagement',
            mentoring: 'a mentoring or speaking engagement',
            speaking: 'an event speaking engagement'
        };
        return lookup[value?.toLowerCase()] || value || 'this engagement';
    };

    const applyPrefill = (data) => {
        if (!data) return;
        if (nameField && data.name) nameField.value = data.name;
        if (emailField && data.email) emailField.value = data.email;
        if (organisationField && data.organisation) organisationField.value = data.organisation;
        if (messageField && data.goal?.trim()) messageField.value = data.goal.trim();
        setSelectValue(data.engagementType || engagementFromQuery);
        banner?.removeAttribute('hidden');
        try {
            sessionStorage.removeItem(ENGAGEMENT_INQUIRY_STORAGE_KEY);
        } catch (error) {
            console.warn('Unable to clear stored inquiry context', error);
        }
    };

    let storedValue = null;
    try {
        const raw = sessionStorage.getItem(ENGAGEMENT_INQUIRY_STORAGE_KEY);
        storedValue = raw ? JSON.parse(raw) : null;
    } catch (error) {
        console.warn('Unable to parse stored inquiry context', error);
    }

    if (storedValue) {
        applyPrefill(storedValue);
    } else if (engagementFromQuery) {
        setSelectValue(engagementFromQuery);
        if (messageField) {
            messageField.value = `Interested in ${friendlyEngagementName(engagementFromQuery)}. Please share availability and next steps.`;
        }
    }
}
