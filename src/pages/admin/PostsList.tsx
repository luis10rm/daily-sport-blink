import { optimizeImageUrl } from "@/lib/imageUrl";
import { useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { usePosts, useDeletePost } from "@/hooks/usePosts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Pencil, Trash2, Star, Megaphone } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

const PostsList = () => {
  const { data: posts, isLoading } = usePosts();
  const deletePost = useDeletePost();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Only show sport-channel posts in this list. Positive posts have their own admin view.
  const sportOnly = posts?.filter((p: any) => (p.channel ?? "sport") === "sport");
  const filteredPosts = sportOnly?.filter(
    (post) =>
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      (post.sport_category?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = () => {
    if (deleteId) {
      deletePost.mutate(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading">Posty</h1>
            <p className="text-muted-foreground">
              Zarządzaj wszystkimi postami
            </p>
          </div>
          <Link to="/admin/posts/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nowy post
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Szukaj postów..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tytuł</TableHead>
                <TableHead>Kategoria</TableHead>
                <TableHead>Data publikacji</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-5 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-20 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredPosts && filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {post.image_url && (
                          <img
                            src={optimizeImageUrl(post.image_url, { width: 160, quality: 65 })}
                            alt=""
                            loading="lazy"
                            className="h-10 w-16 rounded object-cover"
                          />
                        )}
                        <span className="font-medium line-clamp-1">
                          {post.title}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{post.sport_category?.name || "Inne"}</Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(post.published_at), "d MMM yyyy, HH:mm", {
                        locale: pl,
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {post.is_news_of_day && (
                          <Badge className="bg-yellow-500/20 text-yellow-600 hover:bg-yellow-500/30">
                            <Star className="mr-1 h-3 w-3" />
                            News dnia
                          </Badge>
                        )}
                        {post.is_sponsored && (
                          <Badge className="bg-purple-500/20 text-purple-600 hover:bg-purple-500/30">
                            <Megaphone className="mr-1 h-3 w-3" />
                            Sponsor
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link to={`/admin/posts/${post.id}/edit`}>
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(post.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <p className="text-muted-foreground">
                      {search ? "Nie znaleziono postów" : "Brak postów"}
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Delete confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Czy na pewno chcesz usunąć?</AlertDialogTitle>
              <AlertDialogDescription>
                Ta akcja jest nieodwracalna. Post zostanie trwale usunięty.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Anuluj</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Usuń
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default PostsList;
