import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "@/lib/router-compat";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { useAuthorById, useUpdateAuthor, useCreateAuthor, generateSlug } from "@/hooks/useAuthors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { ArrowLeft, Save, ExternalLink, Wand2, Plus } from "lucide-react";

const authorSchema = z.object({
  display_name: z.string().min(2, "Nazwa musi mieć minimum 2 znaki"),
  slug: z
    .string()
    .min(2, "Slug musi mieć minimum 2 znaki")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug może zawierać tylko małe litery, cyfry i myślniki"
    ),
  bio: z.string().max(500, "Bio może mieć maksymalnie 500 znaków").optional(),
  role_title: z.string().optional(),
  avatar_url: z.string().nullable().optional(),
  cover_image_url: z.string().nullable().optional(),
  is_public: z.boolean(),
  social_twitter: z.string().url("Nieprawidłowy URL").nullable().optional().or(z.literal("")),
  social_instagram: z.string().url("Nieprawidłowy URL").nullable().optional().or(z.literal("")),
  linked_email: z.string().email("Nieprawidłowy email").nullable().optional().or(z.literal("")),
});

type AuthorFormValues = z.infer<typeof authorSchema>;

const AuthorEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isCreating = !id || id === "new";
  const { data: author, isLoading } = useAuthorById(isCreating ? "" : id || "");
  const updateAuthor = useUpdateAuthor();
  const createAuthor = useCreateAuthor();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<AuthorFormValues>({
    resolver: zodResolver(authorSchema),
    defaultValues: {
      display_name: "",
      slug: "",
      bio: "",
      role_title: "Autor",
      avatar_url: null,
      cover_image_url: null,
      is_public: false,
      social_twitter: "",
      social_instagram: "",
      linked_email: "",
    },
  });

  useEffect(() => {
    if (author && !isCreating) {
      form.reset({
        display_name: author.display_name || "",
        slug: author.slug || "",
        bio: author.bio || "",
        role_title: author.role_title || "Autor",
        avatar_url: author.avatar_url,
        cover_image_url: author.cover_image_url,
        is_public: author.is_public,
        social_twitter: author.social_twitter || "",
        social_instagram: author.social_instagram || "",
        linked_email: author.email || "",
      });
    }
  }, [author, form, isCreating]);

  const onSubmit = async (values: AuthorFormValues) => {
    setIsSaving(true);

    try {
      const authorData = {
        display_name: values.display_name,
        slug: values.slug,
        bio: values.bio || null,
        role_title: values.role_title || "Autor",
        avatar_url: values.avatar_url || null,
        cover_image_url: values.cover_image_url || null,
        is_public: values.is_public,
        social_twitter: values.social_twitter || null,
        social_instagram: values.social_instagram || null,
        email: values.linked_email || null, // mapped to email field for hooks
      };

      if (isCreating) {
        await createAuthor.mutateAsync(authorData);
      } else if (id) {
        await updateAuthor.mutateAsync({ id, data: authorData });
      }
      navigate("/admin/authors");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateSlug = () => {
    const displayName = form.getValues("display_name");
    if (displayName) {
      form.setValue("slug", generateSlug(displayName));
    }
  };

  if (!isCreating && isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-[600px] w-full rounded-lg" />
        </div>
      </AdminLayout>
    );
  }

  if (id && id !== "new" && !isLoading && !author) {
    return (
      <AdminLayout>
        <div className="py-12 text-center">
          <p className="text-muted-foreground">Autor nie znaleziony</p>
          <Button asChild className="mt-4">
            <Link to="/admin/authors">Wróć do listy</Link>
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/admin/authors">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="font-heading text-2xl font-bold">
                {isCreating ? "Dodaj nowego autora" : "Edytuj profil autora"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isCreating 
                  ? "Utwórz nowy profil autora"
                  : author?.display_name || "Bez nazwy"
                }
              </p>
            </div>
          </div>
          {!isCreating && author?.is_public && author?.slug && (
            <Button variant="outline" asChild>
              <Link
                to={`/autor/${author.slug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Podgląd
              </Link>
            </Button>
          )}
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Cover image */}
            <FormField
              control={form.control}
              name="cover_image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zdjęcie w tle (cover)</FormLabel>
                  <FormDescription>
                    Duże zdjęcie wyświetlane na górze profilu. Po wybraniu pliku będziesz mógł je przyciąć.
                  </FormDescription>
                  <FormControl>
                    <div className="aspect-[5/1] max-h-48 overflow-hidden rounded-lg border border-dashed">
                      <ImageUploader
                        value={field.value || undefined}
                        onChange={field.onChange}
                        onRemove={() => field.onChange(null)}
                        enableCrop
                        cropAspect={5}
                        storageBucket="author-images"
                        storagePath="covers"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Avatar */}
            <FormField
              control={form.control}
              name="avatar_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar</FormLabel>
                  <FormDescription>
                    Okrągłe zdjęcie profilowe. Po wybraniu pliku będziesz mógł je przyciąć.
                  </FormDescription>
                  <FormControl>
                    <div className="h-32 w-32 overflow-hidden rounded-full border border-dashed">
                      <ImageUploader
                        value={field.value || undefined}
                        onChange={field.onChange}
                        onRemove={() => field.onChange(null)}
                        enableCrop
                        cropAspect={1}
                        storageBucket="author-images"
                        storagePath="avatars"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Display name & Slug */}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="display_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nazwa wyświetlana *</FormLabel>
                    <FormControl>
                      <Input placeholder="Jan Kowalski" {...field} />
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
                    <FormLabel>Slug URL *</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input placeholder="jan-kowalski" {...field} />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={handleGenerateSlug}
                          title="Wygeneruj z nazwy"
                        >
                          <Wand2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Adres profilu: /autor/{field.value || "slug"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Email powiązany */}
            <FormField
              control={form.control}
              name="linked_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email powiązany</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="jan@example.com"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Wpisz email użytkownika, do którego ma być przypisany ten profil.
                    Gdy użytkownik zarejestruje się z tym emailem, zostanie automatycznie powiązany.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role title */}
            <FormField
              control={form.control}
              name="role_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tytuł roli</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Redaktor sportowy"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Np. "Redaktor sportowy", "Ekspert F1", "Dziennikarz"
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Bio */}
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Biografia</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Napisz kilka słów o autorze..."
                      className="min-h-24 resize-none"
                      maxLength={500}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    {(field.value?.length || 0)}/500 znaków
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Social links */}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="social_twitter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Twitter/X</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://twitter.com/username"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="social_instagram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://instagram.com/username"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Is public */}
            <FormField
              control={form.control}
              name="is_public"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Profil publiczny</FormLabel>
                    <FormDescription>
                      Włącz, aby profil był widoczny dla wszystkich użytkowników
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

            {/* Submit */}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" asChild>
                <Link to="/admin/authors">Anuluj</Link>
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isCreating ? (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    {isSaving ? "Tworzenie..." : "Utwórz autora"}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? "Zapisywanie..." : "Zapisz zmiany"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
};

export default AuthorEditor;
