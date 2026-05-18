export function initNavigation() {
    const currentYear = document.getElementById('current-year');
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('header nav');
    const navLinks = document.querySelectorAll('header nav ul li a');

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }

    const portfolioPages = new Set(['portfolio.html', 'case-entrepreneurship.html']);

    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => {
            nav.classList.toggle('active');
            menuToggle.setAttribute('aria-expanded', String(nav.classList.contains('active')));
        });
    }

    document.querySelectorAll('.has-dropdown').forEach((item) => {
        const link = item.querySelector('a');
        link?.addEventListener('click', (event) => {
            if (window.innerWidth <= 1024 && nav?.classList.contains('active')) {
                event.preventDefault();
                item.classList.toggle('open');
            }
        });
    });

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    navLinks.forEach((link) => {
        const linkPage = link.getAttribute('href').split('/').pop() || 'index.html';
        const parentItem = link.parentElement;
        const shouldHighlight = linkPage === currentPage || (portfolioPages.has(currentPage) && linkPage === 'portfolio.html');

        parentItem?.classList.toggle('current', shouldHighlight);

        link.addEventListener('click', () => {
            if (nav?.classList.contains('active')) {
                nav.classList.remove('active');
                menuToggle?.setAttribute('aria-expanded', 'false');
            }
        });
    });
}
