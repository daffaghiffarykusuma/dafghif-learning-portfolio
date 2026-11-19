// Cards shown before "Show more". Generation hides the rest in the static markup
// so the default view needs no layout change once this script runs.
export const DEFAULT_VISIBLE_COUNT = 9;
const MAX_TEXT_LENGTH = 120;
const FORMATS = new Set(['pdf', 'html-viewer', 'case-study-page']);
const normalizeFormat = (value: unknown) => FORMATS.has(String(value)) ? String(value) : '';

// Generation and browser controls share these identities. Tags add related work;
// they never choose the declared Practice Area's label or destination.
// `filter` names where each Practice Area appears among the discovery controls:
// a primary filter button, an additional topic, or only in the full area list.
type DiscoveryFilter = { value: string; label: string };
type PracticeAreaFilter = DiscoveryFilter & { filter: 'primary' | 'topic' | 'area-only' };

const practiceAreas: readonly PracticeAreaFilter[] = [
    { value: 'training-workshop', label: 'Custom Training & Workshops', filter: 'primary' },
    { value: 'instructional-design', label: 'Instructional Design', filter: 'primary' },
    { value: 'learning-materials', label: 'Learning Materials', filter: 'primary' },
    { value: 'assessment', label: 'Assessment & Evaluation', filter: 'primary' },
    { value: 'learning-analytics', label: 'Learning Analytics', filter: 'primary' },
    { value: 'training-needs-analysis', label: 'Training Needs Analysis', filter: 'topic' },
    { value: 'curriculum-development', label: 'Curriculum Development', filter: 'topic' },
    { value: 'training-proposal', label: 'Training Proposal', filter: 'topic' },
    { value: 'learning-strategy', label: 'L&D Strategy', filter: 'topic' },
    { value: 'presentation-design', label: 'Presentation Design', filter: 'topic' },
    { value: 'mentoring', label: 'Mentoring & Coaching', filter: 'topic' },
    { value: 'mentoring-speaking', label: 'Mentoring & Speaking', filter: 'area-only' },
    { value: 'legacy-project', label: 'Review: Legacy Project', filter: 'area-only' }
];

// Additional topics that are tags, not Practice Areas.
const topicTags: readonly DiscoveryFilter[] = [
    { value: 'worksheet', label: 'Worksheets' }
];

// Order of the additional-topic menu, by filter value.
const topicOrder = [
    'training-needs-analysis',
    'curriculum-development',
    'training-proposal',
    'worksheet',
    'learning-strategy',
    'presentation-design',
    'mentoring'
];

const toFilter = ({ value, label }: DiscoveryFilter): DiscoveryFilter => ({ value, label });
const topicCandidates = [...practiceAreas.filter(({ filter }) => filter === 'topic'), ...topicTags];

export const portfolioDiscoveryFilters = {
    areas: [{ value: 'all', label: 'All practice areas' }, ...practiceAreas.map(toFilter)],
    primaryAreas: [
        { value: 'all', label: 'All' },
        ...practiceAreas.filter(({ filter }) => filter === 'primary').map(toFilter)
    ],
    // The "More practice areas" menu lists only areas without a filter button,
    // so the buttons and the menu never offer the same choice twice.
    secondaryAreas: [
        { value: '', label: 'Choose another area' },
        ...practiceAreas.filter(({ filter }) => filter !== 'primary').map(toFilter)
    ],
    topics: topicOrder.map((value) => {
        const topic = topicCandidates.find((candidate) => candidate.value === value);
        if (!topic) throw new Error(`Portfolio Item Discovery topic order names an unknown topic: ${value}`);
        return toFilter(topic);
    })
};

/**
 * Checks a `portfolio.html` link's discovery parameters against the known filter
 * identities. Returns the parameter names whose values no filter recognizes.
 */
export const unknownPortfolioDiscoveryParams = (search: string) => {
    const params = new URLSearchParams(search);
    // Discovery matches both parameters against item categories, which carry
    // Practice Area values and topic tags alike.
    const knownValues = new Set([...portfolioDiscoveryFilters.areas, ...portfolioDiscoveryFilters.topics].map(({ value }) => value));
    return ['area', 'tag'].filter((name) => params.has(name) && !knownValues.has(params.get(name) || ''));
};

export const createPortfolioItemDiscoveryFacts = (item: { practiceArea: string; tags: string[] }) => {
    const area = practiceAreas.find(({ label }) => label === item.practiceArea);
    if (!area) throw new Error(`Unknown Portfolio Item Discovery Practice Area: ${item.practiceArea}`);
    return {
        practiceAreaLabel: area.label,
        practiceAreaHref: `portfolio.html?area=${area.value}`,
        categories: [...new Set([...item.tags, area.value])].join(' ')
    };
};

const labelForFilter = (value: string) =>
    [...portfolioDiscoveryFilters.areas, ...portfolioDiscoveryFilters.topics]
        .find((filter) => filter.value === value)?.label || value.replace(/-/g, ' ');

type PortfolioDiscoveryState = {
    query: string;
    area: string;
    tag: string;
    format: string;
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
    format: '',
    visibleCount: DEFAULT_VISIBLE_COUNT
});

const parsePortfolioDiscoveryState = (): PortfolioDiscoveryState => {
    const params = new URLSearchParams(window.location.search || '');
    return {
        query: normalizeText(params.get('q')),
        area: normalizeToken(params.get('area')) || 'all',
        tag: normalizeToken(params.get('tag')),
        format: normalizeFormat(params.get('format')),
        visibleCount: normalizeVisibleCount(params.get('show'))
    };
};

const serializePortfolioDiscoveryState = (state: PortfolioDiscoveryState) => {
    const params = new URLSearchParams();
    const query = normalizeText(state.query);
    const area = normalizeToken(state.area);
    const tag = normalizeToken(state.tag);
    const format = normalizeFormat(state.format);
    const visibleCount = normalizeVisibleCount(state.visibleCount);

    if (query) params.set('q', query);
    if (area && area !== 'all') params.set('area', area);
    if (tag) params.set('tag', tag);
    if (format) params.set('format', format);
    if (visibleCount !== DEFAULT_VISIBLE_COUNT) params.set('show', String(visibleCount));
    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
};

// Cards are static after generation; index their text once instead of reading the DOM on every input.
const indexPortfolioItem = (item: HTMLElement) => ({
    element: item,
    placeholder: item.classList.contains('portfolio-item-placeholder'),
    categories: new Set(
        String(item.dataset.category || '')
            .split(/\s+/)
            .map(normalizeToken)
            .filter(Boolean)
    ),
    searchText: String(item.dataset.searchText || item.textContent).replace(/\s+/g, ' ').trim().toLowerCase(),
    format: item.dataset.format
});

export const initPortfolioDiscovery = () => {
    const container = document.querySelector<HTMLElement>('#portfolio-discovery');
    const searchInput = document.querySelector<HTMLInputElement>('#portfolio-search');
    const filterButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('#portfolio-discovery .filter-button'));
    const moreFilter = document.querySelector<HTMLSelectElement>('#portfolio-more-filter');
    const areaFilter = document.querySelector<HTMLSelectElement>('#portfolio-area-filter');
    const formatFilter = document.querySelector<HTMLSelectElement>('#portfolio-format-filter');
    const filterDetails = document.querySelector<HTMLDetailsElement>('.portfolio-filter-details');
    const activeFilters = document.querySelector<HTMLElement>('#portfolio-active-filters');
    const resultSummary = document.querySelector<HTMLElement>('#portfolio-result-summary');
    const clearFiltersButton = document.querySelector<HTMLButtonElement>('#portfolio-clear-filters');
    const showMoreButton = document.querySelector<HTMLButtonElement>('#portfolio-show-more');
    const items = Array.from(document.querySelectorAll<HTMLElement>('#portfolio-items .portfolio-item'));

    if (!container || !searchInput || !filterButtons.length || !resultSummary || !clearFiltersButton || !showMoreButton || !items.length) {
        return;
    }
    if (container.dataset.discoveryInitialized === 'true') return;
    container.dataset.discoveryInitialized = 'true';
    const indexedItems = items.map(indexPortfolioItem);

    let state = parsePortfolioDiscoveryState();
    if (filterDetails) {
        const desktop = window.matchMedia('(min-width: 768px)');
        filterDetails.open = desktop.matches;
        desktop.addEventListener('change', (event) => { filterDetails.open = event.matches; });
    }

    const writeUrl = () => {
        const query = serializePortfolioDiscoveryState(state);
        window.history.replaceState(null, '', `${window.location.pathname}${query}${window.location.hash || ''}`);
    };

    const render = ({ updateUrl = false }: { updateUrl?: boolean } = {}) => {
        searchInput.value = state.query;
        // A primary area shows as a pressed button; any other area shows in the menu.
        const areaHasButton = filterButtons.some((button) => button.dataset.filter === state.area);
        const areaMenuValue = areaHasButton ? '' : state.area;
        // Keep older or externally linked topic values visible, including area=worksheet.
        for (const [select, value] of [[areaFilter, areaMenuValue], [moreFilter, state.tag]] as const) {
            if (!select) continue;
            if (value && !Array.from(select.options).some((option) => option.value === value)) {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = labelForFilter(value);
                select.append(option);
            }
            select.value = value;
        }
        if (formatFilter) formatFilter.value = state.format;
        filterButtons.forEach((button) => {
            const selected = button.dataset.filter === state.area;
            button.classList.toggle('active', selected);
            button.setAttribute('aria-pressed', String(selected));
        });
        if (activeFilters) {
            activeFilters.textContent = [
                state.area !== 'all' ? labelForFilter(state.area) : '',
                state.tag ? `Topic: ${labelForFilter(state.tag)}` : '',
                state.format ? formatFilter?.selectedOptions[0]?.textContent : ''
            ].filter(Boolean).join(' · ');
        }

        const queryTokens = state.query.toLowerCase().split(/\s+/).filter(Boolean);
        const matchingItems = indexedItems.filter((item) =>
            !item.placeholder
            && queryTokens.every((token) => item.searchText.includes(token))
            && (state.area === 'all' || item.categories.has(state.area))
            && (!state.tag || item.categories.has(state.tag))
            && (!state.format || item.format === state.format)
        );
        const visibleLimit = Math.min(state.visibleCount, matchingItems.length);
        const matchingSet = new Set(matchingItems.slice(0, visibleLimit).map((item) => item.element));
        items.forEach((item) => {
            const hidden = !matchingSet.has(item);
            if (item.hidden !== hidden) item.hidden = hidden;
        });

        const allVisible = matchingItems.length <= visibleLimit;
        resultSummary.textContent = matchingItems.length === 0
            ? 'No matching work samples. Try another search or clear the filters.'
            : allVisible
                ? `Showing all ${matchingItems.length} matching work samples`
                : `Showing ${visibleLimit} of ${matchingItems.length} matching work samples`;
        clearFiltersButton.hidden = !state.query && state.area === 'all' && !state.tag && !state.format;
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
    areaFilter?.addEventListener('change', () => {
        state = { ...state, area: normalizeToken(areaFilter.value) || 'all', visibleCount: DEFAULT_VISIBLE_COUNT };
        render({ updateUrl: true });
    });
    formatFilter?.addEventListener('change', () => {
        state = { ...state, format: normalizeFormat(formatFilter.value), visibleCount: DEFAULT_VISIBLE_COUNT };
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
