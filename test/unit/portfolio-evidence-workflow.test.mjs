import { describe, expect, test } from 'bun:test';
import { Window } from 'happy-dom';
import {
  createPortfolioEvidenceWorkflow
} from '../../scripts/portfolio/portfolio-evidence-workflow.ts';
import {
  createCaseStudyPublication
} from '../../scripts/portfolio/case-study-publication.ts';

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

const portfolioPageSource = `<!--site-page
{ "kind": "portfolio", "title": "Portfolio", "description": "Portfolio Items.", "artifactPreview": true }
-->
<main id="main-content">
  <div class="portfolio-items-grid"></div>
</main>`;

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
      portfolioItemUrl: 'portfolio.html#default-deck'
    },
    {
      id: 'custom-deck',
      title: 'Custom Deck',
      practiceArea: 'Learning Materials',
      tags: ['learning-materials'],
      description: 'Uses roleplay prompts.',
      audience: 'Facilitators',
      image: { src: 'assets/images/portfolio/custom.webp', alt: 'Custom' },
      sourceArtifact: 'assets/portfolio-viewers/custom-deck.html',
      sourceType: 'html-viewer',
      portfolioItemUrl: 'portfolio.html#custom-deck'
    }
  ],
  caseStudies: []
};

const outputFor = (workflow, type) =>
  workflow.outputs.find((output) => output.type === type);

const jsonOutputFor = (workflow, type) =>
  JSON.parse(outputFor(workflow, type).contents);

describe('Portfolio Evidence Workflow', () => {
  test('publishes role and project invitations with contextual discussion after the work samples', async () => {
    const source = await Bun.file(new URL('../../assets/data/portfolio-source.json', import.meta.url)).json();
    const proof = await Bun.file(new URL('../../assets/data/portfolio-proof-points.json', import.meta.url)).json();
    const workflow = createPortfolioEvidenceWorkflow({ portfolioPageSource, portfolioSource: source, proofSource: proof, generatedFrom: 'assets/data/portfolio-source.json' });
    for (const item of source.caseStudies) {
      const document = new Window().document;
      document.write(workflow.outputs.find((output) => output.outputPath === item.pagePath).contents);
      const invitation = document.querySelector('.generated-case-cta');
      expect(invitation.textContent).toMatch(/\broles?\b/i);
      expect(invitation.textContent).toMatch(/\bprojects?\b/i);
      const discussion = [...invitation.querySelectorAll('a')].find((link) => link.textContent === 'Discuss this work');
      expect(discussion).toBeTruthy();
      expect(new URL(discussion.href, 'https://portfolio.test').searchParams.get('portfolioItem')).toBe(item.portfolioItemTitle || item.title);
      expect(document.querySelector('#work-samples').compareDocumentPosition(invitation) & 4).toBeTruthy();
    }
  });

  test('publishes narrative capability before the title while retaining source-supported scope and native destinations', async () => {
    const source = await Bun.file(new URL('../../assets/data/portfolio-source.json', import.meta.url)).json();
    const proof = await Bun.file(new URL('../../assets/data/portfolio-proof-points.json', import.meta.url)).json();
    const workflow = createPortfolioEvidenceWorkflow({ portfolioPageSource, portfolioSource: source, proofSource: proof, generatedFrom: 'assets/data/portfolio-source.json' });
    const document = new Window().document;
    document.write(outputFor(workflow, 'portfolio-html').contents);
    for (const item of source.caseStudies) {
      const card = document.getElementById(item.id);
      const content = card.querySelector('.card-content');
      expect(content.firstElementChild.textContent).toBe(item.practiceArea);
      expect(content.textContent).toContain(item.description);
      const links = [card.querySelector('h2 a'), card.querySelector('a:has(img)'), card.querySelector('.portfolio-review-action')];
      expect(links.map((link) => link.getAttribute('href'))).toEqual([item.pagePath, item.pagePath, item.pagePath]);
      expect(links[2].textContent).toBe('Read case study');
      expect(card.querySelector('[data-pdf], [data-viewer]')).toBeNull();
    }
  });

  test('publishes the Home lead cases first on the index and retains every remaining narrative after regeneration', async () => {
    const source = await Bun.file(new URL('../../assets/data/portfolio-source.json', import.meta.url)).json();
    const proof = await Bun.file(new URL('../../assets/data/portfolio-proof-points.json', import.meta.url)).json();
    const input = { portfolioPageSource, portfolioSource: source, proofSource: proof, generatedFrom: 'assets/data/portfolio-source.json', generatedAt: '2026-11-07T00:00:00.000Z' };
    const workflow = createPortfolioEvidenceWorkflow(input);
    const index = workflow.outputs.find((output) => output.outputPath === 'case-studies.html');
    const document = new Window().document;
    document.write(index.contents);
    const destinations = [...document.querySelectorAll('.case-study-card h2 a')].map((link) => link.getAttribute('href'));
    expect(destinations.slice(0, 3)).toEqual(['case-administrative-communication.html', 'case-learning-organization-strategy.html', 'case-entrepreneurship.html']);
    expect(destinations).toHaveLength(source.caseStudies.length + 1);
    expect(new Set(destinations).size).toBe(destinations.length);
    expect(destinations).toEqual(expect.arrayContaining(source.caseStudies.map((item) => item.pagePath)));
    const regenerated = createPortfolioEvidenceWorkflow(input);
    expect(regenerated.outputs.find((output) => output.outputPath === 'case-studies.html')).toEqual(index);
  });

  test('derives every discussion link from the displayed title and rejects a source inquiry link', () => {
    const workflow = createPortfolioEvidenceWorkflow({ portfolioPageSource, portfolioSource: workflowSource,
      proofSource, generatedFrom: 'assets/data/portfolio-source.json' });
    const document = new Window().document;
    document.write(outputFor(workflow, 'portfolio-html').contents);
    const href = document.querySelector('#default-deck .portfolio-discuss-link').getAttribute('href');
    expect(href).toBe('contact.html?portfolioItem=Default+Deck');
    expect(jsonOutputFor(workflow, 'catalog-json').portfolioItems.find((item) => item.id === 'default-deck').discussUrl).toBe(href);

    const source = structuredClone(workflowSource);
    source.portfolioItems[0].discussUrl = 'contact.html?portfolioItem=Short%20title';
    expect(() => createPortfolioEvidenceWorkflow({ portfolioPageSource, portfolioSource: source,
      proofSource, generatedFrom: 'assets/data/portfolio-source.json' })).toThrow('discussUrl is derived from the title');
  });

  test('renders the portfolio page through the Site Page Shell from a template it never reads back', () => {
    const input = { portfolioPageSource, portfolioSource: workflowSource, proofSource,
      generatedFrom: 'assets/data/portfolio-source.json', generatedAt: '2026-05-26T00:00:00.000Z' };
    const html = outputFor(createPortfolioEvidenceWorkflow(input), 'portfolio-html').contents;
    expect(outputFor(createPortfolioEvidenceWorkflow(input), 'portfolio-html').contents).toBe(html);
    const document = new Window().document;
    document.write(html);
    expect(document.body.dataset.pageKind).toBe('portfolio');
    expect(document.querySelector('header nav li.current a').getAttribute('href')).toBe('portfolio.html');
    expect(document.getElementById('pdf-modal')).toBeTruthy();
    expect(() => createPortfolioEvidenceWorkflow({ ...input, portfolioPageSource: html }))
      .toThrow('must start with a <!--site-page');
    expect(() => createPortfolioEvidenceWorkflow({
      ...input,
      portfolioPageSource: portfolioPageSource.replace('<div class="portfolio-items-grid"></div>', '<div class="portfolio-items-grid"><div class="card"></div></div>')
    })).toThrow('template must be empty');
  });

  test('renders every authored Site Page Source and refuses one that replaces a generated page', () => {
    const input = { portfolioPageSource, portfolioSource: workflowSource, proofSource,
      generatedFrom: 'assets/data/portfolio-source.json' };
    const about = { pagePath: 'about.html', source: '<!--site-page\n{ "kind": "home", "title": "About", "description": "About page." }\n-->\n<main id="main-content"><h1>About</h1></main>' };
    const workflow = createPortfolioEvidenceWorkflow({ ...input, sitePageSources: [about] });
    const page = workflow.outputs.find((output) => output.outputPath === 'about.html');
    expect(page.type).toBe('site-page-html');
    expect(page.contents).toContain('<h1>About</h1>');
    expect(workflow.summary.sitePageCount).toBe(2);
    expect(() => createPortfolioEvidenceWorkflow({ ...input, sitePageSources: [{ ...about, pagePath: 'case-studies.html' }] }))
      .toThrow('generated by more than one source');
  });
  test.each([
    ['default-deck', 'Preview PDF', 'pdf', 'assets/pdf/portfolio/example.pdf', 'Default Deck'],
    ['custom-deck', 'Open interactive preview', 'viewer', 'assets/portfolio-viewers/custom-deck.html', 'Custom Deck']
  ])('publishes three semantic preview controls with one Artifact destination for %s', (id, label, attribute, destination, title) => {
    const workflow = createPortfolioEvidenceWorkflow({ portfolioPageSource, portfolioSource: workflowSource,
      proofSource, generatedFrom: 'assets/data/portfolio-source.json' });
    const document = new Window().document;
    document.write(outputFor(workflow, 'portfolio-html').contents);
    const card = document.getElementById(id);
    const controls = [card.querySelector('h2 button'), card.querySelector('.card-image button'),
      [...card.querySelectorAll('button')].find((button) => button.textContent === label)];
    for (const control of controls) {
      expect(control).toBeTruthy();
      expect(control.type).toBe('button');
    }
    expect(controls[2].dataset[attribute]).toBe(destination);
    expect(new URL(card.querySelector('.portfolio-discuss-link').getAttribute('href'), 'https://example.test')
      .searchParams.get('portfolioItem')).toBe(title);
  });
  test('publishes source-owned review guidance and a working starting Artifact for both lead design cases', async () => {
    const source = await Bun.file(new URL('../../assets/data/portfolio-source.json', import.meta.url)).json();
    const actualProofSource = await Bun.file(new URL('../../assets/data/portfolio-proof-points.json', import.meta.url)).json();
    const input = {
      portfolioPageSource,
      portfolioSource: source,
      proofSource: actualProofSource,
      generatedFrom: 'assets/data/portfolio-source.json',
      generatedAt: '2026-10-07T00:00:00.000Z'
    };
    const workflow = createPortfolioEvidenceWorkflow(input);
    const starts = [
      ['case-administrative-communication.html', 'artifact-bnsp4-program-proposal'],
      ['case-learning-organization-strategy.html', 'artifact-bnsp6-silabus-pelatihan']
    ];
    for (const [pagePath, artifactId] of starts) {
      const caseStudy = source.caseStudies.find((item) => item.pagePath === pagePath);
      const html = workflow.outputs.find((output) => output.outputPath === pagePath).contents;
      const document = new Window().document;
      document.write(html);
      const heading = [...document.querySelectorAll('h2')].find((node) => node.textContent === 'What this demonstrates');
      expect(heading).toBeTruthy();
      const guide = heading.parentElement;
      expect(guide.textContent).toContain(caseStudy.reviewerContext.find((item) => item.label === 'Use case').value);
      expect(guide.textContent).toContain('Start here');
      const start = guide.querySelector('a');
      expect(start.getAttribute('href')).toBe(`#${artifactId}`);
      expect(caseStudy.suggestedArtifactId).toBe(artifactId);
      const artifact = caseStudy.artifacts.find((item) => item.id === artifactId);
      expect(start.textContent).toBe(`Preview ${artifact.title}`);
      const card = document.getElementById(artifactId);
      expect(card.querySelector('[data-pdf]').dataset.pdf).toBe(artifact.href);
      expect(html.indexOf('What this demonstrates')).toBeLessThan(html.indexOf('class="resource-grid artifact-list"'));
      expect([...document.querySelectorAll('.case-artifact-card')].map((node) => node.id))
        .toEqual(caseStudy.artifacts.map((item) => item.id));
      expect(document.querySelector('.case-evidence-note').textContent)
        .toContain(caseStudy.reviewerContext.find((item) => item.label === 'Evidence limit').value);
      expect(document.querySelector('.case-approach-details')).toBeTruthy();
    }
    const regenerated = createPortfolioEvidenceWorkflow(input);
    expect(regenerated.outputs.filter((output) => output.type === 'case-study-html'))
      .toEqual(workflow.outputs.filter((output) => output.type === 'case-study-html'));
    const withoutSelections = structuredClone(source);
    withoutSelections.caseStudies.forEach((item) => { delete item.suggestedArtifactId; });
    const baseline = createPortfolioEvidenceWorkflow({ ...input, portfolioSource: withoutSelections });
    for (const output of workflow.outputs.filter((item) => !starts.some(([path]) => path === item.outputPath))) {
      expect(output).toEqual(baseline.outputs.find((item) => item.type === output.type && item.outputPath === output.outputPath));
    }
  });

  test('returns one complete featured-order output set through one interface', () => {
    const workflow = createPortfolioEvidenceWorkflow({
      portfolioPageSource,
      portfolioSource: workflowSource,
      proofSource,
      generatedFrom: 'assets/data/portfolio-source.json',
      catalogGeneratedFrom: 'assets/data/custom-catalog.json',
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
      caseStudyPageCount: 1,
      sitePageCount: 1
    });
    expect(catalog).toMatchObject({
      schemaVersion: 1,
      generatedFrom: 'assets/data/portfolio-source.json',
      generatedAt: '2026-05-26T00:00:00.000Z',
      portfolioItemCount: 2
    });
    expect(aiContext.generatedFrom).toBe('assets/data/custom-catalog.json');
    const document = new Window().document;
    document.write(html);
    const cards = Array.from(document.querySelectorAll('.card.portfolio-item:not(.portfolio-item-placeholder)'));
    expect(cards).toHaveLength(2);
    for (const card of cards) {
      expect(card.querySelector('.card-content > h2')).toBeTruthy();
      expect(card.querySelector('.card-actions').firstElementChild.classList.contains('view-details-button')).toBe(true);
      expect(card.dataset.format).toBeTruthy();
    }
    expect(document.querySelector('#custom-deck .portfolio-item-proof').textContent)
      .toBe('Uses roleplay instructions and reflection prompts.');
    expect(document.querySelector('#default-deck .portfolio-item-proof')).toBeNull();
    expect(document.querySelector('#custom-deck .portfolio-item-title-link').textContent).toBe('Custom Deck');
    expect(document.querySelector('#custom-deck .portfolio-item-meta').textContent).toBe('HTML preview · Facilitators');
    expect(html).toStartWith('<!DOCTYPE html>');
    expect(html.indexOf('id="custom-deck"')).toBeLessThan(
      html.indexOf('id="default-deck"')
    );
    expect(html).toContain('data-viewer="assets/portfolio-viewers/custom-deck.html"');
    expect(html).toContain('Open interactive preview');
    expect(html).toContain('data-pdf="assets/pdf/portfolio/example.pdf"');
    expect(html).toContain('Preview PDF');
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
      portfolioPageSource,
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
  test('returns Case Study index and detail page outputs', () => {
    const caseStudy = {
      id: 'case-sample-learning-program',
      documentTitle: 'Sample <Learning> & Program',
      title: 'Sample Learning Program',
      portfolioItemTitle: 'Sample Learning Program Case Study',
      practiceArea: 'Instructional Design',
      description: 'Combines diagnosis & design artifacts into one case.',
      summary: 'Shows a grouped learning program case.',
      image: { src: 'assets/images/portfolio/sample.webp', alt: 'Sample thumbnail' },
      reviewerContext: [
        { label: 'Evidence limit', value: 'Direct outcomes are not claimed.' }
      ],
      caseFlow: [{ label: 'Diagnose', value: 'Review the learning gap.' }],
      artifacts: [{
        id: 'artifact-needs-analysis',
        sourceType: 'pdf',
        title: 'Needs Analysis',
        description: 'Defines the learning gap.',
        href: 'assets/pdf/portfolio/needs.pdf',
        practiceArea: 'Training Needs Analysis',
        tags: ['training-needs-analysis'],
        image: { src: 'assets/images/portfolio/needs.webp' }
      }]
    };
    const publication = createCaseStudyPublication({ caseStudies: [caseStudy] });
    const indexPage = publication.pages.find((page) => page.outputPath === 'case-studies.html');
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
    expect(indexPage.html).toContain('case-sample-learning-program.html');
    expect(indexPage.html).toContain('<li class="current"><a href="case-studies.html">Case Studies</a></li>');
    expect(indexPage.html).toContain('All Rights Reserved.');
    expect(detailPage.html).toContain(
      '<strong>Evidence limit:</strong> Direct outcomes are not claimed.'
    );
    expect(detailPage.html).toStartWith('<!DOCTYPE html>');
    expect(detailPage.html).toContain('<title>Sample &lt;Learning&gt; &amp; Program</title>');
    expect(detailPage.html).toContain('<meta name="description" content="Combines diagnosis &amp; design artifacts into one case.">');
    expect(detailPage.html).toContain('<link href="assets/data/portfolio-ai-context.json" rel="alternate" title="Portfolio AI Context" type="application/json">');
    expect(detailPage.html).toContain('<link rel="stylesheet" href="src/styles/site.css">');
    expect(detailPage.html).toContain('data-page-kind="case-study" data-page-path="case-sample-learning-program.html" data-navigation-page="case-studies.html"');
    expect(detailPage.html).not.toContain('Reviewer Context');
    expect(detailPage.html.match(/Direct outcomes are not claimed\./g)).toHaveLength(1);
    expect(detailPage.html.indexOf('id="work-samples"')).toBeLessThan(detailPage.html.indexOf('id="approach"'));
    expect(detailPage.html).toContain('<details class="case-approach-details">');
    expect(detailPage.html).toContain('<script type="module" src="src/script.ts"></script>');
    expect(detailPage.html).toContain('<h1>Sample Learning Program</h1>');
  });
});
