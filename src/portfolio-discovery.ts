const DEFAULT_VISIBLE_COUNT = 9;
const MAX_TEXT_LENGTH = 120;

type PortfolioDiscoveryState = {
    query: string;
    area: string;
    tag: string;
    visibleCount: number;
};

type LocationLike = Pick<Location, 'search' | 'pathname' | 'hash'>;
type HistoryLike = Pick<History, 'replaceState'>;

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

export const createDefaultPortfolioDiscoveryState = () => ({
    query: '',
    area: 'all',
    tag: '',
    visibleCount: DEFAULT_VISIBLE_COUNT
});

export const parsePortfolioDiscoveryState = (locationLike: LocationLike = window.location): PortfolioDiscoveryState => {
    const params = new URLSearchParams(locationLike.search || '');
    return {
        query: normalizeText(params.get('q')),
        area: normalizeToken(params.get('area')) || 'all',
        tag: normalizeToken(params.get('tag')),
        visibleCount: normalizeVisibleCount(params.get('show'))
    };
};

export const serializePortfolioDiscoveryState = (state: PortfolioDiscoveryState = createDefaultPortfolioDiscoveryState()) => {
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

export const matchesPortfolioItem = (item: HTMLElement | null, state: PortfolioDiscoveryState = createDefaultPortfolioDiscoveryState()) => {
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
}: { root?: Document; locationLike?: LocationLike; historyLike?: HistoryLike } = {}) => {
    const container = root.querySelector<HTMLElement>('#portfolio-discovery');
    const searchInput = root.querySelector<HTMLInputElement>('#portfolio-search');
    const filterButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('#portfolio-discovery .filter-button'));
    const moreFilter = root.querySelector<HTMLSelectElement>('#portfolio-more-filter');
    const resultSummary = root.querySelector<HTMLElement>('#portfolio-result-summary');
    const clearFiltersButton = root.querySelector<HTMLButtonElement>('#portfolio-clear-filters');
    const showMoreButton = root.querySelector<HTMLButtonElement>('#portfolio-show-more');
    const items = Array.from(root.querySelectorAll<HTMLElement>('#portfolio-items .portfolio-item'));

    if (!container || !searchInput || !filterButtons.length || !resultSummary || !clearFiltersButton || !showMoreButton || !items.length) {
        return null;
    }
    if (container.dataset.discoveryInitialized === 'true') return null;
    container.dataset.discoveryInitialized = 'true';

    let state = parsePortfolioDiscoveryState(locationLike);

    const writeUrl = () => {
        const query = serializePortfolioDiscoveryState(state);
        historyLike.replaceState(null, '', `${locationLike.pathname}${query}${locationLike.hash || ''}`);
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
    clearFiltersButton.addEventListener('click', () => {
        state = createDefaultPortfolioDiscoveryState();
        render({ updateUrl: true });
        searchInput.focus();
    });

    render();
    return {
        getState: () => ({ ...state }),
        render
    };
};

export { DEFAULT_VISIBLE_COUNT };
