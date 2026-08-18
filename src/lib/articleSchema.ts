/**
 * Shared JSON-LD builders for the three article channels (sport / tech / positive).
 * Keeps Google Discover requirements in one place: honest image dimensions and
 * trustworthy publish / modify dates.
 */

export const SITE_URL = "https://szortsy.pl";

const PUBLISHER = {
  "@type": "Organization",
  name: "Szortsy",
  logo: { "@type": "ImageObject", url: `${SITE_URL}/logo-seo.png` },
} as const;

/** Minimum width Google Discover expects for a large image preview. */
export const DISCOVER_MIN_IMAGE_WIDTH = 1200;

/**
 * ImageObject with real dimensions when we know them.
 * We never invent width/height — a lie is worse than a missing value,
 * because Google verifies the file and drops the large preview.
 */
export function buildImageObject(
  url?: string | null,
  width?: number | null,
  height?: number | null,
) {
  if (!url) return undefined;
  const hasDims = typeof width === "number" && width > 0 && typeof height === "number" && height > 0;
  return {
    "@type": "ImageObject",
    url,
    ...(hasDims ? { width, height } : {}),
  };
}

/**
 * dateModified is only meaningful when the edit was substantial.
 * Anything within 5 minutes of publishing is treated as part of publishing.
 */
export function resolveArticleDates(
  publishedAt?: string | null,
  updatedAt?: string | null,
): { datePublished?: string; dateModified?: string } {
  if (!publishedAt) {
    return updatedAt ? { datePublished: updatedAt } : {};
  }
  if (!updatedAt) return { datePublished: publishedAt };

  const published = new Date(publishedAt).getTime();
  const updated = new Date(updatedAt).getTime();
  if (!Number.isFinite(published) || !Number.isFinite(updated)) {
    return { datePublished: publishedAt };
  }
  const FIVE_MIN = 5 * 60 * 1000;
  if (updated - published < FIVE_MIN) return { datePublished: publishedAt };
  return { datePublished: publishedAt, dateModified: updatedAt };
}

export function buildAuthor(displayName?: string | null, slug?: string | null) {
  if (!displayName) return { "@type": "Organization", name: "Szortsy" };
  return {
    "@type": "Person",
    name: displayName,
    ...(slug ? { url: `${SITE_URL}/autor/${slug}` } : {}),
  };
}

export function buildBreadcrumbList(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export interface ArticleSchemaInput {
  type: "NewsArticle" | "Article";
  canonical: string;
  headline: string;
  description?: string | null;
  imageUrl?: string | null;
  imageWidth?: number | null;
  imageHeight?: number | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  authorName?: string | null;
  authorSlug?: string | null;
  section?: string | null;
  keywords?: string[] | null;
  sourceUrl?: string | null;
}

export function buildArticleSchema(input: ArticleSchemaInput) {
  const image = buildImageObject(input.imageUrl, input.imageWidth, input.imageHeight);
  const dates = resolveArticleDates(input.publishedAt, input.updatedAt);

  return {
    "@context": "https://schema.org",
    "@type": input.type,
    mainEntityOfPage: { "@type": "WebPage", "@id": input.canonical },
    headline: input.headline,
    ...(input.description ? { description: input.description } : {}),
    ...(image ? { image } : {}),
    ...dates,
    author: buildAuthor(input.authorName, input.authorSlug),
    publisher: PUBLISHER,
    ...(input.sourceUrl ? { isBasedOn: input.sourceUrl } : {}),
    ...(input.section ? { articleSection: input.section } : {}),
    ...(input.keywords?.length ? { keywords: input.keywords } : {}),
    inLanguage: "pl-PL",
  };
}

/** OG article:* time tags derived from the same date hygiene rules. */
export function buildArticleTimeMeta(publishedAt?: string | null, updatedAt?: string | null) {
  const { datePublished, dateModified } = resolveArticleDates(publishedAt, updatedAt);
  return [
    ...(datePublished ? [{ property: "article:published_time", content: datePublished }] : []),
    ...(dateModified ? [{ property: "article:modified_time", content: dateModified }] : []),
  ];
}

export interface ReviewSchemaInput {
  canonical: string;
  headline: string;
  /** Ocena w skali 0-10 (jak w CMS-ie). */
  score?: number | null;
  productName?: string | null;
  productBrand?: string | null;
  imageUrl?: string | null;
  description?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  authorName?: string | null;
  authorSlug?: string | null;
}

/**
 * Schema.org Review dla recenzji Tech — warunek gwiazdek w wynikach Google.
 * Zwraca undefined, gdy nie mamy oceny lub nazwy produktu: bez tych dwóch pól
 * Google odrzuca rich result, a niepełny markup szkodzi bardziej niż jego brak.
 */
export function buildReviewSchema(input: ReviewSchemaInput) {
  const productName = input.productName?.trim();
  const hasScore = typeof input.score === "number" && input.score > 0;
  if (!productName || !hasScore) return undefined;

  const dates = resolveArticleDates(input.publishedAt, input.updatedAt);

  return {
    "@context": "https://schema.org",
    "@type": "Review",
    url: input.canonical,
    name: input.headline,
    ...(input.description ? { reviewBody: input.description } : {}),
    ...dates,
    itemReviewed: {
      "@type": "Product",
      name: productName,
      ...(input.productBrand
        ? { brand: { "@type": "Brand", name: input.productBrand } }
        : {}),
      ...(input.imageUrl ? { image: input.imageUrl } : {}),
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: Number(input.score).toFixed(1),
      bestRating: "10",
      worstRating: "1",
    },
    author: buildAuthor(input.authorName, input.authorSlug),
    publisher: PUBLISHER,
    inLanguage: "pl-PL",
  };
}
