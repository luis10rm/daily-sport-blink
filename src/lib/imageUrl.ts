/**
 * Image URL optimization helpers.
 *
 * Images stored in our backend storage are served as full-resolution PNGs
 * (often 1-3 MB). The storage layer exposes an on-the-fly image transformation
 * endpoint (`/storage/v1/render/image/public/...`) which resizes and converts
 * to WebP for browsers that accept it — typically a 90-95% size reduction.
 *
 * These helpers rewrite storage URLs to the transformation endpoint and build
 * responsive `srcset` strings. Any URL that is not a storage object URL
 * (external images, team crests, local /images/* files) is returned untouched.
 */

const OBJECT_MARKER = "/storage/v1/object/public/";
const RENDER_MARKER = "/storage/v1/render/image/public/";

export const isTransformableUrl = (url?: string | null): boolean =>
  !!url && (url.includes(OBJECT_MARKER) || url.includes(RENDER_MARKER));

export interface OptimizeOptions {
  width?: number;
  quality?: number;
  resize?: "cover" | "contain" | "fill";
}

/**
 * Returns a resized/re-encoded variant of a storage image URL.
 * Non-storage URLs are returned as-is.
 */
export const optimizeImageUrl = (
  url?: string | null,
  { width = 800, quality = 70, resize = "cover" }: OptimizeOptions = {}
): string => {
  if (!url) return "";
  if (!isTransformableUrl(url)) return url;

  const base = url.includes(RENDER_MARKER)
    ? url.split("?")[0]
    : url.split("?")[0].replace(OBJECT_MARKER, RENDER_MARKER);

  const params = new URLSearchParams({
    width: String(Math.round(width)),
    quality: String(quality),
    resize,
  });

  return `${base}?${params.toString()}`;
};

/** Default responsive widths used for content images. */
export const DEFAULT_WIDTHS = [400, 640, 800, 1200, 1600];

/**
 * Builds a `srcset` for a storage image. Returns undefined when the URL can't
 * be transformed (so the plain `src` is used instead).
 */
export const buildSrcSet = (
  url?: string | null,
  widths: number[] = DEFAULT_WIDTHS,
  quality = 70
): string | undefined => {
  if (!isTransformableUrl(url)) return undefined;
  return widths
    .map((w) => `${optimizeImageUrl(url, { width: w, quality })} ${w}w`)
    .join(", ");
};
