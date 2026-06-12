import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { spawn } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import {
  getDeniedShippedArtifactFacts,
  getProductionAssetProbePaths
} from '../../scripts/shipped-artifact-inventory.mjs';
import { projectRoot } from '../helpers/dom.mjs';

const host = '127.0.0.1';
const port = 4178;
const baseUrl = `http://${host}:${port}`;
let server;

const run = (command, args) => new Promise((resolve) => {
  const child = spawn(command, args, {
    cwd: projectRoot,
    shell: process.platform === 'win32',
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => {
    stdout += chunk;
  });
  child.stderr.on('data', (chunk) => {
    stderr += chunk;
  });
  child.on('close', (code) => {
    resolve({ code, stdout, stderr });
  });
});

const waitForServer = async () => {
  const deadline = Date.now() + 15_000;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/index.html`);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw lastError || new Error('Preview server did not become ready.');
};

const request = async (path) => {
  const response = await fetch(`${baseUrl}${path}`);
  const body = await response.text();
  return { response, body };
};

const walkFiles = async (dir, results = []) => {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkFiles(entryPath, results);
    } else {
      results.push(entryPath);
    }
  }
  return results;
};

beforeAll(async () => {
  const build = await run('bun', ['run', 'build']);
  expect(build.code, build.stderr || build.stdout).toBe(0);

  server = spawn('bun', ['x', 'vite', 'preview', '--host', host, '--port', String(port), '--strictPort'], {
    cwd: projectRoot,
    shell: process.platform === 'win32',
    stdio: ['ignore', 'pipe', 'pipe']
  });

  await waitForServer();
});

afterAll(() => {
  server?.kill();
});

describe('production site system checks', () => {
  test('serves every top-level HTML page from the production preview', async () => {
    const pages = [
      '/index.html',
      '/portfolio.html',
      '/case-studies.html',
      '/case-employee-assessment-bootcamp.html',
      '/case-administrative-communication.html',
      '/case-learning-organization-strategy.html',
      '/case-ybb-mentoring-workbook.html',
      '/blog.html',
      '/contact.html',
      '/case-entrepreneurship.html'
    ];

    for (const page of pages) {
      const { response, body } = await request(page);
      expect(response.status, page).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/html');
      expect(body).toContain('<!DOCTYPE html>');
      expect(body).toContain('</html>');
    }
  });

  test('serves bundled styles on generated Case Study pages', async () => {
    const pages = [
      '/case-employee-assessment-bootcamp.html',
      '/case-administrative-communication.html',
      '/case-learning-organization-strategy.html',
      '/case-ybb-mentoring-workbook.html'
    ];

    for (const page of pages) {
      const { response, body } = await request(page);
      expect(response.status, page).toBe(200);
      expect(body, page).toContain('rel="stylesheet"');
      expect(body, page).toContain('/assets/');
      expect(body, page).not.toContain('href="css/style.css"');
    }
  });

  test('serves core production assets referenced by pages', async () => {
    const assets = getProductionAssetProbePaths(projectRoot);
    expect(assets.length).toBeGreaterThan(0);

    for (const asset of assets) {
      const { response, body } = await request(asset);
      expect(response.status, asset).toBe(200);
      expect(body.length, asset).toBeGreaterThan(0);
    }
  });

  test('does not ship editable Office source files in the production build', async () => {
    const distFiles = await walkFiles(path.join(projectRoot, 'dist'));
    const distRelativePaths = distFiles
      .map((filePath) => path.relative(path.join(projectRoot, 'dist'), filePath).split(path.sep).join('/'));
    const editableOfficeFiles = getDeniedShippedArtifactFacts(distRelativePaths);

    expect(editableOfficeFiles).toEqual([]);
  });

  test('delivers production blog data that matches the rendered blog page contract', async () => {
    const [{ response: pageResponse, body: pageBody }, { response: dataResponse, body: dataBody }] = await Promise.all([
      request('/blog.html'),
      request('/assets/blog.json')
    ]);

    expect(pageResponse.status).toBe(200);
    expect(dataResponse.status).toBe(200);
    expect(pageBody).toContain('id="blog-cards"');

    const blogData = JSON.parse(dataBody);
    const posts = Array.isArray(blogData) ? blogData : blogData.posts;
    expect(Array.isArray(posts)).toBe(true);
    expect(posts.length).toBeGreaterThan(0);

    for (const post of posts) {
      expect(post.title).toBeTruthy();
      expect(new URL(post.url).hostname.endsWith('medium.com')).toBe(true);
      expect(new URL(post.image).protocol).toBe('https:');
    }
  });

  test('keeps portfolio preview files reachable in the built site', async () => {
    const pages = [
      '/portfolio.html',
      '/case-employee-assessment-bootcamp.html',
      '/case-administrative-communication.html',
      '/case-learning-organization-strategy.html',
      '/case-ybb-mentoring-workbook.html'
    ];
    const bodies = [];

    for (const page of pages) {
      const { response, body } = await request(page);
      expect(response.status, page).toBe(200);
      bodies.push(body);
    }

    const previewPaths = bodies.flatMap((body) =>
      Array.from(body.matchAll(/\b(?:data-pdf|data-viewer)="([^"]+)"/g), (match) => `/${match[1]}`)
    );
    expect(previewPaths.length).toBeGreaterThan(0);

    for (const previewPath of previewPaths.slice(0, 20)) {
      const preview = await fetch(`${baseUrl}${previewPath}`);
      expect(preview.status, previewPath).toBe(200);
    }
  });

  test('keeps built Portfolio Item loading contract real and click-triggered', async () => {
    const { response, body } = await request('/portfolio.html');
    expect(response.status).toBe(200);

    const portfolioItemCount = [...body.matchAll(/<[^>]+\bclass="([^"]*\bcard\b[^"]*\bportfolio-item\b[^"]*)"[^>]*>/g)]
      .filter((match) => !match[1].includes('portfolio-item-placeholder')).length;
    const firstImage = body.match(/<img\b[^>]*>/)?.[0] || '';
    const previewIframe = body.match(/<iframe\b[^>]*\bid="pdf-iframe"[^>]*>/)?.[0] || '';

    expect(portfolioItemCount).toBe(67);
    expect(firstImage).toContain('loading="eager"');
    expect(firstImage).toContain('fetchpriority="high"');
    expect(firstImage).toContain('width="660"');
    expect(firstImage).toContain('height="400"');
    expect(body).toContain('loading="lazy"');
    expect(body).toContain('decoding="async"');
    expect(previewIframe).toContain('src=""');
    expect(body).not.toContain('data-portfolio-item-id=');
    expect(body).not.toContain('data-portfolio-item-url=');
  });

  test('keeps built Case Study Artifact loading contract real and click-triggered', async () => {
    const pages = [
      '/case-employee-assessment-bootcamp.html',
      '/case-administrative-communication.html',
      '/case-learning-organization-strategy.html',
      '/case-ybb-mentoring-workbook.html'
    ];

    for (const page of pages) {
      const { response, body } = await request(page);
      expect(response.status, page).toBe(200);

      const artifactSection = body.slice(body.indexOf('generated-case-artifacts'));
      const firstArtifactImage = artifactSection.match(/<img\b[^>]*>/)?.[0] || '';
      const previewIframe = body.match(/<iframe\b[^>]*\bid="pdf-iframe"[^>]*>/)?.[0] || '';

      expect(body, page).toContain('case-artifact-card');
      expect(firstArtifactImage, page).toContain('loading="eager"');
      expect(firstArtifactImage, page).toContain('fetchpriority="high"');
      expect(firstArtifactImage, page).toContain('width="660"');
      expect(firstArtifactImage, page).toContain('height="400"');
      expect(body, page).toContain('loading="lazy"');
      expect(previewIframe, page).toContain('src=""');
      expect(body, page).not.toContain('data-portfolio-item-id=');
    }
  });

  test('keeps generated case-study artifact UI and AI metadata discoverable in production', async () => {
    const pages = [
      '/case-employee-assessment-bootcamp.html',
      '/case-administrative-communication.html',
      '/case-learning-organization-strategy.html',
      '/case-ybb-mentoring-workbook.html'
    ];

    for (const page of pages) {
      const { response, body } = await request(page);
      expect(response.status, page).toBe(200);
      expect(body, page).toContain('case-artifact-card');
      expect(body, page).toContain('View Details');
      expect(body, page).toContain('rel="alternate"');
      const metadataHref = body.match(/<link href="([^"]+\.json)" rel="alternate" title="Portfolio AI Context" type="application\/json">/)?.[1];
      expect(metadataHref, page).toBeTruthy();
      expect(body, page).not.toContain('Open PDF artifact');
      expect(body, page).not.toContain('Open Artifact Preview');
    }

    const { body: firstPageBody } = await request(pages[0]);
    const metadataHref = firstPageBody.match(/<link href="([^"]+\.json)" rel="alternate" title="Portfolio AI Context" type="application\/json">/)?.[1];
    const metadataPath = `/${metadataHref.replace(/^\.\//, '')}`;
    const { response, body } = await request(metadataPath);
    expect(response.status).toBe(200);
    const aiContext = JSON.parse(body);
    expect(aiContext.portfolioItemCount).toBe(67);
    expect(aiContext.caseStudyArtifactCount).toBeGreaterThan(0);
    expect(aiContext.portfolioItems.find((item) => item.id === 'case-administrative-communication-learning-program').caseStudyArtifacts)
      .toHaveLength(7);
  });
});
