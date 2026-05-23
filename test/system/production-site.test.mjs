import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { spawn } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { getProductionAssetProbePaths } from '../../scripts/shipping-manifest.mjs';
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
    const editableOfficeFiles = distFiles
      .map((filePath) => path.relative(path.join(projectRoot, 'dist'), filePath).split(path.sep).join('/'))
      .filter((filePath) => /\.(?:docx|pptx|xlsx)$/i.test(filePath));

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
    const { response, body } = await request('/portfolio.html');
    expect(response.status).toBe(200);

    const previewPaths = Array.from(body.matchAll(/\b(?:data-pdf|data-viewer)="([^"]+)"/g), (match) => `/${match[1]}`);
    expect(previewPaths.length).toBeGreaterThan(0);

    for (const previewPath of previewPaths.slice(0, 20)) {
      const preview = await fetch(`${baseUrl}${previewPath}`);
      expect(preview.status, previewPath).toBe(200);
    }
  });
});
