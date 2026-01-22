import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useSetting, useUpdateSetting } from "@/hooks/useSettings";
import { Loader2, Save, RotateCcw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const DEFAULT_PROMPT = `Jesteś asystentem redakcji sportowej Daily Sport. Na podstawie podanego artykułu wygeneruj dane do publikacji.

ZASADY:
1. Tytuł: max 80 znaków, chwytliwy, po polsku, bez clickbaitu
2. Excerpt: max 200 znaków, zachęcający do kliknięcia, streszczający główną myśl
3. Kategoria: wybierz JEDNĄ z: football, basketball, tennis, f1, mma, other
4. Tagi: 3-5 krótkich słów kluczowych (bez #), po polsku

Odpowiedz w formacie JSON zgodnym ze schematem.`;

const Settings = () => {
  const { user, isAdmin } = useAuth();
  const { data: promptValue, isLoading: isLoadingPrompt } = useSetting("article_extraction_prompt");
  const updateSetting = useUpdateSetting();
  
  const [localPrompt, setLocalPrompt] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (promptValue) {
      setLocalPrompt(promptValue);
    }
  }, [promptValue]);

  useEffect(() => {
    setHasChanges(localPrompt !== promptValue && localPrompt !== "");
  }, [localPrompt, promptValue]);

  const handleSavePrompt = async () => {
    await updateSetting.mutateAsync({
      key: "article_extraction_prompt",
      value: localPrompt,
    });
    setHasChanges(false);
  };

  const handleResetPrompt = () => {
    setLocalPrompt(DEFAULT_PROMPT);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-heading">Ustawienia</h1>
          <p className="text-muted-foreground">
            Zarządzaj ustawieniami aplikacji
          </p>
        </div>

        {/* AI Settings - Only for admins */}
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Ustawienia AI</CardTitle>
              <CardDescription>
                Konfiguracja automatycznego wypełniania postów na podstawie URL
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="master-prompt">Master prompt do ekstrakcji artykułów</Label>
                {isLoadingPrompt ? (
                  <Skeleton className="h-48 w-full" />
                ) : (
                  <Textarea
                    id="master-prompt"
                    value={localPrompt}
                    onChange={(e) => setLocalPrompt(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                    placeholder="Wprowadź prompt dla AI..."
                  />
                )}
                <p className="text-sm text-muted-foreground">
                  Ten prompt określa jak AI analizuje artykuły i generuje dane dla postów.
                  Możesz dostosować styl, limity znaków i inne wytyczne.
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleSavePrompt} 
                  disabled={!hasChanges || updateSetting.isPending}
                >
                  {updateSetting.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Zapisz zmiany
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleResetPrompt}
                  disabled={updateSetting.isPending}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Przywróć domyślny
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Twoje konto</CardTitle>
              <CardDescription>Informacje o Twoim koncie</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-foreground">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rola</p>
                <p className="text-foreground">
                  {isAdmin ? "Administrator" : "Redaktor"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  ID użytkownika
                </p>
                <p className="text-foreground font-mono text-sm">{user?.id}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informacje o aplikacji</CardTitle>
              <CardDescription>Szczegóły techniczne</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Wersja</p>
                <p className="text-foreground">1.0.0</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Backend
                </p>
                <p className="text-foreground">Lovable Cloud</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Settings;
