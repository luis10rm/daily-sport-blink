import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ImageDown } from "lucide-react";

interface BackfillResult {
  scanned: number;
  candidates: number;
  mirrored: number;
}

/**
 * Copies hot-linked (external) article images into our own storage in batches,
 * so they run through the WebP/srcset pipeline and stop weighing down the feed.
 */
export const ImageMirrorCard = () => {
  const [running, setRunning] = useState(false);
  const [last, setLast] = useState<BackfillResult | null>(null);
  const [total, setTotal] = useState(0);

  const runBatch = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("mirror-image", {
        body: { mode: "backfill", days: 30, limit: 25 },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setLast(data);
      setTotal((t) => t + (data?.mirrored ?? 0));

      if (!data?.candidates) {
        toast.success("Brak zewnętrznych zdjęć do skopiowania w ostatnich 30 dniach");
      } else {
        toast.success(`Skopiowano ${data.mirrored} z ${data.candidates} zdjęć`);
      }
    } catch (err: any) {
      console.error("[ImageMirrorCard]", err);
      toast.error(`Błąd: ${err.message ?? err}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageDown className="h-5 w-5 text-primary" />
          Kopiowanie zdjęć zewnętrznych
        </CardTitle>
        <CardDescription>
          Nowe artykuły kopiują zdjęcia automatycznie przy zapisie. Tutaj możesz
          nadrobić zaległości dla postów z ostatnich 30 dni — partiami po 25.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {last && (
          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              Ostatnia partia: {last.mirrored} skopiowanych z {last.candidates}{" "}
              kandydatów (przeskanowano {last.scanned} postów).
            </p>
            <p>Łącznie w tej sesji: {total}</p>
          </div>
        )}
        <Button onClick={runBatch} disabled={running}>
          {running ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Kopiowanie...
            </>
          ) : (
            "Uruchom kolejną partię"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
