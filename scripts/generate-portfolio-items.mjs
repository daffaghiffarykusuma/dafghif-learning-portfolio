import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createPortfolioEvidencePipeline } from './portfolio-evidence-pipeline.mjs';
import { renderCaseStudyPreviews } from './case-study-source.mjs';

const portfolioPath = 'portfolio.html';
const portfolioSourcePath = 'assets/data/portfolio-source.json';
const proofPointsPath = 'assets/data/portfolio-proof-points.json';
const outputPath = 'assets/data/portfolio-items.json';

const html = await readFile(portfolioPath, 'utf8');
const portfolioSource = JSON.parse(await readFile(portfolioSourcePath, 'utf8'));
const proofSource = JSON.parse(await readFile(proofPointsPath, 'utf8'));

const pipeline = createPortfolioEvidencePipeline({
  portfolioHtml: html,
  portfolioSource,
  proofSource,
  generatedFrom: portfolioSourcePath,
});

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(pipeline.catalogData, null, 2)}\n`, 'utf8');

for (const preview of renderCaseStudyPreviews(portfolioSource)) {
  await mkdir(path.dirname(preview.outputPath), { recursive: true });
  await writeFile(preview.outputPath, preview.html, 'utf8');
}

console.log(`Generated ${pipeline.portfolioItems.length} portfolio item records at ${outputPath}`);
