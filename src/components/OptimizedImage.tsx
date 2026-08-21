import { ImgHTMLAttributes } from "react";
import { buildSrcSet, optimizeImageUrl, DEFAULT_WIDTHS } from "@/lib/imageUrl";

type Priority = "high" | "low" | "auto";

export interface OptimizedImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, "srcSet" | "src"> {
  src?: string | null;
  /** `sizes` attribute — describes the rendered width so the browser picks the right variant. */
  sizes?: string;
  /** Candidate widths for the srcset. */
  widths?: number[];
  /** WebP quality (1-100). */
  quality?: number;
  /** Width used for the fallback `src` (older browsers ignoring srcset). */
  fallbackWidth?: number;
  priority?: Priority;
}

/**
 * Drop-in `<img>` replacement that serves resized WebP variants for images
 * hosted in our storage and leaves external/local images untouched.
 */
export const OptimizedImage = ({
  src,
  alt = "",
  sizes = "100vw",
  widths = DEFAULT_WIDTHS,
  quality = 70,
  fallbackWidth = 800,
  priority = "auto",
  loading,
  decoding = "async",
  ...rest
}: OptimizedImageProps) => {
  const srcSet = buildSrcSet(src, widths, quality);
  const resolvedSrc = optimizeImageUrl(src, { width: fallbackWidth, quality });

  return (
    <img
      src={resolvedSrc}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      loading={loading ?? (priority === "high" ? "eager" : "lazy")}
      decoding={priority === "high" ? "sync" : decoding}
      // @ts-ignore - fetchpriority is valid HTML but not typed in React 18
      fetchpriority={priority}
      {...rest}
    />
  );
};

export default OptimizedImage;
