import { runPortfolioEvidenceGeneration } from './portfolio-generation-command.mjs';

const result = await runPortfolioEvidenceGeneration({
  writeCatalog: false,
  writeAiContext: false,
  writeCaseStudies: false
});

console.log(`Rendered ${result.renderedPortfolioItemCount} portfolio item cards in portfolio.html`);
