const SERVICE_INQUIRY_STORAGE_KEY = 'serviceInquiry';

export function initContactPrefill() {
    document.querySelectorAll('.service-inquiry-form').forEach((form) => {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const formData = new FormData(form);
            const payload = {
                service: form.dataset.service || formData.get('service') || '',
                name: formData.get('name') || '',
                email: formData.get('email') || '',
                organisation: formData.get('organisation') || '',
                timeline: formData.get('timeline') || '',
                goal: formData.get('goal') || ''
            };

            try {
                sessionStorage.setItem(SERVICE_INQUIRY_STORAGE_KEY, JSON.stringify(payload));
            } catch (error) {
                console.warn('Unable to store inquiry context', error);
            }

            window.location.href = form.getAttribute('action') || 'contact.html';
        });
    });

    const currentParams = new URLSearchParams(window.location.search);
    const serviceFromQuery = currentParams.get('service');
    const contactForm = document.querySelector('.contact-form');
    if (!contactForm) return;

    const nameField = contactForm.querySelector('#name');
    const emailField = contactForm.querySelector('#email');
    const organisationField = contactForm.querySelector('input[name="organisation"], #company');
    const messageField = contactForm.querySelector('#message');
    const serviceField = contactForm.querySelector('#service-interest');
    const banner = document.getElementById('contact-prefill-message');

    const setSelectValue = (value) => {
        if (!serviceField || !value) return;
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
        Array.from(serviceField.options).forEach((option) => {
            option.selected = option.value === targetValue;
        });
    };

    const friendlyServiceName = (value) => {
        const lookup = {
            training: 'a custom training programme',
            'custom-training': 'a custom training programme',
            'learning-materials': 'a learning materials project',
            powerpoint: 'a learning materials project',
            'learning-powerpoint': 'a learning materials project',
            mentoring: 'a mentoring or speaking engagement',
            speaking: 'an event speaking engagement'
        };
        return lookup[value?.toLowerCase()] || value || 'this project';
    };

    const applyPrefill = (data) => {
        if (!data) return;
        if (nameField && data.name) nameField.value = data.name;
        if (emailField && data.email) emailField.value = data.email;
        if (organisationField && data.organisation) organisationField.value = data.organisation;
        if (messageField && data.goal?.trim()) messageField.value = data.goal.trim();
        setSelectValue(data.service || serviceFromQuery);
        banner?.removeAttribute('hidden');
        try {
            sessionStorage.removeItem(SERVICE_INQUIRY_STORAGE_KEY);
        } catch (error) {
            console.warn('Unable to clear stored inquiry context', error);
        }
    };

    let storedValue = null;
    try {
        const raw = sessionStorage.getItem(SERVICE_INQUIRY_STORAGE_KEY);
        storedValue = raw ? JSON.parse(raw) : null;
    } catch (error) {
        console.warn('Unable to parse stored inquiry context', error);
    }

    if (storedValue) {
        applyPrefill(storedValue);
    } else if (serviceFromQuery) {
        setSelectValue(serviceFromQuery);
        if (messageField) {
            messageField.value = `Interested in ${friendlyServiceName(serviceFromQuery)}. Please share availability and next steps.`;
        }
    }
}
