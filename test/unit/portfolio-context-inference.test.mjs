import { describe, expect, test } from 'bun:test';
import {
  createAiContextPortfolioItem
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

  test('keeps inference rules behind the complete AI-readable context interface', () => {
    const item = createAiContextPortfolioItem(normalizePortfolioItem({
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
    }));

    expect(item).toEqual({
      id: 'ai-dashboard-for-35-managers',
      title: 'AI Dashboard for 35 Managers',
      practiceArea: 'Learning Analytics',
      tags: [],
      publicDescription: 'A sentiment dashboard and calculator for supervisors.',
      sourceArtifact: 'assets/portfolio-viewers/dashboard.html',
      aiContext: {
        evidenceLevel: 'inferred from structured portfolio source',
        role: 'Converted learning data, response inputs, or budget assumptions into analysis-ready dashboards and decision tools.',
        audience: 'managers and team leaders',
        deliverables: ['analysis dashboard', 'calculation model', 'decision report'],
        skills: ['learning analytics', 'dashboard design', 'Kirkpatrick evaluation', 'spreadsheet modeling'],
        tools: ['Excel or Google Sheets', 'AI-enabled analysis concepts'],
        scaleSignals: ['35'],
        aiHint: {
          evidenceLevel: 'inferred non-proof drafting hint',
          application: 'Improved visibility into learning data so decisions, remediation, and program improvements could be made faster.'
        },
        outcomeEvidence: [
          { claim: 'Supported a 35 manager review.', sourceBasis: 'portfolio-title', confidence: 'direct' }
        ],
        proof: {
          visibleProofLine: '',
          workQuality: [],
          impact: [
            { claim: 'Supported a 35 manager review.', sourceBasis: 'portfolio-title', confidence: 'direct' },
            { claim: 'Likely improved decisions.', sourceBasis: 'guess', confidence: 'inferred' }
          ]
        },
        cvBullet: 'Built AI Dashboard for 35 Managers as a learning analytics portfolio item, creating practical context for managers and team leaders, with supported outcome evidence: Supported a 35 manager review.'
      }
    });
  });
});
