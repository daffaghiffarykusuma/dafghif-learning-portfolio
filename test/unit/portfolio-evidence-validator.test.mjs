import { afterEach, describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { validatePortfolioEvidence } from '../../scripts/validation/portfolio-evidence-validator.ts';
import { runPortfolioEvidenceWorkflow } from '../../scripts/portfolio-generation-command.ts';

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
  portfolioItemUrl: 'portfolio.html#custom-deck'
};

const validProof = {
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
};

const caseStudy = {
  id: 'case-deck', title: 'Deck Case', practiceArea: 'Learning Materials',
  portfolioItemTitle: 'Deck Case Study', pagePath: 'case-deck.html',
  reviewerContext: [], caseFlow: [],
  description: 'A deck case.', summary: 'Source evidence.', image: validSourceItem.image,
  artifacts: [{
    id: 'deck-artifact', title: 'Deck Artifact', description: 'Roleplay prompts.',
    href: validSourceItem.sourceArtifact, sourceType: 'pdf',
    practiceArea: 'Learning Materials', tags: ['learning-materials'], image: validSourceItem.image
  }]
};

const createPortfolioSource = (portfolioItems, caseStudies = []) => ({
  schemaVersion: 1,
  portfolioItemCount: portfolioItems.length,
  featuredPortfolioItemIds: [],
  portfolioItems,
  caseStudies
});

const portfolioPageSource = `<!--site-page
{ "kind": "portfolio", "title": "Portfolio", "description": "Portfolio Items." }
-->
<main id="main-content"><div class="portfolio-items-grid"></div></main>
`;

const catalogPath = 'assets/data/portfolio-items.json';
const aiContextPath = 'assets/data/portfolio-ai-context.json';

// Writes source inputs and assets, then the real generated outputs.
const writePortfolioEvidenceSite = async ({
  sourceItems = [validSourceItem],
  caseStudies = [],
  existingAssets = [validSourceItem.image.src, validSourceItem.sourceArtifact]
} = {}) => {
  tempRoot = await mkdtemp(path.join(os.tmpdir(), 'portfolio-evidence-validation-'));
  await mkdir(path.join(tempRoot, 'assets', 'data'), { recursive: true });
  await mkdir(path.join(tempRoot, 'page-sources'), { recursive: true });
  await Promise.all([
    writeFile(path.join(tempRoot, 'page-sources', 'portfolio.html'), portfolioPageSource),
    writeFile(
      path.join(tempRoot, 'assets', 'data', 'portfolio-source.json'),
      JSON.stringify(createPortfolioSource(sourceItems, caseStudies))
    ),
    writeFile(
      path.join(tempRoot, 'assets', 'data', 'portfolio-proof-points.json'),
      JSON.stringify({
        practiceAreaDefaults: { 'Learning Materials': { ...validProof, impact: [] } },
        itemOverrides: sourceItems.some((item) => item.id === validSourceItem.id)
          ? { [validSourceItem.id]: validProof }
          : {}
      })
    )
  ]);
  for (const assetPath of existingAssets) {
    const absolutePath = path.join(tempRoot, assetPath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, 'fixture');
  }
  await runPortfolioEvidenceWorkflow({ rootDir: tempRoot, generatedAt: '2026-11-18T00:00:00.000Z' });
  return tempRoot;
};

const editJson = async (root, relPath, edit) => {
  const filePath = path.join(root, relPath);
  const data = JSON.parse(await readFile(filePath, 'utf8'));
  edit(data);
  await writeFile(filePath, JSON.stringify(data, null, 2));
};

const deck = (data) => data.portfolioItems.find((item) => item.id === validSourceItem.id);
const staleFailure = (relPath) => `${relPath} is stale; run bun run generate:portfolio`;

describe('Portfolio Evidence Validation', () => {
  test('accepts freshly generated outputs, including Windows line endings', async () => {
    const root = await writePortfolioEvidenceSite({ caseStudies: [caseStudy] });
    expect(await validatePortfolioEvidence({ root })).toEqual({
      failures: [], portfolioItemCount: 2, portfolioSourceItemCount: 2
    });

    const casePagePath = path.join(root, 'case-deck.html');
    await writeFile(casePagePath, (await readFile(casePagePath, 'utf8')).replace(/\n/g, '\r\n'));
    expect((await validatePortfolioEvidence({ root })).failures).toEqual([]);
  });

  test.each([
    [catalogPath, (data) => { data.portfolioItems[0].title = 'Changed generated title'; }],
    [catalogPath, (data) => { deck(data).proof.impact[0].claim = 'Invented outcome'; }],
    [aiContextPath, (data) => { deck(data).aiContext.outcomeEvidence[0].sourceBasis = 'invented source'; }],
    [aiContextPath, (data) => { data.portfolioItems.reverse(); }],
    [aiContextPath, (data) => { data.portfolioItems[0].caseStudyArtifacts[0].publicDescription = 'Unsupported description'; }],
    [aiContextPath, (data) => { data.generatedAt = '2030-01-01T00:00:00.000Z'; }]
  ])('reports a hand edit to %s as stale', async (relPath, edit) => {
    const root = await writePortfolioEvidenceSite({ caseStudies: [caseStudy] });
    await editJson(root, relPath, edit);
    expect((await validatePortfolioEvidence({ root })).failures).toEqual([staleFailure(relPath)]);
  });

  test.each(['portfolio.html', 'case-deck.html', 'case-studies.html'])('reports a hand edit to generated %s as stale', async (page) => {
    const root = await writePortfolioEvidenceSite({ caseStudies: [caseStudy] });
    const pagePath = path.join(root, page);
    await writeFile(pagePath, (await readFile(pagePath, 'utf8')).replace('</main>', '<p>Hand edit</p></main>'));
    expect((await validatePortfolioEvidence({ root })).failures).toEqual([staleFailure(page)]);
  });

  test('skips freshness while the source itself is invalid', async () => {
    const root = await writePortfolioEvidenceSite();
    await editJson(root, 'assets/data/portfolio-source.json', (data) => { data.portfolioItemCount = 5; });
    expect((await validatePortfolioEvidence({ root })).failures).toEqual([
      'assets/data/portfolio-source.json: portfolioItemCount must equal raw portfolioItems length; declared=5, actual=1'
    ]);
  });

  test('keeps asset and Proof Point coverage failures local to the module', async () => {
    const root = await writePortfolioEvidenceSite({ existingAssets: [] });
    await editJson(root, catalogPath, (data) => {
      data.portfolioItems = [{
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
      }];
    });

    expect((await validatePortfolioEvidence({ root })).failures).toEqual([
      'assets/data/portfolio-items.json: portfolio item 1 references asset outside the project root: ../outside.webp',
      'assets/data/portfolio-items.json: portfolio item 1 references missing asset: assets/pdf/portfolio/missing.pdf',
      'assets/data/portfolio-items.json: portfolio item 1 is missing proof.visibleProofLine',
      'assets/data/portfolio-items.json: portfolio item 1 is missing proof.workQuality evidence',
      'assets/data/portfolio-items.json: portfolio item 1 impact proof 1 must be a direct, explicitly supported claim',
      'assets/data/portfolio-items.json: portfolio item 1 impact proof 2 must be a direct, explicitly supported claim',
      staleFailure(catalogPath)
    ]);
  });

  test('reports empty source and catalog inputs with existing validation wording', async () => {
    const root = await writePortfolioEvidenceSite({ sourceItems: [], existingAssets: [] });

    expect((await validatePortfolioEvidence({ root })).failures).toEqual([
      'assets/data/portfolio-source.json: expected at least one Portfolio Item source record',
      'assets/data/portfolio-items.json: expected at least one portfolio item'
    ]);
  });

  test('keeps sourceArtifact validation tied to the Shipped Artifact Policy', async () => {
    const sourceArtifact = 'assets/spreadsheets/portfolio/source-workbook.xlsx';
    const root = await writePortfolioEvidenceSite({
      sourceItems: [{ ...validSourceItem, sourceArtifact, sourceType: 'xlsx' }],
      existingAssets: [validSourceItem.image.src, sourceArtifact]
    });

    expect((await validatePortfolioEvidence({ root })).failures).toEqual([
      'assets/data/portfolio-items.json: portfolio item 1 references a denied shipped Artifact source type: assets/spreadsheets/portfolio/source-workbook.xlsx'
    ]);
  });

  test('keeps AI-context Outcome Evidence directness local to the module', async () => {
    const root = await writePortfolioEvidenceSite();
    await editJson(root, aiContextPath, (data) => {
      data.portfolioItems = [
        {
          id: validSourceItem.id,
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
      ];
    });

    const { failures } = await validatePortfolioEvidence({ root });
    expect(failures).toContain('assets/data/portfolio-ai-context.json: portfolio item 1 Outcome Evidence 2 must be a direct Proof Point impact entry');
    expect(failures).toContain('assets/data/portfolio-ai-context.json: portfolio item 1 Outcome Evidence 3 must be a direct Proof Point impact entry');
    expect(failures).toContain('assets/data/portfolio-ai-context.json: portfolio item 1 aiHint must be labeled as an inferred non-proof drafting hint');
    expect(failures).toContain('assets/data/portfolio-ai-context.json: portfolio item 2 is missing aiContext.outcomeEvidence array');
    expect(failures).toContain(staleFailure(aiContextPath));
  });
});
