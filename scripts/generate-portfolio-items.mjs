import { runPortfolioEvidenceGeneration } from './portfolio-generation-command.mjs';

const result = await runPortfolioEvidenceGeneration({
  writePortfolioHtml: false,
  writeAiContext: false
});

console.log(`Generated ${result.catalogPortfolioItemCount} portfolio item records at assets/data/portfolio-items.json`);
