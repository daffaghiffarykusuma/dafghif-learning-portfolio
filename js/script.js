import { initCurrentPage } from './site/pages/page-router.js';

export const bootCurrentPage = () => initCurrentPage();

document.addEventListener('DOMContentLoaded', () => {
    bootCurrentPage();
});
