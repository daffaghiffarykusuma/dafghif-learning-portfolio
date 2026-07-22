export function initPageEnhancements() {
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
        '.feature-card, .practice-area-card, .visual-card, .approach-steps li, ' +
        '.case-study-list article, .resource-grid article'
    ).forEach((element) => {
        element.classList.add('reveal-on-scroll');
        revealOnScroll.observe(element);
    });
}
