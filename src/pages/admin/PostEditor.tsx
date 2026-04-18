import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ImageSourceSection } from "@/components/admin/ImageSourceSection";
import { usePost, useCreatePost, useUpdatePost } from "@/hooks/usePosts";
import { useExtractArticle } from "@/hooks/useSettings";
import { useSportCategories } from "@/hooks/useSportCategories";
import { useAuth } from "@/hooks/useAuth";
import { useAuthors, useAuthorByUserId } from "@/hooks/useAuthors";
import { useSocialPostsByPostId, usePublishToSocial } from "@/hooks/useSocialPosts";
import { supabase } from "@/integrations/supabase/client";
import { QuickCategoryDialog } from "@/components/admin/QuickCategoryDialog";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Save, Sparkles, Facebook, Send, CheckCircle, XCircle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { normalizeMarkdownInHtml } from "@/lib/normalizeMarkdownInHtml";

// Categories are now fetched dynamically from sport_categories table

// Custom URL validation that's more permissive for tracking URLs and relative paths
const isValidUrl = (url: string) => {
  // Allow relative paths starting with /
  if (url.startsWith('/')) {
    return true;
  }
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const postSchema = z.object({
  title: z.string().min(5, "Tytuł musi mieć minimum 5 znaków"),
  excerpt: z.string().min(10, "Opis musi mieć minimum 10 znaków"),
  content: z.string().optional(),
  category_id: z.string().min(1, "Wybierz kategorię"),
  author_id: z.string().optional(),
  image_url: z.string().refine((val) => !val || isValidUrl(val), {
    message: "Nieprawidłowy URL obrazka",
  }).optional(),
  source_url: z.string().refine((val) => !val || isValidUrl(val), {
    message: "Nieprawidłowy URL źródła",
  }).optional().default(""),
  tags: z.string(),
  is_sponsored: z.boolean(),
  is_news_of_day: z.boolean(),
  published_at: z.string(),
});

type PostFormData = z.infer<typeof postSchema>;

interface PrefillData {
  title?: string;
  excerpt?: string;
  content?: string;
  tags?: string;
  date?: string;
}

const PostEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditing = !!id;
  const { user } = useAuth();

  // Check for prefill data from navigation state (e.g., from daily summary generator)
  const navState = location.state as {
    prefill?: PrefillData;
    sourceUrl?: string;
    suggestionId?: string;
    autoExtract?: boolean;
  } | null;
  const prefillData = navState?.prefill;
  const prefillSourceUrl = navState?.sourceUrl;
  const suggestionId = navState?.suggestionId;
  const autoExtract = navState?.autoExtract;
  const [autoExtractTriggered, setAutoExtractTriggered] = useState(false);

  const { data: post, isLoading: isLoadingPost } = usePost(id || "");
  const { data: sportCategories, isLoading: isLoadingCategories } = useSportCategories();
  const { data: authors } = useAuthors();
  const { data: currentUserAuthor } = useAuthorByUserId(user?.id || "");
  const { data: socialPosts } = useSocialPostsByPostId(id || "");
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();
  const extractArticle = useExtractArticle();
  const publishToSocial = usePublishToSocial();

  // Facebook publishing state
  const [publishToFacebook, setPublishToFacebook] = useState(false);
  const [customFacebookCaption, setCustomFacebookCaption] = useState("");
  const [showFacebookDialog, setShowFacebookDialog] = useState(false);

  // Get current date/time formatted for datetime-local input
  const getCurrentDateTime = () => new Date().toISOString().slice(0, 16);

  const form = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: "",
      excerpt: "",
      content: "",
      category_id: "",
      author_id: "",
      image_url: "",
      source_url: "",
      tags: "",
      is_sponsored: false,
      is_news_of_day: false,
      published_at: getCurrentDateTime(),
    },
  });

  // Apply prefill data when component mounts with prefill state
  // Wait for sportCategories to load before applying prefill to avoid race condition
  useEffect(() => {
    // Poczekaj aż kategorie się załadują
    if (!sportCategories || sportCategories.length === 0) return;
    
    if (prefillData && !isEditing) {
      if (prefillData.title) form.setValue("title", prefillData.title);
      if (prefillData.excerpt) form.setValue("excerpt", prefillData.excerpt);
      if (prefillData.content) {
        const normalizedContent = normalizeMarkdownInHtml(prefillData.content);
        form.setValue("content", normalizedContent);
      }
      if (prefillData.tags) form.setValue("tags", prefillData.tags);
      
      // Set internal source URL for AI-generated summary posts
      const summaryDate = prefillData.date || new Date().toISOString().slice(0, 10);
      form.setValue("source_url", `https://szortsy.pl/podsumowanie/${summaryDate}`);
      
      // Set unique daily summary image
      form.setValue("image_url", "/images/categories/daily-summary.webp");
      
      // Find "other" category for summary posts, fallback to first available
      const otherCategory = sportCategories.find((cat) => cat.slug === "other");
      const categoryToUse = otherCategory || sportCategories[0];
      if (categoryToUse) {
        form.setValue("category_id", categoryToUse.id);
      }
      
      toast.info("Formularz wypełniony danymi z generatora podsumowania");
    }
  }, [prefillData, isEditing, sportCategories, form]);

  // Set default author to current user's author profile when creating new post
  useEffect(() => {
    if (!isEditing && currentUserAuthor && !form.getValues("author_id")) {
      form.setValue("author_id", currentUserAuthor.id);
    }
  }, [isEditing, currentUserAuthor, form]);

  // Reset published_at to current time when creating a new post (not editing)
  useEffect(() => {
    if (!isEditing && !post) {
      form.setValue("published_at", getCurrentDateTime());
    }
  }, [isEditing, post, form]);

  useEffect(() => {
    if (post) {
      // Normalize content to convert any **text** to <strong>text</strong>
      const normalizedContent = normalizeMarkdownInHtml(post.content || "");
      
      form.reset({
        title: post.title,
        excerpt: post.excerpt,
        content: normalizedContent,
        category_id: post.category_id || "",
        author_id: post.author_id || "",
        image_url: post.image_url || "",
        source_url: post.source_url,
        tags: post.tags?.join(", ") || "",
        is_sponsored: post.is_sponsored,
        is_news_of_day: post.is_news_of_day,
        published_at: new Date(post.published_at).toISOString().slice(0, 16),
      });
    }
  }, [post, form]);

  // Notify Google Indexing API about new/updated post
  const notifyGoogleIndex = async (slug: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      
      if (!token) {
        console.warn("No auth token for Google Indexing notification");
        return;
      }

      const postUrl = `https://szortsy.pl/blink/${slug}`;
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-google-index`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            url: postUrl,
            type: "URL_UPDATED",
          }),
        }
      );

      const result = await response.json();
      
      if (response.ok && result.success) {
        toast.success("Google zostało powiadomione o nowym artykule", {
          description: `URL: ${postUrl}`,
        });
      } else {
        console.error("Google Indexing notification failed:", result);
        toast.warning("Nie udało się powiadomić Google o nowym artykule", {
          description: result.error || "Spróbuj ponownie później",
        });
      }
    } catch (error) {
      console.error("Google Indexing notification error:", error);
      // Don't show error toast - this is a non-critical feature
    }
  };

  const onSubmit = async (data: PostFormData) => {
    const postData = {
      title: data.title,
      excerpt: data.excerpt,
      content: data.content || undefined,
      category_id: data.category_id,
      author_id: data.author_id || undefined,
      image_url: data.image_url || undefined,
      source_url: data.source_url,
      tags: data.tags ? data.tags.split(",").map((t) => t.trim()) : [],
      is_sponsored: data.is_sponsored,
      is_news_of_day: data.is_news_of_day,
      published_at: new Date(data.published_at).toISOString(),
    };

    let savedPostId = id;

    if (isEditing && id) {
      await updatePost.mutateAsync({ id, ...postData });
    } else {
      const newPost = await createPost.mutateAsync({ ...postData, created_by: user?.id });
      savedPostId = newPost?.id;
      
      // Notify Google about the new post (only for new posts, not edits)
      if (newPost?.slug) {
        notifyGoogleIndex(newPost.slug);
      }
    }

    // Publish to Facebook if checkbox is checked
    if (publishToFacebook && savedPostId) {
      try {
        await publishToSocial.mutateAsync({
          post_id: savedPostId,
          platform: "facebook",
          custom_caption: customFacebookCaption || undefined,
        });
      } catch (error) {
        // Error toast already shown by hook
        console.error("Facebook publish failed:", error);
      }
    }

    navigate("/admin/posts");
  };

  // Handle manual Facebook publish for existing posts
  const handlePublishToFacebook = async () => {
    if (!id) return;
    
    try {
      await publishToSocial.mutateAsync({
        post_id: id,
        platform: "facebook",
        custom_caption: customFacebookCaption || undefined,
      });
      setShowFacebookDialog(false);
      setCustomFacebookCaption("");
    } catch (error) {
      console.error("Facebook publish failed:", error);
    }
  };

  // Get latest Facebook publication status
  const latestFacebookPost = socialPosts?.find(sp => sp.platform === "facebook");
  const facebookPublishStatus = latestFacebookPost?.status;

  const isSubmitting = createPost.isPending || updatePost.isPending;

  const handleAIExtract = async () => {
    const sourceUrl = form.getValues("source_url");
    
    console.log("[AI Extract] Starting extraction for URL:", sourceUrl);
    
    if (!sourceUrl) {
      toast.error("Wprowadź URL źródła przed użyciem AI");
      return;
    }

    try {
      new URL(sourceUrl);
    } catch {
      toast.error("Nieprawidłowy format URL");
      return;
    }

    toast.info("Analizuję artykuł...");
    console.log("[AI Extract] Calling extractArticle.mutateAsync...");

    try {
      const extractedData = await extractArticle.mutateAsync(sourceUrl);
      
      console.log("[AI Extract] Received data:", {
        title: extractedData.title,
        category: extractedData.category,
        tagsCount: extractedData.tags?.length,
        hasContent: !!extractedData.content,
        contentPreview: extractedData.content?.substring(0, 100),
        extraction_info: extractedData.extraction_info,
      });
      
      // Fill form with extracted data
      form.setValue("title", extractedData.title);
      form.setValue("excerpt", extractedData.excerpt);
      
      // Set AI-generated content if available - normalize to remove any ** patterns
      if (extractedData.content) {
        const normalizedContent = normalizeMarkdownInHtml(extractedData.content);
        form.setValue("content", normalizedContent);
      }
      
      // Try to match extracted category slug to a category_id
      const matchedCategory = sportCategories?.find(
        (cat) => cat.slug === extractedData.category
      );
      if (matchedCategory) {
        form.setValue("category_id", matchedCategory.id);
      }
      form.setValue("tags", extractedData.tags.join(", "));
      
      // If OG image found and no image set yet, offer to use it
      if (extractedData.og_image && !form.getValues("image_url")) {
        form.setValue("image_url", extractedData.og_image);
      }
      
      // Check extraction quality and show appropriate toast
      const extractionInfo = extractedData.extraction_info;
      if (extractionInfo?.quality_warning) {
        toast.warning(
          `Strona zwróciła mało treści (${extractionInfo.final_text_length} znaków).` +
          (extractionInfo.used_firecrawl ? " Użyto renderowania JavaScript." : "") +
          " Sprawdź wygenerowaną treść przed publikacją!",
          { duration: 8000 }
        );
      } else {
        toast.success("Formularz wypełniony przez AI!");
      }
    } catch (error) {
      console.error("[AI Extract] Error:", error);
      // Error toast is already handled by useExtractArticle hook
    }
  };

  if ((isEditing && isLoadingPost) || isLoadingCategories) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </AdminLayout>
    );
  }

  // Get current category for ImageSourceSection
  const currentCategoryId = form.watch("category_id");
  const currentCategory = sportCategories?.find((cat) => cat.id === currentCategoryId);

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
            {/* AI Extract section - at the top */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Generuj AI
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="source_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL źródła</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            placeholder="https://..."
                            {...field}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleAIExtract}
                          disabled={extractArticle.isPending}
                          className="shrink-0"
                        >
                          {extractArticle.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                          <span className="ml-2 hidden sm:inline">Generuj AI</span>
                        </Button>
                      </div>
                      <FormDescription>
                        Wklej link i kliknij "Generuj AI" aby automatycznie wypełnić formularz
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {extractArticle.isPending && (
                  <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-primary">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Analizuję artykuł i wypełniam formularz...</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Mobile-only Facebook button */}
            <div className="lg:hidden">
              <Card>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-2">
                    <Facebook className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium">Facebook</span>
                  </div>
                  {isEditing ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFacebookDialog(true)}
                      disabled={publishToSocial.isPending}
                    >
                      {publishToSocial.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Wyślij
                    </Button>
                  ) : (
                    <Switch
                      checked={publishToFacebook}
                      onCheckedChange={setPublishToFacebook}
                    />
                  )}
                </CardContent>
              </Card>
            </div>

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
                          <FormLabel>Pełna treść artykułu</FormLabel>
                          <FormControl>
                            <RichTextEditor
                              content={field.value || ""}
                              onChange={field.onChange}
                              placeholder="Pełna treść artykułu (generowana automatycznie przez AI)..."
                            />
                          </FormControl>
                          <FormDescription>
                            Ta treść będzie wyświetlana na dedykowanej stronie artykułu (/blink/:id).
                            Użyj paska narzędzi do formatowania tekstu.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Image source section */}
                <ImageSourceSection 
                  form={form} 
                  category={currentCategory?.slug as any} 
                />
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
                      name="category_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kategoria</FormLabel>
                          <div className="flex gap-2">
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="flex-1">
                                  <SelectValue placeholder="Wybierz kategorię" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {sportCategories?.map((cat) => (
                                  <SelectItem key={cat.id} value={cat.id}>
                                    {cat.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <QuickCategoryDialog
                              onCategoryCreated={(categoryId) => {
                                form.setValue("category_id", categoryId);
                              }}
                            />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="author_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Autor</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Wybierz autora" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {authors?.map((author) => (
                                <SelectItem key={author.id} value={author.id}>
                                  {author.display_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Autor widoczny przy artykule
                          </FormDescription>
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

            {/* Facebook Publishing Card - hidden on mobile, shown on desktop */}
                <Card className="hidden lg:block">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Facebook className="h-5 w-5 text-blue-600" />
                      Publikuj na Facebook
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Show status for existing posts */}
                    {isEditing && facebookPublishStatus && (
                      <div className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
                        facebookPublishStatus === "published" 
                          ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400"
                          : facebookPublishStatus === "failed"
                          ? "border-destructive/30 bg-destructive/10 text-destructive"
                          : "border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                      }`}>
                        {facebookPublishStatus === "published" && <CheckCircle className="h-4 w-4" />}
                        {facebookPublishStatus === "failed" && <XCircle className="h-4 w-4" />}
                        {facebookPublishStatus === "pending" && <Clock className="h-4 w-4" />}
                        <span>
                          {facebookPublishStatus === "published" && "Opublikowano na Facebook"}
                          {facebookPublishStatus === "failed" && "Publikacja nie powiodła się"}
                          {facebookPublishStatus === "pending" && "Oczekuje na publikację"}
                        </span>
                      </div>
                    )}

                    {/* New post: checkbox to publish with save */}
                    {!isEditing && (
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">Opublikuj przy zapisie</p>
                          <p className="text-xs text-muted-foreground">
                            Wyślij na Facebook po zapisaniu posta
                          </p>
                        </div>
                        <Switch
                          checked={publishToFacebook}
                          onCheckedChange={setPublishToFacebook}
                        />
                      </div>
                    )}

                    {/* Caption input (shown when checkbox checked or for existing post) */}
                    {(publishToFacebook || isEditing) && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Własny opis (opcjonalnie)</p>
                        <Textarea
                          value={customFacebookCaption}
                          onChange={(e) => setCustomFacebookCaption(e.target.value)}
                          placeholder="Zostaw puste, aby AI wygenerował opis automatycznie..."
                          rows={3}
                          className="text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          Jeśli nie podasz własnego opisu, AI wygeneruje go automatycznie.
                        </p>
                      </div>
                    )}

                    {/* Manual publish button for existing posts */}
                    {isEditing && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => setShowFacebookDialog(true)}
                        disabled={publishToSocial.isPending}
                      >
                        {publishToSocial.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="mr-2 h-4 w-4" />
                        )}
                        Wyślij na Facebook
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {Object.keys(form.formState.errors).length > 0 && (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive space-y-1 mb-4">
                    <p className="font-medium">Popraw błędy przed zapisaniem:</p>
                    {Object.entries(form.formState.errors).map(([key, error]) => (
                      <p key={key}>• {String(error?.message) || `Błąd w polu ${key}`}</p>
                    ))}
                  </div>
                )}

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

        {/* Facebook Confirmation Dialog */}
        <Dialog open={showFacebookDialog} onOpenChange={setShowFacebookDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Facebook className="h-5 w-5 text-blue-600" />
                Wyślij na Facebook
              </DialogTitle>
              <DialogDescription>
                {customFacebookCaption 
                  ? "Post zostanie wysłany z Twoim własnym opisem."
                  : "AI wygeneruje automatycznie angażujący opis posta."}
              </DialogDescription>
            </DialogHeader>
            
            {customFacebookCaption && (
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="text-sm font-medium mb-1">Twój opis:</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {customFacebookCaption}
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowFacebookDialog(false)}
              >
                Anuluj
              </Button>
              <Button
                onClick={handlePublishToFacebook}
                disabled={publishToSocial.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {publishToSocial.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Wyślij
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default PostEditor;
