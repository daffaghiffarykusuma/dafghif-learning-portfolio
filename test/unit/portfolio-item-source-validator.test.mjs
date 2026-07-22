import { describe, expect, test } from 'bun:test';
import {
  assertValidPortfolioItemSource,
  validatePortfolioItemSource
} from '../../scripts/portfolio-item-source-validator.ts';

const validPortfolioItem = {
  id: 'sample-deck',
  title: 'Sample Deck',
  practiceArea: 'Learning Materials',
  tags: ['learning-materials'],
  description: 'A generated learning deck.',
  image: { src: 'assets/images/portfolio/sample.webp', alt: 'Sample deck thumbnail' },
  sourceArtifact: 'assets/pdf/portfolio/sample.pdf',
  sourceType: 'pdf',
  portfolioItemUrl: 'portfolio.html#sample-deck',
  discussUrl: 'contact.html?portfolioItem=Sample%20Deck'
};

const validCaseStudy = {
  id: 'case-sample-program',
  title: 'Sample Program',
  portfolioItemTitle: 'Sample Program Case Study',
  practiceArea: 'Instructional Design',
  tags: ['case-study'],
  description: 'A grouped program case.',
  summary: 'Shows the program from diagnosis through evaluation.',
  image: { src: 'assets/images/portfolio/case-sample.webp', alt: 'Sample case thumbnail' },
  pagePath: 'case-sample-program.html',
  outputPath: 'assets/portfolio-viewers/case-sample-program.html',
  reviewerContext: [],
  caseFlow: [],
  artifacts: [
    {
      id: 'artifact-sample-plan',
      title: 'Sample Plan',
      description: 'A facilitator-ready plan.',
      href: 'assets/pdf/portfolio/sample-plan.pdf',
      sourceType: 'pdf',
      practiceArea: 'Instructional Design',
      tags: ['instructional-design'],
      image: { src: 'assets/images/portfolio/sample-plan.webp', alt: 'Sample plan thumbnail' }
    }
  ]
};

const validProofSource = {
  practiceAreaDefaults: {
    'Learning Materials': {
      visibleProofLine: 'Converts concepts into facilitator-ready learning material.'
    },
    'Instructional Design': {
      visibleProofLine: 'Connects objectives, activities, and evidence.'
    }
  },
  itemOverrides: {
    'sample-deck': {
      visibleProofLine: 'Uses a structured learning sequence.'
    }
  }
};

const createValidSource = () => ({
  schemaVersion: 1,
  portfolioItemCount: 1,
  featuredPortfolioItemIds: ['case-sample-program', 'sample-deck'],
  portfolioItems: [{ ...validPortfolioItem }],
  caseStudies: [{ ...validCaseStudy }]
});

describe('Portfolio Item Source validation', () => {
  test('returns one normalized, expanded, featured-order Portfolio Item representation', () => {
    const result = validatePortfolioItemSource({
      portfolioSource: createValidSource(),
      proofSource: validProofSource
    });

    expect(result).toMatchObject({
      failures: [],
      rawPortfolioItemCount: 1,
      caseStudyCount: 1,
      generatedPortfolioItemCount: 2
    });
    expect(result.portfolioItems.map((item) => item.id)).toEqual([
      'case-sample-program',
      'sample-deck'
    ]);
    expect(result.portfolioItems[0]).toMatchObject({
      id: 'case-sample-program',
      title: 'Sample Program Case Study',
      sourceType: 'case-study-page',
      sourceArtifact: 'case-sample-program.html'
    });
  });

  test('rejects structural drift, duplicate identities, invalid Practice Areas, and orphan Proof Points', () => {
    const source = createValidSource();
    source.schemaVersion = 2;
    source.portfolioItemCount = 9;
    source.featuredPortfolioItemIds = ['missing-item', 'missing-item'];
    source.portfolioItems.push({
      ...validPortfolioItem,
      title: '',
      practiceArea: 'Unknown Practice',
      image: { src: '', alt: '' }
    });
    source.caseStudies.push({
      ...validCaseStudy,
      id: 'case-second-program',
      pagePath: validCaseStudy.pagePath,
      outputPath: '../case-second-program.html',
      absorbedPortfolioItemIds: ['missing-item'],
      artifacts: [
        validCaseStudy.artifacts[0],
        { ...validCaseStudy.artifacts[0], title: '' },
        null
      ]
    });

    const result = validatePortfolioItemSource({
      portfolioSource: source,
      proofSource: {
        ...validProofSource,
        itemOverrides: {
          ...validProofSource.itemOverrides,
          'missing-item': { visibleProofLine: 'This override has no generated Portfolio Item.' }
        }
      }
    });

    expect(result.failures).toContain('assets/data/portfolio-source.json: schemaVersion must be 1; received 2');
    expect(result.failures).toContain('assets/data/portfolio-source.json: portfolioItemCount must equal raw portfolioItems length; declared=9, actual=2');
    expect(result.failures).toContain('assets/data/portfolio-source.json: duplicate Portfolio Item id "sample-deck"');
    expect(result.failures).toContain('assets/data/portfolio-source.json: duplicate featured Portfolio Item id "missing-item"');
    expect(result.failures).toContain('assets/data/portfolio-source.json: featured Portfolio Item "missing-item" does not reference a generated Portfolio Item');
    expect(result.failures).toContain('assets/data/portfolio-source.json: Portfolio Item "sample-deck" is missing title');
    expect(result.failures).toContain('assets/data/portfolio-source.json: Portfolio Item "sample-deck" uses unknown Practice Area "Unknown Practice"');
    expect(result.failures).toContain('assets/data/portfolio-source.json: duplicate Case Study pagePath "case-sample-program.html"');
    expect(result.failures).toContain('assets/data/portfolio-source.json: Case Study "case-second-program" outputPath must be a project-relative .html path');
    expect(result.failures).toContain('assets/data/portfolio-source.json: Case Study "case-second-program" absorbs missing Portfolio Item "missing-item"');
    expect(result.failures).toContain('assets/data/portfolio-source.json: duplicate Case Study "case-second-program" Artifact id "artifact-sample-plan"');
    expect(result.failures).toContain('assets/data/portfolio-source.json: Case Study "case-second-program" Artifact "artifact-sample-plan" is missing title');
    expect(result.failures).toContain('assets/data/portfolio-source.json: Case Study "case-second-program" Artifact "record 3" is missing id');
    expect(result.failures).toContain('assets/data/portfolio-proof-points.json: itemOverride "missing-item" does not reference a generated Portfolio Item');
  });

  test('allows a Case Study to replace a raw Portfolio Item with the same id', () => {
    const source = createValidSource();
    source.portfolioItems[0].id = validCaseStudy.id;

    expect(validatePortfolioItemSource({
      portfolioSource: source,
      proofSource: validProofSource
    }).failures).not.toContain(`assets/data/portfolio-source.json: duplicate Portfolio Item id "${validCaseStudy.id}"`);
  });

  test('throws one generation-facing error with all validation failures', () => {
    const source = createValidSource();
    source.portfolioItems[0].title = '';
    source.portfolioItems[0].sourceArtifact = '';

    expect(() => assertValidPortfolioItemSource({
      portfolioSource: source,
      proofSource: validProofSource
    })).toThrow(/Portfolio Item Source validation failed[\s\S]*missing title[\s\S]*missing sourceArtifact/);
  });

  test('assertion returns the Validated Portfolio Item Source for downstream modules', () => {
    const result = assertValidPortfolioItemSource({
      portfolioSource: createValidSource(),
      proofSource: validProofSource
    });

    expect(result.failures).toEqual([]);
    expect(result.portfolioItems.map((item) => item.id)).toEqual([
      'case-sample-program',
      'sample-deck'
    ]);
  });
});
