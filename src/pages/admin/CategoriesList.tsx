import { useState, lazy, Suspense } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Pencil, Trash2, GripVertical, ImageIcon } from "lucide-react";
import { Link } from "react-router-dom";
import {
  useSportCategories,
  useDeleteSportCategory,
  SportCategory,
} from "@/hooks/useSportCategories";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import { LucideProps } from "lucide-react";

// Dynamic icon component
interface DynamicIconProps extends Omit<LucideProps, "ref"> {
  name: string;
}

const DynamicIcon = ({ name, ...props }: DynamicIconProps) => {
  const iconName = name.toLowerCase() as keyof typeof dynamicIconImports;
  
  if (!dynamicIconImports[iconName]) {
    return <ImageIcon {...props} />;
  }
  
  const IconComponent = lazy(dynamicIconImports[iconName]);
  
  return (
    <Suspense fallback={<div className="h-4 w-4 bg-muted rounded animate-pulse" />}>
      <IconComponent {...props} />
    </Suspense>
  );
};

const CategoryIcon = ({ category }: { category: SportCategory }) => {
  const bgStyle = category.bg_color.includes("%")
    ? { backgroundColor: `hsl(${category.bg_color})` }
    : { backgroundColor: category.bg_color };

  return (
    <div
      className="flex h-10 w-10 items-center justify-center rounded-lg text-white"
      style={bgStyle}
    >
      {category.icon_url ? (
        <img
          src={category.icon_url}
          alt={category.name}
          className="h-5 w-5 object-contain"
        />
      ) : category.icon_name ? (
        <DynamicIcon name={category.icon_name} className="h-5 w-5" />
      ) : (
        <ImageIcon className="h-5 w-5" />
      )}
    </div>
  );
};

export default function CategoriesList() {
  const { data: categories, isLoading } = useSportCategories();
  const deleteCategory = useDeleteSportCategory();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<SportCategory | null>(null);

  const handleDeleteClick = (category: SportCategory) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (categoryToDelete) {
      await deleteCategory.mutateAsync(categoryToDelete.id);
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Kategorie sportowe</h1>
            <p className="text-muted-foreground">
              Zarządzaj kategoriami sportowymi i ich ikonami
            </p>
          </div>
          <Button asChild>
            <Link to="/admin/categories/new">
              <Plus className="mr-2 h-4 w-4" />
              Nowa kategoria
            </Link>
          </Button>
        </div>

        {/* Categories Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista kategorii</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : categories && categories.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead className="w-16">Ikona</TableHead>
                    <TableHead>Nazwa</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Kolejność</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      </TableCell>
                      <TableCell>
                        <CategoryIcon category={category} />
                      </TableCell>
                      <TableCell className="font-medium">
                        {category.name}
                        {category.is_default && (
                          <Badge variant="secondary" className="ml-2">
                            Domyślna
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {category.slug}
                        </code>
                      </TableCell>
                      <TableCell>{category.sort_order}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" asChild>
                            <Link to={`/admin/categories/${category.id}/edit`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(category)}
                            disabled={category.is_default}
                            title={
                              category.is_default
                                ? "Nie można usunąć domyślnej kategorii"
                                : "Usuń kategorię"
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Brak kategorii. Dodaj pierwszą!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usunąć?</AlertDialogTitle>
            <AlertDialogDescription>
              Kategoria "{categoryToDelete?.name}" zostanie trwale usunięta.
              Ta akcja jest nieodwracalna.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
