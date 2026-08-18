import { useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Pencil, Trash2, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWallpapers, Wallpaper } from "@/hooks/useWallpaper";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { toast } from "sonner";

const WallpapersList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: wallpapers, isLoading } = useWallpapers();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("wallpapers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallpapers"] });
      toast.success("Wallpaper usunięty");
    },
    onError: (error) => {
      toast.error("Błąd podczas usuwania: " + error.message);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("wallpapers")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallpapers"] });
      queryClient.invalidateQueries({ queryKey: ["wallpaper", "active"] });
      toast.success("Status zmieniony");
    },
    onError: (error) => {
      toast.error("Błąd: " + error.message);
    },
  });

  const filteredWallpapers = wallpapers?.filter((wp) =>
    wp.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const handleToggle = (id: string, currentStatus: boolean) => {
    toggleMutation.mutate({ id, is_active: !currentStatus });
  };

  const isActive = (wp: Wallpaper) => {
    if (!wp.is_active) return false;
    const now = new Date();
    if (wp.start_date && new Date(wp.start_date) > now) return false;
    if (wp.end_date && new Date(wp.end_date) < now) return false;
    return true;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">Wallpapery Premium</h1>
            <p className="text-sm text-muted-foreground">
              Kampanie przejmujące tło strony (np. Black Friday)
            </p>
          </div>
          <Button onClick={() => navigate("/admin/wallpapers/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Nowy wallpaper
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Szukaj kampanii..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Podgląd</TableHead>
                <TableHead>Nazwa kampanii</TableHead>
                <TableHead>Daty</TableHead>
                <TableHead>Powiązany baner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aktywny</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-12 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-10" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredWallpapers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">
                      {search
                        ? "Nie znaleziono kampanii pasujących do wyszukiwania"
                        : "Brak kampanii wallpaper. Kliknij 'Nowy wallpaper' aby dodać pierwszą."}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredWallpapers?.map((wp) => (
                  <TableRow key={wp.id}>
                    <TableCell>
                      <div className="relative group">
                        {wp.background_image_url ? (
                          <>
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            <img
                              src={wp.background_image_url}
                              alt="Preview"
                              className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-48 rounded border shadow-lg bg-background"
                            />
                          </>
                        ) : (
                          <div
                            className="w-8 h-8 rounded border"
                            style={{ backgroundColor: wp.background_color }}
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{wp.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {wp.start_date
                        ? format(new Date(wp.start_date), "dd MMM yyyy", { locale: pl })
                        : "—"}{" "}
                      →{" "}
                      {wp.end_date
                        ? format(new Date(wp.end_date), "dd MMM yyyy", { locale: pl })
                        : "∞"}
                    </TableCell>
                    <TableCell>
                      {wp.linked_banner_id ? (
                        <Badge variant="outline">Połączony</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isActive(wp) ? (
                        <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                          Aktywny
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Nieaktywny</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={wp.is_active}
                        onCheckedChange={() => handleToggle(wp.id, wp.is_active)}
                        disabled={toggleMutation.isPending}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/admin/wallpapers/${wp.id}/edit`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(wp.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Czy na pewno chcesz usunąć?</AlertDialogTitle>
              <AlertDialogDescription>
                Ta operacja jest nieodwracalna. Kampania wallpaper zostanie trwale usunięta.
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

export default WallpapersList;
