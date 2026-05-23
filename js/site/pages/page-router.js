import { initContactPage } from './contact-page.js';
import { initPortfolioPage } from './portfolio-page.js';
import { initSharedPage } from './shared-page.js';

const pageNameFromPath = (pathname) => pathname.split('/').pop() || 'index.html';

export function initCurrentPage({ pathname = window.location.pathname } = {}) {
    initSharedPage();

    const pageName = pageNameFromPath(pathname);
    if (pageName === 'portfolio.html') {
        initPortfolioPage();
    }

    if (pageName === 'contact.html') {
        initContactPage();
    }
}
