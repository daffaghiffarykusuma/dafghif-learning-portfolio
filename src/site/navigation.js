import { readPageIdentity } from './case-study-page-identity.ts';

export function initNavigation() {
    const currentYear = document.getElementById('current-year');
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('header nav');
    const navLinks = document.querySelectorAll('header nav ul li a');

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }

    if (menuToggle && nav) {
        const setNavigationOpen = (isOpen) => {
            nav.classList.toggle('active', isOpen);
            menuToggle.setAttribute('aria-expanded', String(isOpen));
            document.body.classList.toggle('navigation-open', isOpen);
        };

        menuToggle.addEventListener('click', () => {
            setNavigationOpen(!nav.classList.contains('active'));
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && nav.classList.contains('active')) {
                setNavigationOpen(false);
                menuToggle.focus();
            }
        });

        document.querySelectorAll('.has-dropdown').forEach((item) => {
            const link = item.querySelector('a');
            link?.addEventListener('click', (event) => {
                if (window.innerWidth <= 1024 && nav.classList.contains('active')) {
                    event.preventDefault();
                    item.classList.toggle('open');
                }
            });
        });

        const pageIdentity = readPageIdentity();
        navLinks.forEach((link) => {
            const linkPage = link.getAttribute('href').split('/').pop() || 'index.html';
            const parentItem = link.parentElement;
            const shouldHighlight = linkPage === pageIdentity.navigationPage;

            parentItem?.classList.toggle('current', shouldHighlight);

            link.addEventListener('click', () => {
                if (nav.classList.contains('active')) {
                    setNavigationOpen(false);
                }
            });
        });
    }
}
