import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  PORTFOLIO_ITEM_SCHEMA_VERSION,
  createAiContextPortfolioItem,
  getPortfolioItemSourceItems,
  practiceAreaProfiles
} from './portfolio-item-catalog.mjs';

const portfolioSourcePath = 'assets/data/portfolio-items.json';
const outputPath = 'assets/data/portfolio-ai-context.json';

const portfolioSource = JSON.parse(await readFile(portfolioSourcePath, 'utf8'));
const portfolioItems = getPortfolioItemSourceItems(portfolioSource).map(createAiContextPortfolioItem);
const data = {
  schemaVersion: PORTFOLIO_ITEM_SCHEMA_VERSION,
  generatedFrom: portfolioSourcePath,
  generatedAt: new Date().toISOString(),
  owner: 'Daffa Ghiffary Kusuma',
  positioning:
    'Learning Designer and Program Manager focused on competency-based training, learning assets, evaluation systems, mentoring, and learning analytics.',
  usage:
    'Use this file as AI-readable context for tailored CVs, cover letters, recruiter summaries, and portfolio item matching when the original portfolio artifacts are unavailable.',
  evidenceNote:
    'Portfolio item titles, practice areas, descriptions, tags, and source artifact paths are read from the structured portfolio source. Role, audience, deliverables, skills, tools, outcome evidence, and CV bullets are inferred from those public snippets and should be refined when exact portfolio item details are available.',
  portfolioItemCount: portfolioItems.length,
  practiceAreaProfiles,
  portfolioItems
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');

console.log(`Generated ${portfolioItems.length} portfolio item records at ${outputPath}`);
