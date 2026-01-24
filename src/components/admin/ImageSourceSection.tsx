import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { ImageUploader } from "./ImageUploader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { categoryDefaultImages } from "@/config/categoryImages";
import { Upload, Link as LinkIcon } from "lucide-react";

interface ImageSourceSectionProps {
  form: UseFormReturn<any>;
  category?: string;
}

export const ImageSourceSection = ({ form, category }: ImageSourceSectionProps) => {
  const currentImageUrl = form.watch("image_url");
  const [useCustomImage, setUseCustomImage] = useState(!!currentImageUrl);
  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload");

  const defaultImage = (category && categoryDefaultImages[category as keyof typeof categoryDefaultImages]) || categoryDefaultImages.other;

  const handleCustomImageToggle = (checked: boolean) => {
    setUseCustomImage(checked);
    if (!checked) {
      form.setValue("image_url", "");
    }
  };

  const handleUploadSuccess = (url: string) => {
    form.setValue("image_url", url);
  };

  const handleRemoveImage = () => {
    form.setValue("image_url", "");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Obrazek</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Default category image preview */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">
            Domyślna grafika kategorii
          </Label>
          <div className="relative rounded-lg overflow-hidden border">
            <img
              src={defaultImage}
              alt="Domyślna grafika"
              className="w-full aspect-video object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium">
              Grafika kategorii
            </div>
          </div>
        </div>

        {/* Toggle for custom image */}
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="space-y-0.5">
            <Label>Użyj własnej grafiki</Label>
            <p className="text-xs text-muted-foreground">
              Nadpisz domyślną grafikę kategorii
            </p>
          </div>
          <Switch
            checked={useCustomImage}
            onCheckedChange={handleCustomImageToggle}
          />
        </div>

        {/* Custom image options */}
        {useCustomImage && (
          <div className="space-y-4 pt-2">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "upload" | "url")}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload
                </TabsTrigger>
                <TabsTrigger value="url" className="gap-2">
                  <LinkIcon className="h-4 w-4" />
                  URL
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="mt-4">
                <ImageUploader
                  value={
                    currentImageUrl && !currentImageUrl.startsWith("http")
                      ? undefined
                      : currentImageUrl?.includes("post-images")
                      ? currentImageUrl
                      : undefined
                  }
                  onChange={handleUploadSuccess}
                  onRemove={handleRemoveImage}
                />
              </TabsContent>

              <TabsContent value="url" className="mt-4 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="image_url">URL obrazka</Label>
                  <Input
                    id="image_url"
                    placeholder="https://..."
                    value={currentImageUrl || ""}
                    onChange={(e) => form.setValue("image_url", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Wklej link do obrazka zewnętrznego
                  </p>
                </div>
                
                {currentImageUrl && currentImageUrl.startsWith("http") && (
                  <div className="relative rounded-lg overflow-hidden border">
                    <img
                      src={currentImageUrl}
                      alt="Podgląd"
                      className="w-full aspect-video object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
