import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { usePost, useCreatePost, useUpdatePost, SportCategory } from "@/hooks/usePosts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const categories: { value: SportCategory; label: string }[] = [
  { value: "football", label: "Piłka nożna" },
  { value: "basketball", label: "Koszykówka" },
  { value: "tennis", label: "Tenis" },
  { value: "f1", label: "Formuła 1" },
  { value: "mma", label: "MMA" },
  { value: "other", label: "Inne" },
];

const postSchema = z.object({
  title: z.string().min(5, "Tytuł musi mieć minimum 5 znaków"),
  excerpt: z.string().min(10, "Opis musi mieć minimum 10 znaków"),
  content: z.string().optional(),
  category: z.enum(["football", "basketball", "tennis", "f1", "mma", "other"]),
  image_url: z.string().url("Nieprawidłowy URL").or(z.literal("")),
  source_url: z.string().url("Nieprawidłowy URL"),
  tags: z.string(),
  is_sponsored: z.boolean(),
  is_news_of_day: z.boolean(),
  published_at: z.string(),
});

type PostFormData = z.infer<typeof postSchema>;

const PostEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: post, isLoading: isLoadingPost } = usePost(id || "");
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();

  const form = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: "",
      excerpt: "",
      content: "",
      category: "football",
      image_url: "",
      source_url: "",
      tags: "",
      is_sponsored: false,
      is_news_of_day: false,
      published_at: new Date().toISOString().slice(0, 16),
    },
  });

  useEffect(() => {
    if (post) {
      form.reset({
        title: post.title,
        excerpt: post.excerpt,
        content: post.content || "",
        category: post.category,
        image_url: post.image_url || "",
        source_url: post.source_url,
        tags: post.tags?.join(", ") || "",
        is_sponsored: post.is_sponsored,
        is_news_of_day: post.is_news_of_day,
        published_at: new Date(post.published_at).toISOString().slice(0, 16),
      });
    }
  }, [post, form]);

  const onSubmit = async (data: PostFormData) => {
    const postData = {
      title: data.title,
      excerpt: data.excerpt,
      content: data.content || undefined,
      category: data.category as SportCategory,
      image_url: data.image_url || undefined,
      source_url: data.source_url,
      tags: data.tags ? data.tags.split(",").map((t) => t.trim()) : [],
      is_sponsored: data.is_sponsored,
      is_news_of_day: data.is_news_of_day,
      published_at: new Date(data.published_at).toISOString(),
    };

    if (isEditing && id) {
      await updatePost.mutateAsync({ id, ...postData });
    } else {
      await createPost.mutateAsync(postData);
    }
    navigate("/admin/posts");
  };

  const isSubmitting = createPost.isPending || updatePost.isPending;

  if (isEditing && isLoadingPost) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold font-heading">
              {isEditing ? "Edytuj post" : "Nowy post"}
            </h1>
            <p className="text-muted-foreground">
              {isEditing
                ? "Zaktualizuj istniejący post"
                : "Utwórz nowy post sportowy"}
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Main content */}
              <div className="space-y-6 lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Treść</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tytuł</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Tytuł newsa..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="excerpt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Krótki opis</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Krótki opis newsa (wyświetlany na karcie)..."
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pełna treść (opcjonalnie)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Pełna treść artykułu..."
                              rows={6}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Opcjonalna rozszerzona treść artykułu
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Media i linki</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="image_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL obrazka</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://..."
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Link do obrazka głównego
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="source_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL źródła</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://..."
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Link do oryginalnego artykułu
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Publikacja</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="published_at"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data publikacji</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kategoria</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Wybierz kategorię" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat.value} value={cat.value}>
                                  {cat.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tagi</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Tag1, Tag2, Tag3"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Oddzielone przecinkami
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Opcje</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="is_news_of_day"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>News dnia</FormLabel>
                            <FormDescription>
                              Wyróżnij jako główny news
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

                    <FormField
                      control={form.control}
                      name="is_sponsored"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Post sponsorowany</FormLabel>
                            <FormDescription>
                              Oznacz jako reklamę
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
                  </CardContent>
                </Card>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {isEditing ? "Zapisz zmiany" : "Opublikuj"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
};

export default PostEditor;
