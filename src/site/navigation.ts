export function initNavigation() {
    const currentYear = document.getElementById('current-year');
    const menuToggle = document.querySelector<HTMLButtonElement>('.menu-toggle');
    const nav = document.querySelector<HTMLElement>('header nav');
    const navLinks = document.querySelectorAll<HTMLAnchorElement>('header nav ul li a');

    if (currentYear) {
        currentYear.textContent = String(new Date().getFullYear());
    }

    if (menuToggle && nav) {
        const setNavigationOpen = (isOpen: boolean) => {
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

        // The Site Page Shell marks the current page; this only closes the menu.
        navLinks.forEach((link) => {
            link.addEventListener('click', () => {
                if (nav.classList.contains('active')) {
                    setNavigationOpen(false);
                }
            });
        });
    }
}
