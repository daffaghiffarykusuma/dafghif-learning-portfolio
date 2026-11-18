import { afterEach, describe, expect, test } from 'bun:test';
import {
  CASE_STUDY_NAVIGATION_PAGE,
  createCaseStudyIndexPageIdentity,
  createCaseStudyPageIdentity,
  isCaseStudyPageIdentity,
  createSitePageIdentity,
  pageNameFromPath,
  readPageIdentity
} from '../../src/site/site-page-identity.ts';
import { createDom, resetDom } from '../helpers/dom.mjs';

afterEach(() => {
  resetDom();
});

describe('Site Page Identity', () => {
  test('names every root page and derives its navigation page', () => {
    expect(createSitePageIdentity({ kind: 'portfolio', pagePath: 'portfolio.html' })).toEqual({
      kind: 'portfolio', pagePath: 'portfolio.html', navigationPage: 'portfolio.html'
    });
    expect(createSitePageIdentity({ kind: 'case-study', pagePath: 'case-new.html' }).navigationPage).toBe(CASE_STUDY_NAVIGATION_PAGE);
    expect(pageNameFromPath('/nested/contact.html?portfolioItem=A#top')).toBe('contact.html');
    expect(pageNameFromPath('/')).toBe('index.html');
  });

  test('provides one identity interface for generation and browser adapters', () => {
    const identity = createCaseStudyPageIdentity('nested/case-sample.html');

    expect(identity).toEqual({
      kind: 'case-study',
      pagePath: 'case-sample.html',
      navigationPage: CASE_STUDY_NAVIGATION_PAGE
    });
    expect(isCaseStudyPageIdentity(identity)).toBe(true);
    expect(createCaseStudyIndexPageIdentity()).toEqual({
      kind: 'case-study-index',
      pagePath: 'case-studies.html',
      navigationPage: CASE_STUDY_NAVIGATION_PAGE
    });
  });

  test('reads serialized identity instead of inferring Case Study filenames', () => {
    createDom(
      '<body data-page-kind="case-study" data-page-path="case-new.html" data-navigation-page="case-studies.html"></body>',
      'http://127.0.0.1/unrelated-path.html'
    );

    expect(readPageIdentity()).toEqual({
      kind: 'case-study',
      pagePath: 'case-new.html',
      navigationPage: 'case-studies.html'
    });
  });
});
