import { describe, expect, test } from 'bun:test';
import {
  createPortfolioCatalogData,
  normalizePortfolioItem,
  slugify
} from '../../scripts/portfolio-item-catalog.ts';
import { createAiContextPortfolioItem } from '../../scripts/portfolio-context-inference.mjs';

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

  test('preserves an explicitly supplied proof value', () => {
    const proof = {};

    expect(normalizePortfolioItem({ title: 'A Deck', proof }).proof).toBe(proof);
  });

  test('derives AI context from the normalized Portfolio Item interface', () => {
    const item = createAiContextPortfolioItem({
      title: 'MSME Pitch Deck Template',
      practiceArea: 'Presentation Design',
      description: 'A pitch presentation workbook for 120 MSME entrepreneurs.',
      sourceArtifact: 'assets/presentations/portfolio/msme_pitch_template.pptx',
      tags: ['presentation-design', 'mentoring-coaching'],
      proof: {
        visibleProofLine: 'Organizes complex ideas into a clear slide narrative.',
        workQuality: [{ claim: 'Shapes complex ideas into a presentation-ready flow.' }]
      }
    });

    expect(item).toMatchObject({
      id: 'msme-pitch-deck-template',
      publicDescription: 'A pitch presentation workbook for 120 MSME entrepreneurs.',
      sourceArtifact: 'assets/presentations/portfolio/msme_pitch_template.pptx',
      aiContext: {
        audience: 'MSME owners and entrepreneurs',
        tools: ['PowerPoint or Google Slides'],
        scaleSignals: ['120'],
        aiHint: {
          evidenceLevel: 'inferred non-proof drafting hint',
          application: 'Gave learners and facilitators practical tools for reflection, planning, and follow-through.'
        },
        outcomeEvidence: [],
        proof: {
          visibleProofLine: 'Organizes complex ideas into a clear slide narrative.',
          workQuality: [{ claim: 'Shapes complex ideas into a presentation-ready flow.' }]
        }
      }
    });
    expect(item.aiContext.skills).toContain('presentation design');
    expect(item.aiContext.skills).toContain('mentoring coaching');
    expect(item.aiContext.cvBullet).toContain('non-proof AI application hint');
  });

  test('uses only direct Proof Point impact entries as Outcome Evidence', () => {
    const item = createAiContextPortfolioItem({
      title: 'Entrepreneurship Program for 5000+ SMK Students',
      practiceArea: 'Custom Training & Workshops',
      description: 'A bootcamp program for vocational students.',
      proof: {
        visibleProofLine: 'Adapts entrepreneurship learning for a 5000+ student audience.',
        workQuality: [{ claim: 'Structures entrepreneurship learning for a large vocational student audience.' }],
        impact: [
          {
            claim: 'The portfolio description identifies a 5000+ SMK student audience.',
            sourceBasis: 'portfolio-title',
            confidence: 'direct'
          },
          {
            claim: 'Unsupported generated result.',
            sourceBasis: 'ai-context',
            confidence: 'inferred'
          }
        ]
      }
    });

    expect(item.aiContext.outcomeEvidence).toEqual([
      {
        claim: 'The portfolio description identifies a 5000+ SMK student audience.',
        sourceBasis: 'portfolio-title',
        confidence: 'direct'
      }
    ]);
    expect(item.aiContext.aiHint.application).toBe('Supported applied learning through structured activities, facilitation, and practical implementation tasks.');
    expect(item.aiContext.cvBullet).toContain('with supported outcome evidence: The portfolio description identifies a 5000+ SMK student audience.');
  });

  test('slugifies Portfolio Item titles consistently', () => {
    expect(slugify('L&D Strategy & Evaluation')).toBe('l-and-d-strategy-and-evaluation');
  });
});
