import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { getProductionProbeFacts } from './shipped-artifact-inventory.mjs';

const root = process.cwd();
const dist = path.join(root, 'dist');
const failures = [];

const limits = {
  totalDistBytes: 112 * 1024 * 1024,
  jsGzipBytes: 24 * 1024,
  cssGzipBytes: 28 * 1024,
  largestImageBytes: 1024 * 1024,
};

const walk = async (dir, results = []) => {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(target, results);
    } else {
      results.push(target);
    }
  }
  return results;
};

const files = await walk(dist);
const records = await Promise.all(files.map(async (file) => {
  const size = (await stat(file)).size;
  return {
    file,
    rel: path.relative(dist, file).split(path.sep).join('/'),
    size,
    ext: path.extname(file).toLowerCase(),
  };
}));

const sum = (items) => items.reduce((total, item) => total + item.size, 0);
const totalDistBytes = sum(records);
const jsGzipBytes = gzipSync(Buffer.concat(await Promise.all(
  records.filter((item) => item.ext === '.js').map((item) => readFile(item.file))
))).length;
const cssGzipBytes = gzipSync(Buffer.concat(await Promise.all(
  records.filter((item) => item.ext === '.css').map((item) => readFile(item.file))
))).length;
const imageRecords = records.filter((item) => ['.png', '.jpg', '.jpeg', '.webp', '.svg'].includes(item.ext));
const largestImage = imageRecords.sort((a, b) => b.size - a.size)[0];
const shippedProbeRecords = new Set(records.map((item) => item.rel));

if (totalDistBytes > limits.totalDistBytes) {
  failures.push(`dist total ${(totalDistBytes / 1024 / 1024).toFixed(2)} MB exceeds ${(limits.totalDistBytes / 1024 / 1024).toFixed(2)} MB`);
}
if (jsGzipBytes > limits.jsGzipBytes) {
  failures.push(`JS gzip ${(jsGzipBytes / 1024).toFixed(2)} KB exceeds ${(limits.jsGzipBytes / 1024).toFixed(2)} KB`);
}
if (cssGzipBytes > limits.cssGzipBytes) {
  failures.push(`CSS gzip ${(cssGzipBytes / 1024).toFixed(2)} KB exceeds ${(limits.cssGzipBytes / 1024).toFixed(2)} KB`);
}
if (largestImage && largestImage.size > limits.largestImageBytes) {
  failures.push(`largest image ${largestImage.rel} ${(largestImage.size / 1024).toFixed(1)} KB exceeds ${(limits.largestImageBytes / 1024).toFixed(1)} KB`);
}
for (const probe of getProductionProbeFacts(root)) {
  if (!shippedProbeRecords.has(probe.path)) {
    failures.push(`shipping manifest probe missing from dist: ${probe.path}`);
  }
}

const metrics = {
  totalDistMB: Number((totalDistBytes / 1024 / 1024).toFixed(2)),
  jsGzipKB: Number((jsGzipBytes / 1024).toFixed(2)),
  cssGzipKB: Number((cssGzipBytes / 1024).toFixed(2)),
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
