import { useState, useMemo } from "react";
import { StoriesCircle } from "@/components/StoriesCircle";
import { StoriesViewer } from "@/components/StoriesViewer";
import { SportCategory } from "@/components/SportIcon";
import { useRecentPosts, Post } from "@/hooks/usePosts";

// Map database post to component format
interface StoryPost {
  id: string;
  title: string;
  excerpt: string;
  category: SportCategory;
  publishedAt: string;
  sourceUrl: string;
  imageUrl?: string;
  tags?: string[];
}

const mapPostToStory = (post: Post): StoryPost => ({
  id: post.id,
  title: post.title,
  excerpt: post.excerpt,
  category: (post.sport_category?.slug || "other") as SportCategory,
  publishedAt: post.published_at,
  sourceUrl: post.source_url,
  imageUrl: post.image_url || undefined,
  tags: post.tags || [],
});

// Group posts by category
const groupPostsByCategory = (posts: StoryPost[]): Record<SportCategory, StoryPost[]> => {
  const grouped: Record<SportCategory, StoryPost[]> = {
    football: [],
    basketball: [],
    tennis: [],
    f1: [],
    mma: [],
    other: [],
  };

  posts.forEach((post) => {
    const cat = post.category as SportCategory;
    if (grouped[cat]) {
      grouped[cat].push(post);
    } else {
      grouped.other.push(post);
    }
  });

  return grouped;
};

const CATEGORIES: SportCategory[] = ["football", "basketball", "tennis", "f1", "mma", "other"];

export const StoriesRow = () => {
  const [activeCategory, setActiveCategory] = useState<SportCategory | null>(null);
  const { data: recentDbPosts = [] } = useRecentPosts();

  const recentPosts = useMemo(() => recentDbPosts.map(mapPostToStory), [recentDbPosts]);
  const postsByCategory = useMemo(() => groupPostsByCategory(recentPosts), [recentPosts]);

  // Only show categories that have posts
  const availableCategories = CATEGORIES.filter(
    (cat) => postsByCategory[cat].length > 0
  );

  const handleOpenStory = (category: SportCategory) => {
    if (postsByCategory[category].length > 0) {
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
            <StoriesCircle
              key={category}
              category={category}
              hasUnread={postsByCategory[category].length > 0}
              onClick={() => handleOpenStory(category)}
            />
          ))}
        </div>
      </div>

      {/* Story viewer modal */}
      {activeCategory && postsByCategory[activeCategory].length > 0 && (
        <StoriesViewer
          posts={postsByCategory[activeCategory]}
          category={activeCategory}
          onClose={handleCloseStory}
        />
      )}
    </>
  );
};
