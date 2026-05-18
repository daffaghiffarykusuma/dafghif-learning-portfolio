export function initPageEnhancements() {
    document.querySelectorAll('.faq-list article').forEach((item) => {
        const question = item.querySelector('h3');
        const answer = item.querySelector('p');
        if (!question || !answer) return;
        item.classList.add('expanded');
        item.setAttribute('tabindex', '0');
        item.addEventListener('click', () => {
            const isExpanded = item.classList.toggle('expanded');
            question.setAttribute('aria-expanded', String(isExpanded));
            answer.setAttribute('aria-hidden', String(!isExpanded));
        });
        item.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                item.click();
            }
        });
    });

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (event) => {
            const targetId = link.getAttribute('href');
            const targetElement = targetId && targetId !== '#' ? document.querySelector(targetId) : null;
            if (!targetElement) return;
            event.preventDefault();
            const headerHeight = document.querySelector('header')?.offsetHeight || 80;
            const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
            window.scrollTo({ top: targetPosition, behavior: 'smooth' });
            history.pushState(null, '', targetId);
        });
    });

    const revealOnScroll = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                revealOnScroll.unobserve(entry.target);
            }
        });
    }, { root: null, rootMargin: '0px 0px -50px 0px', threshold: 0.1 });

    document.querySelectorAll(
        '.section-heading, .package-card, .spotlight-card, .impact-card, ' +
        '.feature-card, .service-preview-card, .visual-card, .approach-steps li, ' +
        '.case-study-list article, .resource-grid article, .faq-list article'
    ).forEach((element) => {
        element.classList.add('reveal-on-scroll');
        revealOnScroll.observe(element);
    });

    const sections = document.querySelectorAll('section[id]');
    const navAnchors = document.querySelectorAll('.hero-breadcrumb a[href^="#"]');
    if (!sections.length || !navAnchors.length) return;

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const id = entry.target.getAttribute('id');
            navAnchors.forEach((anchor) => {
                anchor.classList.toggle('active', anchor.getAttribute('href') === `#${id}`);
            });
        });
    }, { threshold: 0.3 });

    sections.forEach((section) => sectionObserver.observe(section));
}
