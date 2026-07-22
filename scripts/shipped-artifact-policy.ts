import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { createCaseStudyPublication } from './case-study-publication.mjs';

type ShippedArtifactPolicy = Readonly<{
  shippedDirectoryTrees: readonly string[];
  shippedFiles: readonly string[];
  rootFiles: Readonly<{ extensions: readonly string[] }>;
  platformFiles: readonly string[];
  excludedFiles: readonly string[];
  productionProbes: readonly string[];
  denyRules: Readonly<{ editableOfficeExtensions: readonly string[] }>;
}>;

type PortfolioSource = Record<string, unknown>;

type PortfolioSourceOptions = {
  rootDir?: string;
  portfolioSource?: PortfolioSource;
};

type CreatePolicyOptions = PortfolioSourceOptions & {
  policy?: ShippedArtifactPolicy;
};

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
  rootFiles: Object.freeze({
    extensions: Object.freeze(['.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico', '.pdf']),
  }),
  platformFiles: Object.freeze([
    '_headers',
  ]),
  excludedFiles: Object.freeze([
    'assets/pdf/portfolio/7_habits.pdf',
    'assets/pdf/portfolio/[SUT] Jualan Mulainya Darimana.pdf',
    'assets/pdf/portfolio/adaptability.pdf',
    'assets/pdf/portfolio/[KJ] Pitch Deck Creation.pdf',
    'assets/pdf/portfolio/[KJ] Customer Relationship.pdf',
    'assets/pdf/portfolio/[CA] Presentation Skill.pdf',
    'assets/pdf/portfolio/[ToT] Salesmanship.pdf',
    'assets/pdf/portfolio/[ToT] Evaluasi Segmen Pasar & Strategi Penjualan.pdf',
    'assets/pdf/portfolio/PPT Webinar Facing Loneliness.pdf',
  ]),
  productionProbes: Object.freeze([
    'assets/blog.json',
    'assets/data/portfolio-ai-context.json',
    'assets/data/portfolio-items.json',
    'assets/pdf/portfolio/adaptive_communication_1.pdf',
    'assets/pdf/portfolio/employee_assessment_individual_report_redacted.pdf',
    'case-studies.html',
    'cv/Profile.pdf',
    '_headers',
  ]),
  denyRules: Object.freeze({
    editableOfficeExtensions: Object.freeze(['.docx', '.pptx', '.xlsx']),
  }),
});

export function toPosixPath(value: string) {
  return value.split(path.sep).join('/');
}

export function toRequestPath(relativePath: string) {
  return `/${toPosixPath(relativePath)}`;
}

const readPortfolioSource = (rootDir: string): PortfolioSource => {
  try {
    const source: unknown = JSON.parse(
      readFileSync(path.resolve(rootDir, 'assets/data/portfolio-source.json'), 'utf8'),
    );
    return source !== null && typeof source === 'object' && !Array.isArray(source)
      ? source as PortfolioSource
      : {};
  } catch {
    return {};
  }
};

export const getRoutableCaseStudyPagePaths = ({
  rootDir = process.cwd(),
  portfolioSource = readPortfolioSource(rootDir)
}: PortfolioSourceOptions = {}): string[] => createCaseStudyPublication(portfolioSource)
  .pageIdentities
  .map((identity: { pagePath: string }) => identity.pagePath);

const createShippingManifest = ({
  rootDir,
  policy,
  portfolioSource,
}: Required<CreatePolicyOptions>) => {
  const routablePages = Object.freeze(getRoutableCaseStudyPagePaths({ rootDir, portfolioSource }));
  const productionProbes = Object.freeze([...new Set([
    ...policy.productionProbes,
    ...routablePages
  ])]);

  return Object.freeze({
    directoryTrees: policy.shippedDirectoryTrees,
    files: policy.shippedFiles,
    routablePages,
    rootFiles: policy.rootFiles,
    platformFiles: policy.platformFiles,
    excludedFiles: policy.excludedFiles,
    productionProbes,
    denyRules: policy.denyRules,
  });
};

export function createShippedArtifactPolicy({
  rootDir = process.cwd(),
  policy = shippedArtifactPolicy,
  portfolioSource = readPortfolioSource(rootDir)
}: CreatePolicyOptions = {}) {
  const manifest = createShippingManifest({ rootDir, policy, portfolioSource });
  const normalize = (relativePath: string) => toPosixPath(relativePath);
  const isDeniedPath = (relativePath: string) => {
    const extension = path.extname(relativePath).toLowerCase();
    return policy.denyRules.editableOfficeExtensions.includes(extension);
  };
  const isExcludedPath = (relativePath: string) =>
    policy.excludedFiles.includes(normalize(relativePath));
  const isPublicPath = (relativePath: string) => {
    const normalizedPath = normalize(relativePath);
    if (isDeniedPath(normalizedPath) || isExcludedPath(normalizedPath)) return false;
    if (policy.shippedFiles.includes(normalizedPath)) return true;
    if (manifest.routablePages.includes(normalizedPath)) return true;
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
  const productionProbeFacts = () => manifest.productionProbes.map((relativePath) => ({
    path: relativePath,
    requestPath: toRequestPath(relativePath),
    existsInSource: existsSync(path.resolve(rootDir, relativePath)),
  }));
  const productionAssetProbePaths = () => productionProbeFacts()
    .filter((probe) => probe.existsInSource)
    .map((probe) => probe.requestPath);
  const deniedArtifactFacts = (relativePaths: readonly string[] = []) => relativePaths
    .map(normalize)
    .filter(isDeniedPath)
    .map((relativePath) => ({
      path: relativePath,
      rule: 'editable Office source files must not ship',
    }));
  const validationFacts = ({
    distRelativePaths = [],
  }: { distRelativePaths?: readonly string[] } = {}) => ({
    productionProbes: productionProbeFacts(),
    deniedArtifacts: deniedArtifactFacts(distRelativePaths),
    publicRoots: policy.shippedDirectoryTrees,
    publicFiles: policy.shippedFiles,
    routablePages: manifest.routablePages,
  });

  return {
    policy,
    shippingManifest: manifest,
    rootShippedFiles,
    productionAssetProbePaths,
    productionProbeFacts,
    deniedArtifactFacts,
    validationFacts,
    isDeniedPath,
    isExcludedPath,
    isPublicPath,
  };
}
