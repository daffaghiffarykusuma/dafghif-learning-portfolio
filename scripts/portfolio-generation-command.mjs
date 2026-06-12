import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createPortfolioEvidenceWorkflow } from './portfolio-evidence-workflow.mjs';
import { assertValidPortfolioItemSource } from './portfolio-item-source-validator.mjs';

const defaultPaths = Object.freeze({
  portfolioHtml: 'portfolio.html',
  portfolioSource: 'assets/data/portfolio-source.json',
  proofPoints: 'assets/data/portfolio-proof-points.json',
  catalogOutput: 'assets/data/portfolio-items.json',
  aiContextOutput: 'assets/data/portfolio-ai-context.json'
});

const readJson = async (rootDir, relPath) =>
  JSON.parse(await readFile(path.join(rootDir, relPath), 'utf8'));

const writeText = async (rootDir, relPath, contents) => {
  const outputPath = path.join(rootDir, relPath);
  const outputDir = path.dirname(outputPath);
  if (path.resolve(outputDir) !== path.resolve(rootDir)) {
    const existing = await stat(outputDir).catch(() => null);
    if (!existing?.isDirectory()) {
      await mkdir(outputDir, { recursive: true });
    }
  }
  await writeFile(outputPath, contents, 'utf8');
};

export const runPortfolioEvidenceWorkflow = async (options = {}) => {
  const {
    rootDir = process.cwd(),
    paths = defaultPaths,
    generatedAt = new Date().toISOString(),
    ...unsupportedOptions
  } = options;
  const unsupportedOptionNames = Object.keys(unsupportedOptions);
  if (unsupportedOptionNames.length > 0) {
    throw new TypeError(
      `Unsupported Portfolio Evidence Workflow option(s): ${unsupportedOptionNames.join(', ')}. Generation always writes the complete output set.`
    );
  }

  const resolvedPaths = { ...defaultPaths, ...paths };
  const html = await readFile(path.join(rootDir, resolvedPaths.portfolioHtml), 'utf8');
  const portfolioSource = await readJson(rootDir, resolvedPaths.portfolioSource);
  const proofSource = await readJson(rootDir, resolvedPaths.proofPoints);
  assertValidPortfolioItemSource({ portfolioSource, proofSource });
  const workflow = createPortfolioEvidenceWorkflow({
    portfolioHtml: html,
    portfolioSource,
    proofSource,
    generatedFrom: resolvedPaths.portfolioSource,
    catalogGeneratedFrom: resolvedPaths.catalogOutput,
    generatedAt
  });

  for (const output of workflow.outputs) {
    await writeText(rootDir, output.outputPath || resolvedPaths[output.pathKey], output.contents);
  }

  return workflow.summary;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await runPortfolioEvidenceWorkflow();
  console.log(`Rendered ${result.renderedPortfolioItemCount} portfolio item cards in ${defaultPaths.portfolioHtml}`);
  console.log(`Generated ${result.catalogPortfolioItemCount} portfolio item records at ${defaultPaths.catalogOutput}`);
  console.log(`Generated ${result.aiContextPortfolioItemCount} portfolio item records at ${defaultPaths.aiContextOutput}`);
  console.log(`Generated ${result.caseStudyPageCount} case study pages`);
}
