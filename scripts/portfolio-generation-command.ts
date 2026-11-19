import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createPortfolioEvidenceWorkflow } from './portfolio/portfolio-evidence-workflow.ts';
import type { PortfolioEvidenceWorkflowSummary } from './portfolio/portfolio-evidence-workflow.ts';

type PortfolioEvidencePaths = {
  /** Output path of the generated portfolio page. */
  portfolioHtml: string;
  /** Folder of authored Site Page Sources; `portfolio.html` in it is the listing template. */
  sitePageSources: string;
  portfolioSource: string;
  proofPoints: string;
  /** Blog publications rendered into the blog page. */
  publicationSource: string;
  catalogOutput: string;
  aiContextOutput: string;
};

type PortfolioEvidenceOptions = {
  rootDir?: string;
  paths?: Partial<PortfolioEvidencePaths>;
  generatedAt?: string;
  [key: string]: unknown;
};

export type PortfolioEvidenceOutputFile = { path: string; contents: string };

export type PortfolioEvidenceOutputSet = {
  files: PortfolioEvidenceOutputFile[];
  summary: PortfolioEvidenceWorkflowSummary;
};

const defaultPaths: Readonly<PortfolioEvidencePaths> = Object.freeze({
  portfolioHtml: 'portfolio.html',
  sitePageSources: 'page-sources',
  portfolioSource: 'assets/data/portfolio-source.json',
  proofPoints: 'assets/data/portfolio-proof-points.json',
  publicationSource: 'assets/blog.json',
  catalogOutput: 'assets/data/portfolio-items.json',
  aiContextOutput: 'assets/data/portfolio-ai-context.json'
});

const readJson = async (rootDir: string, relPath: string): Promise<unknown> =>
  JSON.parse(await readFile(path.join(rootDir, relPath), 'utf8'));

const writeText = async (rootDir: string, relPath: string, contents: string) => {
  const outputPath = path.join(rootDir, relPath);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, contents, 'utf8');
};

const resolveOptions = (options: PortfolioEvidenceOptions) => {
  const {
    rootDir = process.cwd(),
    paths = {},
    generatedAt = new Date().toISOString(),
    ...unsupportedOptions
  } = options;
  const unsupportedOptionNames = Object.keys(unsupportedOptions);
  if (unsupportedOptionNames.length > 0) {
    throw new TypeError(
      `Unsupported Portfolio Evidence Workflow option(s): ${unsupportedOptionNames.join(', ')}. Generation always writes the complete output set.`
    );
  }
  return { rootDir, paths: { ...defaultPaths, ...paths }, generatedAt };
};

const readSitePageSources = async (rootDir: string, sourceDir: string) => {
  let names: string[];
  try {
    names = (await readdir(path.join(rootDir, sourceDir))).filter((name) => name.endsWith('.html')).sort();
  } catch {
    throw new Error(`${sourceDir}: cannot read the Site Page Source folder`);
  }
  return Promise.all(names.map(async (pagePath) => ({
    pagePath,
    source: await readFile(path.join(rootDir, sourceDir, pagePath), 'utf8')
  })));
};

/** Builds the complete output set in memory, without writing anything. */
export const createPortfolioEvidenceOutputSet = async (
  options: PortfolioEvidenceOptions = {}
): Promise<PortfolioEvidenceOutputSet> => {
  const { rootDir, paths, generatedAt } = resolveOptions(options);
  const pageSources = await readSitePageSources(rootDir, paths.sitePageSources);
  const portfolioPage = pageSources.find((page) => page.pagePath === path.basename(paths.portfolioHtml));
  if (!portfolioPage) throw new Error(`${paths.sitePageSources}: missing the ${path.basename(paths.portfolioHtml)} Site Page Source`);

  const workflow = createPortfolioEvidenceWorkflow({
    portfolioPageSource: portfolioPage.source,
    sitePageSources: pageSources.filter((page) => page !== portfolioPage),
    portfolioSource: await readJson(rootDir, paths.portfolioSource),
    proofSource: await readJson(rootDir, paths.proofPoints),
    // A root without blog data renders an empty blog; site validation requires the file separately.
    publicationSource: await readJson(rootDir, paths.publicationSource).catch((error: NodeJS.ErrnoException) => {
      if (error?.code === 'ENOENT') return { posts: [] };
      throw error;
    }),
    generatedFrom: paths.portfolioSource,
    catalogGeneratedFrom: paths.catalogOutput,
    generatedAt
  });

  return {
    files: workflow.outputs.map((output) => ({
      path: 'outputPath' in output ? output.outputPath : paths[output.pathKey],
      contents: output.contents
    })),
    summary: workflow.summary
  };
};

export const runPortfolioEvidenceWorkflow = async (
  options: PortfolioEvidenceOptions = {}
): Promise<PortfolioEvidenceWorkflowSummary> => {
  const { rootDir } = resolveOptions(options);
  // Building first means invalid source fails before any file is written.
  const outputSet = await createPortfolioEvidenceOutputSet(options);
  for (const file of outputSet.files) await writeText(rootDir, file.path, file.contents);
  return outputSet.summary;
};

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, '\n');

const readGeneratedAt = async (rootDir: string, catalogPath: string) => {
  try {
    const catalog = await readJson(rootDir, catalogPath);
    const generatedAt = catalog && typeof catalog === 'object' && 'generatedAt' in catalog ? catalog.generatedAt : undefined;
    return typeof generatedAt === 'string' ? generatedAt : undefined;
  } catch {
    return undefined;
  }
};

/**
 * Lists committed outputs that differ from a fresh in-memory generation. The
 * committed catalog's `generatedAt` is reused so a timestamp alone never counts
 * as a difference; line endings are ignored for Git checkouts on Windows.
 */
export const findStalePortfolioEvidenceOutputs = async (
  options: Omit<PortfolioEvidenceOptions, 'generatedAt'> = {}
): Promise<string[]> => {
  const { rootDir, paths } = resolveOptions(options);
  const generatedAt = await readGeneratedAt(rootDir, paths.catalogOutput);
  const outputSet = await createPortfolioEvidenceOutputSet({ ...options, generatedAt });
  const stale: string[] = [];
  for (const file of outputSet.files) {
    const committed = await readFile(path.join(rootDir, file.path), 'utf8').catch(() => null);
    if (committed === null || normalizeLineEndings(committed) !== normalizeLineEndings(file.contents)) stale.push(file.path);
  }
  return stale;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await runPortfolioEvidenceWorkflow();
  console.log(`Rendered ${result.renderedPortfolioItemCount} portfolio item cards in ${defaultPaths.portfolioHtml}`);
  console.log(`Generated ${result.catalogPortfolioItemCount} portfolio item records at ${defaultPaths.catalogOutput}`);
  console.log(`Generated ${result.aiContextPortfolioItemCount} portfolio item records at ${defaultPaths.aiContextOutput}`);
  console.log(`Generated ${result.caseStudyPageCount} case study pages`);
  console.log(`Rendered ${result.sitePageCount} authored pages from ${defaultPaths.sitePageSources}/`);
}
