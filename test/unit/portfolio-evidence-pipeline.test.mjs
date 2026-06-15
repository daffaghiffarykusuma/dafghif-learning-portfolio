import { describe, expect, test } from 'bun:test';
import {
  applyProofPoints,
  createPortfolioAiContextData,
  createPortfolioDocument,
  createPortfolioEvidencePipeline,
  getPortfolioSourceItems,
  renderPortfolioItemCards,
  renderProofLines,
  serializePortfolioDocument
} from '../../scripts/portfolio-evidence-pipeline.mjs';
import {
  createCaseStudyArtifactMetadata,
  createCaseStudyArtifactPreviewModel,
  createCaseStudyPageIdentity,
  createCaseStudyPortfolioItem,
  expandCaseStudyPortfolioSource,
  getCaseStudyPageIdentities
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
  test('puts explicitly featured Portfolio Items first without dropping the remaining inventory', () => {
    const items = getPortfolioSourceItems({
      featuredPortfolioItemIds: ['project-third', 'project-first'],
      portfolioItems: [
        { id: 'project-first', title: 'First' },
        { id: 'project-second', title: 'Second' },
        { id: 'project-third', title: 'Third' }
      ]
    });

    expect(items.map((item) => item.id)).toEqual([
      'project-third',
      'project-first',
      'project-second'
    ]);
  });

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
      },
      {
        id: 'second-deck',
        title: 'Second Deck',
        practiceArea: 'Learning Materials',
        tags: ['learning-materials'],
        description: 'A second deck.',
        image: { src: 'assets/images/portfolio/second.webp', alt: 'Second deck thumbnail' },
        sourceArtifact: 'assets/pdf/portfolio/second.pdf',
        sourceType: 'pdf',
        portfolioItemUrl: 'portfolio.html#second-deck',
        discussUrl: 'contact.html?portfolioItem=Second%20Deck'
      }
    ], proofSource);

    expect(renderPortfolioItemCards(document, portfolioItems)).toBe(2);
    expect(document.querySelector('#stale-card')).toBeNull();
    expect(document.querySelector('#custom-deck .portfolio-item-proof').textContent)
      .toBe('Uses roleplay instructions and reflection prompts.');
    expect(document.querySelector('#custom-deck .view-details-button').dataset.pdf)
      .toBe('assets/pdf/portfolio/custom.pdf');
    expect(document.querySelector('#custom-deck').textContent)
      .toContain('Uses roleplay instructions and reflection prompts.');
    expect(document.querySelector('#custom-deck .view-details-button').textContent)
      .toBe('View PDF Artifact');
    expect(document.querySelector('#custom-deck .portfolio-item-practice-label a').href)
      .toContain('portfolio.html?area=learning-materials');
    expect(document.querySelector('#custom-deck').hasAttribute('data-portfolio-item-id')).toBe(false);
    expect(document.querySelector('#custom-deck').hasAttribute('data-portfolio-item-url')).toBe(false);

    const firstImage = document.querySelector('#custom-deck img');
    expect(firstImage.loading).toBe('eager');
    expect(firstImage.getAttribute('fetchpriority')).toBe('high');
    expect(firstImage.getAttribute('width')).toBe('660');
    expect(firstImage.getAttribute('height')).toBe('400');
    expect(document.querySelector('#custom-deck .portfolio-item-thumbnail-link').hasAttribute('aria-label')).toBe(false);

    const secondImage = document.querySelector('#second-deck img');
    expect(secondImage.loading).toBe('lazy');
    expect(secondImage.getAttribute('fetchpriority')).toBeNull();
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
    expect(document.querySelector('#viewer-workbook .view-details-button').textContent)
      .toBe('Open Interactive Preview');
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
    expect(createCaseStudyPageIdentity(caseStudy)).toEqual({
      kind: 'case-study',
      pagePath: 'case-sample-learning-program.html',
      navigationPage: 'case-studies.html'
    });
    expect(getCaseStudyPageIdentities({ caseStudies: [caseStudy] })).toEqual([
      createCaseStudyPageIdentity(caseStudy)
    ]);
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

  test('normalizes Case Study Artifact preview and metadata contracts from one model interface', () => {
    const artifact = {
      title: 'Needs Analysis',
      description: 'Defines the learning gap.',
      href: 'assets/pdf/portfolio/needs.pdf',
      practiceArea: 'Training Needs Analysis',
      tags: ['training-needs-analysis'],
      image: { src: 'assets/images/portfolio/needs.webp' }
    };

    expect(createCaseStudyArtifactPreviewModel(artifact)).toMatchObject({
      id: 'artifact-needs-analysis',
      title: 'Needs Analysis',
      sourceType: 'pdf',
      categories: 'training-needs-analysis',
      previewDataset: { pdf: 'assets/pdf/portfolio/needs.pdf' },
      image: {
        src: 'assets/images/portfolio/needs.webp',
        alt: 'Needs Analysis'
      }
    });
    expect(createCaseStudyArtifactMetadata({ id: 'case-sample' }, artifact)).toMatchObject({
      id: 'artifact-needs-analysis',
      parentCaseStudy: 'case-sample',
      sourceArtifact: 'assets/pdf/portfolio/needs.pdf',
      sourceType: 'pdf'
    });
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
    expect(html).toContain('<body data-page-kind="case-study-index" data-page-path="case-studies.html" data-navigation-page="case-studies.html">');
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
      id: 'case-sample-learning-program',
      pagePath: 'case-sample-learning-program.html',
      documentTitle: 'Sample Case Study',
      title: 'Sample Learning Program',
      summary: 'Shows a grouped learning program case.',
      description: 'Combines diagnosis and design artifacts into one case.',
      discussUrl: 'contact.html?portfolioItem=Sample',
      reviewerContext: [{ label: 'Evidence limit', value: 'Direct outcomes are not claimed.' }],
      caseFlow: [{ label: 'Diagnose', value: 'Review the learning need.' }],
      artifacts: [
        {
          id: 'artifact-needs-analysis',
          title: 'Needs Analysis',
          description: 'Defines the learning gap.',
          href: 'assets/pdf/portfolio/needs.pdf',
          sourceType: 'pdf',
          practiceArea: 'Training Needs Analysis',
          tags: ['training-needs-analysis', 'instructional-design'],
          image: {
            src: 'assets/images/portfolio/needs.webp',
            alt: 'Needs analysis artifact thumbnail'
          }
        },
        {
          id: 'artifact-design-plan',
          title: 'Design Plan',
          description: 'Plans the learning path.',
          href: 'assets/pdf/portfolio/design.pdf',
          sourceType: 'pdf',
          practiceArea: 'Instructional Design',
          tags: ['instructional-design'],
          image: {
            src: 'assets/images/portfolio/design.webp',
            alt: 'Design plan artifact thumbnail'
          }
        }
      ]
    });

    expect(html).toContain('<title>Sample Case Study</title>');
    expect(html).toContain('<body data-page-kind="case-study" data-page-path="case-sample-learning-program.html" data-navigation-page="case-studies.html">');
    expect(html).toContain('<li class="current"><a href="case-studies.html">Case Studies</a></li>');
    expect(html).toContain('<h1>Sample Learning Program</h1>');
    expect(html).toContain('class="service-hero service-hero-compact generated-case-hero"');
    expect(html).toContain('class="service-impact generated-case-evidence"');
    expect(html).toContain('class="service-outcomes generated-case-meaning"');
    expect(html).toContain('<h2 class="section-title">Why This Matters</h2>');
    expect(html).toContain('Direct outcomes are not claimed.');
    expect(html).toContain('class="feature-grid"');
    expect(html).toContain('class="approach-steps"');
    expect(html).toContain('class="service-resources generated-case-artifacts"');
    expect(html).toContain('class="service-cta generated-case-cta"');
    expect(html).not.toContain('class="service-trustband"');
    expect(html).toContain('<strong>Evidence limit:</strong> Direct outcomes are not claimed.');
    expect(html).toContain('id="artifact-needs-analysis"');
    expect(html).toContain('class="card portfolio-item case-artifact-card"');
    expect(html).toContain('<img src="assets/images/portfolio/needs.webp" alt="Needs analysis artifact thumbnail" loading="eager" fetchpriority="high" width="660" height="400" decoding="async">');
    expect(html).toContain('<img src="assets/images/portfolio/design.webp" alt="Design plan artifact thumbnail" loading="lazy" decoding="async">');
    expect(html).toContain('data-category="training-needs-analysis instructional-design"');
    expect(html).not.toContain('data-portfolio-item-id=');
    expect(html).not.toContain('aria-label="Preview Needs Analysis"');
    expect(html).toContain('<button class="view-details-button" type="button" data-pdf="assets/pdf/portfolio/needs.pdf">View Details</button>');
    expect(html).not.toContain('href="assets/pdf/portfolio/needs.pdf"');
    expect(html).not.toContain('Open PDF artifact');
    expect(html).toContain('Discuss a Similar Case');
    expect(html).not.toContain('Proof of quality:');
    expect(html).not.toContain('<style>');
  });

  test('adds nested Case Study Artifact metadata without changing Portfolio Item count', () => {
    const aiContextData = createPortfolioAiContextData({
      portfolioSource: {
        portfolioItemCount: 1,
        portfolioItems: [],
        caseStudies: [
          {
            id: 'case-sample-learning-program',
            title: 'Sample Learning Program',
            portfolioItemTitle: 'Sample Learning Program Case Study',
            practiceArea: 'Instructional Design',
            tags: ['instructional-design'],
            description: 'Combines diagnosis and design artifacts into one case.',
            image: { src: 'assets/images/portfolio/sample.webp', alt: 'Sample thumbnail' },
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
          }
        ]
      },
      generatedFrom: 'assets/data/portfolio-items.json',
      generatedAt: '2026-05-26T00:00:00.000Z'
    });

    expect(aiContextData.portfolioItemCount).toBe(1);
    expect(aiContextData.caseStudyArtifactCount).toBe(1);
    expect(aiContextData.portfolioItems).toHaveLength(1);
    expect(aiContextData.portfolioItems[0].caseStudyArtifacts).toEqual([
      expect.objectContaining({
        id: 'artifact-needs-analysis',
        title: 'Needs Analysis',
        practiceArea: 'Training Needs Analysis',
        tags: ['training-needs-analysis'],
        publicDescription: 'Defines the learning gap.',
        sourceArtifact: 'assets/pdf/portfolio/needs.pdf',
        sourceType: 'pdf',
        parentCaseStudy: 'case-sample-learning-program',
        image: {
          src: 'assets/images/portfolio/needs.webp',
          alt: 'Needs thumbnail'
        }
      })
    ]);
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
