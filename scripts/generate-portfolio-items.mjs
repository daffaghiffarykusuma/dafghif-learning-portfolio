import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Window } from 'happy-dom';
import { createPortfolioCatalogData, parsePortfolioItemsFromDocument } from './portfolio-item-catalog.mjs';

const portfolioPath = 'portfolio.html';
const outputPath = 'assets/data/portfolio-items.json';

const html = await readFile(portfolioPath, 'utf8');
const window = new Window();
window.SyntaxError = window.SyntaxError || SyntaxError;
window.document.write(html);
window.document.close();

const portfolioItems = parsePortfolioItemsFromDocument(window.document);
const data = createPortfolioCatalogData({
  generatedFrom: portfolioPath,
  portfolioItems
});

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');

console.log(`Generated ${portfolioItems.length} portfolio item records at ${outputPath}`);
