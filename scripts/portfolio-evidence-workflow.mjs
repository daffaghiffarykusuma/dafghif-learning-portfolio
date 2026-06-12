import { createPortfolioAiContextData, createPortfolioEvidencePipeline } from './portfolio-evidence-pipeline.mjs';
import { renderCaseStudyPages } from './case-study-source.mjs';

export const portfolioEvidenceWorkflowOutputTypes = Object.freeze({
  portfolioHtml: 'portfolio-html',
  catalogJson: 'catalog-json',
  aiContextJson: 'ai-context-json',
  caseStudyHtml: 'case-study-html'
});

const jsonOutput = (data) => `${JSON.stringify(data, null, 2)}\n`;

export const createPortfolioEvidenceWorkflow = ({
  portfolioHtml,
  portfolioSource,
  proofSource,
  generatedFrom,
  catalogGeneratedFrom = 'assets/data/portfolio-items.json',
  generatedAt = new Date().toISOString()
}) => {
  const pipeline = createPortfolioEvidencePipeline({
    portfolioHtml,
    portfolioSource,
    proofSource,
    generatedFrom,
    generatedAt
  });

  const renderedPortfolioItemCount = pipeline.renderPortfolioItems();
  const caseStudyPages = renderCaseStudyPages(portfolioSource);
  const aiContextData = createPortfolioAiContextData({
    portfolioSource: pipeline.catalogData,
    caseStudySource: portfolioSource,
    generatedFrom: catalogGeneratedFrom,
    generatedAt
  });

  const outputs = [
    {
      type: portfolioEvidenceWorkflowOutputTypes.portfolioHtml,
      pathKey: 'portfolioHtml',
      contents: pipeline.serializeDocument()
    },
    {
      type: portfolioEvidenceWorkflowOutputTypes.catalogJson,
      pathKey: 'catalogOutput',
      contents: jsonOutput(pipeline.catalogData)
    },
    ...caseStudyPages.map((page) => ({
      type: portfolioEvidenceWorkflowOutputTypes.caseStudyHtml,
      outputPath: page.outputPath,
      contents: page.html
    })),
    {
      type: portfolioEvidenceWorkflowOutputTypes.aiContextJson,
      pathKey: 'aiContextOutput',
      contents: jsonOutput(aiContextData)
    }
  ];

  return {
    outputs,
    summary: {
      renderedPortfolioItemCount,
      catalogPortfolioItemCount: pipeline.portfolioItems.length,
      aiContextPortfolioItemCount: pipeline.portfolioItems.length,
      caseStudyPageCount: caseStudyPages.length
    }
  };
};
