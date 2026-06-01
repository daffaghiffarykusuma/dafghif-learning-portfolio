import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  createPortfolioEvidenceWorkflow,
  selectPortfolioEvidenceWorkflowOutputs
} from './portfolio-evidence-workflow.mjs';

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

export const runPortfolioEvidenceGeneration = async ({
  rootDir = process.cwd(),
  paths = defaultPaths,
  generatedAt = new Date().toISOString(),
  writePortfolioHtml = true,
  writeCatalog = true,
  writeAiContext = true,
  writeCaseStudies = true
} = {}) => {
  const resolvedPaths = { ...defaultPaths, ...paths };
  const html = await readFile(path.join(rootDir, resolvedPaths.portfolioHtml), 'utf8');
  const portfolioSource = await readJson(rootDir, resolvedPaths.portfolioSource);
  const proofSource = await readJson(rootDir, resolvedPaths.proofPoints);
  const workflow = createPortfolioEvidenceWorkflow({
    portfolioHtml: html,
    portfolioSource,
    proofSource,
    generatedFrom: resolvedPaths.portfolioSource,
    catalogGeneratedFrom: resolvedPaths.catalogOutput,
    generatedAt
  });

  const outputs = selectPortfolioEvidenceWorkflowOutputs(workflow.outputs, {
    writePortfolioHtml,
    writeCatalog,
    writeAiContext,
    writeCaseStudies
  });
  for (const output of outputs) {
    await writeText(rootDir, output.outputPath || resolvedPaths[output.pathKey], output.contents);
  }

  return workflow.summary;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await runPortfolioEvidenceGeneration();
  console.log(`Rendered ${result.renderedPortfolioItemCount} portfolio item cards in ${defaultPaths.portfolioHtml}`);
  console.log(`Generated ${result.catalogPortfolioItemCount} portfolio item records at ${defaultPaths.catalogOutput}`);
  console.log(`Generated ${result.aiContextPortfolioItemCount} portfolio item records at ${defaultPaths.aiContextOutput}`);
  console.log(`Generated ${result.caseStudyPageCount} case study pages`);
}
