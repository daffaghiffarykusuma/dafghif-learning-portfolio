document.addEventListener('DOMContentLoaded', () => {
    const filterContainer = document.querySelector('#portfolio-item-filters');
    const filterButtons = filterContainer?.querySelectorAll('.filter-button');
    const portfolioItems = document.querySelectorAll('#portfolio-items .portfolio-item');

    if (!filterContainer || !filterButtons?.length || !portfolioItems.length) {
        return;
    }

    filterButtons.forEach((button) => {
        button.setAttribute('aria-pressed', button.classList.contains('active') ? 'true' : 'false');
        button.addEventListener('click', () => {
            filterButtons.forEach((btn) => {
                btn.classList.remove('active');
                btn.setAttribute('aria-pressed', 'false');
            });
            button.classList.add('active');
            button.setAttribute('aria-pressed', 'true');

            const filter = button.getAttribute('data-filter');
            portfolioItems.forEach((item) => {
                const itemCategories = item.getAttribute('data-category')?.split(' ') || [];
                const shouldShow = filter === 'all'
                    ? !item.classList.contains('portfolio-item-placeholder')
                    : itemCategories.includes(filter);
                item.hidden = !shouldShow;
            });
        });
    });
});
