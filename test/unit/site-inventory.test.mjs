import { afterEach, describe, expect, test } from 'bun:test';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  createDistSiteInventory,
  createSourceSiteInventory
} from '../../scripts/site-inventory.mjs';

let tempRoot = null;

afterEach(async () => {
  if (tempRoot) {
    await rm(tempRoot, { recursive: true, force: true });
    tempRoot = null;
  }
});

describe('Site Inventory', () => {
  test('exposes shared source and dist facts without caller-owned file walking', async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), 'site-inventory-'));
    await mkdir(path.join(tempRoot, 'css'), { recursive: true });
    await mkdir(path.join(tempRoot, 'dist', 'assets'), { recursive: true });
    await mkdir(path.join(tempRoot, 'node_modules'), { recursive: true });
    await writeFile(path.join(tempRoot, 'index.html'), '<main id="main"><a href="portfolio.html#work">Work</a><img src="assets/example.webp"></main>', 'utf8');
    await writeFile(path.join(tempRoot, 'portfolio.html'), '<section id="work"><iframe id="pdf-iframe" src=""></iframe></section>', 'utf8');
    await writeFile(path.join(tempRoot, 'css', 'style.css'), '.hero{background:url("../assets/example.webp")}', 'utf8');
    await writeFile(path.join(tempRoot, 'node_modules', 'ignored.html'), '<p id="ignored"></p>', 'utf8');
    await writeFile(path.join(tempRoot, 'dist', 'index.html'), '<!doctype html><h1>Built</h1>', 'utf8');
    await writeFile(path.join(tempRoot, 'dist', 'assets', 'app.js'), 'console.log("ok")', 'utf8');

    const sourceInventory = await createSourceSiteInventory({ rootDir: tempRoot });
    const distInventory = await createDistSiteInventory({ rootDir: tempRoot, distDir: path.join(tempRoot, 'dist') });

    expect(sourceInventory.htmlPages.map((page) => page.relPath)).toEqual(['index.html', 'portfolio.html']);
    expect(sourceInventory.cssFiles.map((file) => file.relPath)).toEqual(['css/style.css']);
    expect(sourceInventory.htmlPages[0]).toMatchObject({
      ids: ['main'],
      urlAttributes: [
        { attr: 'href', value: 'portfolio.html#work' },
        { attr: 'src', value: 'assets/example.webp' }
      ]
    });
    expect(sourceInventory.cssFiles[0].urls).toEqual(['../assets/example.webp']);
    expect(distInventory.records.map((record) => record.rel)).toEqual(['assets/app.js', 'index.html']);
    expect(distInventory.records.find((record) => record.rel === 'assets/app.js')).toMatchObject({
      ext: '.js',
      size: 17
    });
  });
});
