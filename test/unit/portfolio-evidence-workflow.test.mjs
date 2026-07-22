import { describe, expect, test } from 'bun:test';
import {
  createPortfolioEvidenceWorkflow
} from '../../scripts/portfolio-evidence-workflow.mjs';
import {
  createCaseStudyPublication
} from '../../scripts/case-study-publication.mjs';
import { renderGeneratedHtmlDocument } from '../../scripts/generated-site-chrome.mjs';

const proofSource = {
  practiceAreaDefaults: {
    'Learning Materials': {
      visibleProofLine: 'Converts concepts into facilitator-ready learning material.',
      workQuality: [
        {
          claim: 'Turns content into activities and learner prompts.',
          sourceBasis: 'practice-area default',
          confidence: 'inferred'
        }
      ]
    },
    'Instructional Design': {
      visibleProofLine: 'Connects objectives, activities, and evidence.',
      workQuality: [
        {
          claim: 'Connects objectives, activities, and evidence.',
          sourceBasis: 'practice-area default',
          confidence: 'inferred'
        }
      ]
    }
  },
  itemOverrides: {
    'custom-deck': {
      visibleProofLine: 'Uses roleplay instructions and reflection prompts.',
      workQuality: [
        {
          claim: 'Includes roleplay instructions and reflection prompts.',
          sourceBasis: 'artifact',
          confidence: 'direct'
        }
      ],
      impact: [
        {
          claim: 'Supported 120 learners.',
          sourceBasis: 'portfolio-description',
          confidence: 'direct'
        }
      ]
    }
  }
};

const portfolioHtml = `<!DOCTYPE html>
<html>
  <body>
    <div class="portfolio-items-grid">
      <div class="portfolio-item-placeholder">Placeholder</div>
    </div>
  </body>
</html>`;

const workflowSource = {
  schemaVersion: 1,
  portfolioItemCount: 2,
  featuredPortfolioItemIds: ['custom-deck', 'default-deck'],
  portfolioItems: [
    {
      id: 'default-deck',
      title: 'Default Deck',
      practiceArea: 'Learning Materials',
      tags: ['learning-materials'],
      description: 'Turns a topic into a deck.',
      image: { src: 'assets/images/portfolio/example.webp', alt: 'Example' },
      sourceArtifact: 'assets/pdf/portfolio/example.pdf',
      sourceType: 'pdf',
      portfolioItemUrl: 'portfolio.html#default-deck',
      discussUrl: 'contact.html?portfolioItem=Default%20Deck'
    },
    {
      id: 'custom-deck',
      title: 'Custom Deck',
      practiceArea: 'Learning Materials',
      tags: ['learning-materials'],
      description: 'Uses roleplay prompts.',
      image: { src: 'assets/images/portfolio/custom.webp', alt: 'Custom' },
      sourceArtifact: 'assets/portfolio-viewers/custom-deck.html',
      sourceType: 'html-viewer',
      portfolioItemUrl: 'portfolio.html#custom-deck',
      discussUrl: 'contact.html?portfolioItem=Custom%20Deck'
    }
  ],
  caseStudies: []
};

const outputFor = (workflow, type) =>
  workflow.outputs.find((output) => output.type === type);

const jsonOutputFor = (workflow, type) =>
  JSON.parse(outputFor(workflow, type).contents);

describe('Portfolio Evidence Workflow', () => {
  test('returns one complete featured-order output set through one interface', () => {
    const workflow = createPortfolioEvidenceWorkflow({
      portfolioHtml,
      portfolioSource: workflowSource,
      proofSource,
      generatedFrom: 'assets/data/portfolio-source.json',
      catalogGeneratedFrom: 'assets/data/portfolio-items.json',
      generatedAt: '2026-05-26T00:00:00.000Z'
    });
    const html = outputFor(
      workflow,
      'portfolio-html'
    ).contents;
    const catalog = jsonOutputFor(
      workflow,
      'catalog-json'
    );
    const aiContext = jsonOutputFor(
      workflow,
      'ai-context-json'
    );

    expect(workflow.summary).toEqual({
      renderedPortfolioItemCount: 2,
      catalogPortfolioItemCount: 2,
      aiContextPortfolioItemCount: 2,
      caseStudyPageCount: 1
    });
    expect(html).toStartWith('<!DOCTYPE html>');
    expect(html.indexOf('id="custom-deck"')).toBeLessThan(
      html.indexOf('id="default-deck"')
    );
    expect(html).toContain('data-viewer="assets/portfolio-viewers/custom-deck.html"');
    expect(html).toContain('Open Interactive Preview');
    expect(html).toContain('data-pdf="assets/pdf/portfolio/example.pdf"');
    expect(html).toContain('View PDF Artifact');
    expect(catalog.portfolioItems.map((item) => item.id)).toEqual([
      'custom-deck',
      'default-deck'
    ]);
    expect(catalog.portfolioItems[0].proof.visibleProofLine)
      .toBe('Uses roleplay instructions and reflection prompts.');
    expect(aiContext.portfolioItems[0].aiContext.outcomeEvidence).toEqual([
      {
        claim: 'Supported 120 learners.',
        sourceBasis: 'portfolio-description',
        confidence: 'direct'
      }
    ]);
  });

  test('keeps Case Study pages and nested Artifact metadata in the same output set', () => {
    const caseStudy = {
      id: 'case-sample-learning-program',
      title: 'Sample Learning Program',
      portfolioItemTitle: 'Sample Learning Program Case Study',
      practiceArea: 'Instructional Design',
      tags: ['instructional-design'],
      description: 'Combines diagnosis and design artifacts into one case.',
      summary: 'Shows a grouped learning program case.',
      image: { src: 'assets/images/portfolio/sample.webp', alt: 'Sample thumbnail' },
      pagePath: 'case-sample-learning-program.html',
      outputPath: 'assets/portfolio-viewers/case-sample-learning-program.html',
      reviewerContext: [],
      caseFlow: [],
      artifacts: [
        {
          id: 'artifact-needs-analysis',
          title: 'Needs Analysis',
          description: 'Defines the learning gap.',
          href: 'assets/pdf/portfolio/needs.pdf',
          sourceType: 'pdf',
          practiceArea: 'Training Needs Analysis',
          tags: ['training-needs-analysis'],
          image: { src: 'assets/images/portfolio/needs.webp', alt: 'Needs thumbnail' }
        }
      ]
    };
    const workflow = createPortfolioEvidenceWorkflow({
      portfolioHtml,
      portfolioSource: {
        schemaVersion: 1,
        portfolioItemCount: 0,
        featuredPortfolioItemIds: [caseStudy.id],
        portfolioItems: [],
        caseStudies: [caseStudy]
      },
      proofSource: {
        practiceAreaDefaults: proofSource.practiceAreaDefaults,
        itemOverrides: {}
      },
      generatedFrom: 'assets/data/portfolio-source.json',
      generatedAt: '2026-05-26T00:00:00.000Z'
    });
    const aiContext = jsonOutputFor(
      workflow,
      'ai-context-json'
    );

    expect(workflow.summary.caseStudyPageCount).toBe(2);
    expect(workflow.outputs.find(
      (output) => output.outputPath === 'case-sample-learning-program.html'
    ).contents).toContain('<h1>Sample Learning Program</h1>');
    expect(aiContext.portfolioItemCount).toBe(1);
    expect(aiContext.caseStudyArtifactCount).toBe(1);
    expect(aiContext.portfolioItems[0].caseStudyArtifacts[0]).toMatchObject({
      id: 'artifact-needs-analysis',
      parentCaseStudy: 'case-sample-learning-program',
      sourceArtifact: 'assets/pdf/portfolio/needs.pdf'
    });
  });
});

describe('Case Study Publication', () => {
  test('returns expanded Portfolio Items and page identities through one interface', () => {
    const caseStudy = {
      id: 'case-sample-learning-program',
      title: 'Sample Learning Program',
      portfolioItemTitle: 'Sample Learning Program Case Study',
      practiceArea: 'Instructional Design',
      tags: ['instructional-design'],
      description: 'Combines diagnosis and design artifacts into one case.',
      image: { src: 'assets/images/portfolio/sample.webp', alt: 'Sample thumbnail' }
    };
    const publication = createCaseStudyPublication({
      caseStudies: [caseStudy],
      portfolioItems: [
        { id: caseStudy.id, title: 'Manual duplicate' },
        { id: 'project-other', title: 'Other Portfolio Item' }
      ]
    });

    expect(publication.portfolioItems[0]).toMatchObject({
      id: 'case-sample-learning-program',
      sourceArtifact: 'case-sample-learning-program.html',
      sourceType: 'case-study-page'
    });
    expect(publication.pageIdentities).toEqual([{
      kind: 'case-study',
      pagePath: 'case-sample-learning-program.html',
      navigationPage: 'case-studies.html'
    }]);
    expect(publication.portfolioItems.map((item) => item.id)).toEqual([
      caseStudy.id,
      'project-other'
    ]);
  });

  test('keeps Artifact preview markup and metadata behind the publication interface', () => {
    const artifact = {
      title: 'Needs Analysis',
      description: 'Defines the learning gap.',
      href: 'assets/pdf/portfolio/needs.pdf',
      practiceArea: 'Training Needs Analysis',
      tags: ['training-needs-analysis'],
      image: { src: 'assets/images/portfolio/needs.webp' }
    };
    const publication = createCaseStudyPublication({
      caseStudies: [{
        id: 'case-sample-learning-program',
        title: 'Sample Learning Program',
        artifacts: [artifact]
      }]
    });
    const detailPage = publication.pages.find(
      (page) => page.outputPath === 'case-sample-learning-program.html'
    );

    expect(detailPage.html).toContain('id="artifact-needs-analysis"');
    expect(detailPage.html).toContain('data-pdf="assets/pdf/portfolio/needs.pdf"');
    expect(publication.artifactMetadataByCaseStudyId
      .get('case-sample-learning-program')[0]).toMatchObject({
      id: 'artifact-needs-analysis',
      sourceType: 'pdf',
      parentCaseStudy: 'case-sample-learning-program',
      sourceArtifact: 'assets/pdf/portfolio/needs.pdf'
    });
  });

  test('returns Case Study index and detail page outputs', () => {
    const caseStudy = {
      id: 'case-sample-learning-program',
      title: 'Sample Learning Program',
      portfolioItemTitle: 'Sample Learning Program Case Study',
      practiceArea: 'Instructional Design',
      description: 'Combines diagnosis and design artifacts into one case.',
      summary: 'Shows a grouped learning program case.',
      image: { src: 'assets/images/portfolio/sample.webp', alt: 'Sample thumbnail' },
      reviewerContext: [
        { label: 'Evidence limit', value: 'Direct outcomes are not claimed.' }
      ],
      caseFlow: [{ label: 'Diagnose', value: 'Review the learning gap.' }],
      artifacts: []
    };
    const publication = createCaseStudyPublication({ caseStudies: [caseStudy] });
    const indexPage = publication.pages.find((page) => page.outputPath === 'case-studies.html');
    const detailPage = publication.pages.find(
      (page) => page.outputPath === 'case-sample-learning-program.html'
    );

    expect(indexPage.html).toContain('case-sample-learning-program.html');
    expect(detailPage.html).toContain(
      '<strong>Evidence boundary:</strong> Direct outcomes are not claimed.'
    );
    expect(renderGeneratedHtmlDocument({
      title: 'Sample',
      description: 'Sample description',
      main: '<main id="main-content"></main>'
    })).toContain('<script type="module" src="src/script.js"></script>');
    expect(detailPage.html).toContain('<h1>Sample Learning Program</h1>');
  });
});
