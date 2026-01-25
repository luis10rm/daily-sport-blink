import { useState, useMemo } from "react";
import { DynamicStoriesCircle, StoryCategoryData } from "@/components/DynamicStoriesCircle";
import { StoriesViewer } from "@/components/StoriesViewer";
import { useRecentPosts, Post } from "@/hooks/usePosts";
import { useSportCategories } from "@/hooks/useSportCategories";

// Story post format for the viewer
export interface StoryPost {
  id: string;
  title: string;
  excerpt: string;
  categoryId: string;
  publishedAt: string;
  sourceUrl: string;
  imageUrl?: string;
  tags?: string[];
}

// Map database post to story format
const mapPostToStory = (post: Post): StoryPost => ({
  id: post.id,
  title: post.title,
  excerpt: post.excerpt,
  categoryId: post.sport_category?.id || "",
  publishedAt: post.published_at,
  sourceUrl: post.source_url,
  imageUrl: post.image_url || undefined,
  tags: post.tags || [],
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

  if (availableCategories.length === 0) return null;

  return (
    <>
      {/* Stories row */}
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-4 pb-2">
          {availableCategories.map((category) => (
            <DynamicStoriesCircle
              key={category.id}
              category={category}
              hasUnread={postsByCategory[category.id].length > 0}
              onClick={() => handleOpenStory(category)}
            />
          ))}
        </div>
      </div>

      {/* Story viewer modal */}
      {activeCategory && postsByCategory[activeCategory.id]?.length > 0 && (
        <StoriesViewer
          posts={postsByCategory[activeCategory.id]}
          category={activeCategory}
          onClose={handleCloseStory}
        />
      )}
    </>
  );
};
