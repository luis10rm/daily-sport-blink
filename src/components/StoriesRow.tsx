import { useState, useMemo } from "react";
import { DynamicStoriesCircle, StoryCategoryData } from "@/components/DynamicStoriesCircle";
import { StoriesViewer } from "@/components/StoriesViewer";
import { useRecentPosts, Post } from "@/hooks/usePosts";
import { useSportCategories } from "@/hooks/useSportCategories";
import { useTournamentMode } from "@/hooks/useTournamentMode";
import { WorldCupStoryCircle } from "@/components/worldcup/WorldCupStoryCircle";
import { WorldCupStoryPanels } from "@/components/worldcup/WorldCupStoryPanels";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

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

// Map database post to story format
const mapPostToStory = (post: Post): StoryPost => ({
  id: post.id,
  slug: post.slug,
  title: post.title,
  excerpt: post.excerpt,
  categoryId: post.sport_category?.id || "",
  publishedAt: post.published_at,
  sourceUrl: post.source_url,
  imageUrl: post.image_url || undefined,
  tags: post.tags || [],
  hasContent: Boolean(post.content),
});

// Map database category to StoryCategoryData
const mapCategoryToStoryCategory = (cat: {
  id: string;
  slug: string;
  name: string;
  icon_name: string | null;
  icon_url: string | null;
  bg_color: string;
  sort_order: number;
}): StoryCategoryData => ({
  id: cat.id,
  slug: cat.slug,
  name: cat.name,
  icon_name: cat.icon_name,
  icon_url: cat.icon_url,
  bg_color: cat.bg_color,
  sort_order: cat.sort_order,
});

export const StoriesRow = () => {
  const [activeCategory, setActiveCategory] = useState<StoryCategoryData | null>(null);
  const [wcOpen, setWcOpen] = useState(false);
  const { isWorldCup } = useTournamentMode();
  const { data: recentDbPosts = [] } = useRecentPosts();
  const { data: allDbCategories = [] } = useSportCategories();

  // Map posts to story format
  const recentPosts = useMemo(() => recentDbPosts.map(mapPostToStory), [recentDbPosts]);

  // Map categories to StoryCategoryData format
  const allCategories = useMemo(
    () => allDbCategories.map(mapCategoryToStoryCategory),
    [allDbCategories]
  );

  // Group posts by category ID
  const postsByCategory = useMemo(() => {
    const grouped: Record<string, StoryPost[]> = {};
    recentPosts.forEach((post) => {
      if (post.categoryId) {
        if (!grouped[post.categoryId]) {
          grouped[post.categoryId] = [];
        }
        grouped[post.categoryId].push(post);
      }
    });
    return grouped;
  }, [recentPosts]);

  // Get categories that have posts, sorted by sort_order
  const availableCategories = useMemo(
    () =>
      allCategories
        .filter((cat) => postsByCategory[cat.id]?.length > 0)
        .sort((a, b) => a.sort_order - b.sort_order),
    [allCategories, postsByCategory]
  );

  const handleOpenStory = (category: StoryCategoryData) => {
    if (postsByCategory[category.id]?.length > 0) {
      setActiveCategory(category);
    }
  };

  const handleCloseStory = () => {
    setActiveCategory(null);
  };

  if (availableCategories.length === 0 && !isWorldCup) return null;

  return (
    <>
      {/* Stories row with Carousel - min-height prevents CLS */}
      <div className="relative group min-h-[88px] md:min-h-[96px]">
        <Carousel
          opts={{
            align: "start",
            dragFree: true,
            containScroll: "trimSnaps",
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-3">
            {isWorldCup && (
              <CarouselItem className="basis-auto pl-2 md:pl-3">
                <WorldCupStoryCircle onClick={() => setWcOpen(true)} />
              </CarouselItem>
            )}
            {availableCategories.map((category) => (
              <CarouselItem
                key={category.id}
                className="basis-auto pl-2 md:pl-3"
              >
                <DynamicStoriesCircle
                  category={category}
                  hasUnread={postsByCategory[category.id].length > 0}
                  onClick={() => handleOpenStory(category)}
                />
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Navigation arrows - desktop only */}
          <CarouselPrevious className="hidden md:flex -left-3 h-8 w-8 bg-background/80 backdrop-blur-sm border-border hover:bg-background" />
          <CarouselNext className="hidden md:flex -right-3 h-8 w-8 bg-background/80 backdrop-blur-sm border-border hover:bg-background" />
        </Carousel>

        {/* Gradient fade on right edge */}
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none" />
      </div>

      {/* Story viewer modal */}
      {activeCategory && postsByCategory[activeCategory.id]?.length > 0 && (
        <StoriesViewer
          posts={postsByCategory[activeCategory.id]}
          category={activeCategory}
          onClose={handleCloseStory}
        />
      )}

      {wcOpen && <WorldCupStoryPanels onClose={() => setWcOpen(false)} />}
    </>
  );
};
