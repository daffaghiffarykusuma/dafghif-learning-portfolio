import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { createPublicationSourceFacts } from '../../src/site/publication-source-facts.ts';
import { validatePortfolioEvidence } from './portfolio-evidence-validator.ts';
import { createShippedArtifactPolicy } from '../site/shipped-artifact-policy.ts';
import {
  createSourceSiteInventory,
  idsForSource
} from '../site/site-inventory.ts';

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

type ValidateLearningPortfolioSiteOptions = {
  rootDir?: string;
  allowedExternalHosts?: ReadonlySet<string>;
};

const defaultAllowedExternalHosts = new Set([
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdn-images-1.medium.com',
  'miro.medium.com',
  'medium.com',
  'www.linkedin.com',
  'rumahsiapkerja.com',
  'wa.link'
]);

const pathExists = async (filePath: string) => {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
};

const isExternal = (value: string) =>
  /^[a-z][a-z\d+.-]*:/i.test(value) || value.startsWith('//');

const splitUrl = (value: string) => {
  const [withoutFragment, fragment = ''] = value.split('#');
  const [pathname] = withoutFragment.split('?');
  return { pathname, fragment };
};

type CspDirectives = Record<string, readonly string[]>;
type CspRule = { source: string; value: string };

// Publication contracts apply independently to both hosting configurations.
// Exact source lists also prevent a new directive from overriding a restriction.
const cspContracts: Readonly<Record<string, CspDirectives>> = {
  '/*': {
    'default-src': ["'self'"],
    'script-src': ["'self'"],
    'connect-src': ["'self'"],
    'style-src': ["'self'", 'https://fonts.googleapis.com'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'img-src': ["'self'", 'data:', 'https://cdn-images-1.medium.com', 'https://miro.medium.com'],
    'frame-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'self'"],
    'upgrade-insecure-requests': []
  },
  '/assets/portfolio-viewers/*': {
    'default-src': ["'self'"],
    'script-src': ["'none'"],
    'connect-src': ["'none'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:'],
    'font-src': ["'none'"],
    'frame-src': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'none'"],
    'form-action': ["'none'"],
    'frame-ancestors': ["'self'"],
    'upgrade-insecure-requests': []
  },
  '/assets/pdf/portfolio/*': {
    'default-src': ["'none'"],
    'script-src': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'none'"],
    'form-action': ["'none'"],
    'frame-ancestors': ["'self'"]
  }
};

const validateCspRules = (file: string, rules: CspRule[]): string[] => {
  const failures: string[] = [];
  for (const source of Object.keys(cspContracts)) {
    const count = rules.filter((rule) => rule.source === source).length;
    if (count !== 1) failures.push(`${file} ${source}: expected exactly one Content-Security-Policy; found ${count}`);
  }
  for (const { source, value } of rules) {
    const label = `${file} ${source}`;
    const contract = Object.hasOwn(cspContracts, source) ? cspContracts[source] : undefined;
    if (!contract) {
      failures.push(`${label}: CSP route has no reviewed publication contract`);
      continue;
    }
    const directives = new Map<string, string[]>();
    for (const segment of value.split(';').map((part) => part.trim()).filter(Boolean)) {
      const [rawName, ...sources] = segment.split(/\s+/);
      const name = rawName.toLowerCase();
      if (directives.has(name)) failures.push(`${label}: duplicate CSP directive ${name}`);
      directives.set(name, sources);
      if (!Object.hasOwn(contract, name)) failures.push(`${label}: unreviewed CSP directive ${name}`);
    }
    for (const [name, expected] of Object.entries(contract)) {
      const actual = directives.get(name);
      if (!actual || [...new Set(actual)].sort().join(' ') !== [...expected].sort().join(' ')) {
        failures.push(`${label}: ${name} must be ${expected.join(' ') || 'present without values'}`);
      }
    }
  }
  return failures;
};

const validateSecurityHeaders = async (rootDir: string): Promise<string[]> => {
  const failures: string[] = [];
  try {
    const rules: CspRule[] = [];
    let source = '';
    for (const line of (await readFile(path.join(rootDir, '_headers'), 'utf8')).split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      if (!/^\s/.test(line)) {
        source = trimmed;
        continue;
      }
      const csp = trimmed.match(/^Content-Security-Policy\s*:\s*(.*)$/i);
      if (csp) rules.push({ source, value: csp[1] });
    }
    failures.push(...validateCspRules('_headers', rules));
  } catch {
    failures.push('_headers: cannot read security header configuration');
  }
  try {
    const config: unknown = JSON.parse(await readFile(path.join(rootDir, 'vercel.json'), 'utf8'));
    if (!config || typeof config !== 'object' || !('headers' in config) || !Array.isArray(config.headers)) {
      failures.push('vercel.json: headers must be an array');
    } else {
      const rules: CspRule[] = [];
      for (const rule of config.headers) {
        if (!rule || typeof rule.source !== 'string' || !Array.isArray(rule.headers)) {
          failures.push('vercel.json: each header rule must have a source and headers array');
          continue;
        }
        for (const header of rule.headers) {
          if (typeof header?.key !== 'string' || typeof header.value !== 'string') {
            failures.push(`vercel.json ${rule.source}: header key and value must be strings`);
          } else if (header.key.toLowerCase() === 'content-security-policy') {
            // These are the configured Vercel patterns, not a general route matcher.
            rules.push({ source: rule.source.replace(/\(\.\*\)$/, '*'), value: header.value });
          }
        }
      }
      failures.push(...validateCspRules('vercel.json', rules));
    }
  } catch {
    failures.push('vercel.json: cannot read or parse security header configuration');
  }
  return failures;
};

export const validateLearningPortfolioSite = async ({
  rootDir = process.cwd(),
  allowedExternalHosts = defaultAllowedExternalHosts
}: ValidateLearningPortfolioSiteOptions = {}): Promise<LearningPortfolioSiteValidationResult> => {
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
    if (pathname && !(await pathExists(targetPath))) {
      failures.push(`${file}: missing local ${attr} target: ${value}`);
      return;
    }
    if (!fragment) return;

    const decodedFragment = decodeUrlPart(file, attr, fragment);
    if (decodedFragment === null) return;
    const targetSource = targetPath === filePath
      ? source
      : await readFile(targetPath, 'utf8').catch(() => '');
    const targetIds = targetPath === filePath
      ? pageIds
      : new Set(idsForSource(targetSource));
    if (!targetIds.has(decodedFragment)) {
      failures.push(`${file}: broken fragment in ${attr}: ${value}`);
    }
  };

  const sourceInventory = await createSourceSiteInventory({
    rootDir
  });
  for (const page of sourceInventory.htmlPages) {
    const pageIds = new Set(page.ids);
    if (!page.relPath.includes('/') && /Publication (?:Title|Thumbnail) \d+|\[Brief description or abstract placeholder\]/i.test(page.source.replace(/<!--[\s\S]*?-->/g, ''))) {
      failures.push(`${page.relPath}: contains unfinished publication placeholder copy`);
    }
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
      if (!(await pathExists(targetPath))) {
        failures.push(`${cssFile.relPath}: missing CSS asset target: ${value}`);
      }
    }
  }

  failures.push(...await validateSecurityHeaders(rootDir));

  const blogJson: unknown = JSON.parse(
    await readFile(path.join(rootDir, 'assets/blog.json'), 'utf8')
  );
  const publicationSource = createPublicationSourceFacts(blogJson, {
    sourceName: 'assets/blog.json'
  });
  failures.push(...publicationSource.failures);

  const portfolioEvidence = await validatePortfolioEvidence({
    root: rootDir
  });
  failures.push(...portfolioEvidence.failures);

  const productionProbeFacts = createShippedArtifactPolicy({ rootDir })
    .productionProbeFacts();
  for (const probe of productionProbeFacts) {
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
      shippedArtifactProbes: productionProbeFacts.length
    }
  };
};

export const formatLearningPortfolioSiteValidationSummary = ({
  counts
}: Pick<LearningPortfolioSiteValidationResult, 'counts'>) =>
  `Validated ${counts.htmlFiles} HTML files, ${counts.cssFiles} CSS files, ${counts.blogPosts} blog posts, ${counts.portfolioItems} portfolio items, ${counts.shippedArtifactProbes} shipped Artifact probes, local assets, fragments, external host allowlists, target=_blank rels, and CSP policies.`;
