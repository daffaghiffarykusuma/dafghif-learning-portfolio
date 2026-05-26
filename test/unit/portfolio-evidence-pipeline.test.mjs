import { describe, expect, test } from 'bun:test';
import {
  applyProofPoints,
  createPortfolioAiContextData,
  createPortfolioDocument,
  createPortfolioEvidencePipeline,
  renderPortfolioItemCards,
  renderProofLines,
  serializePortfolioDocument
} from '../../scripts/portfolio-evidence-pipeline.mjs';
import {
  createCaseStudyPortfolioItem,
  expandCaseStudyPortfolioSource
} from '../../scripts/case-study-model.mjs';
import {
  renderCaseStudyHtml,
  renderCaseStudyPreviews
} from '../../scripts/case-study-page-renderer.mjs';
import {
  renderCaseStudyIndexHtml
} from '../../scripts/case-study-index-renderer.mjs';
import {
  renderGeneratedHtmlDocument
} from '../../scripts/generated-site-chrome.mjs';

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

const portfolioHtml = `
  <!DOCTYPE html>
  <html>
    <body>
      <article id="default-deck" class="card portfolio-item" data-category="learning-materials">
        <div class="card-image"><img src="assets/images/portfolio/example.webp" alt="Example"></div>
        <div class="card-content">
          <h3>Default Deck</h3>
          <span class="portfolio-item-practice-label">Learning Materials</span>
          <p>Turns a topic into a deck.</p>
          <div class="card-actions">
            <button class="view-details-button" data-pdf="assets/pdf/portfolio/example.pdf">View</button>
            <a href="contact.html?portfolioItem=Default%20Deck">Discuss</a>
          </div>
        </div>
      </article>
      <article id="custom-deck" class="card portfolio-item" data-category="learning-materials">
        <div class="card-image"><img src="assets/images/portfolio/custom.webp" alt="Custom"></div>
        <div class="card-content">
          <h3>Custom Deck</h3>
          <span class="portfolio-item-practice-label">Learning Materials</span>
          <p>Uses roleplay prompts.</p>
          <div class="card-actions">
            <button class="view-details-button" data-pdf="assets/pdf/portfolio/custom.pdf">View</button>
            <a href="contact.html?portfolioItem=Custom%20Deck">Discuss</a>
          </div>
        </div>
      </article>
    </body>
  </html>
`;

describe('Portfolio Evidence Pipeline', () => {
  test('applies default Proof Points and item-level overrides conservatively', () => {
    expect(applyProofPoints([
      { id: 'default-deck', title: 'Default Deck', practiceArea: 'Learning Materials' },
      { id: 'custom-deck', title: 'Custom Deck', practiceArea: 'Learning Materials' }
    ], proofSource).map((item) => item.proof)).toEqual([
      {
        visibleProofLine: 'Converts concepts into facilitator-ready learning material.',
        workQuality: [
          {
            claim: 'Turns content into activities and learner prompts.',
            sourceBasis: 'practice-area default',
            confidence: 'inferred'
          }
        ],
        impact: []
      },
      {
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
    ]);
  });

  test('renders visible Proof Point lines and preserves the document doctype', () => {
    const document = createPortfolioDocument(portfolioHtml);
    const portfolioItems = applyProofPoints([
      { id: 'default-deck', title: 'Default Deck', practiceArea: 'Learning Materials' },
      { id: 'custom-deck', title: 'Custom Deck', practiceArea: 'Learning Materials' }
    ], proofSource);

    expect(renderProofLines(document, portfolioItems)).toBe(2);
    expect(Array.from(document.querySelectorAll('.portfolio-item-proof'), (node) => node.textContent)).toEqual([
      'Converts concepts into facilitator-ready learning material.',
      'Uses roleplay instructions and reflection prompts.'
    ]);
    expect(serializePortfolioDocument(document)).toStartWith('<!DOCTYPE html>');
  });

  test('renders Portfolio Item cards from structured source data', () => {
    const document = createPortfolioDocument(`
      <!DOCTYPE html>
      <html><body>
        <div class="grid grid-cols-3 portfolio-items-grid">
          <div id="stale-card" class="card portfolio-item"></div>
        </div>
      </body></html>
    `);
    const portfolioItems = applyProofPoints([
      {
        id: 'custom-deck',
        title: 'Custom Deck',
        practiceArea: 'Learning Materials',
        tags: ['learning-materials'],
        description: 'Uses roleplay prompts.',
        image: { src: 'assets/images/portfolio/custom.webp', alt: 'Custom deck thumbnail' },
        sourceArtifact: 'assets/pdf/portfolio/custom.pdf',
        sourceType: 'pdf',
        portfolioItemUrl: 'portfolio.html#custom-deck',
        discussUrl: 'contact.html?portfolioItem=Custom%20Deck'
      }
    ], proofSource);

    expect(renderPortfolioItemCards(document, portfolioItems)).toBe(1);
    expect(document.querySelector('#stale-card')).toBeNull();
    expect(document.querySelector('#custom-deck .portfolio-item-proof').textContent)
      .toBe('Uses roleplay instructions and reflection prompts.');
    expect(document.querySelector('#custom-deck .view-details-button').dataset.pdf)
      .toBe('assets/pdf/portfolio/custom.pdf');
  });

  test('renders HTML Artifact Preview buttons from structured source data', () => {
    const document = createPortfolioDocument('<!DOCTYPE html><html><body><div class="portfolio-items-grid"></div></body></html>');
    const portfolioItems = applyProofPoints([
      {
        id: 'viewer-workbook',
        title: 'Viewer Workbook',
        practiceArea: 'Learning Materials',
        tags: ['learning-materials'],
        description: 'A workbook with generated preview.',
        image: { src: 'assets/images/portfolio/viewer.webp', alt: 'Viewer workbook thumbnail' },
        sourceArtifact: 'assets/portfolio-viewers/viewer-workbook.html',
        sourceType: 'html-viewer',
        portfolioItemUrl: 'portfolio.html#viewer-workbook',
        discussUrl: 'contact.html?portfolioItem=Viewer%20Workbook'
      }
    ], proofSource);

    renderPortfolioItemCards(document, portfolioItems);
    expect(document.querySelector('#viewer-workbook .view-details-button').dataset.viewer)
      .toBe('assets/portfolio-viewers/viewer-workbook.html');
  });

  test('builds catalog and AI context from one pipeline interface', () => {
    const pipeline = createPortfolioEvidencePipeline({
      portfolioHtml,
      portfolioSource: {
        portfolioItems: [
          { id: 'default-deck', title: 'Default Deck', practiceArea: 'Learning Materials' },
          { id: 'custom-deck', title: 'Custom Deck', practiceArea: 'Learning Materials' }
        ]
      },
      proofSource,
      generatedFrom: 'portfolio.html',
      generatedAt: '2026-05-26T00:00:00.000Z'
    });
    const aiContextData = pipeline.createAiContextData({
      generatedFrom: 'assets/data/portfolio-items.json'
    });

    expect(pipeline.catalogData).toMatchObject({
      generatedFrom: 'portfolio.html',
      generatedAt: '2026-05-26T00:00:00.000Z',
      portfolioItemCount: 2
    });
    expect(aiContextData).toMatchObject({
      generatedFrom: 'assets/data/portfolio-items.json',
      generatedAt: '2026-05-26T00:00:00.000Z',
      portfolioItemCount: 2
    });
    expect(aiContextData.portfolioItems[1].aiContext.proof.impact[0].claim).toBe('Supported 120 learners.');
    expect(aiContextData.portfolioItems[1].aiContext.outcomeEvidence).toEqual([
      {
        claim: 'Supported 120 learners.',
        sourceBasis: 'portfolio-description',
        confidence: 'direct'
      }
    ]);
    expect(aiContextData.portfolioItems[0].aiContext.outcomeEvidence).toEqual([]);
    expect(aiContextData.portfolioItems[0].aiContext.aiHint.evidenceLevel).toBe('inferred non-proof drafting hint');
  });

  test('creates AI context data from an existing Portfolio Item catalog', () => {
    const portfolioSource = {
      portfolioItems: applyProofPoints([
        { id: 'custom-deck', title: 'Custom Deck', practiceArea: 'Learning Materials' }
      ], proofSource)
    };

    expect(createPortfolioAiContextData({
      portfolioSource,
      generatedFrom: 'assets/data/portfolio-items.json',
      generatedAt: '2026-05-26T00:00:00.000Z'
    }).portfolioItems[0].aiContext.proof.visibleProofLine).toBe('Uses roleplay instructions and reflection prompts.');
  });

  test('derives Case Study Portfolio Items from grouped source definitions', () => {
    const caseStudy = {
      id: 'case-sample-learning-program',
      title: 'Sample Learning Program',
      portfolioItemTitle: 'Sample Learning Program Case Study',
      practiceArea: 'Instructional Design',
      tags: ['instructional-design'],
      description: 'Combines diagnosis and design artifacts into one case.',
      image: { src: 'assets/images/portfolio/sample.webp', alt: 'Sample thumbnail' },
      outputPath: 'assets/portfolio-viewers/sample-case-study.html'
    };

    expect(createCaseStudyPortfolioItem(caseStudy)).toMatchObject({
      id: 'case-sample-learning-program',
      title: 'Sample Learning Program Case Study',
      practiceArea: 'Instructional Design',
      tags: ['case-study', 'instructional-design'],
      sourceArtifact: 'case-sample-learning-program.html',
      sourceType: 'case-study-page',
      portfolioItemUrl: 'case-sample-learning-program.html'
    });
    expect(expandCaseStudyPortfolioSource({
      caseStudies: [caseStudy],
      portfolioItems: [
        { id: 'case-sample-learning-program', title: 'Manual duplicate' },
        { id: 'project-other', title: 'Other Portfolio Item' }
      ]
    }).portfolioItems.map((item) => item.id)).toEqual([
      'case-sample-learning-program',
      'project-other'
    ]);
  });

  test('renders a Case Study index page that links grouped case studies as first-class pages', () => {
    const html = renderCaseStudyIndexHtml([
      {
        id: 'case-sample-learning-program',
        portfolioItemTitle: 'Sample Learning Program Case Study',
        practiceArea: 'Instructional Design',
        description: 'Combines diagnosis and design artifacts into one case.',
        pagePath: 'case-sample-learning-program.html',
        image: { src: 'assets/images/portfolio/sample.webp', alt: 'Sample thumbnail' }
      }
    ]);

    expect(html).toContain('<title>Case Studies | Daffa Ghiffary Kusuma</title>');
    expect(html).toContain('href="case-sample-learning-program.html"');
    expect(html).toContain('href="case-entrepreneurship.html"');
    expect(html).toContain('Entrepreneurship Program for 5,000+ SMK Students');
    expect(html).toContain('Sample Learning Program Case Study');
    expect(html).toContain('Instructional Design');
  });

  test('renders generated site chrome from one document shell', () => {
    const html = renderGeneratedHtmlDocument({
      title: 'Generated Page',
      description: 'Generated page description.',
      currentPage: 'case-studies.html',
      main: '<main id="main-content"><h1>Generated Page</h1></main>'
    });

    expect(html).toStartWith('<!DOCTYPE html>');
    expect(html).toContain('<title>Generated Page</title>');
    expect(html).toContain('<meta name="description" content="Generated page description.">');
    expect(html).toContain('<link rel="stylesheet" href="css/style.css">');
    expect(html).toContain('<li class="current"><a href="case-studies.html">Case Studies</a></li>');
    expect(html).toContain('<script type="module" src="js/script.js"></script>');
  });

  test('renders Case Study pages with the richer service case-study layout', () => {
    const html = renderCaseStudyHtml({
      documentTitle: 'Sample Case Study',
      title: 'Sample Learning Program',
      summary: 'Shows a grouped learning program case.',
      description: 'Combines diagnosis and design artifacts into one case.',
      discussUrl: 'contact.html?portfolioItem=Sample',
      reviewerContext: [{ label: 'Evidence limit', value: 'Direct outcomes are not claimed.' }],
      caseFlow: [{ label: 'Diagnose', value: 'Review the learning need.' }],
      artifacts: [
        {
          title: 'Needs Analysis',
          description: 'Defines the learning gap.',
          href: '../pdf/portfolio/needs.pdf',
          linkLabel: 'Open PDF artifact'
        }
      ]
    });

    expect(html).toContain('<title>Sample Case Study</title>');
    expect(html).toContain('<h1>Sample Learning Program</h1>');
    expect(html).toContain('class="service-hero service-hero-compact generated-case-hero"');
    expect(html).toContain('class="service-impact generated-case-evidence"');
    expect(html).toContain('class="feature-grid"');
    expect(html).toContain('class="approach-steps"');
    expect(html).toContain('class="service-resources generated-case-artifacts"');
    expect(html).toContain('class="service-cta generated-case-cta"');
    expect(html).not.toContain('class="service-trustband"');
    expect(html).toContain('<strong>Evidence limit:</strong> Direct outcomes are not claimed.');
    expect(html).toContain('<h3>Needs Analysis</h3>');
    expect(html).toContain('Discuss a Similar Case');
    expect(html).not.toContain('Proof of quality:');
    expect(html).not.toContain('<style>');
  });

  test('renders standalone Case Study page outputs from Portfolio Source case definitions', () => {
    const pages = renderCaseStudyPreviews({
      caseStudies: [
        {
          id: 'case-sample-learning-program',
          title: 'Sample Learning Program',
          summary: 'Shows a grouped learning program case.',
          reviewerContext: [],
          caseFlow: [],
          artifacts: []
        }
      ]
    });

    expect(pages).toHaveLength(1);
    expect(pages[0].outputPath).toBe('case-sample-learning-program.html');
    expect(pages[0].html).toContain('<h1>Sample Learning Program</h1>');
  });
});
