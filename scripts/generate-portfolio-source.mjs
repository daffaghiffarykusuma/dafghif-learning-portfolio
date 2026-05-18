import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Window } from 'happy-dom';

const portfolioPath = 'portfolio.html';
const outputPath = 'assets/data/portfolio-projects.json';

const html = await readFile(portfolioPath, 'utf8');
const window = new Window();
window.SyntaxError = window.SyntaxError || SyntaxError;
window.document.write(html);
window.document.close();

const normalizeText = (value = '') => value.replace(/\s+/g, ' ').trim();

const projects = Array.from(window.document.querySelectorAll('.card.project')).filter((card) =>
  !card.classList.contains('project-placeholder')
).map((card) => {
  const title = normalizeText(card.querySelector('h3')?.textContent || '');
  const category = normalizeText(card.querySelector('.project-category-label')?.textContent || '');
  const description = normalizeText(card.querySelector('.card-content p')?.textContent || '');
  const image = card.querySelector('.card-image img');
  const detailsButton = card.querySelector('.view-details-button');
  const discussLink = card.querySelector('.card-actions a[href^="contact.html"]');

  return {
    id: card.id || card.dataset.projectId || '',
    title,
    category,
    tags: (card.dataset.category || '').split(/\s+/).filter(Boolean),
    description,
    image: {
      src: image?.getAttribute('src') || '',
      alt: image?.getAttribute('alt') || title,
    },
    sourceArtifact: detailsButton?.dataset.pdf || detailsButton?.dataset.viewer || '',
    sourceType: detailsButton?.dataset.pdf ? 'pdf' : detailsButton?.dataset.viewer ? 'html-viewer' : '',
    projectUrl: card.dataset.projectUrl || (card.id ? `portfolio.html#${card.id}` : ''),
    discussUrl: discussLink?.getAttribute('href') || '',
  };
});

const data = {
  schemaVersion: 1,
  generatedFrom: portfolioPath,
  generatedAt: new Date().toISOString(),
  projectCount: projects.length,
  projects,
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');

console.log(`Generated ${projects.length} project records at ${outputPath}`);
