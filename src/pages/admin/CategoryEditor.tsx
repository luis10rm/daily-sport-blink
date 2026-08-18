import { useEffect, useState, lazy, Suspense } from "react";
import { useNavigate, useParams } from "@/lib/router-compat";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ArrowLeft, Save, ImageIcon } from "lucide-react";
import { Link } from "@/lib/router-compat";
import {
  useSportCategory,
  useCreateSportCategory,
  useUpdateSportCategory,
  useUploadCategoryIcon,
} from "@/hooks/useSportCategories";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { AIIconGenerator } from "@/components/admin/AIIconGenerator";
import { SocialImageGenerator } from "@/components/admin/SocialImageGenerator";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import { LucideProps } from "lucide-react";

// Popular icons for sports categories
const POPULAR_ICONS = [
  "trophy",
  "dribbble", 
  "bike",
  "swords",
  "circle-dot",
  "target",
  "flame",
  "zap",
  "star",
  "award",
  "medal",
  "flag",
  "timer",
  "activity",
  "heart-pulse",
  "dumbbell",
  "volleyball",
  "basketball",
  "goal",
  "fish",
  "mountain",
  "waves",
  "wind",
  "snowflake",
  "sun",
] as const;

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
    <Suspense fallback={<div className="h-full w-full bg-muted rounded animate-pulse" />}>
      <IconComponent {...props} />
    </Suspense>
  );
};

const categorySchema = z.object({
  slug: z
    .string()
    .min(2, "Slug musi mieć min. 2 znaki")
    .max(50, "Slug może mieć max. 50 znaków")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug może zawierać tylko małe litery, cyfry i myślniki"
    ),
  name: z
    .string()
    .min(2, "Nazwa musi mieć min. 2 znaki")
    .max(100, "Nazwa może mieć max. 100 znaków"),
  icon_name: z.string().optional().nullable(),
  icon_url: z.string().optional().nullable(),
  bg_color: z.string().min(1, "Kolor jest wymagany"),
  sort_order: z.coerce.number().int().min(0),
  is_default: z.boolean().default(false),
  social_image_url: z.string().optional().nullable(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export default function CategoryEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: category, isLoading: categoryLoading } = useSportCategory(id);
  const createCategory = useCreateSportCategory();
  const updateCategory = useUpdateSportCategory();
  const uploadIcon = useUploadCategoryIcon();

  const [iconSource, setIconSource] = useState<"lucide" | "upload" | "ai">("lucide");
  const [previewColor, setPreviewColor] = useState("220 14% 46%");

  const form = useForm<z.input<typeof categorySchema>, any, CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      slug: "",
      name: "",
      icon_name: "trophy",
      icon_url: null,
      bg_color: "220 14% 46%",
      sort_order: 0,
      is_default: false,
      social_image_url: null,
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (category) {
      form.reset({
        slug: category.slug,
        name: category.name,
        icon_name: category.icon_name,
        icon_url: category.icon_url,
        bg_color: category.bg_color,
        sort_order: category.sort_order,
        is_default: category.is_default,
        social_image_url: category.social_image_url,
      });
      setPreviewColor(category.bg_color);
      setIconSource(category.icon_url ? "upload" : "lucide");
    }
  }, [category, form]);

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    if (!isEditing) {
      const slug = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      form.setValue("slug", slug);
    }
  };

  const onSubmit = async (data: CategoryFormData) => {
    // Ensure either icon_name or icon_url is set
    if (iconSource === "lucide") {
      data.icon_url = null;
    } else {
      data.icon_name = null;
    }

    try {
      if (isEditing && id) {
        await updateCategory.mutateAsync({ id, ...data });
      } else {
        await createCategory.mutateAsync({
          slug: data.slug,
          name: data.name,
          icon_name: data.icon_name,
          icon_url: data.icon_url,
          bg_color: data.bg_color,
          sort_order: data.sort_order,
          is_default: data.is_default,
          social_image_url: data.social_image_url,
        });
      }
      navigate("/admin/categories");
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleUploadSuccess = (url: string) => {
    form.setValue("icon_url", url);
    form.setValue("icon_name", null);
  };

  const handleRemoveUploadedIcon = () => {
    form.setValue("icon_url", null);
  };

  const bgStyle = previewColor.includes("%")
    ? { backgroundColor: `hsl(${previewColor})` }
    : { backgroundColor: previewColor };

  if (isEditing && categoryLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/categories">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? "Edytuj kategorię" : "Nowa kategoria"}
            </h1>
            <p className="text-muted-foreground">
              {isEditing
                ? "Zaktualizuj dane kategorii sportowej"
                : "Dodaj nową kategorię sportową"}
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Main Form */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Podstawowe informacje</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nazwa kategorii</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="np. Piłka nożna"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                handleNameChange(e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slug (identyfikator URL)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="np. pilka-nozna"
                              {...field}
                              disabled={isEditing}
                            />
                          </FormControl>
                          <FormDescription>
                            Unikalny identyfikator używany w adresach URL
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="sort_order"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kolejność wyświetlania</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} />
                            </FormControl>
                            <FormDescription>
                              Mniejsza wartość = wyżej na liście
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="is_default"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Kategoria domyślna
                              </FormLabel>
                              <FormDescription>
                                Przypisywana gdy brak kategorii
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Ikona kategorii</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Tabs
                      value={iconSource}
                      onValueChange={(v) => setIconSource(v as "lucide" | "upload" | "ai")}
                    >
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="lucide">Ikona Lucide</TabsTrigger>
                        <TabsTrigger value="upload">Własna grafika</TabsTrigger>
                        <TabsTrigger value="ai">🤖 Wygeneruj AI</TabsTrigger>
                      </TabsList>

                      <TabsContent value="lucide" className="space-y-4">
                        <FormField
                          control={form.control}
                          name="icon_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Wybierz ikonę</FormLabel>
                              <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                                {POPULAR_ICONS.map((iconName) => (
                                  <button
                                    key={iconName}
                                    type="button"
                                    onClick={() => field.onChange(iconName)}
                                    className={`
                                      p-3 rounded-lg border-2 transition-all
                                      hover:border-primary hover:bg-primary/5
                                      ${field.value === iconName ? "border-primary bg-primary/10" : "border-border"}
                                    `}
                                    title={iconName}
                                  >
                                    <DynamicIcon name={iconName} className="h-5 w-5 mx-auto" />
                                  </button>
                                ))}
                              </div>
                              <FormDescription>
                                Popularne ikony sportowe z biblioteki Lucide
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TabsContent>

                      <TabsContent value="upload" className="space-y-4">
                        <FormField
                          control={form.control}
                          name="icon_url"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Własna ikona</FormLabel>
                              <ImageUploader
                                value={field.value || undefined}
                                onChange={handleUploadSuccess}
                                onRemove={handleRemoveUploadedIcon}
                              />
                              <FormDescription>
                                Zalecany format: SVG lub PNG z przezroczystym tłem, 64x64px
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TabsContent>

                      <TabsContent value="ai" className="space-y-4">
                        <AIIconGenerator
                          categoryName={form.watch("name")}
                          onIconGenerated={(url) => {
                            form.setValue("icon_url", url);
                            form.setValue("icon_name", null);
                            setIconSource("upload");
                          }}
                          disabled={!form.watch("name")}
                        />
                      </TabsContent>
                    </Tabs>

                    <FormField
                      control={form.control}
                      name="bg_color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kolor tła ikony (HSL)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="np. 142 76% 36%"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                setPreviewColor(e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Format HSL bez nawiasów, np. "142 76% 36%" dla zielonego
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Social Image Section */}
                <SocialImageGenerator
                  categoryName={form.watch("name")}
                  categorySlug={form.watch("slug")}
                  currentImageUrl={form.watch("social_image_url") || null}
                  onImageChange={(url) => form.setValue("social_image_url", url)}
                  disabled={!form.watch("name")}
                />
              </div>

              {/* Sidebar - Preview */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Podgląd</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-4">
                    <div
                      className="flex h-20 w-20 items-center justify-center rounded-xl text-white"
                      style={bgStyle}
                    >
                      {iconSource === "upload" && form.watch("icon_url") ? (
                        <img
                          src={form.watch("icon_url") || ""}
                          alt="Podgląd ikony"
                          className="h-10 w-10 object-contain"
                        />
                      ) : (
                        <DynamicIcon
                          name={form.watch("icon_name") || "trophy"}
                          className="h-10 w-10"
                        />
                      )}
                    </div>
                    <div className="text-center">
                      <p className="font-medium">
                        {form.watch("name") || "Nazwa kategorii"}
                      </p>
                      <code className="text-xs text-muted-foreground">
                        {form.watch("slug") || "slug"}
                      </code>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createCategory.isPending || updateCategory.isPending}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isEditing ? "Zapisz zmiany" : "Utwórz kategorię"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}
