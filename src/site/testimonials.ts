export function initTestimonials() {
    const testimonialSliders = document.querySelectorAll<HTMLElement>('[data-testimonial-slider]');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    testimonialSliders.forEach((slider) => {
        const track = slider.querySelector<HTMLElement>('[data-slider-track]');
        const allSlides = track
            ? Array.from(track.children).filter((slide): slide is HTMLElement => 'hidden' in slide)
            : [];
        const featuredSlides = allSlides.filter((slide) => slide.hasAttribute('data-featured-testimonial'));
        const slides = featuredSlides.length ? featuredSlides : allSlides;
        if (featuredSlides.length) {
            allSlides.forEach((slide) => {
                slide.hidden = !slide.hasAttribute('data-featured-testimonial');
            });
        }
        const prevButton = slider.querySelector<HTMLButtonElement>('[data-slider-prev]');
        const nextButton = slider.querySelector<HTMLButtonElement>('[data-slider-next]');
        const dotsContainer = slider.querySelector<HTMLElement>('[data-slider-dots]');
        if (!track || slides.length === 0) {
            slider.classList.add('is-disabled');
            return;
        }
        const sliderTrack = track;

        let currentIndex = 0;
        let autoplayTimer: number | null = null;
        const autoplayEnabled = slider.dataset.autoplay === 'true' && !prefersReducedMotion;
        const interval = parseInt(slider.dataset.interval || '6500', 10);
        const dots: HTMLButtonElement[] = [];

        const updateAria = () => {
            slides.forEach((slide, index) => {
                slide.setAttribute('aria-hidden', String(index !== currentIndex));
                slide.toggleAttribute('inert', index !== currentIndex);
            });
            dots.forEach((dot, index) => dot.setAttribute('aria-current', String(index === currentIndex)));
        };

        const stopAutoplay = () => {
            if (autoplayTimer) {
                window.clearInterval(autoplayTimer);
                autoplayTimer = null;
            }
        };

        const startAutoplay = () => {
            if (!autoplayEnabled) return;
            stopAutoplay();
            autoplayTimer = window.setInterval(() => goTo(currentIndex + 1, true), interval);
        };

        const restartAutoplay = () => {
            if (!autoplayEnabled) return;
            stopAutoplay();
            startAutoplay();
        };

        function goTo(targetIndex: number, fromAutoplay = false) {
            currentIndex = (targetIndex + slides.length) % slides.length;
            sliderTrack.style.transform = `translateX(-${currentIndex * 100}%)`;
            updateAria();
            if (!fromAutoplay) restartAutoplay();
        }

        if (dotsContainer) {
            slides.forEach((_slide, index) => {
                const dot = document.createElement('button');
                dot.type = 'button';
                dot.setAttribute('aria-label', `Show testimonial ${index + 1}`);
                dot.addEventListener('click', () => goTo(index));
                dotsContainer.appendChild(dot);
                dots.push(dot);
            });
        }

        prevButton?.addEventListener('click', () => goTo(currentIndex - 1));
        nextButton?.addEventListener('click', () => goTo(currentIndex + 1));
        slider.addEventListener('mouseenter', stopAutoplay);
        slider.addEventListener('mouseleave', startAutoplay);
        slider.addEventListener('focusin', stopAutoplay);
        slider.addEventListener('focusout', startAutoplay);
        updateAria();
        startAutoplay();
    });

    const testimonialToggle = document.querySelector<HTMLButtonElement>('[data-toggle-testimonials]');
    const testimonialArchive = document.querySelector<HTMLElement>('[data-testimonial-archive]');
    if (testimonialToggle && testimonialArchive) {
        testimonialToggle.addEventListener('click', () => {
            const isHidden = testimonialArchive.hasAttribute('hidden');
            if (isHidden) {
                testimonialArchive.removeAttribute('hidden');
                testimonialToggle.textContent = 'Hide full testimonials';
                testimonialArchive.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                testimonialArchive.setAttribute('hidden', '');
                testimonialToggle.textContent = 'View full testimonials';
            }
        });
    }

    document.querySelectorAll<HTMLButtonElement>('[data-quote-toggle]').forEach((button) => {
        const quote = button.previousElementSibling;
        if (!quote?.matches('[data-collapsible-quote]')) return;
        button.addEventListener('click', () => {
            const isExpanded = quote.classList.toggle('is-expanded');
            button.textContent = isExpanded ? 'show less' : '... more';
            button.setAttribute('aria-expanded', String(isExpanded));
        });
    });
}
