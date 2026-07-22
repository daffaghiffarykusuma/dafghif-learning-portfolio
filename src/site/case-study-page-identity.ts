export const CASE_STUDY_PAGE_KIND = 'case-study';
export const CASE_STUDY_INDEX_PAGE_KIND = 'case-study-index';
export const CASE_STUDY_NAVIGATION_PAGE = 'case-studies.html';

export type PageIdentity = {
    kind: string;
    pagePath: string;
    navigationPage: string;
};

export type CaseStudyPageIdentity = PageIdentity & {
    kind: typeof CASE_STUDY_PAGE_KIND;
};

const pageNameFromPath = (pathname = '') =>
    String(pathname).split('/').filter(Boolean).pop() || 'index.html';

export const createCaseStudyPageIdentity = (pagePath = ''): Readonly<CaseStudyPageIdentity> => Object.freeze({
    kind: CASE_STUDY_PAGE_KIND,
    pagePath: pageNameFromPath(pagePath),
    navigationPage: CASE_STUDY_NAVIGATION_PAGE
});

export const createCaseStudyIndexPageIdentity = (): Readonly<PageIdentity> => Object.freeze({
    kind: CASE_STUDY_INDEX_PAGE_KIND,
    pagePath: CASE_STUDY_NAVIGATION_PAGE,
    navigationPage: CASE_STUDY_NAVIGATION_PAGE
});

export const readPageIdentity = ({
    root = document,
    pathname = globalThis.window?.location?.pathname || ''
} = {}) => {
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
