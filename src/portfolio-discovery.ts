const DEFAULT_VISIBLE_COUNT = 9;
const MAX_TEXT_LENGTH = 120;

type PortfolioDiscoveryState = {
    query: string;
    area: string;
    tag: string;
    visibleCount: number;
};

const normalizeText = (value: unknown = '') =>
    String(value ?? '')
        .replace(/[\u0000-\u001f\u007f]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, MAX_TEXT_LENGTH);

const normalizeToken = (value: unknown = '') =>
    normalizeText(value)
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '');

const normalizeVisibleCount = (value: unknown) => {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    return Number.isFinite(parsed) && parsed >= DEFAULT_VISIBLE_COUNT
        ? parsed
        : DEFAULT_VISIBLE_COUNT;
};

const createDefaultPortfolioDiscoveryState = () => ({
    query: '',
    area: 'all',
    tag: '',
    visibleCount: DEFAULT_VISIBLE_COUNT
});

const parsePortfolioDiscoveryState = (): PortfolioDiscoveryState => {
    const params = new URLSearchParams(window.location.search || '');
    return {
        query: normalizeText(params.get('q')),
        area: normalizeToken(params.get('area')) || 'all',
        tag: normalizeToken(params.get('tag')),
        visibleCount: normalizeVisibleCount(params.get('show'))
    };
};

const serializePortfolioDiscoveryState = (state: PortfolioDiscoveryState) => {
    const params = new URLSearchParams();
    const query = normalizeText(state.query);
    const area = normalizeToken(state.area);
    const tag = normalizeToken(state.tag);
    const visibleCount = normalizeVisibleCount(state.visibleCount);

    if (query) params.set('q', query);
    if (area && area !== 'all') params.set('area', area);
    if (tag) params.set('tag', tag);
    if (visibleCount !== DEFAULT_VISIBLE_COUNT) params.set('show', String(visibleCount));
    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
};

const matchesPortfolioItem = (item: HTMLElement | null, state: PortfolioDiscoveryState) => {
    if (!item || item.classList.contains('portfolio-item-placeholder')) return false;
    const categories = new Set(
        String(item.dataset.category || '')
            .split(/\s+/)
            .map(normalizeToken)
            .filter(Boolean)
    );
    const searchText = normalizeText(item.dataset.searchText || item.textContent).toLowerCase();
    const query = normalizeText(state.query).toLowerCase();
    const area = normalizeToken(state.area);
    const tag = normalizeToken(state.tag);

    return (!query || searchText.includes(query))
        && (!area || area === 'all' || categories.has(area))
        && (!tag || categories.has(tag));
};

export const initPortfolioDiscovery = () => {
    const container = document.querySelector<HTMLElement>('#portfolio-discovery');
    const searchInput = document.querySelector<HTMLInputElement>('#portfolio-search');
    const filterButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('#portfolio-discovery .filter-button'));
    const moreFilter = document.querySelector<HTMLSelectElement>('#portfolio-more-filter');
    const resultSummary = document.querySelector<HTMLElement>('#portfolio-result-summary');
    const clearFiltersButton = document.querySelector<HTMLButtonElement>('#portfolio-clear-filters');
    const showMoreButton = document.querySelector<HTMLButtonElement>('#portfolio-show-more');
    const items = Array.from(document.querySelectorAll<HTMLElement>('#portfolio-items .portfolio-item'));

    if (!container || !searchInput || !filterButtons.length || !resultSummary || !clearFiltersButton || !showMoreButton || !items.length) {
        return;
    }
    if (container.dataset.discoveryInitialized === 'true') return;
    container.dataset.discoveryInitialized = 'true';

    let state = parsePortfolioDiscoveryState();

    const writeUrl = () => {
        const query = serializePortfolioDiscoveryState(state);
        window.history.replaceState(null, '', `${window.location.pathname}${query}${window.location.hash || ''}`);
    };

    const render = ({ updateUrl = false }: { updateUrl?: boolean } = {}) => {
        searchInput.value = state.query;
        if (moreFilter) moreFilter.value = state.tag;
        filterButtons.forEach((button) => {
            const selected = button.dataset.filter === state.area;
            button.classList.toggle('active', selected);
            button.setAttribute('aria-pressed', String(selected));
        });

        const matchingItems = items.filter((item) => matchesPortfolioItem(item, state));
        const visibleLimit = Math.min(state.visibleCount, matchingItems.length);
        const matchingSet = new Set(matchingItems.slice(0, visibleLimit));
        items.forEach((item) => {
            item.hidden = !matchingSet.has(item);
        });

        const allVisible = matchingItems.length <= visibleLimit;
        resultSummary.textContent = matchingItems.length === 0
            ? 'No matching Portfolio Items. Try another search or clear the filters.'
            : allVisible
                ? `Showing all ${matchingItems.length} matching Portfolio Items`
                : `Showing ${visibleLimit} of ${matchingItems.length} matching Portfolio Items`;
        clearFiltersButton.hidden = matchingItems.length > 0;
        showMoreButton.hidden = allVisible;
        if (!allVisible) {
            showMoreButton.textContent = `Show ${Math.min(DEFAULT_VISIBLE_COUNT, matchingItems.length - visibleLimit)} more`;
        }
        if (updateUrl) writeUrl();
    };

    searchInput.addEventListener('input', () => {
        state = {
            ...state,
            query: normalizeText(searchInput.value),
            visibleCount: DEFAULT_VISIBLE_COUNT
        };
        render({ updateUrl: true });
    });
    filterButtons.forEach((button) => {
        button.addEventListener('click', () => {
            state = {
                ...state,
                area: normalizeToken(button.dataset.filter) || 'all',
                visibleCount: DEFAULT_VISIBLE_COUNT
            };
            render({ updateUrl: true });
        });
    });
    moreFilter?.addEventListener('change', () => {
        state = {
            ...state,
            tag: normalizeToken(moreFilter.value),
            visibleCount: DEFAULT_VISIBLE_COUNT
        };
        render({ updateUrl: true });
    });
    showMoreButton.addEventListener('click', () => {
        state = {
            ...state,
            visibleCount: state.visibleCount + DEFAULT_VISIBLE_COUNT
        };
        render({ updateUrl: true });
    });
    clearFiltersButton.addEventListener('click', () => {
        state = createDefaultPortfolioDiscoveryState();
        render({ updateUrl: true });
        searchInput.focus();
    });

    render();
};
