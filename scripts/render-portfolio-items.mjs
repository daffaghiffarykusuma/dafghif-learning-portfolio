import { readFile, writeFile } from 'node:fs/promises';
import { createPortfolioEvidencePipeline } from './portfolio-evidence-pipeline.mjs';

const portfolioPath = 'portfolio.html';
const portfolioSourcePath = 'assets/data/portfolio-source.json';
const proofPointsPath = 'assets/data/portfolio-proof-points.json';

const html = await readFile(portfolioPath, 'utf8');
const portfolioSource = JSON.parse(await readFile(portfolioSourcePath, 'utf8'));
const proofSource = JSON.parse(await readFile(proofPointsPath, 'utf8'));

const pipeline = createPortfolioEvidencePipeline({
  portfolioHtml: html,
  portfolioSource,
  proofSource,
  generatedFrom: portfolioSourcePath
});
const renderedCount = pipeline.renderPortfolioItems();

await writeFile(portfolioPath, pipeline.serializeDocument(), 'utf8');

console.log(`Rendered ${renderedCount} portfolio item cards in ${portfolioPath}`);
