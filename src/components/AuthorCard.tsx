import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavLink } from "@/hooks/useNavLink";

interface AuthorCardProps {
  author: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    slug: string | null;
    role_title: string | null;
  };
  className?: string;
}

export const AuthorCard = ({ author, className }: AuthorCardProps) => {
  const navLink = useNavLink();
  if (!author.slug || !author.display_name) return null;

  return (
    <a
      {...navLink(`/autor/${author.slug}`)}
      className={`flex items-center gap-2.5 rounded-lg p-2 -mx-2 transition-colors hover:bg-muted/50 ${className}`}
    >
      <Avatar className="h-8 w-8 ring-2 ring-primary/10">
        <AvatarImage src={author.avatar_url || undefined} alt={author.display_name} />
        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
          {author.display_name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {author.display_name}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {author.role_title || "Autor"}
        </p>
      </div>
    </a>
  );
};
