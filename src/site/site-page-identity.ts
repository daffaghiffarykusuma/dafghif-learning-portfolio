// Site Page Identity: the one routing input shared by generation and the browser.
// The Site Page Shell serializes it onto <body>; browser adapters read it back.

export const SITE_PAGE_KINDS = Object.freeze({
    home: 'home',
    portfolio: 'portfolio',
    caseStudyIndex: 'case-study-index',
    caseStudy: 'case-study',
    blog: 'blog',
    contact: 'contact',
    notFound: 'not-found'
} as const);

export type SitePageKind = typeof SITE_PAGE_KINDS[keyof typeof SITE_PAGE_KINDS];

export const CASE_STUDY_PAGE_KIND = SITE_PAGE_KINDS.caseStudy;
export const CASE_STUDY_INDEX_PAGE_KIND = SITE_PAGE_KINDS.caseStudyIndex;
export const CASE_STUDY_NAVIGATION_PAGE = 'case-studies.html';

export type PageIdentity = {
    kind: string;
    pagePath: string;
    navigationPage: string;
};

export type CaseStudyPageIdentity = PageIdentity & {
    kind: typeof CASE_STUDY_PAGE_KIND;
};

const sitePageKindValues: ReadonlySet<string> = new Set(Object.values(SITE_PAGE_KINDS));

export const isSitePageKind = (value: unknown): value is SitePageKind =>
    typeof value === 'string' && sitePageKindValues.has(value);

export const pageNameFromPath = (pathname = '') =>
    String(pathname).split(/[?#]/)[0].split('/').filter(Boolean).pop() || 'index.html';

export const createSitePageIdentity = ({
    kind,
    pagePath,
    navigationPage
}: { kind: SitePageKind; pagePath: string; navigationPage?: string }): Readonly<PageIdentity> => {
    const page = pageNameFromPath(pagePath);
    return Object.freeze({
        kind,
        pagePath: page,
        navigationPage: navigationPage
            ? pageNameFromPath(navigationPage)
            : kind === CASE_STUDY_PAGE_KIND ? CASE_STUDY_NAVIGATION_PAGE : page
    });
};

export const createCaseStudyPageIdentity = (pagePath = ''): Readonly<CaseStudyPageIdentity> =>
    createSitePageIdentity({ kind: CASE_STUDY_PAGE_KIND, pagePath }) as Readonly<CaseStudyPageIdentity>;

export const createCaseStudyIndexPageIdentity = (): Readonly<PageIdentity> =>
    createSitePageIdentity({ kind: CASE_STUDY_INDEX_PAGE_KIND, pagePath: CASE_STUDY_NAVIGATION_PAGE });

export const readPageIdentity = ({
    root = document,
    pathname = globalThis.window?.location?.pathname || ''
} = {}): PageIdentity => {
    const body = root.body;
    const pagePath = body?.dataset.pagePath || pageNameFromPath(pathname);
    return {
        kind: body?.dataset.pageKind || '',
        pagePath,
        navigationPage: body?.dataset.navigationPage || pagePath
    };
};

export const isCaseStudyPageIdentity = (identity: Partial<PageIdentity> = {}): identity is CaseStudyPageIdentity =>
    identity.kind === CASE_STUDY_PAGE_KIND;
