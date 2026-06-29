import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Plus, Save, Sparkles, Trash2, X } from "lucide-react";
import {
  useReviewById,
  useUpsertReview,
  useReviewCategories,
  type Review,
} from "@/hooks/useReviews";
import { supabase } from "@/integrations/supabase/client";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const ReviewEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;
  const { data: existing } = useReviewById(id);
  const { data: categories = [] } = useReviewCategories();
  const upsert = useUpsertReview();

  const [form, setForm] = useState<Partial<Review>>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    verdict: "",
    score: null,
    pros: [],
    cons: [],
    gallery: [],
    cover_image_url: "",
    product_name: "",
    product_brand: "",
    category_id: null,
    status: "draft",
    source_url: "",
    is_ai_generated: false,
    content_type: "review",
  });
  const isReview = (form.content_type ?? "review") === "review";
  const [slugTouched, setSlugTouched] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMode, setAiMode] = useState<"review" | "news">("review");

  useEffect(() => {
    if (existing?.content_type === "news" || existing?.content_type === "review") {
      setAiMode(existing.content_type);
    }
  }, [existing]);
  const aiIsReview = aiMode === "review";

  useEffect(() => {
    if (existing) {
      setForm(existing);
      setSlugTouched(true);
    }
  }, [existing]);

  useEffect(() => {
    if (!slugTouched && form.title) {
      setForm((f) => ({ ...f, slug: slugify(f.title || "") }));
    }
  }, [form.title, slugTouched]);

  const set = <K extends keyof Review>(key: K, value: Review[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const addPro = () => set("pros", [...(form.pros ?? []), ""]);
  const addCon = () => set("cons", [...(form.cons ?? []), ""]);

  const handleSubmit = async (publish?: boolean) => {
    if (!form.title || !form.slug) {
      toast.error("Tytuł i slug są wymagane");
      return;
    }
    const payload: any = {
      ...form,
      id: id ?? undefined,
      pros: (form.pros ?? []).filter((p) => p && p.trim()),
      cons: (form.cons ?? []).filter((c) => c && c.trim()),
      status: publish ? "published" : form.status ?? "draft",
    };
    delete payload.category;
    const saved = await upsert.mutateAsync(payload);
    navigate(`/admin/recki/${saved.id}/edit`);
  };

  const generateAI = async () => {
    if (!aiPrompt.trim() && !form.source_url) {
      toast.error(aiIsReview ? "Podaj produkt lub URL źródła" : "Podaj temat newsa lub URL źródła");
      return;
    }
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-review", {
        body: {
          content_type: aiMode,
          product: aiIsReview ? (aiPrompt || form.product_name || form.title) : undefined,
          topic: !aiIsReview ? (aiPrompt || form.title) : undefined,
          category: categories.find((c) => c.id === form.category_id)?.name,
          source_url: form.source_url || undefined,
        },
      });
      if (error) {
        // supabase.functions.invoke wraps non-2xx in FunctionsHttpError; extract body error
        let msg = error.message;
        try {
          const ctx: any = (error as any).context;
          if (ctx?.json) {
            const j = await ctx.json();
            if (j?.error) msg = j.error;
          } else if (ctx?.text) {
            const t = await ctx.text();
            const j = JSON.parse(t);
            if (j?.error) msg = j.error;
          }
        } catch { /* ignore */ }
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);
      const suggested: string[] = Array.isArray(data.gallery_suggestions) ? data.gallery_suggestions : [];
      const existingGallery = form.gallery ?? [];
      const existingCover = form.cover_image_url;
      const mergedGallery = existingGallery.length > 0
        ? existingGallery
        : suggested.slice(0, 8);
      const nextCover = existingCover && existingCover.trim()
        ? existingCover
        : suggested[0] ?? existingCover;
      setForm((f) => ({
        ...f,
        content_type: aiMode,
        title: data.title ?? f.title,
        slug: f.slug || slugify(data.title ?? ""),
        excerpt: data.excerpt ?? f.excerpt,
        content: data.content ?? f.content,
        verdict: aiIsReview ? (data.verdict ?? f.verdict) : f.verdict,
        score: aiIsReview ? (data.score ?? f.score) : f.score,
        pros: aiIsReview ? (data.pros ?? f.pros) : f.pros,
        cons: aiIsReview ? (data.cons ?? f.cons) : f.cons,
        product_name: aiIsReview ? (data.product_name ?? f.product_name) : f.product_name,
        product_brand: aiIsReview ? (data.product_brand ?? f.product_brand) : f.product_brand,
        cover_image_url: nextCover,
        gallery: mergedGallery,
        is_ai_generated: true,
      }));
      setSlugTouched(true);
      const imgInfo = suggested.length
        ? ` (+${existingGallery.length ? 0 : Math.min(suggested.length, 8)} obrazków ze źródła)`
        : "";
      toast.success(`Wygenerowano ${aiIsReview ? "recenzję" : "news"} AI${imgInfo} — edytuj i opublikuj`);
    } catch (e: any) {
      toast.error(e.message ?? "Błąd generowania");
    } finally {
      setAiLoading(false);
    }
  };



  const uploadGalleryImage = async (file: File) => {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `reviews/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("post-images").upload(path, file);
    if (error) {
      toast.error(error.message);
      return;
    }
    const { data } = supabase.storage.from("post-images").getPublicUrl(path);
    set("gallery", [...(form.gallery ?? []), data.publicUrl]);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => navigate("/admin/recki")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Wróć
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleSubmit(false)} disabled={upsert.isPending}>
              {upsert.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Zapisz szkic
            </Button>
            <Button onClick={() => handleSubmit(true)} disabled={upsert.isPending}>
              Opublikuj
            </Button>
          </div>
        </div>

        <h1 className="text-3xl font-bold">{isNew ? "Nowa recenzja" : "Edycja recenzji"}</h1>

        {/* AI generator */}
        <Card className="border-fuchsia-600/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-fuchsia-600" /> Generator AI — {aiIsReview ? "Recenzja" : "News"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Tryb generowania</Label>
              <div className="mt-1 inline-flex rounded-md border border-border bg-muted p-1">
                <button
                  type="button"
                  onClick={() => setAiMode("review")}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    aiMode === "review"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Recenzja
                </button>
                <button
                  type="button"
                  onClick={() => setAiMode("news")}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    aiMode === "news"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  News
                </button>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{aiIsReview ? "Produkt" : "Temat newsa"}</Label>
              <Input
                placeholder={aiIsReview
                  ? "np. iPhone 16 Pro Max — codzienne użytkowanie"
                  : "np. Apple ogłasza iOS 19 z nowym AI"}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">URL źródła (opcjonalnie)</Label>
              <Input
                placeholder="https://… — AI przeczyta artykuł i pobierze obrazki"
                value={form.source_url ?? ""}
                onChange={(e) => set("source_url", e.target.value)}
              />
            </div>
            <Button onClick={generateAI} disabled={aiLoading}>
              {aiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {aiIsReview ? "Wygeneruj recenzję" : "Wygeneruj news"}
            </Button>
            <p className="text-xs text-muted-foreground">
              {aiIsReview
                ? "AI zaproponuje tytuł, werdykt, ocenę 1–10, plusy, minusy i treść. Jeśli podasz URL, automatycznie pobierze obrazki do galerii (chyba że już dodałeś własne)."
                : "AI napisze krótki, rzeczowy news (400–800 słów) bez oceny i plusów/minusów. Typ wpisu zostanie automatycznie ustawiony na News."}
            </p>
          </CardContent>

        </Card>


        {/* Basic info */}
        <Card>
          <CardHeader>
            <CardTitle>Podstawowe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Typ wpisu</Label>
              <Select
                value={form.content_type ?? "review"}
                onValueChange={(v) => set("content_type", v as "review" | "news")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="review">Recenzja (z oceną, plusami i minusami)</SelectItem>
                  <SelectItem value="news">News / artykuł (bez oceny)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg border border-fuchsia-600/30 bg-fuchsia-600/5 p-3">
              <Label className="text-sm font-semibold">Skąd pochodzi treść?</Label>
              <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                Określa plakietkę widoczną w nagłówku artykułu Tech.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { value: "research", label: "Na podstawie researchu", desc: "Kompilacja źródeł, specyfikacji i opinii — bez fizycznego testu." },
                  { value: "hands_on", label: "Test redakcji", desc: "Produkt fizycznie testowany przez redakcję Tech." },
                ].map((opt) => {
                  const active = (form as any).review_basis === opt.value;
                  return (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => set("review_basis" as any, opt.value as any)}
                      className={`text-left rounded-lg border p-3 transition-colors ${
                        active
                          ? "border-fuchsia-600 bg-fuchsia-600/10"
                          : "border-border hover:border-fuchsia-600/50"
                      }`}
                    >
                      <div className="text-sm font-semibold">{opt.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>
                    </button>
                  );
                })}
              </div>
              {(form as any).review_basis && (
                <button
                  type="button"
                  onClick={() => set("review_basis" as any, null as any)}
                  className="mt-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Wyczyść (nie pokazuj plakietki)
                </button>
              )}
            </div>

            <div>
              <Label>Tytuł</Label>
              <Input value={form.title ?? ""} onChange={(e) => set("title", e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Slug (URL)</Label>
                <Input
                  value={form.slug ?? ""}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", slugify(e.target.value));
                  }}
                />
              </div>
              <div>
                <Label>Kategoria</Label>
                <Select
                  value={form.category_id ?? undefined}
                  onValueChange={(v) => set("category_id", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz kategorię" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {isReview && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Marka</Label>
                  <Input value={form.product_brand ?? ""} onChange={(e) => set("product_brand", e.target.value)} />
                </div>
                <div>
                  <Label>Nazwa produktu</Label>
                  <Input value={form.product_name ?? ""} onChange={(e) => set("product_name", e.target.value)} />
                </div>
              </div>
            )}
            <div>
              <Label>Krótki opis (excerpt)</Label>
              <Textarea
                rows={2}
                value={form.excerpt ?? ""}
                onChange={(e) => set("excerpt", e.target.value)}
              />
            </div>
            {isReview && (
              <div className="grid grid-cols-1 sm:grid-cols-[1fr,200px] gap-3">
                <div>
                  <Label>Werdykt</Label>
                  <Textarea
                    rows={3}
                    value={form.verdict ?? ""}
                    onChange={(e) => set("verdict", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Ocena 0–10</Label>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    step={0.1}
                    value={form.score ?? ""}
                    onChange={(e) =>
                      set("score", e.target.value === "" ? null : Number(e.target.value))
                    }
                  />
                </div>
              </div>
            )}
            <div>
              <Label>URL źródła (opcjonalnie)</Label>
              <Input value={form.source_url ?? ""} onChange={(e) => set("source_url", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Cover */}
        <Card>
          <CardHeader>
            <CardTitle>Zdjęcie główne</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUploader
              value={form.cover_image_url ?? ""}
              onChange={(url) => set("cover_image_url", url)}
              onRemove={() => set("cover_image_url", "")}
              storageBucket="post-images"
              storagePath="reviews/cover"
            />
          </CardContent>
        </Card>

        {/* Gallery */}
        <Card>
          <CardHeader>
            <CardTitle>Galeria zdjęć</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(form.gallery ?? []).map((url, idx) => (
                <div key={idx} className="relative aspect-square overflow-hidden rounded-md border">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute right-1 top-1 h-7 w-7"
                    onClick={() =>
                      set(
                        "gallery",
                        (form.gallery ?? []).filter((_, i) => i !== idx)
                      )
                    }
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary">
                <Plus className="h-6 w-6" />
                <span className="mt-1 text-xs">Dodaj</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files ?? []);
                    for (const f of files) await uploadGalleryImage(f);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Pros / Cons */}
        {isReview && (
        <Card>
          <CardHeader>
            <CardTitle>Plusy i minusy</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Plusy</Label>
                <Button type="button" variant="ghost" size="sm" onClick={addPro}>
                  <Plus className="mr-1 h-3 w-3" /> Dodaj
                </Button>
              </div>
              {(form.pros ?? []).map((p, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={p}
                    onChange={(e) => {
                      const next = [...(form.pros ?? [])];
                      next[i] = e.target.value;
                      set("pros", next);
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => set("pros", (form.pros ?? []).filter((_, j) => j !== i))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Minusy</Label>
                <Button type="button" variant="ghost" size="sm" onClick={addCon}>
                  <Plus className="mr-1 h-3 w-3" /> Dodaj
                </Button>
              </div>
              {(form.cons ?? []).map((c, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={c}
                    onChange={(e) => {
                      const next = [...(form.cons ?? [])];
                      next[i] = e.target.value;
                      set("cons", next);
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => set("cons", (form.cons ?? []).filter((_, j) => j !== i))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        )}

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle>Treść {isReview ? "recenzji" : "wpisu"} (HTML)</CardTitle>
          </CardHeader>
          <CardContent>
            <RichTextEditor
              content={form.content ?? ""}
              onChange={(v) => set("content", v)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <Label className="text-base">Status: {form.status === "published" ? "Opublikowana" : "Szkic"}</Label>
              <p className="text-xs text-muted-foreground">
                Włącz, by oznaczyć jako opublikowaną (data pub. = teraz).
              </p>
            </div>
            <Switch
              checked={form.status === "published"}
              onCheckedChange={(v) => set("status", v ? "published" : "draft")}
            />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ReviewEditor;
