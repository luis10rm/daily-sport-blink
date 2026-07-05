import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import { Save, ArrowLeft } from "lucide-react";
import {
  usePositiveCategory,
  useCreatePositiveCategory,
  useUpdatePositiveCategory,
} from "@/hooks/usePositiveCategories";

const schema = z.object({
  name: z.string().min(2, "Min. 2 znaki"),
  slug: z.string().min(2, "Min. 2 znaki").regex(/^[a-z0-9-]+$/, "Tylko małe litery, cyfry i myślniki"),
  icon_name: z.string().optional(),
  bg_color: z.string().optional(),
  sort_order: z.coerce.number().int().min(0),
  is_active: z.boolean(),
});

type FormData = z.infer<typeof schema>;

const PositiveCategoryEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  const { data: cat, isLoading } = usePositiveCategory(id);
  const create = useCreatePositiveCategory();
  const update = useUpdatePositiveCategory();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      slug: "",
      icon_name: "",
      bg_color: "#84cc16",
      sort_order: 0,
      is_active: true,
    },
  });

  useEffect(() => {
    if (cat) {
      form.reset({
        name: cat.name,
        slug: cat.slug,
        icon_name: cat.icon_name || "",
        bg_color: cat.bg_color || "#84cc16",
        sort_order: cat.sort_order,
        is_active: cat.is_active,
      });
    }
  }, [cat, form]);

  const onSubmit = async (data: FormData) => {
    if (isEditing && id) {
      await update.mutateAsync({ id, ...data });
    } else {
      await create.mutateAsync(data);
    }
    navigate("/admin/pozytywne/kategorie");
  };

  if (isEditing && isLoading) {
    return <AdminLayout><div>Ładowanie…</div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/pozytywne/kategorie")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold font-heading">
            {isEditing ? "Edytuj kategorię" : "Nowa kategoria"}
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
                      <FormControl><Input {...field} placeholder="np. Nauka" /></FormControl>
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
                      <FormControl><Input {...field} placeholder="np. nauka" /></FormControl>
                      <FormDescription>Używany w adresach URL, tylko małe litery i myślniki.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="icon_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ikona (lucide)</FormLabel>
                      <FormControl><Input {...field} placeholder="np. FlaskConical" /></FormControl>
                      <FormDescription>Nazwa ikony z biblioteki lucide-react (opcjonalnie).</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bg_color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kolor akcentu (hex)</FormLabel>
                      <FormControl>
                        <div className="flex gap-2 items-center">
                          <Input type="color" className="h-10 w-16 p-1" {...field} />
                          <Input {...field} placeholder="#84cc16" />
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
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border border-border p-4">
                      <div>
                        <FormLabel>Aktywna</FormLabel>
                        <FormDescription>Ukryte kategorie nie pojawiają się publicznie.</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={create.isPending || update.isPending}
                  className="bg-lime-600 hover:bg-lime-700 text-white"
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
};

export default PositiveCategoryEditor;
