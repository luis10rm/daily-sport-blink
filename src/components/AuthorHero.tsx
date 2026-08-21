import { buildSrcSet } from "@/lib/imageUrl";
import { optimizeImageUrl } from "@/lib/imageUrl";
import { Twitter, Instagram, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PublicAuthor } from "@/hooks/useAuthors";

interface AuthorHeroProps {
  author: PublicAuthor;
}

export const AuthorHero = ({ author }: AuthorHeroProps) => {
  const displayName = author.display_name || "Autor";

  return (
    <div className="relative">
      {/* Cover image */}
      <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 md:h-72">
        {author.cover_image_url ? (
          <img
            src={optimizeImageUrl(author.cover_image_url, { width: 1200, quality: 70 })}
            srcSet={buildSrcSet(author.cover_image_url, [640, 1200, 1600])}
            sizes="100vw"
            alt={`${displayName} - cover`}
            loading="eager"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-background" />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        
        {/* Back button */}
        <Link to="/" className="absolute left-4 top-4 z-10">
          <Button variant="secondary" size="sm" className="gap-2 backdrop-blur-sm">
            <ArrowLeft className="h-4 w-4" />
            Powrót
          </Button>
        </Link>
      </div>

      {/* Profile section */}
      <div className="relative mx-auto max-w-4xl px-4">
        {/* Avatar - overlapping cover */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 md:-top-20">
          <Avatar className="h-32 w-32 border-4 border-background shadow-xl md:h-40 md:w-40">
            <AvatarImage src={author.avatar_url ? optimizeImageUrl(author.avatar_url, { width: 256, quality: 78 }) : undefined} alt={displayName} />
            <AvatarFallback className="bg-primary text-4xl font-bold text-primary-foreground md:text-5xl">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Author info */}
        <div className="pt-20 text-center md:pt-24">
          <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
            {displayName}
          </h1>
          <p className="mt-1 text-lg text-primary font-medium">
            {author.role_title || "Autor"}
          </p>

          {/* Social links */}
          {(author.social_twitter || author.social_instagram) && (
            <div className="mt-4 flex items-center justify-center gap-3">
              {author.social_twitter && (
                <a
                  href={author.social_twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <Twitter className="h-4 w-4" />
                  Twitter
                </a>
              )}
              {author.social_instagram && (
                <a
                  href={author.social_instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <Instagram className="h-4 w-4" />
                  Instagram
                </a>
              )}
            </div>
          )}

          {/* Bio */}
          {author.bio && (
            <div className="mx-auto mt-6 max-w-2xl">
              <p className="text-base leading-relaxed text-muted-foreground italic">
                "{author.bio}"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
