import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WallpaperImageUploader } from "@/components/admin/WallpaperImageUploader";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWallpaper, WallpaperInsert, WallpaperUpdate } from "@/hooks/useWallpaper";
import { useBanners } from "@/hooks/useBanners";
import { toast } from "sonner";

const WallpaperEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const { data: existingWallpaper, isLoading: isLoadingWallpaper } = useWallpaper(id);
  const { data: banners } = useBanners();

  const [formData, setFormData] = useState({
    name: "",
    background_image_url: "",
    left_wing_url: "",
    right_wing_url: "",
    background_color: "#000000",
    click_url: "",
    linked_banner_id: "",
    is_active: false,
    start_date: "",
    end_date: "",
    min_screen_width: 1280,
  });

  useEffect(() => {
    if (existingWallpaper) {
      setFormData({
        name: existingWallpaper.name,
        background_image_url: existingWallpaper.background_image_url || "",
        left_wing_url: existingWallpaper.left_wing_url || "",
        right_wing_url: existingWallpaper.right_wing_url || "",
        background_color: existingWallpaper.background_color,
        click_url: existingWallpaper.click_url,
        linked_banner_id: existingWallpaper.linked_banner_id || "",
        is_active: existingWallpaper.is_active,
        start_date: existingWallpaper.start_date
          ? existingWallpaper.start_date.slice(0, 16)
          : "",
        end_date: existingWallpaper.end_date
          ? existingWallpaper.end_date.slice(0, 16)
          : "",
        min_screen_width: existingWallpaper.min_screen_width,
      });
    }
  }, [existingWallpaper]);

  const createMutation = useMutation({
    mutationFn: async (data: WallpaperInsert) => {
      const { error } = await supabase.from("wallpapers").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallpapers"] });
      toast.success("Wallpaper utworzony");
      navigate("/admin/wallpapers");
    },
    onError: (error) => {
      toast.error("Błąd: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: WallpaperUpdate }) => {
      const { error } = await supabase.from("wallpapers").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallpapers"] });
      queryClient.invalidateQueries({ queryKey: ["wallpaper", "active"] });
      toast.success("Wallpaper zaktualizowany");
      navigate("/admin/wallpapers");
    },
    onError: (error) => {
      toast.error("Błąd: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      background_image_url: formData.background_image_url || null,
      left_wing_url: formData.left_wing_url || null,
      right_wing_url: formData.right_wing_url || null,
      background_color: formData.background_color,
      click_url: formData.click_url,
      linked_banner_id: formData.linked_banner_id || null,
      is_active: formData.is_active,
      start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
      end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
      min_screen_width: formData.min_screen_width,
    };

    if (isEditing && id) {
      updateMutation.mutate({ id, data: payload });
    } else {
      createMutation.mutate(payload as WallpaperInsert);
    }
  };

  const handleImageUpload = async (file: File, field: string) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("wallpapers")
      .upload(filePath, file);

    if (uploadError) {
      toast.error("Błąd podczas wgrywania: " + uploadError.message);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("wallpapers")
      .getPublicUrl(filePath);

    setFormData((prev) => ({ ...prev, [field]: urlData.publicUrl }));
    toast.success("Grafika wgrana");
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEditing && isLoadingWallpaper) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => navigate("/admin/wallpapers")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="font-heading text-2xl font-bold">
                {isEditing ? "Edytuj wallpaper" : "Nowy wallpaper"}
              </h1>
              <p className="text-sm text-muted-foreground">
                Kampania premium przejmująca tło strony
              </p>
            </div>
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isEditing ? "Zapisz zmiany" : "Utwórz"}
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Podstawowe informacje</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nazwa kampanii *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="np. Black Friday 2026"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="click_url">URL po kliknięciu w skrzydła *</Label>
                <Input
                  id="click_url"
                  type="url"
                  value={formData.click_url}
                  onChange={(e) => setFormData({ ...formData, click_url: e.target.value })}
                  placeholder="https://klient.pl/landing"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="background_color">Kolor tła (fallback)</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={formData.background_color}
                    onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                    className="w-14 h-10 p-1"
                  />
                  <Input
                    value={formData.background_color}
                    onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="linked_banner">Powiązany baner (tryb borderless)</Label>
              <Select
                  value={formData.linked_banner_id || "__none__"}
                  onValueChange={(val) => setFormData({ 
                    ...formData, 
                    linked_banner_id: val === "__none__" ? "" : val 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz baner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Brak</SelectItem>
                    {banners?.map((banner) => (
                      <SelectItem key={banner.id} value={banner.id}>
                        {banner.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Wybrany baner wyświetli się bez ramki gdy wallpaper jest aktywny
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="min_screen_width">Min. szerokość ekranu (px)</Label>
                <Input
                  id="min_screen_width"
                  type="number"
                  value={formData.min_screen_width}
                  onChange={(e) => setFormData({ ...formData, min_screen_width: parseInt(e.target.value) })}
                  min={1024}
                  max={1920}
                />
                <p className="text-xs text-muted-foreground">
                  Wallpaper widoczny tylko na ekranach szerszych niż ta wartość
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Dates & Status */}
          <Card>
            <CardHeader>
              <CardTitle>Harmonogram i status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Aktywny</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">Data rozpoczęcia</Label>
                <Input
                  id="start_date"
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">Data zakończenia</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Grafiki</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Główne tło</Label>
                  <WallpaperImageUploader
                    value={formData.background_image_url}
                    onChange={(url) => setFormData({ ...formData, background_image_url: url })}
                    onRemove={() => setFormData({ ...formData, background_image_url: "" })}
                    onUploadFile={(file) => handleImageUpload(file, "background_image_url")}
                    aspectHint="Rozciągane na całą szerokość"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Lewe skrzydło (opcjonalne)</Label>
                  <WallpaperImageUploader
                    value={formData.left_wing_url}
                    onChange={(url) => setFormData({ ...formData, left_wing_url: url })}
                    onRemove={() => setFormData({ ...formData, left_wing_url: "" })}
                    onUploadFile={(file) => handleImageUpload(file, "left_wing_url")}
                    aspectHint="Grafika stała po lewej"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Prawe skrzydło (opcjonalne)</Label>
                  <WallpaperImageUploader
                    value={formData.right_wing_url}
                    onChange={(url) => setFormData({ ...formData, right_wing_url: url })}
                    onRemove={() => setFormData({ ...formData, right_wing_url: "" })}
                    onUploadFile={(file) => handleImageUpload(file, "right_wing_url")}
                    aspectHint="Grafika stała po prawej"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </AdminLayout>
  );
};

export default WallpaperEditor;
