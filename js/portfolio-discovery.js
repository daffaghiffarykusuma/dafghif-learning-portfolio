const DEFAULT_VISIBLE_COUNT = 9;
const MAX_TEXT_LENGTH = 120;

const normalizeText = (value = '') =>
    String(value ?? '')
        .replace(/[\u0000-\u001f\u007f]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, MAX_TEXT_LENGTH);

const normalizeToken = (value = '') =>
    normalizeText(value)
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '');

const normalizeVisibleCount = (value) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed >= DEFAULT_VISIBLE_COUNT
        ? parsed
        : DEFAULT_VISIBLE_COUNT;
};

export const createDefaultPortfolioDiscoveryState = () => ({
    query: '',
    area: 'all',
    tag: '',
    visibleCount: DEFAULT_VISIBLE_COUNT
});

export const parsePortfolioDiscoveryState = (locationLike = window.location) => {
    const params = new URLSearchParams(locationLike.search || '');
    return {
        query: normalizeText(params.get('q')),
        area: normalizeToken(params.get('area')) || 'all',
        tag: normalizeToken(params.get('tag')),
        visibleCount: normalizeVisibleCount(params.get('show'))
    };
};

export const serializePortfolioDiscoveryState = (state = createDefaultPortfolioDiscoveryState()) => {
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

export const matchesPortfolioItem = (item, state = createDefaultPortfolioDiscoveryState()) => {
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

export const initPortfolioDiscovery = ({
    root = document,
    locationLike = window.location,
    historyLike = window.history
} = {}) => {
    const container = root.getElementById('portfolio-discovery');
    const searchInput = root.getElementById('portfolio-search');
    const filterButtons = Array.from(root.querySelectorAll('#portfolio-discovery .filter-button'));
    const moreFilter = root.getElementById('portfolio-more-filter');
    const resultSummary = root.getElementById('portfolio-result-summary');
    const showMoreButton = root.getElementById('portfolio-show-more');
    const items = Array.from(root.querySelectorAll('#portfolio-items .portfolio-item'));

    if (!container || !searchInput || !filterButtons.length || !resultSummary || !showMoreButton || !items.length) {
        return null;
    }
    if (container.dataset.discoveryInitialized === 'true') return null;
    container.dataset.discoveryInitialized = 'true';

    let state = parsePortfolioDiscoveryState(locationLike);

    const writeUrl = () => {
        const query = serializePortfolioDiscoveryState(state);
        historyLike.replaceState(null, '', `${locationLike.pathname}${query}${locationLike.hash || ''}`);
    };

    const render = ({ updateUrl = false } = {}) => {
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
        resultSummary.textContent = allVisible
            ? `Showing all ${matchingItems.length} matching Portfolio Items`
            : `Showing ${visibleLimit} of ${matchingItems.length} matching Portfolio Items`;
        showMoreButton.hidden = allVisible;
        if (!allVisible) {
            showMoreButton.textContent = `Show ${Math.min(DEFAULT_VISIBLE_COUNT, matchingItems.length - visibleLimit)} more`;
        }
        if (updateUrl) writeUrl();
        return { matchingCount: matchingItems.length, visibleCount: visibleLimit };
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

    render();
    return {
        getState: () => ({ ...state }),
        render
    };
};

export { DEFAULT_VISIBLE_COUNT };
