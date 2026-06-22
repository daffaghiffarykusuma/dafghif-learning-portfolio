import { describe, expect, test } from 'bun:test';
import path from 'node:path';
import { validatePortfolioEvidenceData } from '../../scripts/portfolio-evidence-validator.mjs';

const root = path.resolve('C:/portfolio-site');
const validSourceItem = {
  id: 'custom-deck',
  title: 'Custom Deck',
  practiceArea: 'Learning Materials',
  description: 'Uses roleplay prompts.',
  image: { src: 'assets/images/portfolio/custom.webp', alt: 'Custom deck thumbnail' },
  sourceArtifact: 'assets/pdf/portfolio/custom.pdf'
};
const validCatalogItem = {
  ...validSourceItem,
  proof: {
    visibleProofLine: 'Uses roleplay instructions and reflection prompts.',
    workQuality: [
      {
        claim: 'Includes roleplay instructions and reflection prompts.',
        sourceBasis: 'artifact',
        confidence: 'direct'
      }
    ],
    impact: [
      {
        claim: 'Supported 120 learners.',
        sourceBasis: 'portfolio-description',
        confidence: 'direct'
      }
    ]
  }
};

const exists = async (absolutePath) => [
  path.resolve(root, 'assets/images/portfolio/custom.webp'),
  path.resolve(root, 'assets/pdf/portfolio/custom.pdf')
].includes(absolutePath);

describe('Portfolio Evidence validator', () => {
  test('accepts aligned source/catalog data with direct impact proof', async () => {
    const result = await validatePortfolioEvidenceData({
      portfolioSourceData: { portfolioItems: [validSourceItem] },
      portfolioCatalog: { portfolioItems: [validCatalogItem] },
      portfolioAiContext: {
        portfolioItems: [
          {
            id: validCatalogItem.id,
            aiContext: {
              aiHint: { evidenceLevel: 'inferred non-proof drafting hint' },
              outcomeEvidence: validCatalogItem.proof.impact
            }
          }
        ]
      },
      root,
      assetExists: exists
    });

    expect(result).toEqual({
      failures: [],
      portfolioItemCount: 1,
      portfolioSourceItemCount: 1
    });
  });

  test('keeps source/catalog drift and Proof Point coverage failures local to the module', async () => {
    const result = await validatePortfolioEvidenceData({
      portfolioSourceData: { portfolioItems: [validSourceItem, { ...validSourceItem, id: 'second-item' }] },
      portfolioCatalog: {
        portfolioItems: [
          {
            id: 'other-item',
            title: 'Other Item',
            practiceArea: 'Learning Materials',
            description: 'Missing evidence fields.',
            sourceArtifact: 'assets/pdf/portfolio/missing.pdf',
            image: { src: '../outside.webp' },
            proof: {
              impact: [
                {
                  claim: 'Unsupported broad result.',
                  confidence: 'inferred'
                },
                {
                  confidence: 'direct'
                }
              ]
            }
          }
        ]
      },
      root,
      assetExists: async () => false
    });

    expect(result.failures).toEqual([
      'Portfolio Item source/catalog count mismatch: source=2, catalog=1',
      'Portfolio Item source/catalog id order mismatch; regenerate catalog and rendered cards from assets/data/portfolio-source.json',
      'assets/data/portfolio-items.json: portfolio item 1 references asset outside the project root: ../outside.webp',
      'assets/data/portfolio-items.json: portfolio item 1 references missing asset: assets/pdf/portfolio/missing.pdf',
      'assets/data/portfolio-items.json: portfolio item 1 is missing proof.visibleProofLine',
      'assets/data/portfolio-items.json: portfolio item 1 is missing proof.workQuality evidence',
      'assets/data/portfolio-items.json: portfolio item 1 impact proof 1 must be a direct, explicitly supported claim',
      'assets/data/portfolio-items.json: portfolio item 1 impact proof 2 must be a direct, explicitly supported claim'
    ]);
  });

  test('reports empty source and catalog inputs with existing validation wording', async () => {
    const result = await validatePortfolioEvidenceData({
      portfolioSourceData: {},
      portfolioCatalog: {},
      root,
      assetExists: async () => true
    });

    expect(result.failures).toEqual([
      'assets/data/portfolio-source.json: expected at least one Portfolio Item source record',
      'assets/data/portfolio-items.json: expected at least one portfolio item'
    ]);
  });

  test('keeps sourceArtifact validation tied to the Shipped Artifact Policy', async () => {
    const result = await validatePortfolioEvidenceData({
      portfolioSourceData: { portfolioItems: [validSourceItem] },
      portfolioCatalog: {
        portfolioItems: [
          {
            ...validCatalogItem,
            sourceArtifact: 'assets/spreadsheets/portfolio/source-workbook.xlsx'
          }
        ]
      },
      root,
      assetExists: async () => true
    });

    expect(result.failures).toContain('assets/data/portfolio-items.json: portfolio item 1 references a denied shipped Artifact source type: assets/spreadsheets/portfolio/source-workbook.xlsx');
  });

  test('keeps AI-context Outcome Evidence directness local to the module', async () => {
    const result = await validatePortfolioEvidenceData({
      portfolioSourceData: { portfolioItems: [validSourceItem] },
      portfolioCatalog: { portfolioItems: [validCatalogItem] },
      portfolioAiContext: {
        portfolioItems: [
          {
            id: validCatalogItem.id,
            aiContext: {
              aiHint: { evidenceLevel: 'inferred outcome' },
              outcomeEvidence: [
                { claim: 'Direct result.', confidence: 'direct' },
                { claim: 'Inferred result.', confidence: 'inferred' },
                { confidence: 'direct' }
              ]
            }
          },
          {
            id: 'extra-context-item',
            aiContext: {}
          }
        ]
      },
      root,
      assetExists: exists
    });

    expect(result.failures).toContain('Portfolio Item catalog/AI context count mismatch: catalog=1, aiContext=2');
    expect(result.failures).toContain('assets/data/portfolio-ai-context.json: portfolio item 1 Outcome Evidence 2 must be a direct Proof Point impact entry');
    expect(result.failures).toContain('assets/data/portfolio-ai-context.json: portfolio item 1 Outcome Evidence 3 must be a direct Proof Point impact entry');
    expect(result.failures).toContain('assets/data/portfolio-ai-context.json: portfolio item 1 aiHint must be labeled as an inferred non-proof drafting hint');
    expect(result.failures).toContain('assets/data/portfolio-ai-context.json: portfolio item 2 is missing aiContext.outcomeEvidence array');
  });
});
