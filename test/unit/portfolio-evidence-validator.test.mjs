import { afterEach, describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { validatePortfolioEvidence } from '../../scripts/validation/portfolio-evidence-validator.ts';

let tempRoot = null;

afterEach(async () => {
  if (tempRoot) {
    await rm(tempRoot, { recursive: true, force: true });
    tempRoot = null;
  }
});

const validSourceItem = {
  id: 'custom-deck',
  title: 'Custom Deck',
  practiceArea: 'Learning Materials',
  tags: ['learning-materials'],
  description: 'Uses roleplay prompts.',
  image: { src: 'assets/images/portfolio/custom.webp', alt: 'Custom deck thumbnail' },
  sourceArtifact: 'assets/pdf/portfolio/custom.pdf',
  sourceType: 'pdf',
  portfolioItemUrl: 'portfolio.html#custom-deck',
  discussUrl: 'contact.html?portfolioItem=Custom%20Deck'
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

const validAiContextItem = {
  id: validCatalogItem.id,
  aiContext: {
    aiHint: { evidenceLevel: 'inferred non-proof drafting hint' },
    outcomeEvidence: validCatalogItem.proof.impact
  }
};

const createPortfolioSource = (portfolioItems) => ({
  schemaVersion: 1,
  portfolioItemCount: portfolioItems.length,
  featuredPortfolioItemIds: [],
  portfolioItems,
  caseStudies: []
});

const writePortfolioEvidenceSite = async ({
  sourceItems = [validSourceItem],
  catalogItems = [validCatalogItem],
  aiContextItems = [validAiContextItem],
  existingAssets = [validSourceItem.image.src, validSourceItem.sourceArtifact]
} = {}) => {
  tempRoot = await mkdtemp(path.join(os.tmpdir(), 'portfolio-evidence-validation-'));
  await mkdir(path.join(tempRoot, 'assets', 'data'), { recursive: true });
  await Promise.all([
    writeFile(
      path.join(tempRoot, 'assets', 'data', 'portfolio-source.json'),
      JSON.stringify(createPortfolioSource(sourceItems))
    ),
    writeFile(
      path.join(tempRoot, 'assets', 'data', 'portfolio-proof-points.json'),
      JSON.stringify({ practiceAreaDefaults: {}, itemOverrides: {} })
    ),
    writeFile(
      path.join(tempRoot, 'assets', 'data', 'portfolio-items.json'),
      JSON.stringify({ portfolioItems: catalogItems })
    ),
    writeFile(
      path.join(tempRoot, 'assets', 'data', 'portfolio-ai-context.json'),
      JSON.stringify({ portfolioItems: aiContextItems })
    )
  ]);
  for (const assetPath of existingAssets) {
    const absolutePath = path.join(tempRoot, assetPath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, 'fixture');
  }
  return tempRoot;
};

describe('Portfolio Evidence Validation', () => {
  test('keeps source/catalog drift and Proof Point coverage failures local to the module', async () => {
    const secondSourceItem = {
      ...validSourceItem,
      id: 'second-item',
      title: 'Second Item',
      portfolioItemUrl: 'portfolio.html#second-item'
    };
    const root = await writePortfolioEvidenceSite({
      sourceItems: [validSourceItem, secondSourceItem],
      catalogItems: [
        {
          id: 'other-item',
          title: 'Other Item',
          practiceArea: 'Learning Materials',
          description: 'Missing evidence fields.',
          sourceArtifact: 'assets/pdf/portfolio/missing.pdf',
          image: { src: '../outside.webp' },
          proof: {
            impact: [
              { claim: 'Unsupported broad result.', confidence: 'inferred' },
              { confidence: 'direct' }
            ]
          }
        }
      ],
      existingAssets: []
    });

    const result = await validatePortfolioEvidence({ root });

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
    const root = await writePortfolioEvidenceSite({
      sourceItems: [],
      catalogItems: [],
      aiContextItems: [],
      existingAssets: []
    });

    const result = await validatePortfolioEvidence({ root });

    expect(result.failures).toEqual([
      'assets/data/portfolio-source.json: expected at least one Portfolio Item source record',
      'assets/data/portfolio-items.json: expected at least one portfolio item'
    ]);
  });

  test('keeps sourceArtifact validation tied to the Shipped Artifact Policy', async () => {
    const sourceArtifact = 'assets/spreadsheets/portfolio/source-workbook.xlsx';
    const deniedSourceItem = {
      ...validSourceItem,
      sourceArtifact,
      sourceType: 'xlsx'
    };
    const root = await writePortfolioEvidenceSite({
      sourceItems: [deniedSourceItem],
      catalogItems: [{ ...validCatalogItem, sourceArtifact, sourceType: 'xlsx' }],
      existingAssets: [validSourceItem.image.src, sourceArtifact]
    });

    const result = await validatePortfolioEvidence({ root });

    expect(result.failures).toContain(
      'assets/data/portfolio-items.json: portfolio item 1 references a denied shipped Artifact source type: assets/spreadsheets/portfolio/source-workbook.xlsx'
    );
  });

  test('keeps AI-context Outcome Evidence directness local to the module', async () => {
    const root = await writePortfolioEvidenceSite({
      aiContextItems: [
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
        { id: 'extra-context-item', aiContext: {} }
      ]
    });

    const result = await validatePortfolioEvidence({ root });

    expect(result.failures).toContain('Portfolio Item catalog/AI context count mismatch: catalog=1, aiContext=2');
    expect(result.failures).toContain('assets/data/portfolio-ai-context.json: portfolio item 1 Outcome Evidence 2 must be a direct Proof Point impact entry');
    expect(result.failures).toContain('assets/data/portfolio-ai-context.json: portfolio item 1 Outcome Evidence 3 must be a direct Proof Point impact entry');
    expect(result.failures).toContain('assets/data/portfolio-ai-context.json: portfolio item 1 aiHint must be labeled as an inferred non-proof drafting hint');
    expect(result.failures).toContain('assets/data/portfolio-ai-context.json: portfolio item 2 is missing aiContext.outcomeEvidence array');
  });
});
