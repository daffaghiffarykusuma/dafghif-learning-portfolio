import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

export const shippedArtifactPolicy = Object.freeze({
  shippedDirectoryTrees: Object.freeze([
    'assets/data',
    'assets/pdf',
    'assets/portfolio-viewers',
  ]),
  shippedFiles: Object.freeze([
    'assets/blog.json',
    'cv/Profile.pdf',
  ]),
  routablePages: Object.freeze([
    'case-administrative-communication.html',
    'case-employee-assessment-bootcamp.html',
    'case-learning-organization-strategy.html',
    'case-ybb-mentoring-workbook.html',
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
    'assets/pdf/portfolio/employee_assessment_individual_report_redacted.pdf',
    'case-studies.html',
    'case-employee-assessment-bootcamp.html',
    'case-ybb-mentoring-workbook.html',
    'cv/Profile.pdf',
    '_headers',
  ]),
  denyRules: Object.freeze({
    editableOfficeExtensions: Object.freeze(['.docx', '.pptx', '.xlsx']),
  }),
});

export const shippingManifest = Object.freeze({
  directoryTrees: shippedArtifactPolicy.shippedDirectoryTrees,
  files: shippedArtifactPolicy.shippedFiles,
  routablePages: shippedArtifactPolicy.routablePages,
  rootFiles: shippedArtifactPolicy.rootFiles,
  platformFiles: shippedArtifactPolicy.platformFiles,
  productionProbes: shippedArtifactPolicy.productionProbes,
  denyRules: shippedArtifactPolicy.denyRules,
});

export function toPosixPath(value) {
  return value.split(path.sep).join('/');
}

export function toRequestPath(relativePath) {
  return `/${toPosixPath(relativePath)}`;
}

export function createShippedArtifactPolicy({
  rootDir = process.cwd(),
  policy = shippedArtifactPolicy
} = {}) {
  const normalize = (relativePath) => toPosixPath(relativePath);
  const isDeniedPath = (relativePath) => {
    const extension = path.extname(relativePath).toLowerCase();
    return policy.denyRules.editableOfficeExtensions.includes(extension);
  };
  const isPublicPath = (relativePath) => {
    const normalizedPath = normalize(relativePath);
    if (isDeniedPath(normalizedPath)) return false;
    if (policy.shippedFiles.includes(normalizedPath)) return true;
    if (policy.routablePages.includes(normalizedPath)) return true;
    if (policy.platformFiles.includes(normalizedPath)) return true;

    return policy.shippedDirectoryTrees.some(
      (directory) => normalizedPath === directory || normalizedPath.startsWith(`${directory}/`)
    );
  };
  const rootShippedFiles = () => {
    const extensions = new Set(policy.rootFiles.extensions);
    return readdirSync(rootDir)
      .filter((file) => {
        const source = path.resolve(rootDir, file);
        return statSync(source).isFile() && extensions.has(path.extname(file).toLowerCase());
      });
  };
  const productionProbeFacts = () => policy.productionProbes.map((relativePath) => ({
    path: relativePath,
    requestPath: toRequestPath(relativePath),
    existsInSource: existsSync(path.resolve(rootDir, relativePath)),
  }));
  const productionAssetProbePaths = () => productionProbeFacts()
    .filter((probe) => probe.existsInSource)
    .map((probe) => probe.requestPath);
  const deniedArtifactFacts = (relativePaths = []) => relativePaths
    .map(normalize)
    .filter(isDeniedPath)
    .map((relativePath) => ({
      path: relativePath,
      rule: 'editable Office source files must not ship',
    }));
  const validationFacts = ({ distRelativePaths = [] } = {}) => ({
    productionProbes: productionProbeFacts(),
    deniedArtifacts: deniedArtifactFacts(distRelativePaths),
    publicRoots: policy.shippedDirectoryTrees,
    publicFiles: policy.shippedFiles,
    routablePages: policy.routablePages,
  });

  return {
    policy,
    shippingManifest,
    rootShippedFiles,
    productionAssetProbePaths,
    productionProbeFacts,
    deniedArtifactFacts,
    validationFacts,
    isDeniedPath,
    isPublicPath,
  };
}

export function getRootShippedFiles(rootDir) {
  return createShippedArtifactPolicy({ rootDir }).rootShippedFiles();
}

export function getProductionAssetProbePaths(rootDir) {
  return createShippedArtifactPolicy({ rootDir }).productionAssetProbePaths();
}

export function isDeniedShippedArtifactPath(relativePath) {
  return createShippedArtifactPolicy().isDeniedPath(relativePath);
}

export function isPublicShippedArtifactPath(relativePath) {
  return createShippedArtifactPolicy().isPublicPath(relativePath);
}

export function getDeniedShippedArtifactFacts(relativePaths) {
  return createShippedArtifactPolicy().deniedArtifactFacts(relativePaths);
}

export function getProductionProbeFacts(rootDir) {
  return createShippedArtifactPolicy({ rootDir }).productionProbeFacts();
}

export function getShippedArtifactValidationFacts({ rootDir, distRelativePaths = [] }) {
  return createShippedArtifactPolicy({ rootDir }).validationFacts({ distRelativePaths });
}
