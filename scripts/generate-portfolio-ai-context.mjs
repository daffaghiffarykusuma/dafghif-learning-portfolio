import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createPortfolioAiContextData } from './portfolio-evidence-pipeline.mjs';

const portfolioSourcePath = 'assets/data/portfolio-items.json';
const outputPath = 'assets/data/portfolio-ai-context.json';

const portfolioSource = JSON.parse(await readFile(portfolioSourcePath, 'utf8'));
const data = createPortfolioAiContextData({
  portfolioSource,
  generatedFrom: portfolioSourcePath,
});

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');

console.log(`Generated ${data.portfolioItems.length} portfolio item records at ${outputPath}`);
