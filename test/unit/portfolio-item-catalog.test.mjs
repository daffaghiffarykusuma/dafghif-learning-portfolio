import { describe, expect, test } from 'bun:test';
import { Window } from 'happy-dom';
import {
  createAiContextPortfolioItem,
  createPortfolioCatalogData,
  getPortfolioItemSourceItems,
  normalizePortfolioItem,
  parsePortfolioItemsFromDocument,
  slugify
} from '../../scripts/portfolio-item-catalog.mjs';

const createDocument = (html) => {
  const window = new Window();
  window.SyntaxError = window.SyntaxError || SyntaxError;
  window.document.write(html);
  window.document.close();
  return window.document;
};

describe('Portfolio Item catalog', () => {
  test('parses Portfolio Items from portfolio card markup', () => {
    const document = createDocument(`
      <article id="portfolio-item-a" class="card portfolio-item" data-category="learning-materials presentation-design">
        <div class="card-image">
          <img src="assets/images/portfolio/example.webp" alt="Example thumbnail">
        </div>
        <div class="card-content">
          <span class="portfolio-item-practice-label"> Learning Materials </span>
          <h3> Example Training Deck </h3>
          <p>
            Turns a complex topic into a practical learner-ready deck.
          </p>
        </div>
        <div class="card-actions">
          <button class="view-details-button" data-pdf="assets/pdf/portfolio/example.pdf">View</button>
          <a href="contact.html?portfolioItem=Example%20Training%20Deck">Discuss</a>
        </div>
      </article>
      <article class="card portfolio-item portfolio-item-placeholder"></article>
    `);

    expect(parsePortfolioItemsFromDocument(document)).toEqual([
      {
        id: 'portfolio-item-a',
        title: 'Example Training Deck',
        practiceArea: 'Learning Materials',
        tags: ['learning-materials', 'presentation-design'],
        description: 'Turns a complex topic into a practical learner-ready deck.',
        image: {
          src: 'assets/images/portfolio/example.webp',
          alt: 'Example thumbnail'
        },
        sourceArtifact: 'assets/pdf/portfolio/example.pdf',
        sourceType: 'pdf',
        portfolioItemUrl: 'portfolio.html#portfolio-item-a',
        discussUrl: 'contact.html?portfolioItem=Example%20Training%20Deck'
      }
    ]);
  });

  test('normalizes legacy source fields into the current Portfolio Item shape', () => {
    expect(normalizePortfolioItem({
      title: ' Recruitment Assessment Blueprint ',
      category: ' Assessment & Evaluation ',
      publicDescription: '  Scores candidates with clear rubric evidence. ',
      source: 'assets/spreadsheets/portfolio/recruitment_assessment_blueprint.xlsx',
      projectUrl: 'portfolio.html#assessment-blueprint',
      tags: [' assessment-evaluation ', '', 'learning-analytics']
    })).toEqual({
      id: 'recruitment-assessment-blueprint',
      title: 'Recruitment Assessment Blueprint',
      practiceArea: 'Assessment & Evaluation',
      tags: ['assessment-evaluation', 'learning-analytics'],
      description: 'Scores candidates with clear rubric evidence.',
      image: {
        src: '',
        alt: 'Recruitment Assessment Blueprint'
      },
      sourceArtifact: 'assets/spreadsheets/portfolio/recruitment_assessment_blueprint.xlsx',
      sourceType: '',
      portfolioItemUrl: 'portfolio.html#assessment-blueprint',
      discussUrl: ''
    });
  });

  test('builds schema-versioned catalog data without changing the public schema', () => {
    const portfolioItems = [normalizePortfolioItem({ title: 'A Deck', practiceArea: 'Presentation Design' })];

    expect(createPortfolioCatalogData({
      generatedFrom: 'portfolio.html',
      generatedAt: '2026-05-23T00:00:00.000Z',
      portfolioItems
    })).toEqual({
      schemaVersion: 1,
      generatedFrom: 'portfolio.html',
      generatedAt: '2026-05-23T00:00:00.000Z',
      portfolioItemCount: 1,
      portfolioItems
    });
  });

  test('maps current and legacy catalog containers to Portfolio Item sources', () => {
    const currentItems = [{ title: 'Current item' }];
    const legacyItems = [{ title: 'Legacy item' }];

    expect(getPortfolioItemSourceItems({ portfolioItems: currentItems })).toBe(currentItems);
    expect(getPortfolioItemSourceItems({ projects: legacyItems })).toBe(legacyItems);
    expect(getPortfolioItemSourceItems({})).toEqual([]);
  });

  test('derives AI context from the normalized Portfolio Item interface', () => {
    const item = createAiContextPortfolioItem({
      title: 'MSME Pitch Deck Template',
      practiceArea: 'Presentation Design',
      description: 'A pitch presentation workbook for 120 MSME entrepreneurs.',
      sourceArtifact: 'assets/presentations/portfolio/msme_pitch_template.pptx',
      tags: ['presentation-design', 'mentoring-coaching']
    });

    expect(item).toMatchObject({
      id: 'msme-pitch-deck-template',
      publicDescription: 'A pitch presentation workbook for 120 MSME entrepreneurs.',
      sourceArtifact: 'assets/presentations/portfolio/msme_pitch_template.pptx',
      aiContext: {
        audience: 'MSME owners and entrepreneurs',
        tools: ['PowerPoint or Google Slides'],
        scaleSignals: ['120']
      }
    });
    expect(item.aiContext.skills).toContain('presentation design');
    expect(item.aiContext.skills).toContain('mentoring coaching');
  });

  test('slugifies Portfolio Item titles consistently', () => {
    expect(slugify('L&D Strategy & Evaluation')).toBe('l-and-d-strategy-and-evaluation');
  });
});
