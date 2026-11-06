import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useRecentPosts } from "@/hooks/usePosts";
import { OptimizedImage } from "@/components/OptimizedImage";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { getPostImage, getCategoryImage } from "@/config/categoryImages";
import { cn } from "@/lib/utils";
import { latestNewsStories, newsStoryKeyword, loadReadNewsStories, saveReadNewsStory } from "@/lib/newsStories";

// Story post format for the viewer
export interface StoryPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  categoryId: string;
  publishedAt: string;
  sourceUrl: string;
  imageUrl?: string;
  tags?: string[];
  hasContent?: boolean;
}

export const StoriesRow = () => {
  const { data: posts = [], isLoading } = useRecentPosts();
  const stories = useMemo(() => latestNewsStories(posts), [posts]);
  const [readIds, setReadIds] = useState(loadReadNewsStories);

  useEffect(() => {
    const sync = () => setReadIds(loadReadNewsStories());
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  if (isLoading) {
    return <div aria-label="Ładowanie najnowszych newsów" className="flex min-h-[112px] gap-4 overflow-hidden">
      {Array.from({ length: 10 }, (_, index) => <Skeleton key={index} className="h-20 w-20 shrink-0 rounded-full" />)}
    </div>;
  }
  if (stories.length === 0) return null;

  return (
    <Carousel
      aria-label="10 najnowszych newsów"
      opts={{ align: "start", dragFree: true, containScroll: "trimSnaps" }}
      className="min-h-[112px] w-full"
    >
      <CarouselContent className="-ml-4 py-1">
        {stories.map((post) => {
          const keyword = newsStoryKeyword(post);
          const isRead = readIds.has(post.id);
          return (
            <CarouselItem key={post.id} className="basis-auto pl-4">
              <Button asChild variant="ghost" className="h-auto min-w-20 flex-col gap-2 rounded-none p-0 hover:bg-transparent">
                <Link
                  to={`/blink/${post.slug}`}
                  aria-label={post.title}
                  title={post.title}
                  className="touch-manipulation"
                  onClick={() => setReadIds(current => saveReadNewsStory(post.id, current))}
                >
                  <span className={cn("flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-[3px] bg-background p-1", isRead ? "border-text-muted" : "border-primary")}>
                    <OptimizedImage
                      src={getPostImage(post)}
                      alt=""
                      sizes="66px"
                      widths={[80, 160]}
                      fallbackWidth={160}
                      aspect={1}
                      className="h-full w-full rounded-full object-cover"
                      onError={(event) => {
                        const image = event.currentTarget;
                        image.onerror = null;
                        image.srcset = "";
                        image.src = getCategoryImage(post.sport_category?.slug);
                      }}
                    />
                  </span>
                  <span className="block whitespace-nowrap text-xs font-medium leading-5 text-text-secondary">{keyword}</span>
                </Link>
              </Button>
            </CarouselItem>
          );
        })}
      </CarouselContent>
    </Carousel>
  );
};
