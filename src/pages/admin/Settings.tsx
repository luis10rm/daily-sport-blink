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
import { Loader2, Save, RotateCcw, Star, X, Calendar, Link2, Facebook } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { LogoGenerator } from "@/components/admin/LogoGenerator";

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
- Bez powtarzania tytułu na początku

LINKOWANIE WEWNĘTRZNE (SEO - OBOWIĄZKOWE):
- Jeśli otrzymasz listę powiązanych artykułów, MUSISZ dodać sekcję "Przeczytaj również" na końcu
- Format sekcji: <p><strong>Przeczytaj również:</strong></p> a następnie lista <ul> z 1-2 linkami
- Format linku: <a href="/blink/slug-artykulu">tekst kotwicy</a>
- Linkuj TYLKO do artykułów tematycznie powiązanych z aktualnym newsem
- Tekst kotwicy powinien być naturalny - skrócony tytuł lub kluczowa fraza
- Jeśli brak powiązanych artykułów w kontekście - nie dodawaj sekcji`;

const DEFAULT_SUMMARY_PROMPT = `Jesteś redaktorem sportowym Daily Sport Blink. Napisz profesjonalne podsumowanie dnia sportowego w języku polskim.

DANE WEJŚCIOWE:
Otrzymasz listę newsów opublikowanych danego dnia w formacie JSON (title, excerpt, category, id).

WYMAGANIA TREŚCI:
- Napisz artykuł o długości 1500-2500 słów
- Podziel na sekcje według kategorii sportowych (każda kategoria to osobny nagłówek H2)
- Każda sekcja: 2-4 akapity streszczające i analizujące newsy z tej kategorii
- Dodaj kontekst, analizę i opinie eksperta sportowego
- Ton: profesjonalny, angażujący, dziennikarski
- Rozpocznij od krótkiego wprowadzenia witającego czytelników
- Zakończ krótkim podsumowaniem i zapowiedzią kolejnego dnia

SEO:
- Tytuł: max 60 znaków, musi zawierać datę i główne sporty dnia
- Meta description (excerpt): max 155 znaków, zachęcający do przeczytania
- Naturalne użycie słów kluczowych sportowych
- Dla każdego wspomnianego newsa dodaj wewnętrzny link w formacie: <a href="/blink/ID">tekst linku</a>

FORMATOWANIE (OBOWIĄZKOWE):
- Używaj TYLKO tagów HTML: <h2>, <p>, <strong>, <em>, <a href="/blink/ID">
- NIE używaj składni Markdown (**, *, #, ## itp.)
- Pogrubienia: <strong>tekst</strong>
- Kursywa: <em>tekst</em>
- Nagłówki sekcji: <h2>Nazwa kategorii</h2>
- Akapity: <p>treść</p>

STRUKTURA ODPOWIEDZI:
Odpowiedz w formacie JSON:
{
  "title": "Tytuł SEO (max 60 znaków)",
  "excerpt": "Meta description (max 155 znaków)",
  "content": "<p>Wprowadzenie...</p><h2>Piłka nożna</h2><p>Treść...</p>...",
  "suggested_tags": ["tag1", "tag2", "podsumowanie dnia"]
}`;

const DEFAULT_FACEBOOK_PROMPT = `Jesteś copywriterem sportowym Szortsy.pl. Tworzysz angażujące posty na Facebooka.

STRUKTURA:
1. HOOK - mocne otwarcie z emoji kategorii, zaskakujący fakt lub pytanie retoryczne
2. KONTEKST - 2-3 krótkie, dynamiczne zdania rozwijające temat, użyj 1-2 emoji w tekście
3. CTA - zakończ pytaniem zachęcającym do dyskusji w komentarzach

ZASADY:
- Max 250 znaków (link i hashtagi zostaną dodane automatycznie)
- Pisz krótko, dynamicznie, z energią
- Unikaj clickbaitu, ale buduj ciekawość
- NIE kopiuj tytułu artykułu dosłownie - przeformułuj
- Używaj dynamicznych czasowników i emocjonalnego języka
- Zakończ angażującym pytaniem typu "A Wy co sądzicie?", "Kto wygra?"

EMOJI KATEGORII:
- football: ⚽
- basketball: 🏀
- tennis: 🎾
- f1: 🏎️
- mma: 🥊
- other: 🏆`;

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
  const { data: summaryPromptValue, isLoading: isLoadingSummaryPrompt } = useSetting("daily_summary_prompt");
  const { data: facebookPromptValue, isLoading: isLoadingFacebookPrompt } = useSetting("facebook_post_prompt");
  const { data: makeWebhookValue, isLoading: isLoadingMakeWebhook } = useSetting("make_webhook_url");
  const { data: patronData, isLoading: isLoadingPatron } = usePatronSettings();
  const updateSetting = useUpdateSetting();
  const updatePatron = useUpdatePatronSettings();
  
  // Extraction prompt state
  const [localPrompt, setLocalPrompt] = useState("");
  const [hasPromptChanges, setHasPromptChanges] = useState(false);
  
  // Content prompt state
  const [localContentPrompt, setLocalContentPrompt] = useState("");
  const [hasContentPromptChanges, setHasContentPromptChanges] = useState(false);
  
  // Summary prompt state
  const [localSummaryPrompt, setLocalSummaryPrompt] = useState("");
  const [hasSummaryPromptChanges, setHasSummaryPromptChanges] = useState(false);
  
  // Facebook prompt state
  const [localFacebookPrompt, setLocalFacebookPrompt] = useState("");
  const [hasFacebookPromptChanges, setHasFacebookPromptChanges] = useState(false);
  
  // Make webhook state
  const [localMakeWebhook, setLocalMakeWebhook] = useState("");
  const [hasMakeWebhookChanges, setHasMakeWebhookChanges] = useState(false);
  
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
    if (summaryPromptValue) {
      setLocalSummaryPrompt(summaryPromptValue);
    }
  }, [summaryPromptValue]);

  useEffect(() => {
    if (facebookPromptValue) {
      setLocalFacebookPrompt(facebookPromptValue);
    }
  }, [facebookPromptValue]);

  useEffect(() => {
    if (makeWebhookValue !== undefined) {
      setLocalMakeWebhook(makeWebhookValue || "");
    }
  }, [makeWebhookValue]);

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
    setHasSummaryPromptChanges(localSummaryPrompt !== summaryPromptValue && localSummaryPrompt !== "");
  }, [localSummaryPrompt, summaryPromptValue]);

  useEffect(() => {
    setHasFacebookPromptChanges(localFacebookPrompt !== facebookPromptValue && localFacebookPrompt !== "");
  }, [localFacebookPrompt, facebookPromptValue]);

  useEffect(() => {
    const currentValue = makeWebhookValue || "";
    setHasMakeWebhookChanges(localMakeWebhook !== currentValue);
  }, [localMakeWebhook, makeWebhookValue]);

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

  const handleSaveSummaryPrompt = async () => {
    await updateSetting.mutateAsync({
      key: "daily_summary_prompt",
      value: localSummaryPrompt,
    });
    setHasSummaryPromptChanges(false);
  };

  const handleResetSummaryPrompt = () => {
    setLocalSummaryPrompt(DEFAULT_SUMMARY_PROMPT);
  };

  const handleSaveFacebookPrompt = async () => {
    await updateSetting.mutateAsync({
      key: "facebook_post_prompt",
      value: localFacebookPrompt,
    });
    setHasFacebookPromptChanges(false);
  };

  const handleResetFacebookPrompt = () => {
    setLocalFacebookPrompt(DEFAULT_FACEBOOK_PROMPT);
  };

  const handleSaveMakeWebhook = async () => {
    await updateSetting.mutateAsync({
      key: "make_webhook_url",
      value: localMakeWebhook,
    });
    setHasMakeWebhookChanges(false);
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

        {/* Logo Generator - Only for admins */}
        {isAdmin && <LogoGenerator />}

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

        {/* Make Webhook Settings - Only for admins */}
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Integracja z Make
              </CardTitle>
              <CardDescription>
                Konfiguracja webhooka do automatycznej publikacji na social media
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingMakeWebhook ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="make-webhook-url">URL Webhooka Make</Label>
                    <Input
                      id="make-webhook-url"
                      type="url"
                      value={localMakeWebhook}
                      onChange={(e) => setLocalMakeWebhook(e.target.value)}
                      placeholder="https://hook.eu1.make.com/..."
                    />
                    <p className="text-sm text-muted-foreground">
                      Wklej URL webhooka z Make.com (Webhooks → Custom webhook)
                    </p>
                  </div>

                  <Button
                    onClick={handleSaveMakeWebhook}
                    disabled={!hasMakeWebhookChanges || updateSetting.isPending}
                    size="sm"
                  >
                    {updateSetting.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Zapisz
                  </Button>
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

              {/* Daily Summary Prompt */}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="summary-prompt">Prompt podsumowania dnia</Label>
                </div>
                {isLoadingSummaryPrompt ? (
                  <Skeleton className="h-48 w-full" />
                ) : (
                  <Textarea
                    id="summary-prompt"
                    value={localSummaryPrompt}
                    onChange={(e) => setLocalSummaryPrompt(e.target.value)}
                    rows={12}
                    className="font-mono text-sm"
                    placeholder="Wprowadź prompt do generowania podsumowań dnia..."
                  />
                )}
                <p className="text-sm text-muted-foreground">
                  Ten prompt określa jak AI generuje podsumowania dnia sportowego (1500-2500 słów).
                  Używany w module "AI Podsumowanie Dnia" na dashboardzie.
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSaveSummaryPrompt} 
                    disabled={!hasSummaryPromptChanges || updateSetting.isPending}
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
                    onClick={handleResetSummaryPrompt}
                    disabled={updateSetting.isPending}
                    size="sm"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Przywróć domyślny
                  </Button>
                </div>
              </div>

              {/* Facebook Post Prompt */}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Facebook className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="facebook-prompt">Prompt postów na Facebook</Label>
                </div>
                {isLoadingFacebookPrompt ? (
                  <Skeleton className="h-48 w-full" />
                ) : (
                  <Textarea
                    id="facebook-prompt"
                    value={localFacebookPrompt}
                    onChange={(e) => setLocalFacebookPrompt(e.target.value)}
                    rows={12}
                    className="font-mono text-sm"
                    placeholder="Wprowadź prompt do generowania postów na Facebook..."
                  />
                )}
                <p className="text-sm text-muted-foreground">
                  Ten prompt określa jak AI generuje opisy postów na Facebooka.
                  Używany przy automatycznej publikacji przez Make.
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSaveFacebookPrompt} 
                    disabled={!hasFacebookPromptChanges || updateSetting.isPending}
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
                    onClick={handleResetFacebookPrompt}
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
