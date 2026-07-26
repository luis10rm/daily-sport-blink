import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Save, ArrowLeft, Star } from "lucide-react";
import {
  useReviewCategory,
  useCreateReviewCategory,
  useUpdateReviewCategory,
  type ReviewCategoryInput,
} from "@/hooks/useReviews";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const schema = z.object({
  name: z.string().min(2, "Min. 2 znaki"),
  slug: z.string().min(2, "Min. 2 znaki").regex(/^[a-z0-9-]+$/, "Tylko małe litery, cyfry i myślniki"),
  description: z.string().optional(),
  icon_url: z.string().url("Podaj prawidłowy URL").optional().or(z.literal("")),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Podaj kolor w formacie HEX, np. #A855F7"),
  sort_order: z.coerce.number().int().min(0),
});

type FormData = z.infer<typeof schema>;

export default function ReviewCategoryEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  const { data: category, isLoading } = useReviewCategory(id);
  const create = useCreateReviewCategory();
  const update = useUpdateReviewCategory();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      icon_url: "",
      color: "#A855F7",
      sort_order: 0,
    },
  });

  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        slug: category.slug,
        description: category.description ?? "",
        icon_url: category.icon_url ?? "",
        color: category.color ?? "#A855F7",
        sort_order: category.sort_order,
      });
    }
  }, [category, form]);

  // Auto-generate slug from name until user touches it manually
  const slugTouched = form.formState.touchedFields.slug;
  const watchedName = form.watch("name");
  useEffect(() => {
    if (!slugTouched && watchedName) {
      form.setValue("slug", slugify(watchedName), { shouldValidate: true });
    }
  }, [watchedName, slugTouched, form]);

  const onSubmit = async (data: FormData) => {
    const payload: ReviewCategoryInput = {
      name: data.name,
      slug: data.slug,
      color: data.color,
      sort_order: data.sort_order,
      description: data.description || null,
      icon_url: data.icon_url || null,
    };
    if (isEditing && id) {
      await update.mutateAsync({ id, ...payload });
    } else {
      await create.mutateAsync(payload);
    }
    navigate("/admin/recki/kategorie");
  };

  if (isEditing && isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-muted-foreground">Ładowanie…</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/recki/kategorie")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold font-heading flex items-center gap-2">
            <Star className="h-6 w-6 text-fuchsia-600" />
            {isEditing ? "Edytuj kategorię Tech" : "Nowa kategoria Tech"}
          </h1>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nazwa</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="np. Smartfony" />
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
                      <FormLabel>Slug (URL)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="np. smartfony"
                          onChange={(e) => field.onChange(slugify(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Używany w adresach URL, tylko małe litery i myślniki.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opis</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={3}
                          placeholder="Krótki opis kategorii (opcjonalnie)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="icon_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL ikony</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://..." />
                      </FormControl>
                      <FormDescription>
                        Bezpośredni adres obrazka ikony (opcjonalnie).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kolor akcentu</FormLabel>
                      <FormControl>
                        <div className="flex gap-2 items-center">
                          <Input type="color" className="h-10 w-16 p-1" {...field} />
                          <Input {...field} placeholder="#A855F7" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sort_order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kolejność</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={create.isPending || update.isPending}
                  className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Zapisz
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
