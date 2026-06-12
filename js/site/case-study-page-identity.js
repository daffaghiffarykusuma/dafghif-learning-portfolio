export const CASE_STUDY_PAGE_KIND = 'case-study';
export const CASE_STUDY_INDEX_PAGE_KIND = 'case-study-index';
export const CASE_STUDY_NAVIGATION_PAGE = 'case-studies.html';

const pageNameFromPath = (pathname = '') =>
    String(pathname).split('/').filter(Boolean).pop() || 'index.html';

export const createCaseStudyPageIdentity = (pagePath = '') => Object.freeze({
    kind: CASE_STUDY_PAGE_KIND,
    pagePath: pageNameFromPath(pagePath),
    navigationPage: CASE_STUDY_NAVIGATION_PAGE
});

export const createCaseStudyIndexPageIdentity = () => Object.freeze({
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

export const isCaseStudyPageIdentity = (identity = {}) =>
    identity.kind === CASE_STUDY_PAGE_KIND;
