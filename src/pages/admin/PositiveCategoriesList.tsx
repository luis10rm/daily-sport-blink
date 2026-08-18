import { Link } from "@/lib/router-compat";
import { AdminLayout } from "@/components/admin/AdminLayout";
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
import { Plus, Pencil, Trash2, Sun } from "lucide-react";
import { useState } from "react";
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
import {
  usePositiveCategories,
  useDeletePositiveCategory,
} from "@/hooks/usePositiveCategories";

const PositiveCategoriesList = () => {
  const { data: categories, isLoading } = usePositiveCategories();
  const del = useDeletePositiveCategory();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading flex items-center gap-2">
              <Sun className="h-7 w-7 text-lime-600" />
              Kategorie Pozytywnych
            </h1>
            <p className="text-muted-foreground">Zarządzaj kategoriami kanału Pozytywne</p>
          </div>
          <Link to="/admin/pozytywne/kategorie/new">
            <Button className="bg-lime-600 hover:bg-lime-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Nowa kategoria
            </Button>
          </Link>
        </div>

        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nazwa</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Kolejność</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}><Skeleton className="h-5 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : categories && categories.length > 0 ? (
                categories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell><code className="text-xs text-muted-foreground">{cat.slug}</code></TableCell>
                    <TableCell>{cat.sort_order}</TableCell>
                    <TableCell>
                      {cat.is_active ? (
                        <Badge className="bg-lime-500/15 text-lime-700 dark:text-lime-300">Aktywna</Badge>
                      ) : (
                        <Badge variant="outline">Ukryta</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link to={`/admin/pozytywne/kategorie/${cat.id}/edit`}>
                          <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                        </Link>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(cat.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Brak kategorii
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Usunąć kategorię?</AlertDialogTitle>
              <AlertDialogDescription>Jeśli są do niej przypisane posty, usunięcie nie powiedzie się.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Anuluj</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => { if (deleteId) { del.mutate(deleteId); setDeleteId(null); } }}
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

export default PositiveCategoriesList;
