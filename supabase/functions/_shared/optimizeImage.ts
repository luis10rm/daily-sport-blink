import { decode, Image } from "https://deno.land/x/imagescript@1.3.0/mod.ts";

export interface OptimizeResult {
  bytes: Uint8Array;
  contentType: string;
  extension: string;
}

/**
 * Downscales an AI generated image and re-encodes it.
 * - `keepAlpha: true`  -> PNG output (icons, logos with transparency)
 * - `keepAlpha: false` -> JPEG output (article covers), much smaller than PNG
 *
 * Falls back to the original bytes if anything goes wrong, so image
 * generation never fails because of optimization.
 */
export async function optimizeImageBytes(
  input: Uint8Array,
  {
    maxWidth = 1600,
    keepAlpha = false,
    quality = 80,
  }: { maxWidth?: number; keepAlpha?: boolean; quality?: number } = {}
): Promise<OptimizeResult> {
  const fallback: OptimizeResult = keepAlpha
    ? { bytes: input, contentType: "image/png", extension: "png" }
    : { bytes: input, contentType: "image/png", extension: "png" };

  try {
    const decoded = await decode(input);
    if (!(decoded instanceof Image)) return fallback;

    if (decoded.width > maxWidth) {
      decoded.resize(maxWidth, Image.RESIZE_AUTO);
    }

    if (keepAlpha) {
      const bytes = await decoded.encode(6); // PNG, max compression
      return bytes.length < input.length
        ? { bytes, contentType: "image/png", extension: "png" }
        : fallback;
    }

    const bytes = await decoded.encodeJPEG(quality);
    return bytes.length < input.length
      ? { bytes, contentType: "image/jpeg", extension: "jpg" }
      : fallback;
  } catch (err) {
    console.error("[optimizeImageBytes] failed, using original:", err);
    return fallback;
  }
}
