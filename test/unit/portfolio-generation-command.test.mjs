import { afterEach, describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { runPortfolioEvidenceWorkflow } from '../../scripts/portfolio-generation-command.mjs';
import {
  createPortfolioEvidenceWorkflow,
  portfolioEvidenceWorkflowOutputTypes
} from '../../scripts/portfolio-evidence-workflow.mjs';

let tempRoot = null;

afterEach(async () => {
  if (tempRoot) {
    await rm(tempRoot, { recursive: true, force: true });
    tempRoot = null;
  }
});

describe('Portfolio generation command', () => {
  test('plans Portfolio Evidence Workflow outputs before file writing', () => {
    const workflow = createPortfolioEvidenceWorkflow({
      portfolioHtml: `<!doctype html><html><body><div class="portfolio-items-grid"></div></body></html>`,
      portfolioSource: {
        portfolioItems: [
          {
            id: 'sample-deck',
            title: 'Sample Deck',
            practiceArea: 'Learning Materials',
            tags: ['learning-materials'],
            description: 'A generated deck.',
            image: { src: 'assets/images/portfolio/sample.webp', alt: 'Sample thumbnail' },
            sourceArtifact: 'assets/pdf/portfolio/sample.pdf',
            sourceType: 'pdf',
            portfolioItemUrl: 'portfolio.html#sample-deck',
            discussUrl: 'contact.html?portfolioItem=Sample%20Deck'
          }
        ],
        caseStudies: [
          {
            id: 'case-sample-deck',
            title: 'Sample Deck Case',
            portfolioItemTitle: 'Sample Deck Case Study',
            practiceArea: 'Learning Materials',
            description: 'Combines the generated deck into one case.',
            image: { src: 'assets/images/portfolio/case-sample.webp', alt: 'Case sample thumbnail' },
            summary: 'Shows the deck as a case.',
            pagePath: 'case-sample-deck.html',
            outputPath: 'assets/portfolio-viewers/case-sample-deck.html',
            reviewerContext: [],
            caseFlow: [],
            artifacts: []
          }
        ]
      },
      proofSource: {
        practiceAreaDefaults: {
          'Learning Materials': {
            visibleProofLine: 'Converts concepts into facilitator-ready learning material.'
          }
        }
      },
      generatedFrom: 'assets/data/portfolio-source.json',
      catalogGeneratedFrom: 'assets/data/custom-catalog.json',
      generatedAt: '2026-05-27T00:00:00.000Z'
    });

    expect(workflow.summary).toEqual({
      renderedPortfolioItemCount: 2,
      catalogPortfolioItemCount: 2,
      aiContextPortfolioItemCount: 2,
      caseStudyPageCount: 2
    });
    expect(workflow.outputs.map((output) => output.type)).toEqual([
      portfolioEvidenceWorkflowOutputTypes.portfolioHtml,
      portfolioEvidenceWorkflowOutputTypes.catalogJson,
      portfolioEvidenceWorkflowOutputTypes.caseStudyHtml,
      portfolioEvidenceWorkflowOutputTypes.caseStudyHtml,
      portfolioEvidenceWorkflowOutputTypes.aiContextJson
    ]);
    expect(workflow.outputs.find((output) => output.pathKey === 'portfolioHtml').contents).toContain('Sample Deck');
    expect(workflow.outputs.find((output) => output.pathKey === 'catalogOutput').contents).toContain('"generatedFrom": "assets/data/portfolio-source.json"');
    expect(workflow.outputs.find((output) => output.pathKey === 'aiContextOutput').contents).toContain('"generatedFrom": "assets/data/custom-catalog.json"');
    expect(workflow.outputs.find((output) => output.outputPath === 'case-sample-deck.html').contents).toContain('<h1>Sample Deck Case</h1>');
  });

  test('writes all Portfolio Evidence Workflow outputs from one interface', async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), 'portfolio-generation-'));
    await mkdir(path.join(tempRoot, 'assets', 'data'), { recursive: true });
    await writeFile(path.join(tempRoot, 'portfolio.html'), `<!doctype html><html><body>
      <div class="portfolio-items-grid"></div>
    </body></html>`, 'utf8');
    await writeFile(path.join(tempRoot, 'assets', 'data', 'portfolio-proof-points.json'), JSON.stringify({
      practiceAreaDefaults: {
        'Learning Materials': {
          visibleProofLine: 'Converts concepts into facilitator-ready learning material.'
        }
      }
    }), 'utf8');
    await writeFile(path.join(tempRoot, 'assets', 'data', 'portfolio-source.json'), JSON.stringify({
      schemaVersion: 1,
      portfolioItemCount: 1,
      portfolioItems: [
        {
          id: 'sample-deck',
          title: 'Sample Deck',
          practiceArea: 'Learning Materials',
          tags: ['learning-materials'],
          description: 'A generated deck.',
          image: { src: 'assets/images/portfolio/sample.webp', alt: 'Sample thumbnail' },
          sourceArtifact: 'assets/pdf/portfolio/sample.pdf',
          sourceType: 'pdf',
          portfolioItemUrl: 'portfolio.html#sample-deck',
          discussUrl: 'contact.html?portfolioItem=Sample%20Deck'
        }
      ],
      caseStudies: [
        {
          id: 'case-sample-deck',
          title: 'Sample Deck Case',
          portfolioItemTitle: 'Sample Deck Case Study',
          practiceArea: 'Learning Materials',
          description: 'Combines the generated deck into one case.',
          image: { src: 'assets/images/portfolio/case-sample.webp', alt: 'Case sample thumbnail' },
          summary: 'Shows the deck as a case.',
          pagePath: 'case-sample-deck.html',
          outputPath: 'assets/portfolio-viewers/case-sample-deck.html',
          reviewerContext: [],
          caseFlow: [],
          artifacts: []
        }
      ]
    }), 'utf8');

    const result = await runPortfolioEvidenceWorkflow({
      rootDir: tempRoot,
      generatedAt: '2026-05-27T00:00:00.000Z'
    });

    const portfolioHtml = await readFile(path.join(tempRoot, 'portfolio.html'), 'utf8');
    const catalog = JSON.parse(await readFile(path.join(tempRoot, 'assets', 'data', 'portfolio-items.json'), 'utf8'));
    const aiContext = JSON.parse(await readFile(path.join(tempRoot, 'assets', 'data', 'portfolio-ai-context.json'), 'utf8'));
    const caseStudyHtml = await readFile(path.join(tempRoot, 'case-sample-deck.html'), 'utf8');

    expect(result).toEqual({
      renderedPortfolioItemCount: 2,
      catalogPortfolioItemCount: 2,
      aiContextPortfolioItemCount: 2,
      caseStudyPageCount: 2
    });
    expect(portfolioHtml).toContain('Sample Deck');
    expect(portfolioHtml).toContain('Sample Deck Case Study');
    expect(catalog.generatedAt).toBe('2026-05-27T00:00:00.000Z');
    expect(aiContext.generatedFrom).toBe('assets/data/portfolio-items.json');
    expect(caseStudyHtml).toContain('<h1>Sample Deck Case</h1>');
  });

  test('validates Portfolio Item Source inputs before writing any outputs', async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), 'portfolio-generation-invalid-'));
    await mkdir(path.join(tempRoot, 'assets', 'data'), { recursive: true });
    await writeFile(path.join(tempRoot, 'portfolio.html'), 'unchanged portfolio', 'utf8');
    await writeFile(path.join(tempRoot, 'assets', 'data', 'portfolio-items.json'), 'unchanged catalog', 'utf8');
    await writeFile(path.join(tempRoot, 'assets', 'data', 'portfolio-proof-points.json'), JSON.stringify({
      practiceAreaDefaults: {
        'Learning Materials': {
          visibleProofLine: 'Converts concepts into facilitator-ready learning material.'
        }
      }
    }), 'utf8');
    await writeFile(path.join(tempRoot, 'assets', 'data', 'portfolio-source.json'), JSON.stringify({
      schemaVersion: 1,
      portfolioItemCount: 2,
      portfolioItems: [
        {
          id: 'sample-deck',
          title: 'Sample Deck',
          practiceArea: 'Learning Materials',
          tags: ['learning-materials'],
          description: 'A generated deck.',
          image: { src: 'assets/images/portfolio/sample.webp', alt: 'Sample thumbnail' },
          sourceArtifact: 'assets/pdf/portfolio/sample.pdf',
          sourceType: 'pdf',
          portfolioItemUrl: 'portfolio.html#sample-deck',
          discussUrl: 'contact.html?portfolioItem=Sample%20Deck'
        }
      ],
      caseStudies: []
    }), 'utf8');

    await expect(runPortfolioEvidenceWorkflow({ rootDir: tempRoot }))
      .rejects.toThrow('portfolioItemCount must equal raw portfolioItems length');
    expect(await readFile(path.join(tempRoot, 'portfolio.html'), 'utf8')).toBe('unchanged portfolio');
    expect(await readFile(path.join(tempRoot, 'assets', 'data', 'portfolio-items.json'), 'utf8')).toBe('unchanged catalog');
  });

  test('rejects legacy partial-write options before reading or writing files', async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), 'portfolio-generation-options-'));
    await expect(runPortfolioEvidenceWorkflow({
      rootDir: tempRoot,
      writeCatalog: false
    })).rejects.toThrow(
      'Unsupported Portfolio Evidence Workflow option(s): writeCatalog. Generation always writes the complete output set.'
    );
  });
});
