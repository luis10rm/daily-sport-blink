import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, RefreshCw, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AIIconGeneratorProps {
  categoryName: string;
  onIconGenerated: (url: string) => void;
  disabled?: boolean;
}

export function AIIconGenerator({
  categoryName,
  onIconGenerated,
  disabled = false,
}: AIIconGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedIconUrl, setGeneratedIconUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!categoryName.trim()) {
      toast.error("Wprowadź najpierw nazwę kategorii");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "generate-category-icon",
        {
          body: { categoryName: categoryName.trim() },
        }
      );

      if (fnError) {
        throw new Error(fnError.message || "Błąd funkcji");
      }

      if (data?.error) {
        setError(data.error);
        toast.error(data.error);
        return;
      }

      if (data?.iconUrl) {
        setGeneratedIconUrl(data.iconUrl);
        toast.success("Ikona wygenerowana pomyślnie!");
      } else {
        throw new Error("Brak URL w odpowiedzi");
      }
    } catch (err) {
      console.error("Error generating icon:", err);
      const message = err instanceof Error ? err.message : "Nieznany błąd";
      setError(message);
      toast.error(`Błąd: ${message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseIcon = () => {
    if (generatedIconUrl) {
      onIconGenerated(generatedIconUrl);
      toast.success("Ikona została wybrana");
    }
  };

  const handleRegenerate = () => {
    setGeneratedIconUrl(null);
    setError(null);
    handleGenerate();
  };

  const isDisabled = disabled || !categoryName.trim();

  return (
    <div className="space-y-4">
      {/* Info section */}
      <div className="rounded-lg bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          AI wygeneruje minimalistyczną ikonę dla:
        </p>
        <p className="mt-1 font-medium text-foreground">
          {categoryName.trim() || (
            <span className="text-muted-foreground italic">
              (wprowadź nazwę kategorii)
            </span>
          )}
        </p>
      </div>

      {/* Generate button - show when no icon generated yet */}
      {!generatedIconUrl && !isGenerating && (
        <Button
          type="button"
          onClick={handleGenerate}
          disabled={isDisabled}
          className="w-full"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Generuj ikonę AI
        </Button>
      )}

      {/* Loading state */}
      {isGenerating && (
        <div className="flex flex-col items-center justify-center py-8 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Generuję ikonę...</p>
          <p className="text-xs text-muted-foreground">
            To może potrwać kilka sekund
          </p>
        </div>
      )}

      {/* Error state */}
      {error && !isGenerating && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm text-destructive">{error}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              disabled={isDisabled}
            >
              <RefreshCw className="mr-2 h-3 w-3" />
              Spróbuj ponownie
            </Button>
          </div>
        </div>
      )}

      {/* Preview generated icon */}
      {generatedIconUrl && !isGenerating && (
        <div className="space-y-4">
          {/* Preview box */}
          <div className="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed border-primary/30 bg-muted/30 p-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-slate-700">
              <img
                src={generatedIconUrl}
                alt="Wygenerowana ikona"
                className="h-16 w-16 object-contain"
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Podgląd wygenerowanej ikony
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleUseIcon}
              className="flex-1"
            >
              <Check className="mr-2 h-4 w-4" />
              Użyj tej ikony
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleRegenerate}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Generuj ponownie
            </Button>
          </div>
        </div>
      )}

      {/* Hint */}
      <p className="text-xs text-muted-foreground">
        Ikona zostanie wygenerowana w stylu minimalistycznym, podobnym do ikon Lucide.
        Biały kolor na przezroczystym tle, optymalizowana do rozmiaru 64x64px.
      </p>
    </div>
  );
}
