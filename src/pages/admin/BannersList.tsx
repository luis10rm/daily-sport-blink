import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ActiveSlotsOverview } from "@/components/admin/ActiveSlotsOverview";
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
import { Plus, Search, Pencil, Trash2, Monitor, Smartphone } from "lucide-react";
import {
  useBanners,
  useDeleteBanner,
  useToggleBannerActive,
  BannerPosition,
} from "@/hooks/useBanners";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

const positionLabels: Record<BannerPosition, string> = {
  home_top: "Góra strony",
  home_middle: "Środek strony",
  home_bottom: "Dół strony",
};

const BannersList = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: banners, isLoading } = useBanners();
  const deleteMutation = useDeleteBanner();
  const toggleMutation = useToggleBannerActive();

  const filteredBanners = banners?.filter((banner) =>
    banner.title.toLowerCase().includes(search.toLowerCase())
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

  const isActive = (banner: {
    is_active: boolean;
    start_date: string | null;
    end_date: string | null;
  }) => {
    if (!banner.is_active) return false;
    const now = new Date();
    if (banner.start_date && new Date(banner.start_date) > now) return false;
    if (banner.end_date && new Date(banner.end_date) < now) return false;
    return true;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">Banery reklamowe</h1>
            <p className="text-sm text-muted-foreground">
              Zarządzaj banerami wyświetlanymi na stronie
            </p>
          </div>
          <Button onClick={() => navigate("/admin/banners/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Nowy baner
          </Button>
        </div>

        {/* Active Slots Overview */}
        <ActiveSlotsOverview />

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Szukaj banerów..."
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
                <TableHead>Nazwa</TableHead>
                <TableHead>Pozycja</TableHead>
                <TableHead>Daty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aktywny</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-12 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-10" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-20 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredBanners?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">
                      {search
                        ? "Nie znaleziono banerów pasujących do wyszukiwania"
                        : "Brak banerów. Kliknij 'Nowy baner' aby dodać pierwszy."}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredBanners?.map((banner) => (
                  <TableRow key={banner.id}>
                    <TableCell>
                      <div className="flex gap-1">
                        <div className="relative group">
                          <Monitor className="h-4 w-4 text-muted-foreground" />
                          <img
                            src={banner.image_desktop_url}
                            alt="Desktop"
                            className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-48 rounded border shadow-lg bg-background"
                          />
                        </div>
                        <div className="relative group">
                          <Smartphone className="h-4 w-4 text-muted-foreground" />
                          <img
                            src={banner.image_mobile_url}
                            alt="Mobile"
                            className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-32 rounded border shadow-lg bg-background"
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{banner.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {positionLabels[banner.position]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {banner.start_date
                        ? format(new Date(banner.start_date), "dd MMM yyyy", {
                            locale: pl,
                          })
                        : "—"}{" "}
                      →{" "}
                      {banner.end_date
                        ? format(new Date(banner.end_date), "dd MMM yyyy", {
                            locale: pl,
                          })
                        : "∞"}
                    </TableCell>
                    <TableCell>
                      {isActive(banner) ? (
                        <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                          Wyświetlany
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Ukryty</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={banner.is_active}
                        onCheckedChange={() =>
                          handleToggle(banner.id, banner.is_active)
                        }
                        disabled={toggleMutation.isPending}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            navigate(`/admin/banners/${banner.id}/edit`)
                          }
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(banner.id)}
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
                Ta operacja jest nieodwracalna. Baner zostanie trwale usunięty.
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

export default BannersList;
