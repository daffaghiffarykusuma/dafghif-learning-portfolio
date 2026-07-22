import { describe, expect, test } from 'bun:test';
import {
  createAiContextPortfolioItem,
  getDirectOutcomeEvidence,
  inferApplicationHint,
  inferAudience,
  inferScale,
  inferTools
} from '../../scripts/portfolio-context-inference.ts';
import { normalizePortfolioItem } from '../../scripts/portfolio-item-catalog.ts';

describe('Portfolio Context Inference', () => {
  test('builds AI-readable context from one inference interface', () => {
    const item = createAiContextPortfolioItem(normalizePortfolioItem({
      title: 'MSME Pitch Deck Template',
      practiceArea: 'Presentation Design',
      description: 'A pitch presentation workbook for 120 MSME entrepreneurs.',
      sourceArtifact: 'assets/presentations/portfolio/msme_pitch_template.pptx',
      tags: ['presentation-design', 'mentoring-coaching'],
      proof: {
        visibleProofLine: 'Organizes complex ideas into a clear slide narrative.',
        workQuality: [{ claim: 'Shapes complex ideas into a presentation-ready flow.' }]
      }
    }));

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

  test('keeps direct Outcome Evidence separate from inferred hints', () => {
    const item = createAiContextPortfolioItem(normalizePortfolioItem({
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
    }));

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

  test('exposes individual inference rules for focused regression coverage', () => {
    const portfolioItem = {
      title: 'AI Dashboard for 35 Managers',
      practiceArea: 'Learning Analytics',
      description: 'A sentiment dashboard and calculator for supervisors.',
      sourceArtifact: 'assets/portfolio-viewers/dashboard.html',
      proof: {
        impact: [
          { claim: 'Supported a 35 manager review.', sourceBasis: 'portfolio-title', confidence: 'direct' },
          { claim: 'Likely improved decisions.', sourceBasis: 'guess', confidence: 'inferred' }
        ]
      }
    };

    expect(inferTools(portfolioItem)).toEqual(['Excel or Google Sheets', 'AI-enabled analysis concepts']);
    expect(inferAudience(portfolioItem)).toBe('managers and team leaders');
    expect(inferScale(portfolioItem)).toEqual(['35']);
    expect(inferApplicationHint(portfolioItem)).toBe('Improved visibility into learning data so decisions, remediation, and program improvements could be made faster.');
    expect(getDirectOutcomeEvidence(portfolioItem)).toEqual([
      { claim: 'Supported a 35 manager review.', sourceBasis: 'portfolio-title', confidence: 'direct' }
    ]);
  });
});
