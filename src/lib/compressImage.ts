/**
 * Client-side image compression used before uploading to storage.
 *
 * Editors often paste 2-3 MB PNGs straight from AI tools or screenshots.
 * We downscale to a sane max width and re-encode as WebP, which typically
 * cuts the file to 100-250 kB with no visible quality loss.
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  /** Skip compression for files already below this size (bytes). */
  skipBelowBytes?: number;
}

const loadImage = (file: Blob): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Nie udało się odczytać obrazu"));
    };
    img.src = url;
  });

export const compressImageFile = async (
  file: File,
  {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.82,
    skipBelowBytes = 150 * 1024,
  }: CompressOptions = {}
): Promise<File> => {
  // SVG / GIF and already-small files pass through untouched.
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml" || file.type === "image/gif") {
    return file;
  }
  if (file.size <= skipBelowBytes) return file;

  try {
    const img = await loadImage(file);
    const scale = Math.min(1, maxWidth / img.naturalWidth, maxHeight / img.naturalHeight);
    const targetW = Math.round(img.naturalWidth * scale);
    const targetH = Math.round(img.naturalHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality)
    );
    if (!blob || blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${baseName}.webp`, { type: "image/webp" });
  } catch {
    // Never block an upload because compression failed.
    return file;
  }
};
