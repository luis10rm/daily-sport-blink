import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { X, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { StoryPost } from "@/components/StoriesRow";
import { StoryCategoryData } from "@/components/DynamicStoriesCircle";
import { getCategoryImage } from "@/config/categoryImages";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

interface StoriesViewerProps {
  posts: StoryPost[];
  category: StoryCategoryData;
  initialIndex?: number;
  onClose: () => void;
}

const STORY_DURATION = 5000; // 5 seconds per story

export const StoriesViewer = ({
  posts,
  category,
  initialIndex = 0,
  onClose,
}: StoriesViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const currentPost = posts[currentIndex];

  const goToNext = useCallback(() => {
    if (currentIndex < posts.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentIndex, posts.length, onClose]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    }
  }, [currentIndex]);

  // Auto-advance timer
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          goToNext();
          return 0;
        }
        return prev + (100 / (STORY_DURATION / 100));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPaused, goToNext]);

  // Reset progress when changing stories
  useEffect(() => {
    setProgress(0);
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goToNext();
      if (e.key === "ArrowLeft") goToPrev();
      if (e.key === " ") setIsPaused((prev) => !prev);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, goToNext, goToPrev]);

  // Prevent body scroll when viewer is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;

    if (clickX < width / 3) {
      goToPrev();
    } else if (clickX > (width * 2) / 3) {
      goToNext();
    }
  };

  if (!currentPost) return null;

  const formattedDate = format(new Date(currentPost.publishedAt), "d MMMM yyyy", {
    locale: pl,
  });

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Story container */}
      <div
        className="relative w-full h-full max-w-lg mx-auto flex flex-col"
        onClick={handleClick}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2">
          {posts.map((_, index) => (
            <div
              key={index}
              className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-white rounded-full transition-all duration-100"
                style={{
                  width:
                    index < currentIndex
                      ? "100%"
                      : index === currentIndex
                      ? `${progress}%`
                      : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-6 left-0 right-0 z-20 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-bold">
                {category.name.charAt(0)}
              </span>
            </div>
            <div>
              <p className="text-white font-medium text-sm">
                {category.name}
              </p>
              <p className="text-white/60 text-xs">{formattedDate}</p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${getCategoryImage(category.slug, currentPost.imageUrl)})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-6 pb-10">
          <h2 className="text-white text-xl md:text-2xl font-bold leading-tight mb-3">
            {currentPost.title}
          </h2>
          <p className="text-white/80 text-sm md:text-base mb-4 line-clamp-3">
            {currentPost.excerpt}
          </p>

          {/* Tags */}
          {currentPost.tags && currentPost.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {currentPost.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-white/20 rounded-full text-white text-xs"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Read more link */}
          {currentPost.hasContent ? (
            <Link
              to={`/blink/${currentPost.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full text-sm font-medium hover:bg-white/90 transition-colors"
            >
              Czytaj więcej
            </Link>
          ) : (
            <a
              href={currentPost.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full text-sm font-medium hover:bg-white/90 transition-colors"
            >
              Czytaj więcej
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Navigation hints */}
        <div className="absolute inset-y-0 left-4 flex items-center z-10 pointer-events-none">
          {currentIndex > 0 && (
            <ChevronLeft className="w-8 h-8 text-white/50" />
          )}
        </div>
        <div className="absolute inset-y-0 right-4 flex items-center z-10 pointer-events-none">
          {currentIndex < posts.length - 1 && (
            <ChevronRight className="w-8 h-8 text-white/50" />
          )}
        </div>

        {/* Story counter */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
          <span className="text-white/60 text-xs">
            {currentIndex + 1} / {posts.length}
          </span>
        </div>
      </div>
    </div>
  );
};
