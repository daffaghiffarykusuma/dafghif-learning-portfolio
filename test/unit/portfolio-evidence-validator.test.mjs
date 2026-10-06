import { afterEach, describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { validatePortfolioEvidence } from '../../scripts/validation/portfolio-evidence-validator.ts';
import { createPortfolioEvidenceWorkflow } from '../../scripts/portfolio/portfolio-evidence-workflow.ts';

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
  title: validCatalogItem.title,
  practiceArea: validCatalogItem.practiceArea,
  tags: validCatalogItem.tags,
  publicDescription: validCatalogItem.description,
  sourceArtifact: validCatalogItem.sourceArtifact,
  aiContext: {
    aiHint: { evidenceLevel: 'inferred non-proof drafting hint' },
    proof: validCatalogItem.proof,
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
      JSON.stringify({
        practiceAreaDefaults: {},
        itemOverrides: sourceItems.some((item) => item.id === validSourceItem.id)
          ? { [validSourceItem.id]: validCatalogItem.proof }
          : {}
      })
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
  test('accepts matching source facts regardless of JSON property order or inferred drafting text', async () => {
    const aiItem = structuredClone(validAiContextItem);
    aiItem.aiContext.role = 'Editable inferred role';
    aiItem.aiContext.outcomeEvidence = aiItem.aiContext.outcomeEvidence.map(
      (entry) => Object.fromEntries(Object.entries(entry).reverse())
    );
    const root = await writePortfolioEvidenceSite({ aiContextItems: [aiItem] });

    expect(await validatePortfolioEvidence({ root })).toEqual({
      failures: [], portfolioItemCount: 1, portfolioSourceItemCount: 1
    });
  });

  test('rejects generated factual drift even when catalog and AI context agree with each other', async () => {
    const root = await writePortfolioEvidenceSite();
    const catalog = structuredClone(validCatalogItem);
    const aiItem = structuredClone(validAiContextItem);
    catalog.title = aiItem.title = 'Changed generated title';
    catalog.tags = aiItem.tags = ['invented-tag'];
    catalog.image.alt = 'Changed generated thumbnail description';
    catalog.audience = 'Unsupported audience';
    catalog.proof.impact[0].claim = 'Invented outcome';
    aiItem.aiContext.proof = catalog.proof;
    aiItem.aiContext.outcomeEvidence = catalog.proof.impact;
    await writeFile(path.join(root, 'assets/data/portfolio-items.json'), JSON.stringify({ portfolioItems: [catalog] }));
    await writeFile(path.join(root, 'assets/data/portfolio-ai-context.json'), JSON.stringify({ portfolioItems: [aiItem] }));

    const { failures } = await validatePortfolioEvidence({ root });
    for (const field of ['title', 'tags', 'image', 'audience', 'proof']) {
      expect(failures).toContain(`assets/data/portfolio-items.json: portfolio item 1 ${field} does not match Validated Portfolio Item Source`);
    }
    for (const field of ['title', 'tags', 'aiContext.proof', 'aiContext.outcomeEvidence']) {
      expect(failures).toContain(`assets/data/portfolio-ai-context.json: portfolio item 1 ${field} does not match Validated Portfolio Item Source`);
    }
  });

  test.each([
    ['invented claim', [{ claim: 'Invented outcome', sourceBasis: 'artifact', confidence: 'direct' }]],
    ['changed attribution', [{ ...validCatalogItem.proof.impact[0], sourceBasis: 'invented source' }]],
    ['missing claim', []],
    ['duplicate claim', [...validCatalogItem.proof.impact, ...validCatalogItem.proof.impact]]
  ])('rejects %s in generated Outcome Evidence', async (_name, outcomeEvidence) => {
    const aiItem = structuredClone(validAiContextItem);
    aiItem.aiContext.outcomeEvidence = outcomeEvidence;
    const root = await writePortfolioEvidenceSite({ aiContextItems: [aiItem] });

    expect((await validatePortfolioEvidence({ root })).failures).toContain(
      'assets/data/portfolio-ai-context.json: portfolio item 1 aiContext.outcomeEvidence does not match Validated Portfolio Item Source'
    );
  });

  test.each(['reordered', 'duplicate', 'unknown', 'missing'])('rejects %s AI-context identities independently of item counts', async (mutation) => {
    const secondSource = { ...validSourceItem, id: 'second-item', title: 'Second item' };
    const secondProof = { ...validCatalogItem.proof, impact: [] };
    const secondCatalog = { ...secondSource, proof: secondProof };
    const secondAi = {
      ...validAiContextItem, id: secondSource.id, title: secondSource.title,
      aiContext: { ...validAiContextItem.aiContext, proof: secondProof, outcomeEvidence: [] }
    };
    const aiItems = structuredClone([validAiContextItem, secondAi]);
    if (mutation === 'reordered') aiItems.reverse();
    if (mutation === 'duplicate') aiItems[1] = structuredClone(aiItems[0]);
    if (mutation === 'unknown') aiItems[1].id = 'unknown-item';
    if (mutation === 'missing') aiItems.pop();
    const root = await writePortfolioEvidenceSite({
      sourceItems: [validSourceItem, secondSource],
      catalogItems: [validCatalogItem, secondCatalog], aiContextItems: aiItems
    });
    await writeFile(path.join(root, 'assets/data/portfolio-proof-points.json'), JSON.stringify({
      practiceAreaDefaults: { 'Learning Materials': secondProof },
      itemOverrides: { [validSourceItem.id]: validCatalogItem.proof }
    }));

    expect((await validatePortfolioEvidence({ root })).failures).toContain(
      'Portfolio Item source/AI context id order mismatch; regenerate AI context from assets/data/portfolio-source.json'
    );
  });

  test('checks generated Case Study facts and nested Artifacts against the validated publication', async () => {
    const root = await writePortfolioEvidenceSite();
    const source = createPortfolioSource([validSourceItem]);
    source.caseStudies = [{
      id: 'case-deck', title: 'Deck Case', practiceArea: 'Learning Materials',
      portfolioItemTitle: 'Deck Case Study', pagePath: 'case-deck.html',
      outputPath: 'assets/portfolio-viewers/case-deck.html', reviewerContext: [], caseFlow: [],
      description: 'A deck case.', summary: 'Source evidence.', image: validSourceItem.image,
      artifacts: [{
        id: 'deck-artifact', title: 'Deck Artifact', description: 'Roleplay prompts.',
        href: validSourceItem.sourceArtifact, sourceType: 'pdf',
        practiceArea: 'Learning Materials', tags: ['learning-materials'], image: validSourceItem.image
      }]
    }];
    source.featuredPortfolioItemIds = ['case-deck', validSourceItem.id];
    const proofSource = {
      practiceAreaDefaults: { 'Learning Materials': validCatalogItem.proof },
      itemOverrides: { [validSourceItem.id]: validCatalogItem.proof }
    };
    const workflow = createPortfolioEvidenceWorkflow({
      portfolioHtml: '<html><body><div class="portfolio-items-grid"></div></body></html>',
      portfolioSource: source, proofSource, generatedFrom: 'assets/data/portfolio-source.json'
    });
    await writeFile(path.join(root, 'assets/data/portfolio-source.json'), JSON.stringify(source));
    await writeFile(path.join(root, 'assets/data/portfolio-proof-points.json'), JSON.stringify(proofSource));
    for (const output of workflow.outputs) {
      const target = output.outputPath || {
        portfolioHtml: 'portfolio.html', catalogOutput: 'assets/data/portfolio-items.json',
        aiContextOutput: 'assets/data/portfolio-ai-context.json'
      }[output.pathKey];
      await mkdir(path.dirname(path.join(root, target)), { recursive: true });
      await writeFile(path.join(root, target), output.contents);
    }
    expect((await validatePortfolioEvidence({ root })).failures).toEqual([]);

    const aiPath = path.join(root, 'assets/data/portfolio-ai-context.json');
    const ai = JSON.parse(await readFile(aiPath, 'utf8'));
    ai.portfolioItems[0].caseStudyArtifacts[0].publicDescription = 'Unsupported description';
    await writeFile(aiPath, JSON.stringify(ai));
    expect((await validatePortfolioEvidence({ root })).failures).toEqual([
      'assets/data/portfolio-ai-context.json: portfolio item 1 caseStudyArtifacts does not match Validated Portfolio Item Source'
    ]);
  });

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
      'assets/data/portfolio-items.json: portfolio item 1 impact proof 2 must be a direct, explicitly supported claim',
      'Portfolio Item source/AI context id order mismatch; regenerate AI context from assets/data/portfolio-source.json'
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
