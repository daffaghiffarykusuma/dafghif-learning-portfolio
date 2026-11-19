import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { basename, extname, relative, resolve } from 'node:path';
import { responsiveImages } from './scripts/site/responsive-images.ts';
import { createShippedArtifactPolicy } from './scripts/site/shipped-artifact-policy.ts';

const root = process.cwd();
const shippedArtifacts = createShippedArtifactPolicy({ rootDir: root });
const { shippingManifest } = shippedArtifacts;

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
          cpSync(source, resolve(outDir, directory), {
            recursive: true,
            force: true,
            filter: (sourcePath) => {
              const relativePath = relative(root, sourcePath);
              return !shippedArtifacts.isDeniedPath(relativePath)
                && !shippedArtifacts.isExcludedPath(relativePath);
            },
          });
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

      for (const file of shippedArtifacts.rootShippedFiles()) {
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
    // Every content-hashed build file lives here, so hosting can cache this one
    // folder as immutable (see _headers and vercel.json). Copied public assets
    // keep their stable URLs elsewhere under assets/.
    assetsDir: 'assets/immutable',
    // Keep images as cacheable files: base64 inlining would put lazy, below-the-fold
    // avatars into every page's HTML and skip the responsive-images step.
    assetsInlineLimit: (filePath) => (/\.(?:webp|png|jpe?g|gif|avif|svg)$/i.test(filePath) ? false : undefined),
    rollupOptions: {
      input: htmlInputs,
    },
  },
  plugins: [responsiveImages({ rootDir: root }), copyStaticFiles()],
};
