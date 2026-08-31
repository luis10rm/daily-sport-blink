import { optimizeImageUrl } from "@/lib/imageUrl";
import { OptimizedImage } from "@/components/OptimizedImage";
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ReckiHeader } from "@/components/recki/ReckiHeader";
import { ReckiFooter } from "@/components/recki/ReckiFooter";
import { ReviewCard } from "@/components/recki/ReviewCard";
import { ReviewFaq, normalizeFaq } from "@/components/recki/ReviewFaq";
import { ReviewBasisBadge } from "@/components/recki/ReviewBasisBadge";
import { CommunityRequestBadge } from "@/components/recki/CommunityRequestBadge";
import { ScoreBadge } from "@/components/recki/ScoreBadge";
import { useReviewBySlug, usePublishedReviews } from "@/hooks/useReviews";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X, ExternalLink, ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { useActiveBannerForDevice } from "@/hooks/useBanners";
import { useIsMobile } from "@/hooks/use-mobile";
import { SponsorBanner } from "@/components/SponsorBanner";
import { Button } from "@/components/ui/button";
import { sanitizePastedHtml } from "@/lib/unescapeHtmlIfEncoded";
import { useSEOMeta } from "@/hooks/useSEOMeta";

const ReckiReview = () => {
  const { slug } = useParams();
  const { data: review, isLoading } = useReviewBySlug(slug);
  const { data: allReviews = [] } = usePublishedReviews();
  const isMobile = useIsMobile();
  const device = isMobile ? "mobile" : "desktop";
  const { data: inlineBanner } = useActiveBannerForDevice("recki_inline" as any, device);
  const { data: articleTopBanner } = useActiveBannerForDevice("recki_article_top" as any, device);
  const { data: articleBottomBanner } = useActiveBannerForDevice("recki_article_bottom" as any, device);
  const { data: stickyMobileBanner } = useActiveBannerForDevice("recki_sticky_mobile" as any, "mobile");

  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  useEffect(() => {
    document.documentElement.classList.add("mode-recki");
    return () => document.documentElement.classList.remove("mode-recki");
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [slug]);

  const canonicalPath = review?.category?.slug && review?.slug
    ? `https://szortsy.pl/tech/${review.category.slug}/${review.slug}`
    : `https://szortsy.pl/tech`;
  useSEOMeta({
    title: review?.title ?? "Tech — recenzja",
    description: review?.excerpt || review?.verdict || "Recenzja na Szortsy Tech.",
    canonical: canonicalPath,
    ogType: "article",
    ogImage: review?.cover_image_url || undefined,
    articlePublishedTime: review?.published_at || undefined,
    articleModifiedTime: review?.updated_at || undefined,
    articleSection: review?.category?.name,
  });

  const related = allReviews
    .filter((r) => r.id !== review?.id && r.category?.id === review?.category?.id)
    .slice(0, 3);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <ReckiHeader />
        <main className="flex-1 container py-6">
          <Skeleton className="h-8 w-2/3 mb-3" />
          <Skeleton className="aspect-[16/9] w-full rounded-xl mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6" />
        </main>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="min-h-screen flex flex-col">
        <ReckiHeader />
        <main className="flex-1 container py-12 text-center">
          <h1 className="text-2xl font-bold">Nie znaleziono wpisu</h1>
          <Link to="/tech" className="text-primary mt-4 inline-block">← Wróć do Tech</Link>
        </main>
      </div>
    );
  }

  const gallery = review.gallery ?? [];

  const renderBanner = (b: any, className = "my-8") =>
    b ? (
      <div className={className}>
        <SponsorBanner
          bannerId={b.id}
          title={b.title}
          description={b.description ?? undefined}
          ctaText={b.cta_text}
          ctaUrl={b.click_tag}
          imageDesktopUrl={b.image_desktop_url ?? undefined}
          imageMobileUrl={b.image_mobile_url ?? undefined}
          impressionTag={b.impression_tag ?? undefined}
        />
      </div>
    ) : null;

  return (
    <div className="min-h-screen flex flex-col">
      <ReckiHeader />
      <main className="flex-1">
        <article className="container max-w-4xl py-6">
          <nav className="mb-3 text-sm text-muted-foreground">
            <Link to="/tech" className="hover:text-foreground">Tech</Link>
            {review.category && (
              <>
                {" · "}
                <Link to={`/tech/kategoria/${review.category.slug}`} className="hover:text-foreground">
                  {review.category.name}
                </Link>
              </>
            )}
          </nav>

          {renderBanner(articleTopBanner, "mb-6")}


          <header className="mb-6">
            <div className="flex flex-wrap items-center gap-2">
              {review.category && (
                <span className="inline-block rounded-full bg-fuchsia-600/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-fuchsia-700 dark:text-fuchsia-300">
                  {review.category.name}
                </span>
              )}
              <CommunityRequestBadge
                active={review.is_community_requested}
                votes={review.request?.votes}
              />
              <ReviewBasisBadge basis={(review as any).review_basis} />
            </div>
            <h1 className="mt-3 text-3xl sm:text-4xl font-bold leading-tight">{review.title}</h1>
            {review.product_brand || review.product_name ? (
              <p className="mt-2 text-muted-foreground">
                {[review.product_brand, review.product_name].filter(Boolean).join(" · ")}
              </p>
            ) : null}

            {review.excerpt && (
              <p className="mt-4 text-lg text-muted-foreground">{review.excerpt}</p>
            )}
          </header>

          {/* Score + Verdict box */}
          {(review.score !== null || review.verdict) && (
            <aside className="mb-8 flex flex-col sm:flex-row gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
              {review.score !== null && (
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <ScoreBadge score={review.score} size="xl" />
                  <span className="text-xs text-muted-foreground">na 10</span>
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-sm font-bold uppercase tracking-wide text-fuchsia-600 dark:text-fuchsia-300">
                  Werdykt
                </h2>
                <p className="mt-1 leading-relaxed text-foreground">
                  {review.verdict ?? review.excerpt}
                </p>
              </div>
            </aside>
          )}

          {/* Cover image */}
          {review.cover_image_url && (
            <div className="mb-8 overflow-hidden rounded-2xl">
              <OptimizedImage
                src={review.cover_image_url}
                alt={review.title}
                className="w-full object-cover"
                priority="high"
                sizes="(min-width: 1024px) 800px, 100vw"
                widths={[400, 640, 800, 1200]}
                fallbackWidth={800}
              />
            </div>
          )}

          {/* Pros / Cons */}
          {(review.pros?.length > 0 || review.cons?.length > 0) && (
            <section className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {review.pros?.length > 0 && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                  <h3 className="mb-2 flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-300">
                    <Check className="h-4 w-4" /> Plusy
                  </h3>
                  <ul className="space-y-1.5 text-sm">
                    {review.pros.map((p, i) => (
                      <li key={i} className="flex gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {review.cons?.length > 0 && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
                  <h3 className="mb-2 flex items-center gap-2 font-bold text-rose-700 dark:text-rose-300">
                    <X className="h-4 w-4" /> Minusy
                  </h3>
                  <ul className="space-y-1.5 text-sm">
                    {review.cons.map((p, i) => (
                      <li key={i} className="flex gap-2">
                        <X className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* Content */}
          {review.content && (
            <div
              className="prose prose-lg dark:prose-invert max-w-none mb-8"
              dangerouslySetInnerHTML={{ __html: sanitizePastedHtml(review.content) }}
            />
          )}

          {/* Gallery */}
          {gallery.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-3">Galeria</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {gallery.map((src, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setLightboxIdx(idx)}
                    className="group relative aspect-square overflow-hidden rounded-lg bg-muted"
                  >
                    <OptimizedImage
                      src={src}
                      alt={`Zdjęcie ${idx + 1}`}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      sizes="(min-width: 768px) 200px, 45vw"
                      widths={[200, 320, 400, 640]}
                      fallbackWidth={400}
                    />
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* FAQ */}
          <ReviewFaq items={normalizeFaq((review as any).faq)} canonicalUrl={canonicalPath} />



          {/* Inline banner */}
          {inlineBanner && (
            <div className="my-8">
              <SponsorBanner
                bannerId={inlineBanner.id}
                title={inlineBanner.title}
                description={inlineBanner.description ?? undefined}
                ctaText={inlineBanner.cta_text}
                ctaUrl={inlineBanner.click_tag}
                imageDesktopUrl={inlineBanner.image_desktop_url ?? undefined}
                imageMobileUrl={inlineBanner.image_mobile_url ?? undefined}
                impressionTag={inlineBanner.impression_tag ?? undefined}
              />
            </div>
          )}

          {review.source_url && (
            <p className="mb-8 text-sm text-muted-foreground">
              Źródło:{" "}
              <a
                href={review.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                {review.source_url} <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </p>
          )}

          {related.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-3">Podobne wpisy</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {related.map((r) => (
                  <ReviewCard key={r.id} review={r} />
                ))}
              </div>
            </section>
          )}

          {renderBanner(articleBottomBanner, "mt-10")}
        </article>
      </main>

      {/* Sticky mobile banner */}
      {stickyMobileBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur sm:hidden">
          <div className="container py-2">
            <SponsorBanner
              bannerId={stickyMobileBanner.id}
              title={stickyMobileBanner.title}
              description={stickyMobileBanner.description ?? undefined}
              ctaText={stickyMobileBanner.cta_text}
              ctaUrl={stickyMobileBanner.click_tag}
              imageDesktopUrl={stickyMobileBanner.image_desktop_url ?? undefined}
              imageMobileUrl={stickyMobileBanner.image_mobile_url ?? undefined}
              impressionTag={stickyMobileBanner.impression_tag ?? undefined}
            />
          </div>
        </div>
      )}


      {/* Lightbox */}
      {lightboxIdx !== null && gallery[lightboxIdx] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxIdx(null)}
        >
          <img
            src={optimizeImageUrl(gallery[lightboxIdx], { width: 1600, quality: 78 })}
            alt=""
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIdx((i) => (i === null ? 0 : (i - 1 + gallery.length) % gallery.length));
            }}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIdx((i) => (i === null ? 0 : (i + 1) % gallery.length));
            }}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        </div>
      )}

      <ReckiFooter />
    </div>
  );
};

export default ReckiReview;
