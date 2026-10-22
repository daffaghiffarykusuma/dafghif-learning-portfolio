import { expect, test } from 'bun:test';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

test('the actual build copy hook rejects Office files in every public tree', async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'portfolio-static-copy-'));
  const publicTrees = ['assets/data', 'assets/pdf', 'assets/portfolio-viewers'];
  try {
    for (const directory of publicTrees) {
      await mkdir(path.join(rootDir, directory, 'nested'), { recursive: true });
      await writeFile(path.join(rootDir, directory, 'public.txt'), 'public');
      for (const extension of ['docx', 'PPTX', 'xlsx']) {
        await writeFile(path.join(rootDir, directory, 'nested', `private.${extension}`), 'private');
      }
    }
    await mkdir(path.join(rootDir, 'assets/pdf/portfolio'), { recursive: true });
    await writeFile(path.join(rootDir, 'assets/pdf/portfolio/adaptability.pdf'), 'excluded');
    const configUrl = new URL('../../vite.config.mjs', import.meta.url).href;
    const child = Bun.spawn([process.execPath, '--eval', `
      const { default: config } = await import(${JSON.stringify(configUrl)});
      config.plugins.find((plugin) => plugin.name === 'copy-static-files').closeBundle();
    `], { cwd: rootDir, stdout: 'pipe', stderr: 'pipe' });
    const [code, stderr] = await Promise.all([child.exited, new Response(child.stderr).text()]);
    expect(code, stderr).toBe(0);
    for (const directory of publicTrees) {
      expect(await readFile(path.join(rootDir, 'dist', directory, 'public.txt'), 'utf8')).toBe('public');
      expect(await readdir(path.join(rootDir, 'dist', directory, 'nested'))).toEqual([]);
    }
    expect(await readdir(path.join(rootDir, 'dist/assets/pdf/portfolio'))).toEqual([]);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});
