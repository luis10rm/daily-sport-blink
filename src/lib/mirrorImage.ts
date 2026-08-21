import { supabase } from "@/integrations/supabase/client";

const STORAGE_MARKERS = [
  "/storage/v1/object/public/",
  "/storage/v1/render/image/public/",
];

/** External images are hot-linked; ours are already optimized. */
export const isExternalImageUrl = (url?: string | null): boolean => {
  if (!url) return false;
  if (url.startsWith("/") || url.startsWith("data:")) return false;
  return !STORAGE_MARKERS.some((m) => url.includes(m));
};

/**
 * Copies an external image into our storage (scaled to 1200px, re-encoded)
 * and returns the new public URL. On any failure the original URL is returned,
 * so saving an article never breaks because of a broken source image.
 */
export const mirrorExternalImage = async (
  url?: string | null
): Promise<string | undefined> => {
  if (!url) return url ?? undefined;
  if (!isExternalImageUrl(url)) return url;

  try {
    const { data, error } = await supabase.functions.invoke("mirror-image", {
      body: { url },
    });
    if (error) throw error;
    if (data?.mirrored && typeof data.url === "string") return data.url;
    if (data?.reason) console.warn("[mirrorExternalImage] skipped:", data.reason);
    return url;
  } catch (err) {
    console.warn("[mirrorExternalImage] failed, keeping original URL:", err);
    return url;
  }
};
