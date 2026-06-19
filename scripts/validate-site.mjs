import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  formatLearningPortfolioSiteValidationSummary,
  validateLearningPortfolioSite
} from './learning-portfolio-site-validation.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const result = await validateLearningPortfolioSite({ rootDir });

if (result.failures.length > 0) {
  console.error(result.failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(formatLearningPortfolioSiteValidationSummary(result));
}
