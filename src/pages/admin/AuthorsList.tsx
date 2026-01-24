import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAuthors } from "@/hooks/useAuthors";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, ExternalLink, Globe, GlobeLock } from "lucide-react";

const AuthorsList = () => {
  const { data: authors, isLoading } = useAuthors();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold">Autorzy</h1>
          <p className="mt-1 text-muted-foreground">
            Zarządzaj profilami autorów widocznymi na stronie
          </p>
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Autor</TableHead>
                <TableHead>Rola</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-5 w-32" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="ml-auto h-8 w-20" />
                    </TableCell>
                  </TableRow>
                ))
              ) : authors && authors.length > 0 ? (
                authors.map((author) => (
                  <TableRow key={author.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={author.avatar_url || undefined}
                            alt={author.display_name || author.full_name || ""}
                          />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {(author.display_name || author.full_name || "?")
                              .charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {author.display_name || author.full_name || "Bez nazwy"}
                          </p>
                          {author.bio && (
                            <p className="max-w-xs truncate text-xs text-muted-foreground">
                              {author.bio}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {author.role_title || "Autor"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {author.slug ? (
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                          {author.slug}
                        </code>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {author.is_public ? (
                        <Badge
                          variant="default"
                          className="gap-1 bg-green-500/10 text-green-600 hover:bg-green-500/20"
                        >
                          <Globe className="h-3 w-3" />
                          Publiczny
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <GlobeLock className="h-3 w-3" />
                          Ukryty
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {author.is_public && author.slug && (
                          <Button variant="ghost" size="icon" asChild>
                            <Link
                              to={`/autor/${author.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/admin/authors/${author.id}/edit`}>
                            <Pencil className="mr-1 h-4 w-4" />
                            Edytuj
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center">
                    <p className="text-muted-foreground">
                      Brak autorów do wyświetlenia
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AuthorsList;
