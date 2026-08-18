import { Link } from "@/lib/router-compat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, User } from "lucide-react";
import { PublicAuthor } from "@/hooks/useAuthors";

interface AuthorProfileCardProps {
  author: PublicAuthor;
  postsCount?: number;
}

export const AuthorProfileCard = ({ author, postsCount }: AuthorProfileCardProps) => {
  const initials = author.display_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

  const truncatedBio = author.bio && author.bio.length > 100 
    ? `${author.bio.slice(0, 100)}...` 
    : author.bio;

  return (
    <Link to={`/autor/${author.slug}`} className="block">
      <Card className="group overflow-hidden card-hover h-full">
        {/* Cover Image */}
        <div 
          className="h-24 bg-gradient-to-br from-primary/20 to-primary/5 relative"
          style={author.cover_image_url ? {
            backgroundImage: `url(${author.cover_image_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          } : undefined}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>

        <CardContent className="pt-0 -mt-10 relative">
          {/* Avatar */}
          <Avatar className="h-20 w-20 border-4 border-background shadow-md mx-auto">
            <AvatarImage src={author.avatar_url || undefined} alt={author.display_name || "Autor"} />
            <AvatarFallback className="bg-primary text-primary-foreground text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Name & Role */}
          <div className="text-center mt-3">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {author.display_name}
            </h3>
            {author.role_title && (
              <p className="text-sm text-muted-foreground">{author.role_title}</p>
            )}
          </div>

          {/* Bio */}
          {truncatedBio && (
            <p className="text-sm text-muted-foreground text-center mt-3 line-clamp-3">
              "{truncatedBio}"
            </p>
          )}

          {/* Posts Count */}
          {postsCount !== undefined && (
            <div className="flex items-center justify-center gap-1.5 mt-4 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>
                {postsCount} {postsCount === 1 ? "artykuł" : postsCount < 5 ? "artykuły" : "artykułów"}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};
