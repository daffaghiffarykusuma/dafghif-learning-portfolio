import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

export const shippedArtifactInventory = Object.freeze({
  shippedDirectoryTrees: Object.freeze([
    'assets/data',
    'assets/pdf',
    'assets/portfolio-viewers',
  ]),
  shippedFiles: Object.freeze([
    'assets/blog.json',
    'cv/Profile.pdf',
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
  denyRules: Object.freeze({
    editableOfficeExtensions: Object.freeze(['.docx', '.pptx', '.xlsx']),
  }),
});

export const shippingManifest = Object.freeze({
  directoryTrees: shippedArtifactInventory.shippedDirectoryTrees,
  files: shippedArtifactInventory.shippedFiles,
  rootFiles: shippedArtifactInventory.rootFiles,
  platformFiles: shippedArtifactInventory.platformFiles,
  productionProbes: shippedArtifactInventory.productionProbes,
  denyRules: shippedArtifactInventory.denyRules,
});

export function toPosixPath(value) {
  return value.split(path.sep).join('/');
}

export function toRequestPath(relativePath) {
  return `/${toPosixPath(relativePath)}`;
}

export function getRootShippedFiles(rootDir) {
  const extensions = new Set(shippedArtifactInventory.rootFiles.extensions);

  return readdirSync(rootDir)
    .filter((file) => {
      const source = path.resolve(rootDir, file);
      return statSync(source).isFile() && extensions.has(path.extname(file).toLowerCase());
    });
}

export function getProductionAssetProbePaths(rootDir) {
  return shippedArtifactInventory.productionProbes
    .filter((relativePath) => existsSync(path.resolve(rootDir, relativePath)))
    .map(toRequestPath);
}

export function isDeniedShippedArtifactPath(relativePath) {
  const extension = path.extname(relativePath).toLowerCase();
  return shippedArtifactInventory.denyRules.editableOfficeExtensions.includes(extension);
}

export function isPublicShippedArtifactPath(relativePath) {
  const normalizedPath = toPosixPath(relativePath);
  if (isDeniedShippedArtifactPath(normalizedPath)) return false;

  if (shippedArtifactInventory.shippedFiles.includes(normalizedPath)) return true;
  if (shippedArtifactInventory.platformFiles.includes(normalizedPath)) return true;

  return shippedArtifactInventory.shippedDirectoryTrees.some(
    (directory) => normalizedPath === directory || normalizedPath.startsWith(`${directory}/`)
  );
}

export function getDeniedShippedArtifactFacts(relativePaths) {
  return relativePaths
    .map(toPosixPath)
    .filter(isDeniedShippedArtifactPath)
    .map((relativePath) => ({
      path: relativePath,
      rule: 'editable Office source files must not ship',
    }));
}

export function getProductionProbeFacts(rootDir) {
  return shippedArtifactInventory.productionProbes.map((relativePath) => ({
    path: relativePath,
    requestPath: toRequestPath(relativePath),
    existsInSource: existsSync(path.resolve(rootDir, relativePath)),
  }));
}

export function getShippedArtifactValidationFacts({ rootDir, distRelativePaths = [] }) {
  const productionProbes = getProductionProbeFacts(rootDir);
  const deniedArtifacts = getDeniedShippedArtifactFacts(distRelativePaths);

  return {
    productionProbes,
    deniedArtifacts,
    publicRoots: shippedArtifactInventory.shippedDirectoryTrees,
    publicFiles: shippedArtifactInventory.shippedFiles,
  };
}
