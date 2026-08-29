import { describe, expect, test } from 'bun:test';
import {
  createPortfolioCatalogData,
  normalizePortfolioItem,
  slugify
} from '../../scripts/portfolio-item-catalog.ts';

describe('Portfolio Item catalog', () => {
  test('normalizes Portfolio Item source fields', () => {
    expect(normalizePortfolioItem({
      title: ' Recruitment Assessment Blueprint ',
      practiceArea: ' Assessment & Evaluation ',
      description: '  Scores candidates with clear rubric evidence. ',
      sourceArtifact: 'assets/spreadsheets/portfolio/recruitment_assessment_blueprint.xlsx',
      portfolioItemUrl: 'portfolio.html#assessment-blueprint',
      tags: [' assessment-evaluation ', '', 'learning-analytics']
    })).toEqual({
      id: 'recruitment-assessment-blueprint',
      title: 'Recruitment Assessment Blueprint',
      practiceArea: 'Assessment & Evaluation',
      tags: ['assessment-evaluation', 'learning-analytics'],
      description: 'Scores candidates with clear rubric evidence.',
      image: {
        src: '',
        alt: 'Recruitment Assessment Blueprint'
      },
      sourceArtifact: 'assets/spreadsheets/portfolio/recruitment_assessment_blueprint.xlsx',
      sourceType: '',
      portfolioItemUrl: 'portfolio.html#assessment-blueprint',
      discussUrl: '',
      proof: {
        visibleProofLine: '',
        workQuality: [],
        impact: []
      }
    });
  });

  test('builds schema-versioned catalog data without changing the public schema', () => {
    const portfolioItems = [normalizePortfolioItem({ title: 'A Deck', practiceArea: 'Presentation Design' })];

    expect(createPortfolioCatalogData({
      generatedFrom: 'portfolio.html',
      generatedAt: '2026-05-23T00:00:00.000Z',
      portfolioItems
    })).toEqual({
      schemaVersion: 1,
      generatedFrom: 'portfolio.html',
      generatedAt: '2026-05-23T00:00:00.000Z',
      portfolioItemCount: 1,
      portfolioItems
    });
  });

  test('normalizes an explicitly supplied Proof Point value', () => {
    expect(normalizePortfolioItem({
      title: 'A Deck',
      proof: {
        visibleProofLine: '  Evidence line. ',
        workQuality: [{ claim: '  Structured work. ', confidence: 'direct' }, {}]
      }
    }).proof).toEqual({
      visibleProofLine: 'Evidence line.',
      workQuality: [{ claim: 'Structured work.', sourceBasis: '', confidence: 'direct' }],
      impact: []
    });
  });

  test('slugifies Portfolio Item titles consistently', () => {
    expect(slugify('L&D Strategy & Evaluation')).toBe('l-and-d-strategy-and-evaluation');
  });
});
