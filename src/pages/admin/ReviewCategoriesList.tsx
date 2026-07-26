import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
import { Plus, Pencil, Trash2, GripVertical, Star } from "lucide-react";
import {
  useReviewCategories,
  useDeleteReviewCategory,
  useReorderReviewCategories,
  ReviewCategory,
} from "@/hooks/useReviews";

interface SortableRowProps {
  category: ReviewCategory;
  onDeleteClick: (category: ReviewCategory) => void;
}

const SortableRow = ({ category, onDeleteClick }: SortableRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={isDragging ? "opacity-50 bg-muted" : ""}
    >
      <TableCell className="w-12">
        <button
          className="cursor-grab active:cursor-grabbing touch-none p-1 hover:bg-muted rounded"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </TableCell>
      <TableCell className="w-16">
        <div
          className="h-8 w-8 rounded-full border border-border/50"
          style={{ backgroundColor: category.color || "#A855F7" }}
          title={category.color || "#A855F7"}
        />
      </TableCell>
      <TableCell className="font-medium">{category.name}</TableCell>
      <TableCell>
        <code className="text-sm bg-muted px-2 py-1 rounded">{category.slug}</code>
      </TableCell>
      <TableCell>{category.sort_order}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Link to={`/admin/recki/kategorie/${category.id}/edit`}>
            <Button variant="ghost" size="icon">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDeleteClick(category)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default function ReviewCategoriesList() {
  const { data: categories, isLoading } = useReviewCategories();
  const deleteCategory = useDeleteReviewCategory();
  const reorderCategories = useReorderReviewCategories();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<ReviewCategory | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const categoryIds = useMemo(
    () => categories?.map((c) => c.id) ?? [],
    [categories]
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id && categories) {
      const oldIndex = categories.findIndex((c) => c.id === active.id);
      const newIndex = categories.findIndex((c) => c.id === over.id);
      const newOrder = arrayMove(categories, oldIndex, newIndex);
      reorderCategories.mutate(newOrder.map((c) => c.id));
    }
  };

  const handleDeleteClick = (category: ReviewCategory) => {
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading flex items-center gap-2">
              <Star className="h-7 w-7 text-fuchsia-600" />
              Kategorie Tech
            </h1>
            <p className="text-muted-foreground">
              Zarządzaj kategoriami kanału Tech / Recenzje.
            </p>
          </div>
          <Link to="/admin/recki/kategorie/new">
            <Button className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Nowa kategoria
            </Button>
          </Link>
        </div>

        <div className="rounded-lg border border-border">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : categories && categories.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead className="w-16">Kolor</TableHead>
                    <TableHead>Nazwa</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Kolejność</TableHead>
                    <TableHead className="text-right">Akcje</TableHead>
                  </TableRow>
                </TableHeader>
                <SortableContext
                  items={categoryIds}
                  strategy={verticalListSortingStrategy}
                >
                  <TableBody>
                    {categories.map((category) => (
                      <SortableRow
                        key={category.id}
                        category={category}
                        onDeleteClick={handleDeleteClick}
                      />
                    ))}
                  </TableBody>
                </SortableContext>
              </Table>
            </DndContext>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Brak kategorii Tech. Dodaj pierwszą!</p>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usunąć?</AlertDialogTitle>
            <AlertDialogDescription>
              Kategoria "{categoryToDelete?.name}" zostanie trwale usunięta. Jeśli są do niej przypisane recenzje, usunięcie nie powiedzie się.
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
