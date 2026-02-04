import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, Upload, Trash2, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ImageUploader } from "./ImageUploader";

interface SocialImageGeneratorProps {
  categoryName: string;
  categorySlug: string;
  currentImageUrl: string | null;
  onImageChange: (url: string | null) => void;
  disabled?: boolean;
}

// Sport-specific prompts for AI image generation
const sportPrompts: Record<string, string> = {
  football: "dynamic football/soccer action shot, ball in motion, stadium atmosphere, dramatic lighting, players in action",
  basketball: "intense basketball game moment, slam dunk, ball near hoop, court environment, dynamic action",
  tennis: "powerful tennis serve, player in motion, court background, tennis ball in flight",
  f1: "Formula 1 racing car in action, speed blur, race track curves, dramatic racing moment",
  mma: "MMA fighter in octagon, dynamic fighting pose, dramatic lighting, intense atmosphere",
  boxing: "boxing match moment, boxer in action, ring environment, dramatic punch",
  volleyball: "volleyball spike action, players jumping, net, dynamic sports moment",
  hockey: "ice hockey game action, player with puck, rink environment, fast motion",
};

export function SocialImageGenerator({
  categoryName,
  categorySlug,
  currentImageUrl,
  onImageChange,
  disabled,
}: SocialImageGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showUploader, setShowUploader] = useState(false);

  const generateImage = async () => {
    if (!categoryName) {
      toast.error("Podaj najpierw nazwę kategorii");
      return;
    }

    setIsGenerating(true);

    try {
      // Get sport-specific prompt or use generic
      const sportContext = sportPrompts[categorySlug] || `${categoryName} sport action, dynamic athletic moment`;

      const prompt = `Professional sports photography style image for ${categoryName} category. ${sportContext}. Ultra high quality, 16:9 aspect ratio, vibrant saturated colors, dynamic composition with motion, photorealistic or high-quality 3D render style. No text, no logos, no watermarks. Perfect for Facebook Open Graph thumbnail.`;

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Musisz być zalogowany");
        return;
      }

      // Call Lovable AI to generate image
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          modalities: ["image", "text"],
        }),
      });

      if (!response.ok) {
        throw new Error(`AI request failed: ${response.status}`);
      }

      const data = await response.json();
      const imageBase64 = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!imageBase64) {
        throw new Error("No image returned from AI");
      }

      // Convert base64 to blob
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "image/png" });

      // Upload to storage
      const fileName = `social-${categorySlug}-${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
        .from("category-icons")
        .upload(fileName, blob);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("category-icons")
        .getPublicUrl(fileName);

      onImageChange(urlData.publicUrl);
      toast.success("Obraz wygenerowany pomyślnie!");
    } catch (error) {
      console.error("Error generating social image:", error);
      toast.error("Błąd generowania obrazu");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUploadSuccess = (url: string) => {
    onImageChange(url);
    setShowUploader(false);
  };

  const handleRemove = () => {
    onImageChange(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Obraz dla mediów społecznościowych
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Ten obraz (1200x630px) będzie używany jako miniaturka postów na Facebooku,
          gdy post nie ma własnego zdjęcia.
        </p>

        {currentImageUrl ? (
          <div className="space-y-3">
            <div className="relative aspect-[1200/630] w-full overflow-hidden rounded-lg border bg-muted">
              <img
                src={currentImageUrl}
                alt="Social media preview"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateImage}
                disabled={disabled || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generowanie...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Wygeneruj nowy
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowUploader(true)}
                disabled={disabled}
              >
                <Upload className="mr-2 h-4 w-4" />
                Prześlij własny
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={disabled}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Usuń
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex aspect-[1200/630] w-full items-center justify-center rounded-lg border-2 border-dashed bg-muted/50">
              <div className="text-center text-muted-foreground">
                <Image className="mx-auto h-12 w-12 opacity-50" />
                <p className="mt-2 text-sm">Brak obrazu</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={generateImage}
                disabled={disabled || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generowanie...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Wygeneruj z AI
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowUploader(true)}
                disabled={disabled}
              >
                <Upload className="mr-2 h-4 w-4" />
                Prześlij własny
              </Button>
            </div>
          </div>
        )}

        {showUploader && (
          <div className="mt-4 rounded-lg border p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">Prześlij obraz (1200x630px)</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowUploader(false)}
              >
                Anuluj
              </Button>
            </div>
            <ImageUploader
              value={undefined}
              onChange={handleUploadSuccess}
              onRemove={() => {}}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
