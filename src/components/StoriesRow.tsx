import { useState, useMemo } from "react";
import { StoriesCircle } from "@/components/StoriesCircle";
import { StoriesViewer } from "@/components/StoriesViewer";
import { SportCategory } from "@/components/SportIcon";
import { Post, samplePosts } from "@/data/samplePosts";
import { subDays, isAfter, parseISO } from "date-fns";

const CATEGORIES: SportCategory[] = ["football", "basketball", "tennis", "f1", "mma", "other"];

// Get posts from last 7 days
const getRecentPosts = (): Post[] => {
  const sevenDaysAgo = subDays(new Date(), 7);
  return samplePosts.filter((post) => {
    const postDate = parseISO(post.publishedAt);
    return isAfter(postDate, sevenDaysAgo);
  });
};

// Group posts by category
const groupPostsByCategory = (posts: Post[]): Record<SportCategory, Post[]> => {
  const grouped: Record<SportCategory, Post[]> = {
    football: [],
    basketball: [],
    tennis: [],
    f1: [],
    mma: [],
    other: [],
  };

  posts.forEach((post) => {
    if (grouped[post.category]) {
      grouped[post.category].push(post);
    }
  });

  return grouped;
};

export const StoriesRow = () => {
  const [activeCategory, setActiveCategory] = useState<SportCategory | null>(null);

  const recentPosts = useMemo(() => getRecentPosts(), []);
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
