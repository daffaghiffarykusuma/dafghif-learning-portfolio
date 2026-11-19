import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

// Responsive Images: a build step over the generated HTML. Source pages keep one
// plain `src` per image; an <img> that declares its layout slot with `sizes`
// gets smaller WebP renditions in `srcset`, so phones and 1x screens stop
// downloading 1,200-1,500px thumbnails for 400px cards. The original stays the
// largest candidate, so nothing renders softer than before. Every local raster
// <img> without dimensions also gets its intrinsic width/height, so the browser
// can reserve space before the file arrives.

/** Rendition widths. Covers ~400px cards at 1x, phones at ~2x, and wide slots at 2x+. */
export const RESPONSIVE_IMAGE_WIDTHS = Object.freeze([480, 800, 1200]);
// A rendition must save at least this share of the original's width to be worth a file.
const MIN_WIDTH_SAVING = 0.1;
const WEBP_OPTIONS = Object.freeze({ quality: 80, effort: 5, smartSubsample: true });
const RASTER_IMAGE = /\.(?:webp|png|jpe?g)$/i;
// Rendition files are named after the original's content-hashed file plus this
// fingerprint of the rendering settings, so their URLs stay immutable-cache safe
// and repeat text gzip already saw in `src` (random hashes would not compress).
const RENDITION_FINGERPRINT = createHash('sha256')
  .update(JSON.stringify({ WEBP_OPTIONS, RESPONSIVE_IMAGE_WIDTHS }))
  .digest('base64url')
  .slice(0, 6);

/** `assets/immutable/card-AbC123.webp` + 480 → `assets/immutable/card-AbC123-480w-<fingerprint>.webp` */
export const renditionFileName = (originalFileName: string, width: number) =>
  `${originalFileName.replace(/\.[^./]+$/, '')}-${width}w-${RENDITION_FINGERPRINT}.webp`;

export type ImageFacts = { width: number; height: number };
export type ImageRendition = { url: string; width: number };
/** Resolves a built `src` to its intrinsic size and renditions, or null to leave the tag alone. */
export type ImageResolver = (src: string, wantsRenditions: boolean) =>
  Promise<{ facts: ImageFacts; renditions: ImageRendition[] } | null>;

export const renditionWidthsFor = (originalWidth: number) =>
  RESPONSIVE_IMAGE_WIDTHS.filter((width) => width <= originalWidth * (1 - MIN_WIDTH_SAVING));

const IMG_TAG = /<img\b[^>]*>/gi;
const hasAttribute = (tag: string, name: string) => new RegExp(`\\s${name}(?:\\s*=|[\\s/>])`, 'i').test(tag);
const readAttribute = (tag: string, name: string) =>
  tag.match(new RegExp(`\\s${name}\\s*=\\s*"([^"]*)"`, 'i'))?.[1];

/** Adds srcset/width/height to the <img> tags in one HTML document. */
export const addResponsiveImageAttributes = async (html: string, resolve: ImageResolver) => {
  const tags = [...new Set(html.match(IMG_TAG) || [])];
  let output = html;
  for (const tag of tags) {
    const src = readAttribute(tag, 'src');
    if (!src || !RASTER_IMAGE.test(src)) continue;
    const wantsRenditions = hasAttribute(tag, 'sizes') && !hasAttribute(tag, 'srcset');
    const needsDimensions = !hasAttribute(tag, 'width') && !hasAttribute(tag, 'height');
    if (!wantsRenditions && !needsDimensions) continue;
    const resolved = await resolve(src, wantsRenditions);
    if (!resolved) continue;
    const added: string[] = [];
    if (wantsRenditions && resolved.renditions.length) {
      const candidates = [...resolved.renditions, { url: src, width: resolved.facts.width }]
        .map(({ url, width }) => `${url} ${width}w`);
      added.push(`srcset="${candidates.join(', ')}"`);
    }
    if (needsDimensions) added.push(`width="${resolved.facts.width}" height="${resolved.facts.height}"`);
    if (!added.length) continue;
    const rewritten = tag.replace(/\s*\/?>$/, (end) => ` ${added.join(' ')}${end.trim() === '/>' ? ' />' : '>'}`);
    output = output.split(tag).join(rewritten);
  }
  return output;
};

type BundleAsset = { type: 'asset'; fileName: string; source: string | Uint8Array; originalFileNames?: readonly string[] };
type BundleChunk = { type: 'chunk'; fileName: string };
type PluginContext = {
  emitFile: (file: { type: 'asset'; fileName: string; source: Uint8Array }) => string;
};

type ResponsiveImagesOptions = { rootDir: string; cacheDir?: string };

/** Vite plugin: rewrites built HTML and emits the renditions as hashed assets. */
export const responsiveImages = ({ rootDir, cacheDir = path.join(rootDir, 'node_modules/.cache/responsive-images') }: ResponsiveImagesOptions) => {
  const renderRendition = async (source: Buffer, width: number) => {
    const key = createHash('sha256').update(source).update(JSON.stringify({ width, WEBP_OPTIONS })).digest('hex');
    const cached = path.join(cacheDir, `${key}.webp`);
    try {
      return await readFile(cached);
    } catch {
      const rendered = await sharp(source).resize({ width }).webp(WEBP_OPTIONS).toBuffer();
      await mkdir(cacheDir, { recursive: true });
      await writeFile(cached, rendered);
      return rendered;
    }
  };

  return {
    name: 'responsive-images',
    apply: 'build' as const,
    generateBundle: {
      order: 'post' as const,
      async handler(this: PluginContext, _options: unknown, bundle: Record<string, BundleAsset | BundleChunk>) {
        const assets = Object.values(bundle).filter((item): item is BundleAsset => item.type === 'asset');
        const renditionsByAsset = new Map<string, Promise<{ facts: ImageFacts; renditions: { fileName: string; width: number }[] } | null>>();

        const describeAsset = (asset: BundleAsset, wantsRenditions: boolean) => {
          const key = `${asset.fileName}|${wantsRenditions}`;
          if (!renditionsByAsset.has(key)) {
            renditionsByAsset.set(key, (async () => {
              const source = Buffer.from(typeof asset.source === 'string' ? Buffer.from(asset.source) : asset.source);
              const { width, height } = await sharp(source).metadata();
              if (!width || !height) return null;
              const renditions = wantsRenditions
                ? await Promise.all(renditionWidthsFor(width).map(async (renditionWidth) => {
                  const fileName = renditionFileName(asset.fileName, renditionWidth);
                  this.emitFile({ type: 'asset', fileName, source: await renderRendition(source, renditionWidth) });
                  return { fileName, width: renditionWidth };
                }))
                : [];
              return { facts: { width, height }, renditions };
            })());
          }
          return renditionsByAsset.get(key)!;
        };

        for (const page of assets.filter((asset) => asset.fileName.endsWith('.html'))) {
          const html = typeof page.source === 'string' ? page.source : Buffer.from(page.source).toString('utf8');
          page.source = await addResponsiveImageAttributes(html, async (src, wantsRenditions) => {
            // Built pages reference assets relative to themselves; keep that prefix for renditions.
            const asset = assets.find((item) => src.endsWith(item.fileName) && RASTER_IMAGE.test(item.fileName));
            if (!asset) return null;
            const prefix = src.slice(0, src.length - asset.fileName.length);
            const described = await describeAsset(asset, wantsRenditions);
            if (!described) return null;
            return {
              facts: described.facts,
              renditions: described.renditions.map(({ fileName, width }) => ({ url: `${prefix}${fileName}`, width }))
            };
          });
        }
      }
    }
  };
};
