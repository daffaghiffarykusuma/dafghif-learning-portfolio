import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePortfolioEvidence } from './portfolio-evidence-validator.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ignoredDirs = new Set(['.git', '.vscode', 'dist', 'node_modules']);
const allowedExternalHosts = new Set([
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdn-images-1.medium.com',
  'miro.medium.com',
  'medium.com',
  'www.linkedin.com',
  'wa.link'
]);
const failures = [];

const toPosix = (value) => value.split(path.sep).join('/');
const rel = (absolutePath) => toPosix(path.relative(root, absolutePath));

const walk = async (dir, extensions, results = []) => {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) {
        await walk(path.join(dir, entry.name), extensions, results);
      }
      continue;
    }
    if (extensions.has(path.extname(entry.name).toLowerCase())) {
      results.push(path.join(dir, entry.name));
    }
  }
  return results;
};

const exists = async (absolutePath) => {
  try {
    await stat(absolutePath);
    return true;
  } catch {
    return false;
  }
};

const isExternal = (value) => /^[a-z][a-z\d+.-]*:/i.test(value) || value.startsWith('//');

const splitUrl = (value) => {
  const [withoutFragment, fragment = ''] = value.split('#');
  const [pathname] = withoutFragment.split('?');
  return { pathname, fragment };
};

const idsFor = (source) => new Set(
  Array.from(source.matchAll(/\bid=["']([^"']+)["']/gi), (match) => match[1])
);

const decodeUrlPart = (file, attr, value) => {
  try {
    return decodeURIComponent(value);
  } catch {
    failures.push(`${file}: ${attr} uses invalid percent-encoding: ${value}`);
    return null;
  }
};

const isInsideRoot = (targetPath) => {
  const relativePath = path.relative(root, targetPath);
  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
};

const validateExternal = (file, attr, value) => {
  const url = value.startsWith('//') ? new URL(`https:${value}`) : new URL(value);
  if (url.protocol !== 'https:' && url.protocol !== 'mailto:' && url.protocol !== 'tel:') {
    failures.push(`${file}: ${attr} uses non-HTTPS URL: ${value}`);
  }
  if (url.protocol === 'https:' && !allowedExternalHosts.has(url.hostname.toLowerCase())) {
    failures.push(`${file}: ${attr} uses unreviewed external host: ${url.hostname}`);
  }
};

const validateUrl = async ({ file, filePath, attr, rawValue, source, pageIds }) => {
  const value = rawValue.trim();
  if (!value || value.startsWith('mailto:') || value.startsWith('tel:') || value.startsWith('data:')) {
    return;
  }

  if (isExternal(value)) {
    validateExternal(file, attr, value);
    return;
  }

  const { pathname, fragment } = splitUrl(value);
  const baseDir = path.dirname(filePath);
  const decodedPathname = pathname ? decodeUrlPart(file, attr, pathname) : '';
  if (pathname && decodedPathname === null) return;
  const targetPath = pathname ? path.resolve(baseDir, decodedPathname) : filePath;

  if (!isInsideRoot(targetPath)) {
    failures.push(`${file}: local ${attr} escapes the project root: ${value}`);
    return;
  }

  if (pathname && !(await exists(targetPath))) {
    failures.push(`${file}: missing local ${attr} target: ${value}`);
    return;
  }

  if (fragment) {
    const decodedFragment = decodeUrlPart(file, attr, fragment);
    if (decodedFragment === null) return;
    const targetSource = targetPath === filePath ? source : await readFile(targetPath, 'utf8').catch(() => '');
    const targetIds = targetPath === filePath ? pageIds : idsFor(targetSource);
    if (!targetIds.has(decodedFragment)) {
      failures.push(`${file}: broken fragment in ${attr}: ${value}`);
    }
  }
};

const htmlFiles = (await walk(root, new Set(['.html']))).sort();
for (const filePath of htmlFiles) {
  const file = rel(filePath);
  const source = await readFile(filePath, 'utf8');
  const pageIds = idsFor(source);

  if (/<script(?![^>]*\bsrc=)[^>]*>/i.test(source)) {
    failures.push(`${file}: contains inline script; use an external JS file so CSP can block inline execution`);
  }
  if (/\son\w+=["']/i.test(source)) {
    failures.push(`${file}: contains inline event handler; use external JavaScript instead`);
  }

  for (const match of source.matchAll(/\b(href|src|data-pdf|data-viewer)=["']([^"']+)["']/gi)) {
    await validateUrl({ file, filePath, attr: match[1], rawValue: match[2], source, pageIds });
  }

  for (const match of source.matchAll(/<a\b[^>]*target=["']_blank["'][^>]*>/gi)) {
    const tag = match[0];
    if (!/\brel=["'][^"']*\bnoopener\b[^"']*\bnoreferrer\b[^"']*["']/i.test(tag)) {
      failures.push(`${file}: target="_blank" link is missing rel="noopener noreferrer": ${tag}`);
    }
  }
}

const cssFiles = (await walk(root, new Set(['.css']))).sort();
for (const filePath of cssFiles) {
  const file = rel(filePath);
  const source = await readFile(filePath, 'utf8');
  for (const match of source.matchAll(/url\((["']?)([^"')]+)\1\)/gi)) {
    const value = match[2].trim();
    if (!value || value.startsWith('data:') || value.startsWith('#')) continue;
    if (isExternal(value)) {
      validateExternal(file, 'css url()', value);
      continue;
    }
    const { pathname } = splitUrl(value);
    const decodedPathname = decodeUrlPart(file, 'css url()', pathname);
    if (decodedPathname === null) continue;
    const targetPath = path.resolve(path.dirname(filePath), decodedPathname);
    if (!isInsideRoot(targetPath)) {
      failures.push(`${file}: CSS asset target escapes the project root: ${value}`);
      continue;
    }
    if (!(await exists(targetPath))) {
      failures.push(`${file}: missing CSS asset target: ${value}`);
    }
  }
}

const headers = await readFile(path.join(root, '_headers'), 'utf8');
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

const blogJson = JSON.parse(await readFile(path.join(root, 'assets/blog.json'), 'utf8'));
const posts = Array.isArray(blogJson) ? blogJson : blogJson.posts || [];
posts.forEach((post, index) => {
  for (const key of ['url', 'image']) {
    if (!post[key]) continue;
    const value = post[key].trim();
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:') {
        failures.push(`assets/blog.json: post ${index + 1} ${key} is not HTTPS`);
      }
      if (key === 'url') {
        const host = url.hostname.toLowerCase();
        if (host !== 'medium.com' && !host.endsWith('.medium.com')) {
          failures.push(`assets/blog.json: post ${index + 1} URL is not a Medium host`);
        }
      }
      if (key === 'image' && !['cdn-images-1.medium.com', 'miro.medium.com'].includes(url.hostname.toLowerCase())) {
        failures.push(`assets/blog.json: post ${index + 1} image host is not allowlisted`);
      }
    } catch {
      failures.push(`assets/blog.json: post ${index + 1} ${key} is not a valid URL`);
    }
  }
});

const portfolioEvidence = await validatePortfolioEvidence({ root });
failures.push(...portfolioEvidence.failures);

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Validated ${htmlFiles.length} HTML files, ${cssFiles.length} CSS files, ${posts.length} blog posts, ${portfolioEvidence.portfolioItemCount} portfolio items, local assets, fragments, external host allowlists, target=_blank rels, and CSP policies.`);
