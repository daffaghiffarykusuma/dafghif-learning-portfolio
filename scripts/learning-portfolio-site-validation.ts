import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { createPublicationSourceFacts } from '../src/site/publication-source-facts.ts';
import { validatePortfolioEvidence } from './portfolio-evidence-validator.ts';
import { createShippedArtifactPolicy } from './shipped-artifact-policy.ts';
import {
  createSourceSiteInventory,
  idsForSource
} from './site-inventory.ts';
import type { SourceSiteInventory } from './site-inventory.ts';
import type { PortfolioEvidenceValidationResult } from './portfolio-evidence-validator.ts';
import type { CreatedShippedArtifactPolicy } from './shipped-artifact-policy.ts';

export type LearningPortfolioSiteValidationCounts = {
  htmlFiles: number;
  cssFiles: number;
  blogPosts: number;
  portfolioItems: number;
  shippedArtifactProbes: number;
};

export type LearningPortfolioSiteValidationResult = {
  failures: string[];
  counts: LearningPortfolioSiteValidationCounts;
};

type LearningPortfolioSiteValidationAdapters = {
  createSourceSiteInventory: (options: { rootDir: string }) => Promise<SourceSiteInventory>;
  readText: (filePath: string) => Promise<string>;
  pathExists: (filePath: string) => Promise<boolean>;
  validatePortfolioEvidence: (options: { root: string }) => Promise<PortfolioEvidenceValidationResult>;
  createShippedArtifactPolicy: (
    options: { rootDir: string }
  ) => Pick<CreatedShippedArtifactPolicy, 'validationFacts'>;
};

type ValidateLearningPortfolioSiteOptions = {
  rootDir?: string;
  allowedExternalHosts?: ReadonlySet<string>;
  adapters?: Partial<LearningPortfolioSiteValidationAdapters>;
};

const defaultAllowedExternalHosts = new Set([
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdn-images-1.medium.com',
  'miro.medium.com',
  'medium.com',
  'www.linkedin.com',
  'wa.link'
]);

const defaultAdapters: LearningPortfolioSiteValidationAdapters = Object.freeze({
  createSourceSiteInventory,
  readText: (filePath: string) => readFile(filePath, 'utf8'),
  pathExists: async (filePath: string) => {
    try {
      await stat(filePath);
      return true;
    } catch {
      return false;
    }
  },
  validatePortfolioEvidence,
  createShippedArtifactPolicy
});

const isExternal = (value: string) =>
  /^[a-z][a-z\d+.-]*:/i.test(value) || value.startsWith('//');

const splitUrl = (value: string) => {
  const [withoutFragment, fragment = ''] = value.split('#');
  const [pathname] = withoutFragment.split('?');
  return { pathname, fragment };
};

export const validateLearningPortfolioSite = async ({
  rootDir = process.cwd(),
  allowedExternalHosts = defaultAllowedExternalHosts,
  adapters = {}
}: ValidateLearningPortfolioSiteOptions = {}): Promise<LearningPortfolioSiteValidationResult> => {
  const dependencies = { ...defaultAdapters, ...adapters };
  const failures: string[] = [];
  const decodeUrlPart = (file: string, attr: string, value: string): string | null => {
    try {
      return decodeURIComponent(value);
    } catch {
      failures.push(`${file}: ${attr} uses invalid percent-encoding: ${value}`);
      return null;
    }
  };
  const isInsideRoot = (targetPath: string) => {
    const relativePath = path.relative(rootDir, targetPath);
    return relativePath === ''
      || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
  };
  const validateExternal = (file: string, attr: string, value: string) => {
    const url = value.startsWith('//') ? new URL(`https:${value}`) : new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'mailto:' && url.protocol !== 'tel:') {
      failures.push(`${file}: ${attr} uses non-HTTPS URL: ${value}`);
    }
    if (
      url.protocol === 'https:'
      && !allowedExternalHosts.has(url.hostname.toLowerCase())
    ) {
      failures.push(`${file}: ${attr} uses unreviewed external host: ${url.hostname}`);
    }
  };
  const validateUrl = async ({
    file,
    filePath,
    attr,
    rawValue,
    source,
    pageIds
  }: {
    file: string;
    filePath: string;
    attr: string;
    rawValue: string;
    source: string;
    pageIds: Set<string>;
  }) => {
    const value = rawValue.trim();
    if (
      !value
      || value.startsWith('mailto:')
      || value.startsWith('tel:')
      || value.startsWith('data:')
    ) {
      return;
    }
    if (isExternal(value)) {
      validateExternal(file, attr, value);
      return;
    }

    const { pathname, fragment } = splitUrl(value);
    const decodedPathname = pathname
      ? decodeUrlPart(file, attr, pathname)
      : '';
    if (decodedPathname === null) return;
    const targetPath = pathname
      ? path.resolve(path.dirname(filePath), decodedPathname)
      : filePath;

    if (!isInsideRoot(targetPath)) {
      failures.push(`${file}: local ${attr} escapes the project root: ${value}`);
      return;
    }
    if (pathname && !(await dependencies.pathExists(targetPath))) {
      failures.push(`${file}: missing local ${attr} target: ${value}`);
      return;
    }
    if (!fragment) return;

    const decodedFragment = decodeUrlPart(file, attr, fragment);
    if (decodedFragment === null) return;
    const targetSource = targetPath === filePath
      ? source
      : await dependencies.readText(targetPath).catch(() => '');
    const targetIds = targetPath === filePath
      ? pageIds
      : new Set(idsForSource(targetSource));
    if (!targetIds.has(decodedFragment)) {
      failures.push(`${file}: broken fragment in ${attr}: ${value}`);
    }
  };

  const sourceInventory = await dependencies.createSourceSiteInventory({
    rootDir
  });
  for (const page of sourceInventory.htmlPages) {
    const pageIds = new Set(page.ids);
    if (page.hasInlineScript) {
      failures.push(
        `${page.relPath}: contains inline script; use an external JS file so CSP can block inline execution`
      );
    }
    if (page.hasInlineEventHandler) {
      failures.push(
        `${page.relPath}: contains inline event handler; use external JavaScript instead`
      );
    }
    for (const attribute of page.urlAttributes) {
      await validateUrl({
        file: page.relPath,
        filePath: page.filePath,
        attr: attribute.attr,
        rawValue: attribute.value,
        source: page.source,
        pageIds
      });
    }
    for (const tag of page.blankTargetTags) {
      if (!/\brel=["'][^"']*\bnoopener\b[^"']*\bnoreferrer\b[^"']*["']/i.test(tag)) {
        failures.push(
          `${page.relPath}: target="_blank" link is missing rel="noopener noreferrer": ${tag}`
        );
      }
    }
  }

  for (const cssFile of sourceInventory.cssFiles) {
    for (const value of cssFile.urls) {
      if (!value || value.startsWith('data:') || value.startsWith('#')) continue;
      if (isExternal(value)) {
        validateExternal(cssFile.relPath, 'css url()', value);
        continue;
      }
      const { pathname } = splitUrl(value);
      const decodedPathname = decodeUrlPart(
        cssFile.relPath,
        'css url()',
        pathname
      );
      if (decodedPathname === null) continue;
      const targetPath = path.resolve(path.dirname(cssFile.filePath), decodedPathname);
      if (!isInsideRoot(targetPath)) {
        failures.push(
          `${cssFile.relPath}: CSS asset target escapes the project root: ${value}`
        );
        continue;
      }
      if (!(await dependencies.pathExists(targetPath))) {
        failures.push(`${cssFile.relPath}: missing CSS asset target: ${value}`);
      }
    }
  }

  const headers = await dependencies.readText(path.join(rootDir, '_headers'));
  const csp = headers.match(/Content-Security-Policy:\s*(.+)/i)?.[1] || '';
  if (/\bscript-src\b[^;\n]*'unsafe-inline'/.test(csp)) {
    failures.push('_headers: script-src still allows unsafe-inline');
  }
  if (/\bstyle-src\b[^;\n]*'unsafe-inline'/.test(csp)) {
    failures.push('_headers: top-level style-src still allows unsafe-inline');
  }
  if (!/\bconnect-src\b/.test(csp)) {
    failures.push('_headers: CSP should declare connect-src for fetch destinations');
  }

  const blogJson: unknown = JSON.parse(
    await dependencies.readText(path.join(rootDir, 'assets/blog.json'))
  );
  const publicationSource = createPublicationSourceFacts(blogJson, {
    sourceName: 'assets/blog.json'
  });
  failures.push(...publicationSource.failures);

  const portfolioEvidence = await dependencies.validatePortfolioEvidence({
    root: rootDir
  });
  failures.push(...portfolioEvidence.failures);

  const shippedArtifactFacts = dependencies
    .createShippedArtifactPolicy({ rootDir })
    .validationFacts();
  for (const probe of shippedArtifactFacts.productionProbes) {
    if (!probe.existsInSource) {
      failures.push(
        `Shipped Artifact Policy production probe missing from source: ${probe.path}`
      );
    }
  }

  return {
    failures,
    counts: {
      htmlFiles: sourceInventory.htmlPages.length,
      cssFiles: sourceInventory.cssFiles.length,
      blogPosts: publicationSource.publications.length,
      portfolioItems: portfolioEvidence.portfolioItemCount,
      shippedArtifactProbes: shippedArtifactFacts.productionProbes.length
    }
  };
};

export const formatLearningPortfolioSiteValidationSummary = ({
  counts
}: Pick<LearningPortfolioSiteValidationResult, 'counts'>) =>
  `Validated ${counts.htmlFiles} HTML files, ${counts.cssFiles} CSS files, ${counts.blogPosts} blog posts, ${counts.portfolioItems} portfolio items, ${counts.shippedArtifactProbes} shipped Artifact probes, local assets, fragments, external host allowlists, target=_blank rels, and CSP policies.`;
