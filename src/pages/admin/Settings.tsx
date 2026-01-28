import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useSetting, useUpdateSetting } from "@/hooks/useSettings";
import { usePatronSettings, useUpdatePatronSettings, PatronSettings } from "@/hooks/usePatronSettings";
import { Loader2, Save, RotateCcw, Star, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const DEFAULT_EXTRACTION_PROMPT = `Jesteś asystentem redakcji sportowej Daily Sport Blink. Na podstawie podanego artykułu wygeneruj dane do publikacji.

ZASADY:
1. Tytuł: max 80 znaków, chwytliwy, po polsku, bez clickbaitu
2. Excerpt: max 200 znaków, zachęcający do kliknięcia, streszczający główną myśl
3. Kategoria: wybierz JEDNĄ z: football, basketball, tennis, f1, mma, other
4. Tagi: 3-5 krótkich słów kluczowych (bez #), po polsku

Odpowiedz w formacie JSON zgodnym ze schematem.`;

const DEFAULT_CONTENT_PROMPT = `Na podstawie oryginalnego artykułu napisz unikatową, skróconą wersję newsa sportowego w języku polskim. Treść musi być:
- 300-500 słów
- Napisana prostym, angażującym językiem
- Zawierać wszystkie kluczowe fakty z oryginału
- Mieć dynamiczny, dziennikarski ton
- Podzielona na 2-3 akapity
- Bez powtarzania tytułu na początku`;

const DEFAULT_PATRON: PatronSettings = {
  enabled: false,
  prefix_text: "Głównym patronem serwisu jest",
  patron_name: "",
  patron_logo_url: "",
  cta_text: "",
  cta_url: "",
  background_color: "#1e3a5f",
  text_color: "#ffffff",
  style: "solid",
  dismissible: true,
};

// Live preview component
const PatronBarPreview = ({ settings }: { settings: PatronSettings }) => {
  const getBackgroundStyle = () => {
    switch (settings.style) {
      case "gradient":
        return {
          background: `linear-gradient(90deg, ${settings.background_color}00 0%, ${settings.background_color} 20%, ${settings.background_color} 80%, ${settings.background_color}00 100%)`,
          color: settings.text_color,
        };
      case "glass":
        return {
          backgroundColor: `${settings.background_color}CC`,
          color: settings.text_color,
        };
      default:
        return {
          backgroundColor: settings.background_color,
          color: settings.text_color,
        };
    }
  };

  return (
    <div
      className={cn(
        "w-full h-10 flex items-center justify-center rounded-lg",
        settings.style === "glass" && "backdrop-blur-md"
      )}
      style={getBackgroundStyle()}
    >
      <div className="flex items-center gap-2 text-sm px-4">
        <Star className="h-4 w-4 flex-shrink-0 fill-current" />
        <span className="font-medium">{settings.prefix_text}</span>
        {settings.patron_logo_url && (
          <img
            src={settings.patron_logo_url}
            alt={settings.patron_name}
            className="h-5 w-auto object-contain"
          />
        )}
        <span className="font-bold">{settings.patron_name || "Nazwa marki"}</span>
        {settings.cta_text && (
          <span
            className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{
              backgroundColor: settings.text_color,
              color: settings.background_color,
            }}
          >
            {settings.cta_text}
          </span>
        )}
        {settings.dismissible && (
          <X className="h-4 w-4 ml-2 opacity-70" />
        )}
      </div>
    </div>
  );
};

const Settings = () => {
  const { user, isAdmin } = useAuth();
  const { data: promptValue, isLoading: isLoadingPrompt } = useSetting("article_extraction_prompt");
  const { data: contentPromptValue, isLoading: isLoadingContentPrompt } = useSetting("article_content_prompt");
  const { data: patronData, isLoading: isLoadingPatron } = usePatronSettings();
  const updateSetting = useUpdateSetting();
  const updatePatron = useUpdatePatronSettings();
  
  // Extraction prompt state
  const [localPrompt, setLocalPrompt] = useState("");
  const [hasPromptChanges, setHasPromptChanges] = useState(false);
  
  // Content prompt state
  const [localContentPrompt, setLocalContentPrompt] = useState("");
  const [hasContentPromptChanges, setHasContentPromptChanges] = useState(false);
  
  const [patronSettings, setPatronSettings] = useState<PatronSettings>(DEFAULT_PATRON);
  const [hasPatronChanges, setHasPatronChanges] = useState(false);

  useEffect(() => {
    if (promptValue) {
      setLocalPrompt(promptValue);
    }
  }, [promptValue]);

  useEffect(() => {
    if (contentPromptValue) {
      setLocalContentPrompt(contentPromptValue);
    }
  }, [contentPromptValue]);

  useEffect(() => {
    if (patronData) {
      setPatronSettings(patronData);
    }
  }, [patronData]);

  useEffect(() => {
    setHasPromptChanges(localPrompt !== promptValue && localPrompt !== "");
  }, [localPrompt, promptValue]);

  useEffect(() => {
    setHasContentPromptChanges(localContentPrompt !== contentPromptValue && localContentPrompt !== "");
  }, [localContentPrompt, contentPromptValue]);

  useEffect(() => {
    if (patronData) {
      setHasPatronChanges(JSON.stringify(patronSettings) !== JSON.stringify(patronData));
    }
  }, [patronSettings, patronData]);

  const handleSavePrompt = async () => {
    await updateSetting.mutateAsync({
      key: "article_extraction_prompt",
      value: localPrompt,
    });
    setHasPromptChanges(false);
  };

  const handleResetPrompt = () => {
    setLocalPrompt(DEFAULT_EXTRACTION_PROMPT);
  };

  const handleSaveContentPrompt = async () => {
    await updateSetting.mutateAsync({
      key: "article_content_prompt",
      value: localContentPrompt,
    });
    setHasContentPromptChanges(false);
  };

  const handleResetContentPrompt = () => {
    setLocalContentPrompt(DEFAULT_CONTENT_PROMPT);
  };

  const handleSavePatron = async () => {
    await updatePatron.mutateAsync(patronSettings);
    setHasPatronChanges(false);
  };

  const handleResetPatron = () => {
    setPatronSettings(DEFAULT_PATRON);
  };

  const updatePatronField = <K extends keyof PatronSettings>(
    field: K,
    value: PatronSettings[K]
  ) => {
    setPatronSettings((prev) => ({ ...prev, [field]: value }));
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

        {/* Patron Bar Settings - Only for admins */}
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Patron Serwisu</CardTitle>
              <CardDescription>
                Konfiguracja paska sponsora wyświetlanego pod nagłówkiem strony
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingPatron ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <>
                  {/* Live Preview */}
                  <div className="space-y-2">
                    <Label>Podgląd na żywo</Label>
                    <div className="border rounded-lg p-4 bg-muted/50">
                      <PatronBarPreview settings={patronSettings} />
                    </div>
                  </div>

                  {/* Enable Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Włącz pasek patrona</Label>
                      <p className="text-sm text-muted-foreground">
                        Pasek będzie widoczny na wszystkich stronach publicznych
                      </p>
                    </div>
                    <Switch
                      checked={patronSettings.enabled}
                      onCheckedChange={(checked) => updatePatronField("enabled", checked)}
                    />
                  </div>

                  {/* Text Fields */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="prefix_text">Tekst przed nazwą</Label>
                      <Input
                        id="prefix_text"
                        value={patronSettings.prefix_text}
                        onChange={(e) => updatePatronField("prefix_text", e.target.value)}
                        placeholder="Głównym patronem serwisu jest"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="patron_name">Nazwa patrona</Label>
                      <Input
                        id="patron_name"
                        value={patronSettings.patron_name}
                        onChange={(e) => updatePatronField("patron_name", e.target.value)}
                        placeholder="Red Bull"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="patron_logo_url">URL logo (opcjonalnie)</Label>
                    <Input
                      id="patron_logo_url"
                      value={patronSettings.patron_logo_url || ""}
                      onChange={(e) => updatePatronField("patron_logo_url", e.target.value)}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>

                  {/* CTA Fields */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="cta_text">Tekst CTA (opcjonalnie)</Label>
                      <Input
                        id="cta_text"
                        value={patronSettings.cta_text || ""}
                        onChange={(e) => updatePatronField("cta_text", e.target.value)}
                        placeholder="Sprawdź ofertę"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cta_url">URL CTA</Label>
                      <Input
                        id="cta_url"
                        value={patronSettings.cta_url || ""}
                        onChange={(e) => updatePatronField("cta_url", e.target.value)}
                        placeholder="https://redbull.pl"
                      />
                    </div>
                  </div>

                  {/* Style Settings */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="background_color">Kolor tła</Label>
                      <div className="flex gap-2">
                        <Input
                          id="background_color"
                          type="color"
                          value={patronSettings.background_color}
                          onChange={(e) => updatePatronField("background_color", e.target.value)}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={patronSettings.background_color}
                          onChange={(e) => updatePatronField("background_color", e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="text_color">Kolor tekstu</Label>
                      <div className="flex gap-2">
                        <Input
                          id="text_color"
                          type="color"
                          value={patronSettings.text_color}
                          onChange={(e) => updatePatronField("text_color", e.target.value)}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={patronSettings.text_color}
                          onChange={(e) => updatePatronField("text_color", e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="style">Styl tła</Label>
                      <Select
                        value={patronSettings.style}
                        onValueChange={(value) => updatePatronField("style", value as PatronSettings["style"])}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solid">Jednolity</SelectItem>
                          <SelectItem value="gradient">Gradient</SelectItem>
                          <SelectItem value="glass">Szkło (blur)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Dismissible Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Możliwość zamknięcia</Label>
                      <p className="text-sm text-muted-foreground">
                        Użytkownik może zamknąć pasek (wraca po odświeżeniu strony)
                      </p>
                    </div>
                    <Switch
                      checked={patronSettings.dismissible}
                      onCheckedChange={(checked) => updatePatronField("dismissible", checked)}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSavePatron}
                      disabled={!hasPatronChanges || updatePatron.isPending}
                    >
                      {updatePatron.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Zapisz zmiany
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleResetPatron}
                      disabled={updatePatron.isPending}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Przywróć domyślne
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* AI Settings - Only for admins */}
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Ustawienia AI</CardTitle>
              <CardDescription>
                Konfiguracja automatycznego wypełniania postów na podstawie URL
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Extraction Prompt */}
              <div className="space-y-2">
                <Label htmlFor="master-prompt">📝 Prompt ekstrakcji metadanych</Label>
                {isLoadingPrompt ? (
                  <Skeleton className="h-48 w-full" />
                ) : (
                  <Textarea
                    id="master-prompt"
                    value={localPrompt}
                    onChange={(e) => setLocalPrompt(e.target.value)}
                    rows={8}
                    className="font-mono text-sm"
                    placeholder="Wprowadź prompt dla AI..."
                  />
                )}
                <p className="text-sm text-muted-foreground">
                  Ten prompt określa jak AI generuje tytuł, excerpt, kategorię i tagi.
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSavePrompt} 
                    disabled={!hasPromptChanges || updateSetting.isPending}
                    size="sm"
                  >
                    {updateSetting.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Zapisz
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleResetPrompt}
                    disabled={updateSetting.isPending}
                    size="sm"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Przywróć domyślny
                  </Button>
                </div>
              </div>

              {/* Content Generation Prompt */}
              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="content-prompt">✨ Prompt generowania treści artykułu</Label>
                {isLoadingContentPrompt ? (
                  <Skeleton className="h-48 w-full" />
                ) : (
                  <Textarea
                    id="content-prompt"
                    value={localContentPrompt}
                    onChange={(e) => setLocalContentPrompt(e.target.value)}
                    rows={8}
                    className="font-mono text-sm"
                    placeholder="Wprowadź prompt do generowania treści..."
                  />
                )}
                <p className="text-sm text-muted-foreground">
                  Ten prompt określa jak AI generuje pełną, unikatową treść artykułu (300-500 słów).
                  Treść jest wyświetlana na dedykowanych stronach blinków.
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSaveContentPrompt} 
                    disabled={!hasContentPromptChanges || updateSetting.isPending}
                    size="sm"
                  >
                    {updateSetting.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Zapisz
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleResetContentPrompt}
                    disabled={updateSetting.isPending}
                    size="sm"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Przywróć domyślny
                  </Button>
                </div>
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
