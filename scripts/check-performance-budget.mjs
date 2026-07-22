import path from 'node:path';
import { createShippedArtifactPolicy } from './shipped-artifact-policy.ts';
import { createDistSiteInventory } from './site-inventory.ts';

const root = process.cwd();
const dist = path.join(root, 'dist');
const failures = [];

const limits = {
  totalDistBytes: 112 * 1024 * 1024,
  jsGzipBytes: 24 * 1024,
  cssGzipBytes: 28 * 1024,
  largestImageBytes: 1024 * 1024,
  portfolioHtmlGzipBaselineBytes: 15.8 * 1024,
  portfolioHtmlGzipStretchBytes: 14.22 * 1024,
  caseStudyHtmlGzipBytes: 5 * 1024,
};

const {
  records,
  gzipBytesForExtensions,
  gzipBytesForPath,
  previewIframeSources
} = await createDistSiteInventory({ rootDir: root, distDir: dist });
const shippedArtifactPolicy = createShippedArtifactPolicy({ rootDir: root });

const sum = (items) => items.reduce((total, item) => total + item.size, 0);
const toKB = (bytes) => Number((bytes / 1024).toFixed(2));

const totalDistBytes = sum(records);
const jsGzipBytes = gzipBytesForExtensions(['.js']);
const cssGzipBytes = gzipBytesForExtensions(['.css']);
const imageRecords = records.filter((item) => ['.png', '.jpg', '.jpeg', '.webp', '.svg'].includes(item.ext));
const largestImage = imageRecords.sort((a, b) => b.size - a.size)[0];
const shippedProbeRecords = new Set(records.map((item) => item.rel));
const htmlRecords = records.filter((item) => item.ext === '.html');
const portfolioHtmlGzipBytes = shippedProbeRecords.has('portfolio.html')
  ? gzipBytesForPath('portfolio.html')
  : 0;
const caseStudyHtmlGzip = htmlRecords
  .filter((item) => item.rel.startsWith('case-') && item.rel !== 'case-studies.html')
  .map((item) => ({
    path: item.rel,
    gzipBytes: gzipBytesForPath(item.rel),
  }));

if (totalDistBytes > limits.totalDistBytes) {
  failures.push(`dist total ${(totalDistBytes / 1024 / 1024).toFixed(2)} MB exceeds ${(limits.totalDistBytes / 1024 / 1024).toFixed(2)} MB`);
}
if (jsGzipBytes > limits.jsGzipBytes) {
  failures.push(`JS gzip ${(jsGzipBytes / 1024).toFixed(2)} KB exceeds ${(limits.jsGzipBytes / 1024).toFixed(2)} KB`);
}
if (cssGzipBytes > limits.cssGzipBytes) {
  failures.push(`CSS gzip ${(cssGzipBytes / 1024).toFixed(2)} KB exceeds ${(limits.cssGzipBytes / 1024).toFixed(2)} KB`);
}
if (!portfolioHtmlGzipBytes) {
  failures.push('portfolio.html missing from dist');
} else if (portfolioHtmlGzipBytes > limits.portfolioHtmlGzipBaselineBytes) {
  failures.push(`portfolio.html gzip ${toKB(portfolioHtmlGzipBytes)} KB exceeds baseline guard ${toKB(limits.portfolioHtmlGzipBaselineBytes)} KB`);
}
for (const page of caseStudyHtmlGzip) {
  if (page.gzipBytes > limits.caseStudyHtmlGzipBytes) {
    failures.push(`${page.path} gzip ${toKB(page.gzipBytes)} KB exceeds ${toKB(limits.caseStudyHtmlGzipBytes)} KB`);
  }
}
if (largestImage && largestImage.size > limits.largestImageBytes) {
  failures.push(`largest image ${largestImage.rel} ${(largestImage.size / 1024).toFixed(1)} KB exceeds ${(limits.largestImageBytes / 1024).toFixed(1)} KB`);
}
for (const probe of shippedArtifactPolicy.productionProbeFacts()) {
  if (!shippedProbeRecords.has(probe.path)) {
    failures.push(`Shipped Artifact Policy probe missing from dist: ${probe.path}`);
  }
}
for (const page of previewIframeSources) {
  for (const src of page.sources) {
    if (src) {
      failures.push(`${page.path} loads preview iframe before click: ${src}`);
    }
  }
}

const metrics = {
  totalDistMB: Number((totalDistBytes / 1024 / 1024).toFixed(2)),
  jsGzipKB: toKB(jsGzipBytes),
  cssGzipKB: toKB(cssGzipBytes),
  portfolioHtml: {
    gzipKB: toKB(portfolioHtmlGzipBytes),
    baselineGuardKB: toKB(limits.portfolioHtmlGzipBaselineBytes),
    stretchTargetKB: toKB(limits.portfolioHtmlGzipStretchBytes),
    stretchTargetMet: portfolioHtmlGzipBytes <= limits.portfolioHtmlGzipStretchBytes,
  },
  caseStudyHtml: caseStudyHtmlGzip.map((page) => ({
    path: page.path,
    gzipKB: toKB(page.gzipBytes),
    limitKB: toKB(limits.caseStudyHtmlGzipBytes),
  })),
  previewIframeInitialLoad: previewIframeSources.map((page) => ({
    path: page.path,
    sources: page.sources,
  })),
  largestImage: largestImage ? {
    path: largestImage.rel,
    KB: Number((largestImage.size / 1024).toFixed(1)),
  } : null,
};

if (failures.length) {
  console.error(failures.join('\n'));
  console.error(JSON.stringify(metrics, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(metrics, null, 2));
