import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { basename, extname, resolve } from 'node:path';

const root = process.cwd();

const htmlInputs = Object.fromEntries(
  readdirSync(root)
    .filter((file) => extname(file) === '.html')
    .map((file) => [basename(file, '.html'), resolve(root, file)]),
);

const staticDirectories = [
  'assets/data',
  'assets/pdf',
  'assets/portfolio-viewers',
  'assets/presentations',
  'assets/spreadsheets',
  'cv',
];
const staticFiles = ['assets/blog.json'];
const rootStaticExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico', '.pdf']);

function copyStaticFiles() {
  return {
    name: 'copy-static-files',
    closeBundle() {
      const outDir = resolve(root, 'dist');
      mkdirSync(outDir, { recursive: true });

      for (const directory of staticDirectories) {
        const source = resolve(root, directory);
        if (existsSync(source)) {
          cpSync(source, resolve(outDir, directory), { recursive: true, force: true });
        }
      }

      for (const file of staticFiles) {
        const source = resolve(root, file);
        if (existsSync(source)) {
          const target = resolve(outDir, file);
          mkdirSync(resolve(target, '..'), { recursive: true });
          copyFileSync(source, target);
        }
      }

      for (const file of readdirSync(root)) {
        const source = resolve(root, file);
        if (statSync(source).isFile() && rootStaticExtensions.has(extname(file).toLowerCase())) {
          copyFileSync(source, resolve(outDir, file));
        }
      }

      const headers = resolve(root, '_headers');
      if (existsSync(headers)) {
        copyFileSync(headers, resolve(outDir, '_headers'));
      }
    },
  };
}

export default {
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: htmlInputs,
    },
  },
  plugins: [copyStaticFiles()],
};
