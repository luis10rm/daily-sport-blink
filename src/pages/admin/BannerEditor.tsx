import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Upload,
  Monitor,
  Smartphone,
  ExternalLink,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import {
  useBanner,
  useCreateBanner,
  useUpdateBanner,
  useUploadBannerImage,
  BannerPosition,
  BannerTargetDevice,
} from "@/hooks/useBanners";
import { SponsorBanner } from "@/components/SponsorBanner";

const positions: { value: BannerPosition; label: string }[] = [
  { value: "home_top", label: "Góra strony głównej" },
  { value: "home_middle", label: "Środek strony głównej" },
  { value: "home_bottom", label: "Dół strony głównej" },
];

const targetDevices: { value: BannerTargetDevice; label: string; description: string }[] = [
  { value: "all", label: "Wszystkie urządzenia", description: "Wymaga obu grafik (desktop + mobile)" },
  { value: "desktop", label: "Tylko Desktop", description: "Wymaga tylko grafiki 970×250" },
  { value: "mobile", label: "Tylko Mobile", description: "Wymaga tylko grafiki 300×250" },
];

const bannerSchema = z.object({
  title: z.string().min(1, "Nazwa jest wymagana"),
  description: z.string().optional(),
  cta_text: z.string().min(1, "Tekst CTA jest wymagany"),
  click_tag: z.string()
    .min(1, "URL przekierowania jest wymagany")
    .refine(
      (val) => val.startsWith("http://") || val.startsWith("https://"),
      "URL musi zaczynać się od http:// lub https://"
    ),
  impression_tag: z.string()
    .refine(
      (val) => !val || val.startsWith("http://") || val.startsWith("https://"),
      "URL musi zaczynać się od http:// lub https://"
    )
    .optional()
    .or(z.literal("")),
  image_desktop_url: z.string().optional().or(z.literal("")),
  image_mobile_url: z.string().optional().or(z.literal("")),
  position: z.enum(["home_top", "home_middle", "home_bottom"]),
  target_device: z.enum(["all", "desktop", "mobile"]),
  is_active: z.boolean(),
  start_date: z.date().optional().nullable(),
  end_date: z.date().optional().nullable(),
}).refine((data) => {
  // Validation based on target_device
  if (data.target_device === "desktop") {
    return data.image_desktop_url && data.image_desktop_url.length > 0;
  }
  if (data.target_device === "mobile") {
    return data.image_mobile_url && data.image_mobile_url.length > 0;
  }
  // target_device === "all" - require both
  return (
    data.image_desktop_url && data.image_desktop_url.length > 0 &&
    data.image_mobile_url && data.image_mobile_url.length > 0
  );
}, {
  message: "Wymagane grafiki zależą od wybranego urządzenia docelowego",
  path: ["image_desktop_url"],
});

type BannerFormData = z.infer<typeof bannerSchema>;

const BannerEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: banner, isLoading } = useBanner(id);
  const createMutation = useCreateBanner();
  const updateMutation = useUpdateBanner();
  const uploadMutation = useUploadBannerImage();

  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

  const form = useForm<BannerFormData>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      title: "",
      description: "",
      cta_text: "Dowiedz się więcej",
      click_tag: "",
      impression_tag: "",
      image_desktop_url: "",
      image_mobile_url: "",
      position: "home_middle",
      target_device: "all",
      is_active: false,
      start_date: null,
      end_date: null,
    },
  });

  useEffect(() => {
    if (banner) {
      form.reset({
        title: banner.title,
        description: banner.description || "",
        cta_text: banner.cta_text,
        click_tag: banner.click_tag,
        impression_tag: banner.impression_tag || "",
        image_desktop_url: banner.image_desktop_url || "",
        image_mobile_url: banner.image_mobile_url || "",
        position: banner.position,
        target_device: banner.target_device || "all",
        is_active: banner.is_active,
        start_date: banner.start_date ? new Date(banner.start_date) : null,
        end_date: banner.end_date ? new Date(banner.end_date) : null,
      });
    }
  }, [banner, form]);

  const onSubmit = async (data: BannerFormData) => {
    const payload = {
      title: data.title,
      description: data.description || null,
      cta_text: data.cta_text,
      click_tag: data.click_tag,
      impression_tag: data.impression_tag || null,
      image_desktop_url: data.image_desktop_url || null,
      image_mobile_url: data.image_mobile_url || null,
      position: data.position,
      target_device: data.target_device,
      is_active: data.is_active,
      start_date: data.start_date?.toISOString() || null,
      end_date: data.end_date?.toISOString() || null,
      created_by: null,
    };

    if (isEditing) {
      await updateMutation.mutateAsync({ id, updates: payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    navigate("/admin/banners");
  };

  const handleFileUpload = async (
    file: File,
    type: "desktop" | "mobile"
  ) => {
    const url = await uploadMutation.mutateAsync({ file, type });
    if (type === "desktop") {
      form.setValue("image_desktop_url", url);
    } else {
      form.setValue("image_mobile_url", url);
    }
  };

  const watchedValues = form.watch();

  if (isEditing && isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-96 w-full" />
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
            <h1 className="font-heading text-2xl font-bold">
              {isEditing ? "Edytuj baner" : "Nowy baner"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isEditing
                ? "Zaktualizuj dane banera reklamowego"
                : "Utwórz nowy baner reklamowy"}
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Left column - Form fields */}
              <div className="space-y-6">
                {/* Basic info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Podstawowe informacje</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nazwa banera (wewnętrzna)</FormLabel>
                          <FormControl>
                            <Input placeholder="np. Kampania Nike 2024" {...field} />
                          </FormControl>
                          <FormDescription>
                            Nazwa widoczna tylko w panelu administracyjnym
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
                          <FormLabel>Opis (opcjonalnie)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Krótki opis kampanii..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cta_text"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tekst przycisku CTA</FormLabel>
                          <FormControl>
                            <Input placeholder="Dowiedz się więcej" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Graphics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Grafiki</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="image_desktop_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Monitor className="h-4 w-4" />
                            Grafika Desktop
                          </FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <Input
                                  placeholder="URL lub wgraj plik"
                                  {...field}
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => desktopInputRef.current?.click()}
                                  disabled={uploadMutation.isPending}
                                >
                                  {uploadMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Upload className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                              <input
                                ref={desktopInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileUpload(file, "desktop");
                                }}
                              />
                              {field.value && (
                                <div className="relative group rounded-lg overflow-hidden border">
                                  <img
                                    src={field.value}
                                    alt="Desktop preview"
                                    className="w-full h-32 object-cover"
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => form.setValue("image_desktop_url", "")}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormDescription>
                            <strong>Wymagany rozmiar: 970×250px</strong> (standard IAB Billboard)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="image_mobile_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4" />
                            Grafika Mobile
                          </FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <Input
                                  placeholder="URL lub wgraj plik"
                                  {...field}
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => mobileInputRef.current?.click()}
                                  disabled={uploadMutation.isPending}
                                >
                                  {uploadMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Upload className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                              <input
                                ref={mobileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileUpload(file, "mobile");
                                }}
                              />
                              {field.value && (
                                <div className="relative group rounded-lg overflow-hidden border">
                                  <img
                                    src={field.value}
                                    alt="Mobile preview"
                                    className="w-full h-32 object-cover"
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => form.setValue("image_mobile_url", "")}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormDescription>
                            <strong>Wymagany rozmiar: 300×250px</strong> (standard IAB Medium Rectangle)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Tracking */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tracking i linki</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="click_tag"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <ExternalLink className="h-4 w-4" />
                            Click Tag (URL przekierowania)
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://example.com/landing-page"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Adres URL, na który użytkownik zostanie przekierowany po
                            kliknięciu
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="impression_tag"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Impression Tag (URL piksela 1x1)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://tracking.example.com/pixel.gif"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            URL piksela do zliczania wyświetleń (opcjonalnie)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Publication */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Publikacja</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pozycja na stronie</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Wybierz pozycję" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {positions.map((pos) => (
                                <SelectItem key={pos.value} value={pos.value}>
                                  {pos.label}
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
                      name="target_device"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Docelowe urządzenie</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Wybierz urządzenie" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {targetDevices.map((device) => (
                                <SelectItem key={device.value} value={device.value}>
                                  <div className="flex flex-col">
                                    <span>{device.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            {targetDevices.find(d => d.value === field.value)?.description}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="start_date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Data rozpoczęcia</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP", { locale: pl })
                                    ) : (
                                      <span>Wybierz datę</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value || undefined}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="end_date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Data zakończenia</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP", { locale: pl })
                                    ) : (
                                      <span>Bez ograniczenia</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value || undefined}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="is_active"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Aktywny</FormLabel>
                            <FormDescription>
                              Baner będzie widoczny na stronie
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
              </div>

              {/* Right column - Preview */}
              <div className="space-y-4">
                <Card className="sticky top-8">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Podgląd</CardTitle>
                      <div className="flex gap-1 rounded-lg border p-1">
                        <Button
                          type="button"
                          variant={previewMode === "desktop" ? "secondary" : "ghost"}
                          size="sm"
                          onClick={() => setPreviewMode("desktop")}
                        >
                          <Monitor className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant={previewMode === "mobile" ? "secondary" : "ghost"}
                          size="sm"
                          onClick={() => setPreviewMode("mobile")}
                        >
                          <Smartphone className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={cn(
                        "mx-auto transition-all",
                        previewMode === "mobile" ? "max-w-[375px]" : "max-w-full"
                      )}
                    >
                      <SponsorBanner
                        title={watchedValues.title || "Tytuł banera"}
                        description={watchedValues.description}
                        ctaText={watchedValues.cta_text || "Dowiedz się więcej"}
                        ctaUrl={watchedValues.click_tag || "#"}
                        imageDesktopUrl={watchedValues.image_desktop_url}
                        imageMobileUrl={watchedValues.image_mobile_url}
                        previewMode={previewMode}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/banners")}
              >
                Anuluj
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditing ? "Zapisz zmiany" : "Utwórz baner"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
};

export default BannerEditor;
