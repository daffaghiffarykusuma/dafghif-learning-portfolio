import { runPortfolioEvidenceGeneration } from './portfolio-generation-command.mjs';

const result = await runPortfolioEvidenceGeneration({
  writePortfolioHtml: false,
  writeCatalog: false,
  writeCaseStudies: false
});

console.log(`Generated ${result.aiContextPortfolioItemCount} portfolio item records at assets/data/portfolio-ai-context.json`);
