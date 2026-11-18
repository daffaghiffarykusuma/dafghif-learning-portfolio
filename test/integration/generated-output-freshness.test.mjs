import { describe, expect, test } from 'bun:test';
import { findStalePortfolioEvidenceOutputs } from '../../scripts/portfolio-generation-command.ts';
import { projectRoot } from '../helpers/dom.mjs';

// Integration tests read the committed root pages; this keeps them honest.
describe('committed generated outputs', () => {
  test('match a fresh Portfolio Evidence Workflow run', async () => {
    expect(await findStalePortfolioEvidenceOutputs({ rootDir: projectRoot })).toEqual([]);
  });
});
