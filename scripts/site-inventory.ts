import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const DEFAULT_IGNORED_DIRS = new Set(['.git', '.vscode', 'dist', 'node_modules']);

type SourceUrlAttribute = { attr: string; value: string };
type SourceHtmlPage = {
  filePath: string;
  relPath: string;
  source: string;
  ids: string[];
  urlAttributes: SourceUrlAttribute[];
  blankTargetTags: string[];
  hasInlineScript: boolean;
  hasInlineEventHandler: boolean;
};
type SourceCssFile = {
  filePath: string;
  relPath: string;
  source: string;
  urls: string[];
};
export type SourceSiteInventory = {
  rootDir: string;
  htmlPages: SourceHtmlPage[];
  cssFiles: SourceCssFile[];
};
type DistSiteRecord = {
  file: string;
  rel: string;
  size: number;
  ext: string;
};
type PreviewIframeSources = { path: string; sources: string[] };
export type ProductionSiteInventoryFacts = {
  rootDir: string;
  distDir: string;
  records: DistSiteRecord[];
  gzipBytesForExtensions: (extensions: readonly string[]) => number;
  gzipBytesForPath: (rel: string) => number;
  previewIframeSources: PreviewIframeSources[];
};

export const toPosixPath = (value: string) => value.split(path.sep).join('/');

const globFiles = (dir: string, pattern: string): Promise<string[]> => Array.fromAsync(
  new Bun.Glob(pattern).scan({ cwd: dir, absolute: true, onlyFiles: true })
);

export const idsForSource = (source: string) =>
  Array.from(source.matchAll(/\bid=["']([^"']+)["']/gi), (match) => match[1]);

export const urlAttributesForSource = (source: string): SourceUrlAttribute[] =>
  Array.from(source.matchAll(/\b(href|src|data-pdf|data-viewer)=["']([^"']+)["']/gi), (match) => ({
    attr: match[1],
    value: match[2]
  }));

export const cssUrlsForSource = (source: string) =>
  Array.from(source.matchAll(/url\((["']?)([^"')]+)\1\)/gi), (match) => match[2].trim())
    .filter(Boolean);

export const createSourceSiteInventory = async ({
  rootDir = process.cwd(),
  ignoredDirs = DEFAULT_IGNORED_DIRS
}: { rootDir?: string; ignoredDirs?: ReadonlySet<string> } = {}): Promise<SourceSiteInventory> => {
  const rel = (absolutePath: string) => toPosixPath(path.relative(rootDir, absolutePath));
  const isIgnored = (absolutePath: string) => rel(absolutePath).split('/').some((part) => ignoredDirs.has(part));
  const htmlPaths = (await globFiles(rootDir, '**/*.html')).filter((file) => !isIgnored(file)).sort();
  const cssPaths = (await globFiles(rootDir, '**/*.css')).filter((file) => !isIgnored(file)).sort();

  const htmlPages = await Promise.all(htmlPaths.map(async (filePath) => {
    const source = await readFile(filePath, 'utf8');
    return {
      filePath,
      relPath: rel(filePath),
      source,
      ids: idsForSource(source),
      urlAttributes: urlAttributesForSource(source),
      blankTargetTags: Array.from(source.matchAll(/<a\b[^>]*target=["']_blank["'][^>]*>/gi), (match) => match[0]),
      hasInlineScript: /<script(?![^>]*\bsrc=)[^>]*>/i.test(source),
      hasInlineEventHandler: /\son\w+=["']/i.test(source)
    };
  }));

  const cssFiles = await Promise.all(cssPaths.map(async (filePath) => {
    const source = await readFile(filePath, 'utf8');
    return {
      filePath,
      relPath: rel(filePath),
      source,
      urls: cssUrlsForSource(source)
    };
  }));

  return { rootDir, htmlPages, cssFiles };
};

export const createDistSiteInventory = async ({
  rootDir = process.cwd(),
  distDir = path.join(rootDir, 'dist')
}: { rootDir?: string; distDir?: string } = {}): Promise<ProductionSiteInventoryFacts> => {
  const files = await globFiles(distDir, '**/*');
  const contents = new Map<string, Buffer>();
  const records = await Promise.all(files.sort().map(async (file) => {
    const size = (await stat(file)).size;
    const ext = path.extname(file).toLowerCase();
    const rel = toPosixPath(path.relative(distDir, file));
    if (['.html', '.js', '.css'].includes(ext)) {
      contents.set(rel, await readFile(file));
    }
    return {
      file,
      rel,
      size,
      ext
    };
  }));

  const gzipBytesForExtensions = (extensions: readonly string[]) => gzipSync(Buffer.concat(
    records
      .filter((record) => extensions.includes(record.ext))
      .flatMap((record) => {
        const content = contents.get(record.rel);
        return content ? [content] : [];
      })
  )).length;
  const gzipBytesForPath = (rel: string) => {
    const content = contents.get(rel);
    return content ? gzipSync(content).length : 0;
  };
  const previewIframeSources = records
    .filter((record) => record.ext === '.html')
    .map((record) => {
      const content = contents.get(record.rel);
      return {
        path: record.rel,
        sources: content ? [...content.toString('utf8').matchAll(
          /<iframe\b[^>]*\bid="pdf-iframe"[^>]*\bsrc="([^"]*)"/g
        )].map((match) => match[1]) : []
      };
    })
    .filter((page) => page.sources.length);

  return {
    rootDir,
    distDir,
    records,
    gzipBytesForExtensions,
    gzipBytesForPath,
    previewIframeSources
  };
};
