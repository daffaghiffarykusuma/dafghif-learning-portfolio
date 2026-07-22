import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { createCaseStudyPublication } from './case-study-publication.ts';
import type { PortfolioItemSourceInput } from './portfolio-item-source-validator.ts';

type ShippedArtifactPolicy = Readonly<{
  shippedDirectoryTrees: readonly string[];
  shippedFiles: readonly string[];
  rootFiles: Readonly<{ extensions: readonly string[] }>;
  platformFiles: readonly string[];
  excludedFiles: readonly string[];
  productionProbes: readonly string[];
  denyRules: Readonly<{ editableOfficeExtensions: readonly string[] }>;
}>;

export type ShippingManifest = Readonly<{
  directoryTrees: readonly string[];
  files: readonly string[];
  routablePages: readonly string[];
  platformFiles: readonly string[];
}>;

type ProductionProbeFact = {
  path: string;
  requestPath: string;
  existsInSource: boolean;
};

type PortfolioSourceOptions = {
  rootDir?: string;
  portfolioSource?: PortfolioItemSourceInput;
};

type CreatePolicyOptions = PortfolioSourceOptions & {
  policy?: ShippedArtifactPolicy;
};

const shippedArtifactPolicy: ShippedArtifactPolicy = Object.freeze({
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

function toPosixPath(value: string) {
  return value.split(path.sep).join('/');
}

function toRequestPath(relativePath: string) {
  return `/${toPosixPath(relativePath)}`;
}

const readPortfolioSource = (rootDir: string): PortfolioItemSourceInput => {
  try {
    const source: unknown = JSON.parse(
      readFileSync(path.resolve(rootDir, 'assets/data/portfolio-source.json'), 'utf8'),
    );
    return source !== null && typeof source === 'object' && !Array.isArray(source)
      ? source as PortfolioItemSourceInput
      : {};
  } catch {
    return {};
  }
};

const getRoutableCaseStudyPagePaths = ({
  rootDir = process.cwd(),
  portfolioSource = readPortfolioSource(rootDir)
}: PortfolioSourceOptions = {}): string[] => createCaseStudyPublication(portfolioSource)
  .pageIdentities
  .map((identity: { pagePath: string }) => identity.pagePath);

const createShippingManifest = ({
  rootDir,
  policy,
  portfolioSource,
}: Required<CreatePolicyOptions>): ShippingManifest => {
  const routablePages = Object.freeze(getRoutableCaseStudyPagePaths({ rootDir, portfolioSource }));

  return Object.freeze({
    directoryTrees: policy.shippedDirectoryTrees,
    files: policy.shippedFiles,
    routablePages,
    platformFiles: policy.platformFiles,
  });
};

export type CreatedShippedArtifactPolicy = {
  shippingManifest: ShippingManifest;
  rootShippedFiles: () => string[];
  productionProbeFacts: () => ProductionProbeFact[];
  isDeniedPath: (relativePath: string) => boolean;
  isExcludedPath: (relativePath: string) => boolean;
  isPublicPath: (relativePath: string) => boolean;
};

export function createShippedArtifactPolicy({
  rootDir = process.cwd(),
  policy = shippedArtifactPolicy,
  portfolioSource = readPortfolioSource(rootDir)
}: CreatePolicyOptions = {}): CreatedShippedArtifactPolicy {
  const manifest = createShippingManifest({ rootDir, policy, portfolioSource });
  const productionProbePaths = [...new Set([
    ...policy.productionProbes,
    ...manifest.routablePages
  ])];
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
  const productionProbeFacts = (): ProductionProbeFact[] => productionProbePaths.map((relativePath) => ({
    path: relativePath,
    requestPath: toRequestPath(relativePath),
    existsInSource: existsSync(path.resolve(rootDir, relativePath)),
  }));

  return {
    shippingManifest: manifest,
    rootShippedFiles,
    productionProbeFacts,
    isDeniedPath,
    isExcludedPath,
    isPublicPath,
  };
}
