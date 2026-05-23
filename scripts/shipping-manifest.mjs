import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

export const shippingManifest = Object.freeze({
  directoryTrees: Object.freeze([
    'assets/data',
    'assets/pdf',
    'assets/portfolio-viewers',
    'assets/presentations',
    'assets/spreadsheets',
    'cv',
  ]),
  files: Object.freeze([
    'assets/blog.json',
  ]),
  rootFiles: Object.freeze({
    extensions: Object.freeze(['.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico', '.pdf']),
  }),
  platformFiles: Object.freeze([
    '_headers',
  ]),
  productionProbes: Object.freeze([
    'assets/blog.json',
    'assets/data/portfolio-ai-context.json',
    'assets/data/portfolio-items.json',
    'assets/pdf/portfolio/adaptive_communication_1.pdf',
    'cv/Profile.pdf',
    '_headers',
  ]),
});

export function toRequestPath(relativePath) {
  return `/${relativePath.split(path.sep).join('/')}`;
}

export function getRootShippedFiles(rootDir) {
  const extensions = new Set(shippingManifest.rootFiles.extensions);

  return readdirSync(rootDir)
    .filter((file) => {
      const source = path.resolve(rootDir, file);
      return statSync(source).isFile() && extensions.has(path.extname(file).toLowerCase());
    });
}

export function getProductionAssetProbePaths(rootDir) {
  return shippingManifest.productionProbes
    .filter((relativePath) => existsSync(path.resolve(rootDir, relativePath)))
    .map(toRequestPath);
}
