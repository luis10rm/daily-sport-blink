import { optimizeImageUrl } from "@/lib/imageUrl";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { sanitizePastedHtml } from "@/lib/unescapeHtmlIfEncoded";
import { mirrorExternalImage } from "@/lib/mirrorImage";
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
import { ArrowDown, ArrowLeft, ArrowUp, Loader2, Plus, Save, Search, Sparkles, Star, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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

type ContentType = "review" | "news" | "comparison";

const CONTENT_TYPES: {
  value: ContentType;
  label: string;
  accusative: string;
  desc: string;
  aiInputLabel: string;
  aiPlaceholder: string;
  aiButton: string;
  aiHint: string;
}[] = [
  {
    value: "review",
    label: "Recenzja",
    accusative: "recenzję",
    desc: "Ocena 0–10, plusy i minusy, werdykt.",
    aiInputLabel: "Produkt",
    aiPlaceholder: "np. iPhone 16 Pro Max — codzienne użytkowanie",
    aiButton: "Wygeneruj recenzję",
    aiHint:
      "AI zaproponuje tytuł, werdykt, ocenę 1–10, plusy, minusy i treść. Jeśli podasz URL, automatycznie pobierze obrazki do galerii (chyba że już dodałeś własne).",
  },
  {
    value: "news",
    label: "News",
    accusative: "news",
    desc: "Krótki artykuł informacyjny, bez oceny.",
    aiInputLabel: "Temat newsa",
    aiPlaceholder: "np. Apple ogłasza iOS 19 z nowym AI",
    aiButton: "Wygeneruj news",
    aiHint: "AI napisze krótki, rzeczowy news (300–600 słów) bez oceny i plusów/minusów.",
  },
  {
    value: "comparison",
    label: "Porównanie",
    accusative: "porównanie",
    desc: "Ranking / TOP-lista z sekcją FAQ i szybkim werdyktem.",
    aiInputLabel: "Temat rankingu",
    aiPlaceholder: "np. najlepsze słuchawki bezprzewodowe do 1000 zł",
    aiButton: "Wygeneruj porównanie",
    aiHint:
      "AI zbuduje ranking pro-kliencki: pozycje z ceną w PLN, zalety i wady, sekcja „jak wybieraliśmy”, ściąga zakupowa i FAQ. Prompt edytujesz w Ustawieniach.",
  },
];


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
    faq: [],

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
  const contentType = (form.content_type ?? "review") as ContentType;
  const isReview = contentType === "review";
  const isComparison = contentType === "comparison";
  const typeMeta = CONTENT_TYPES.find((t) => t.value === contentType) ?? CONTENT_TYPES[0];
  const [slugTouched, setSlugTouched] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);


  // Image search (SerpApi / Google Images)
  type SearchedImage = {
    imageUrl: string;
    thumbnailUrl: string;
    sourceDomain: string;
    sourceUrl: string;
    title: string;
    width: number | null;
    height: number | null;
  };
  const [imgSearchOpen, setImgSearchOpen] = useState(false);
  const [imgSearchQuery, setImgSearchQuery] = useState("");
  const [imgSearchLoading, setImgSearchLoading] = useState(false);
  const [imgSearchResults, setImgSearchResults] = useState<SearchedImage[]>([]);

  const runImageSearch = async (q: string) => {
    const query = q.trim();
    if (query.length < 2) return;
    setImgSearchLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("search-product-images", {
        body: { query, num: 24 },
      });
      if (error) throw error;
      const images = Array.isArray((data as any)?.images) ? (data as any).images : [];
      setImgSearchResults(images);
      if (!images.length) toast.info("Brak wyników dla tego zapytania");
    } catch (e: any) {
      toast.error(e?.message ?? "Błąd wyszukiwania");
    } finally {
      setImgSearchLoading(false);
    }
  };

  const addImageFromSearch = (url: string) => {
    if (!url) return;
    const current = form.gallery ?? [];
    if (current.includes(url)) {
      toast.info("To zdjęcie jest już w galerii");
      return;
    }
    set("gallery", [...current, url]);
    toast.success("Dodano do galerii");
  };

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

  const changeContentType = (next: ContentType) => {
    if (next === contentType) return;
    const losesReviewFields =
      contentType === "review" &&
      next !== "review" &&
      (form.score !== null && form.score !== undefined ||
        (form.pros ?? []).some((p) => p?.trim()) ||
        (form.cons ?? []).some((c) => c?.trim()));
    if (losesReviewFields) {
      const ok = window.confirm(
        "Zmiana typu ukryje ocenę oraz plusy i minusy (dane zostaną w bazie, ale nie będą widoczne w artykule). Kontynuować?",
      );
      if (!ok) return;
    }
    set("content_type", next as any);
  };


  const addPro = () => set("pros", [...(form.pros ?? []), ""]);
  const addCon = () => set("cons", [...(form.cons ?? []), ""]);
  const faqItems = form.faq ?? [];
  const addFaq = () => set("faq", [...faqItems, { q: "", a: "" }]);
  const setFaqField = (i: number, key: "q" | "a", value: string) => {
    const next = faqItems.map((item, j) => (j === i ? { ...item, [key]: value } : item));
    set("faq", next);
  };
  const removeFaq = (i: number) => set("faq", faqItems.filter((_, j) => j !== i));
  const moveFaq = (i: number, dir: -1 | 1) => {
    const target = i + dir;
    if (target < 0 || target >= faqItems.length) return;
    const next = [...faqItems];
    [next[i], next[target]] = [next[target], next[i]];
    set("faq", next);
  };

  const handleSubmit = async (publish?: boolean) => {
    if (!form.title || !form.slug) {
      toast.error("Tytuł i slug są wymagane");
      return;
    }
    // External cover images are copied into our storage so they get WebP/srcset
    // treatment and never break when the source removes the file.
    const mirroredCover = await mirrorExternalImage(form.cover_image_url);

    const payload: any = {
      ...form,
      cover_image_url: mirroredCover ?? form.cover_image_url,
      id: id ?? undefined,
      content: form.content ? sanitizePastedHtml(form.content) : form.content,
      pros: (form.pros ?? []).filter((p) => p && p.trim()),
      cons: (form.cons ?? []).filter((c) => c && c.trim()),
      faq: faqItems
        .map((item) => ({ q: (item.q ?? "").trim(), a: (item.a ?? "").trim() }))
        .filter((item) => item.q && item.a),
      status: publish ? "published" : form.status ?? "draft",
    };

    delete payload.category;
    const saved = await upsert.mutateAsync(payload);
    navigate(`/admin/recki/${saved.id}/edit`);
  };

  const generateAI = async () => {
    if (!aiPrompt.trim() && !form.source_url) {
      toast.error(`${typeMeta.aiInputLabel} lub URL źródła jest wymagany`);
      return;
    }
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-review", {
        body: {
          content_type: contentType,
          product: isReview ? (aiPrompt || form.product_name || form.title) : undefined,
          topic: !isReview ? (aiPrompt || form.title) : undefined,
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
      const aiFaq = Array.isArray(data.faq)
        ? data.faq
            .map((item: any) => ({ q: String(item?.q ?? "").trim(), a: String(item?.a ?? "").trim() }))
            .filter((item: any) => item.q && item.a)
        : [];
      setForm((f) => ({
        ...f,
        content_type: contentType,
        title: data.title ?? f.title,
        slug: f.slug || slugify(data.title ?? ""),
        excerpt: data.excerpt ?? f.excerpt,
        content: data.content ? sanitizePastedHtml(data.content) : f.content,
        verdict: isReview || isComparison ? (data.verdict ?? f.verdict) : f.verdict,
        score: isReview ? (data.score ?? f.score) : f.score,
        pros: isReview ? (data.pros ?? f.pros) : f.pros,
        cons: isReview ? (data.cons ?? f.cons) : f.cons,
        faq: aiFaq.length && !(f.faq ?? []).length ? aiFaq : f.faq,
        product_name: isReview ? (data.product_name ?? f.product_name) : f.product_name,
        product_brand: isReview ? (data.product_brand ?? f.product_brand) : f.product_brand,
        cover_image_url: nextCover,
        gallery: mergedGallery,
        is_ai_generated: true,
      }));
      setSlugTouched(true);
      const imgInfo = suggested.length
        ? ` (+${existingGallery.length ? 0 : Math.min(suggested.length, 8)} obrazków ze źródła)`
        : "";
      if (Array.isArray(data.internal_links) && data.internal_links.length) {
        toast.info(`Propozycje linkowania: ${data.internal_links.slice(0, 3).join(" · ")}`, { duration: 10000 });
      }
      toast.success(`Wygenerowano: ${typeMeta.accusative} AI${imgInfo} — edytuj i opublikuj`);
      if (Array.isArray(data.warnings)) {
        for (const w of data.warnings.slice(0, 3)) {
          toast.warning(String(w), { duration: 12000 });
        }
      }



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

        <h1 className="text-3xl font-bold">
          {isNew ? `Nowy wpis: ${typeMeta.label}` : `Edycja: ${typeMeta.label}`}
        </h1>

        {/* Step 1 — content type (single source of truth) */}
        <Card className="border-fuchsia-600/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Krok 1 — Typ wpisu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {CONTENT_TYPES.map((opt) => {
                const active = contentType === opt.value;
                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => changeContentType(opt.value)}
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
            <p className="text-xs text-muted-foreground mt-2">
              Typ wybierasz raz — sterują nim zarówno generator AI, jak i pola formularza poniżej.
            </p>
          </CardContent>
        </Card>

        {/* Step 2 — AI generator */}
        <Card className="border-fuchsia-600/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-fuchsia-600" /> Krok 2 — Generator AI ({typeMeta.label})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">{typeMeta.aiInputLabel}</Label>
              <Input
                placeholder={typeMeta.aiPlaceholder}
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
              {typeMeta.aiButton}
            </Button>
            <p className="text-xs text-muted-foreground">{typeMeta.aiHint}</p>
          </CardContent>

        </Card>


        {/* Step 3 — Basic info */}
        <Card>
          <CardHeader>
            <CardTitle>Krok 3 — Podstawowe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

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
            {(isReview || isComparison) && (
              <div className={`grid grid-cols-1 gap-3 ${isReview ? "sm:grid-cols-[1fr,200px]" : ""}`}>
                <div>
                  <Label>{isComparison ? "Szybki werdykt (zwycięzca rankingu)" : "Werdykt"}</Label>
                  <Textarea
                    rows={3}
                    value={form.verdict ?? ""}
                    onChange={(e) => set("verdict", e.target.value)}
                  />
                </div>
                {isReview && (
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
                )}
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
          <CardContent className="space-y-2">
            <ImageUploader
              value={form.cover_image_url ?? ""}
              onChange={(url) => set("cover_image_url", url)}
              onRemove={() => set("cover_image_url", "")}
              storageBucket="post-images"
              storagePath="reviews/cover"
            />
            {(form.gallery ?? []).length > 0 && (
              <p className="text-xs text-muted-foreground">
                Możesz też wybrać dowolne zdjęcie z galerii poniżej — kliknij ⭐ na miniaturze.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Gallery */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle>Galeria zdjęć</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const seed =
                  form.product_name?.trim() ||
                  [form.product_brand, form.title].filter(Boolean).join(" ").trim() ||
                  form.title?.trim() ||
                  "";
                setImgSearchQuery(seed);
                setImgSearchResults([]);
                setImgSearchOpen(true);
                if (seed.length >= 2) {
                  void runImageSearch(seed);
                }
              }}
            >
              <Search className="mr-2 h-4 w-4" /> Szukaj w Google
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(form.gallery ?? []).map((url, idx) => {
                const isCover = url === form.cover_image_url && !!url;
                return (
                  <div
                    key={idx}
                    className={`relative aspect-square overflow-hidden rounded-md border ${
                      isCover ? "ring-2 ring-amber-400 border-amber-400" : ""
                    }`}
                  >
                    <img src={optimizeImageUrl(url, { width: 320, quality: 65 })} alt="" loading="lazy" className="h-full w-full object-cover" />
                    <Button
                      type="button"
                      size="icon"
                      variant={isCover ? "default" : "secondary"}
                      className={`absolute left-1 top-1 h-7 w-7 ${
                        isCover ? "bg-amber-400 text-black hover:bg-amber-400" : ""
                      }`}
                      title={isCover ? "To jest zdjęcie główne" : "Ustaw jako zdjęcie główne"}
                      onClick={() => {
                        set("cover_image_url", url);
                        toast.success("Ustawiono jako zdjęcie główne");
                      }}
                    >
                      <Star className={`h-3.5 w-3.5 ${isCover ? "fill-current" : ""}`} />
                    </Button>
                    {isCover && (
                      <span className="absolute bottom-1 left-1 rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-semibold text-black">
                        Główne
                      </span>
                    )}
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
                );
              })}
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

        {/* Google Image Search Dialog */}
        <Dialog open={imgSearchOpen} onOpenChange={setImgSearchOpen}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Search className="h-4 w-4" /> Wyszukaj zdjęcia w Google
              </DialogTitle>
              <DialogDescription>
                Wpisz nazwę produktu. Kliknij miniaturę, aby dodać ją do galerii. Źródło: SerpApi (Google Images).
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void runImageSearch(imgSearchQuery);
              }}
              className="flex gap-2"
            >
              <Input
                value={imgSearchQuery}
                onChange={(e) => setImgSearchQuery(e.target.value)}
                placeholder="np. Vivo X300 Ultra"
                autoFocus
              />
              <Button type="submit" disabled={imgSearchLoading || imgSearchQuery.trim().length < 2}>
                {imgSearchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span className="ml-2">Szukaj</span>
              </Button>
            </form>
            <div className="flex-1 overflow-y-auto">
              {imgSearchLoading && imgSearchResults.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Szukam zdjęć…
                </div>
              ) : imgSearchResults.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  Wpisz frazę i kliknij „Szukaj”, aby zobaczyć wyniki.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-1">
                  {imgSearchResults.map((img, idx) => {
                    const inGallery = (form.gallery ?? []).includes(img.imageUrl);
                    return (
                      <button
                        key={`${img.imageUrl}-${idx}`}
                        type="button"
                        onClick={() => addImageFromSearch(img.imageUrl)}
                        className={`group relative aspect-square overflow-hidden rounded-md border bg-muted transition hover:ring-2 hover:ring-fuchsia-500 ${
                          inGallery ? "ring-2 ring-emerald-500 opacity-70" : ""
                        }`}
                        title={img.title || img.sourceDomain}
                      >
                        <img
                          src={img.thumbnailUrl || img.imageUrl}
                          alt={img.title || ""}
                          loading="lazy"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.opacity = "0.3";
                          }}
                        />
                        <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                          {img.sourceDomain || "źródło"}
                          {img.width && img.height ? ` · ${img.width}×${img.height}` : ""}
                        </span>
                        {inGallery && (
                          <span className="absolute right-1 top-1 rounded bg-emerald-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            W galerii
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>


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

        {/* FAQ */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <div>
              <CardTitle>FAQ (pytania i odpowiedzi)</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Wyświetlane w wyróżnionej sekcji pod treścią artykułu. {faqItems.length}/8 pozycji.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addFaq}>
              <Plus className="mr-1 h-3 w-3" /> Dodaj pytanie
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {faqItems.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Brak pytań. Dodaj 3–5 krótkich pytań, które użytkownicy wpisują w Google.
              </p>
            )}
            {faqItems.map((item, i) => (
              <div key={i} className="space-y-2 rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">#{i + 1}</span>
                  <div className="ml-auto flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={i === 0}
                      onClick={() => moveFaq(i, -1)}
                      title="W górę"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={i === faqItems.length - 1}
                      onClick={() => moveFaq(i, 1)}
                      title="W dół"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFaq(i)}
                      title="Usuń"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Pytanie</Label>
                  <Input
                    value={item.q ?? ""}
                    placeholder="Np. Czy klawiatura jest cicha?"
                    onChange={(e) => setFaqField(i, "q", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Odpowiedź</Label>
                  <Textarea
                    rows={3}
                    value={item.a ?? ""}
                    placeholder="Krótka, konkretna odpowiedź (2–4 zdania)."
                    onChange={(e) => setFaqField(i, "a", e.target.value)}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>



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

        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <Label className="text-base">Temat dnia w Tech</Label>
              <p className="text-xs text-muted-foreground">
                Ten wpis trafi na główny kafelek /tech. Tematem dnia może być tylko jeden artykuł —
                włączenie zdejmie flagę z poprzedniego.
              </p>
            </div>
            <Switch
              checked={!!form.is_topic_of_day}
              onCheckedChange={(v) => set("is_topic_of_day", v)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recenzja na życzenie użytkowników</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-muted-foreground">
                Włącz, jeśli temat pochodzi z ankiety „Jakiej recenzji szukasz?”. Na artykule i
                kafelkach pojawi się plakietka „Na Wasze życzenie”.
              </p>
              <Switch
                checked={!!(form as any).is_community_requested}
                onCheckedChange={(v) => {
                  set("is_community_requested" as any, v as any);
                  if (!v) set("review_request_id" as any, null as any);
                }}
              />
            </div>

            {!!(form as any).is_community_requested && (
              <div>
                <Label>Powiązane zgłoszenie (opcjonalnie)</Label>
                <Select
                  value={(form as any).review_request_id ?? "none"}
                  onValueChange={(v) =>
                    set("review_request_id" as any, (v === "none" ? null : v) as any)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz zgłoszenie z ankiety" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Bez powiązania (bez liczby głosów)</SelectItem>
                    {reviewRequests.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.title} — {r.votes} gł.
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-muted-foreground">
                  Powiązanie pokaże liczbę głosów w plakietce i oznaczy zgłoszenie jako
                  zrealizowane.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ReviewEditor;
