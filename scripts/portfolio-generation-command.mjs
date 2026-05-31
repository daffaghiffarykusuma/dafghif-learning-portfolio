import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createPortfolioAiContextData, createPortfolioEvidencePipeline } from './portfolio-evidence-pipeline.mjs';
import { renderCaseStudyPages } from './case-study-source.mjs';

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
  const pipeline = createPortfolioEvidencePipeline({
    portfolioHtml: html,
    portfolioSource,
    proofSource,
    generatedFrom: resolvedPaths.portfolioSource,
    generatedAt
  });

  const renderedPortfolioItemCount = pipeline.renderPortfolioItems();
  if (writePortfolioHtml) {
    await writeText(rootDir, resolvedPaths.portfolioHtml, pipeline.serializeDocument());
  }

  if (writeCatalog) {
    await writeText(rootDir, resolvedPaths.catalogOutput, `${JSON.stringify(pipeline.catalogData, null, 2)}\n`);
  }

  const caseStudyPages = writeCaseStudies ? renderCaseStudyPages(portfolioSource) : [];
  for (const preview of caseStudyPages) {
    await writeText(rootDir, preview.outputPath, preview.html);
  }

  if (writeAiContext) {
    const aiContextData = createPortfolioAiContextData({
      portfolioSource: pipeline.catalogData,
      caseStudySource: portfolioSource,
      generatedFrom: resolvedPaths.catalogOutput,
      generatedAt
    });
    await writeText(rootDir, resolvedPaths.aiContextOutput, `${JSON.stringify(aiContextData, null, 2)}\n`);
  }

  return {
    renderedPortfolioItemCount,
    catalogPortfolioItemCount: pipeline.portfolioItems.length,
    aiContextPortfolioItemCount: pipeline.portfolioItems.length,
    caseStudyPageCount: caseStudyPages.length
  };
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await runPortfolioEvidenceGeneration();
  console.log(`Rendered ${result.renderedPortfolioItemCount} portfolio item cards in ${defaultPaths.portfolioHtml}`);
  console.log(`Generated ${result.catalogPortfolioItemCount} portfolio item records at ${defaultPaths.catalogOutput}`);
  console.log(`Generated ${result.aiContextPortfolioItemCount} portfolio item records at ${defaultPaths.aiContextOutput}`);
  console.log(`Generated ${result.caseStudyPageCount} case study pages`);
}
