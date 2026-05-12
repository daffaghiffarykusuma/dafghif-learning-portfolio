import { describe, expect, test } from 'bun:test';
import { spawn } from 'node:child_process';
import { projectRoot } from '../helpers/dom.mjs';

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

describe('site validation script', () => {
  test('passes content, asset, link, CSP, and blog data checks', async () => {
    const result = await run('bun', ['scripts/validate-site.mjs']);

    expect(result.code).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('Validated');
  });
});
