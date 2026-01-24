import { useState } from "react";
import { Plus } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useCreateSportCategory } from "@/hooks/useSportCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// Popular sport icons for quick selection
const POPULAR_ICONS = [
  { name: "Circle", label: "Piłka" },
  { name: "Trophy", label: "Trofeum" },
  { name: "Timer", label: "Czas" },
  { name: "Target", label: "Cel" },
  { name: "Flame", label: "Ogień" },
  { name: "Zap", label: "Błysk" },
  { name: "Star", label: "Gwiazda" },
  { name: "Medal", label: "Medal" },
] as const;

// Dynamic icon component
const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name];
  if (!IconComponent || typeof IconComponent !== "function") return null;
  return <IconComponent className={className} />;
};

// Generate slug from name (Polish-friendly)
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

interface QuickCategoryDialogProps {
  onCategoryCreated: (categoryId: string) => void;
}

export const QuickCategoryDialog = ({ onCategoryCreated }: QuickCategoryDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState<string>("Circle");
  const [bgColor, setBgColor] = useState("#6366f1");
  
  const createCategory = useCreateSportCategory();

  const handleSubmit = async () => {
    if (!name.trim()) return;

    const slug = generateSlug(name);
    
    try {
      const result = await createCategory.mutateAsync({
        name: name.trim(),
        slug,
        icon_name: selectedIcon,
        bg_color: bgColor,
      });
      
      // Reset form and close dialog
      setName("");
      setSelectedIcon("Circle");
      setBgColor("#6366f1");
      setOpen(false);
      
      // Notify parent with new category ID
      if (result?.id) {
        onCategoryCreated(result.id);
      }
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const slug = generateSlug(name);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          title="Szybkie tworzenie kategorii"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Szybkie tworzenie kategorii</DialogTitle>
          <DialogDescription>
            Utwórz nową kategorię bez opuszczania formularza
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Category name */}
          <div className="space-y-2">
            <Label htmlFor="category-name">Nazwa kategorii</Label>
            <Input
              id="category-name"
              placeholder="np. Siatkówka"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            {name && (
              <p className="text-xs text-muted-foreground">
                Slug: <code className="rounded bg-muted px-1">{slug}</code>
              </p>
            )}
          </div>

          {/* Icon selection */}
          <div className="space-y-2">
            <Label>Ikona</Label>
            <div className="grid grid-cols-4 gap-2">
              {POPULAR_ICONS.map((icon) => (
                <button
                  key={icon.name}
                  type="button"
                  onClick={() => setSelectedIcon(icon.name)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border p-3 transition-colors hover:bg-accent",
                    selectedIcon === icon.name && "border-primary bg-primary/10"
                  )}
                >
                  <DynamicIcon name={icon.name} className="h-5 w-5" />
                  <span className="text-xs text-muted-foreground">{icon.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Background color */}
          <div className="space-y-2">
            <Label htmlFor="bg-color">Kolor tła</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                id="bg-color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded border"
              />
              <Input
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="flex-1 font-mono"
                placeholder="#6366f1"
              />
            </div>
          </div>

          {/* Preview */}
          {name && (
            <div className="space-y-2">
              <Label>Podgląd</Label>
              <div className="flex items-center gap-2">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: bgColor }}
                >
                  <DynamicIcon name={selectedIcon} className="h-5 w-5" />
                </div>
                <span className="font-medium">{name}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Anuluj
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!name.trim() || createCategory.isPending}
          >
            {createCategory.isPending ? "Tworzenie..." : "Utwórz"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
