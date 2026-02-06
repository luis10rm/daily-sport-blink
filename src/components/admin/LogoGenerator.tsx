import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, RotateCcw, Download, Upload } from "lucide-react";
import { toast } from "sonner";

export const LogoGenerator = () => {
  const [generatedLogo, setGeneratedLogo] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedUrl, setSavedUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setSavedUrl(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-logo");

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setGeneratedLogo(data.imageBase64);
      toast.success("Logo wygenerowane!");
    } catch (err: any) {
      console.error("Error generating logo:", err);
      toast.error(err.message || "Nie udało się wygenerować logo");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToStorage = async () => {
    if (!generatedLogo) return;
    setIsSaving(true);

    try {
      // Extract base64 data
      const base64Match = generatedLogo.match(/^data:image\/\w+;base64,(.+)$/);
      const base64Data = base64Match ? base64Match[1] : generatedLogo;

      // Decode to bytes
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const fileName = `logo/szortsy-logo-${Date.now()}.png`;

      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(fileName, bytes, { contentType: "image/png", upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("post-images")
        .getPublicUrl(fileName);

      setSavedUrl(urlData.publicUrl);
      toast.success("Logo zapisane w storage!");
    } catch (err: any) {
      console.error("Error saving logo:", err);
      toast.error(err.message || "Nie udało się zapisać logo");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    if (!generatedLogo) return;
    const link = document.createElement("a");
    link.href = generatedLogo.startsWith("data:") ? generatedLogo : `data:image/png;base64,${generatedLogo}`;
    link.download = "szortsy-logo.png";
    link.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Generator Logo AI
        </CardTitle>
        <CardDescription>
          Wygeneruj nowe logo Szortsy w wysokiej jakości przy użyciu AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview */}
        {generatedLogo && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Podgląd wygenerowanego logo:</p>
            <div className="flex gap-4 flex-wrap">
              {/* White bg */}
              <div className="border rounded-lg p-4 bg-background">
                <img
                  src={generatedLogo.startsWith("data:") ? generatedLogo : `data:image/png;base64,${generatedLogo}`}
                  alt="Generated logo"
                  className="w-32 h-32 object-contain"
                />
              </div>
              {/* Dark bg */}
              <div className="border rounded-lg p-4 bg-foreground">
                <img
                  src={generatedLogo.startsWith("data:") ? generatedLogo : `data:image/png;base64,${generatedLogo}`}
                  alt="Generated logo on dark"
                  className="w-32 h-32 object-contain"
                />
              </div>
            </div>
          </div>
        )}

        {savedUrl && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-1">URL zapisanego logo:</p>
            <code className="text-xs break-all text-muted-foreground">{savedUrl}</code>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : generatedLogo ? (
              <RotateCcw className="mr-2 h-4 w-4" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {generatedLogo ? "Generuj ponownie" : "Generuj logo"}
          </Button>

          {generatedLogo && (
            <>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Pobierz
              </Button>
              <Button variant="secondary" onClick={handleSaveToStorage} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Zapisz w storage
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
