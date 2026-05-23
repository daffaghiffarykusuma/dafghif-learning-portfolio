import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { basename, extname, resolve } from 'node:path';
import { getRootShippedFiles, shippingManifest } from './scripts/shipping-manifest.mjs';

const root = process.cwd();

const htmlInputs = Object.fromEntries(
  readdirSync(root)
    .filter((file) => extname(file) === '.html')
    .map((file) => [basename(file, '.html'), resolve(root, file)]),
);

function copyStaticFiles() {
  return {
    name: 'copy-static-files',
    closeBundle() {
      const outDir = resolve(root, 'dist');
      mkdirSync(outDir, { recursive: true });

      for (const directory of shippingManifest.directoryTrees) {
        const source = resolve(root, directory);
        if (existsSync(source)) {
          cpSync(source, resolve(outDir, directory), { recursive: true, force: true });
        }
      }

      for (const file of shippingManifest.files) {
        const source = resolve(root, file);
        if (existsSync(source)) {
          const target = resolve(outDir, file);
          mkdirSync(resolve(target, '..'), { recursive: true });
          copyFileSync(source, target);
        }
      }

      for (const file of getRootShippedFiles(root)) {
        copyFileSync(resolve(root, file), resolve(outDir, file));
      }

      for (const file of shippingManifest.platformFiles) {
        const source = resolve(root, file);
        if (existsSync(source)) {
          copyFileSync(source, resolve(outDir, file));
        }
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
