import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createPortfolioEvidenceWorkflow } from './portfolio-evidence-workflow.ts';
import type { PortfolioEvidenceWorkflowSummary } from './portfolio-evidence-workflow.ts';

type PortfolioEvidencePaths = {
  portfolioHtml: string;
  portfolioSource: string;
  proofPoints: string;
  catalogOutput: string;
  aiContextOutput: string;
};

type RunPortfolioEvidenceWorkflowOptions = {
  rootDir?: string;
  paths?: Partial<PortfolioEvidencePaths>;
  generatedAt?: string;
  [key: string]: unknown;
};

const defaultPaths: Readonly<PortfolioEvidencePaths> = Object.freeze({
  portfolioHtml: 'portfolio.html',
  portfolioSource: 'assets/data/portfolio-source.json',
  proofPoints: 'assets/data/portfolio-proof-points.json',
  catalogOutput: 'assets/data/portfolio-items.json',
  aiContextOutput: 'assets/data/portfolio-ai-context.json'
});

const readJson = async (rootDir: string, relPath: string): Promise<unknown> =>
  JSON.parse(await readFile(path.join(rootDir, relPath), 'utf8'));

const writeText = async (rootDir: string, relPath: string, contents: string) => {
  const outputPath = path.join(rootDir, relPath);
  try {
    await mkdir(path.dirname(outputPath), { recursive: true });
  } catch (error) {
    if (
      error === null
      || typeof error !== 'object'
      || !('code' in error)
      || error.code !== 'EEXIST'
    ) throw error;
  }
  await writeFile(outputPath, contents, 'utf8');
};

export const runPortfolioEvidenceWorkflow = async (
  options: RunPortfolioEvidenceWorkflowOptions = {}
): Promise<PortfolioEvidenceWorkflowSummary> => {
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
  const workflow = createPortfolioEvidenceWorkflow({
    portfolioHtml: html,
    portfolioSource,
    proofSource,
    generatedFrom: resolvedPaths.portfolioSource,
    catalogGeneratedFrom: resolvedPaths.catalogOutput,
    generatedAt
  });

  for (const output of workflow.outputs) {
    const outputPath = 'outputPath' in output
      ? output.outputPath
      : resolvedPaths[output.pathKey];
    await writeText(rootDir, outputPath, output.contents);
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
