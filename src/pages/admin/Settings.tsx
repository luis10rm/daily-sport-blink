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
import { Loader2, Save, RotateCcw, Star, X, Calendar, Link2, Facebook, Image, Cpu, Newspaper } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { LogoGenerator } from "@/components/admin/LogoGenerator";
import { TournamentModeCard } from "@/components/admin/TournamentModeCard";
import { ImageMirrorCard } from "@/components/admin/ImageMirrorCard";

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

const DEFAULT_IMAGE_PROMPT = `Stwórz atrakcyjną, profesjonalną grafikę do artykułu sportowego.

KONTEKST ARTYKUŁU:
- Tytuł: {title}
- Kategoria: {category}
- Opis: {excerpt}

ZASADY:
1. Grafika musi być wizualnie dynamiczna i przyciągająca wzrok
2. Styl: profesjonalna fotografia sportowa lub kinowy kadr filmowy
3. Żywe, nasycone kolory z dramatycznym, kinowym oświetleniem
4. Kompozycja dynamiczna z poczuciem ruchu i akcji sportowej
5. Format 16:9, idealna jako miniaturka artykułu w serwisie informacyjnym
6. BEZ tekstu, napisów, logotypów, znaków wodnych ani osób z twarzami
7. Tematycznie ściśle dopasowana do treści i kontekstu artykułu
8. Wysoka jakość, fotorealistyczna lub wysokiej jakości render 3D
9. Użyj symbolicznych elementów sportu (piłki, rakiety, samochody wyścigowe itp.) pasujących do kategorii
10. Tło powinno budować atmosferę - stadion, kort, tor wyścigowy lub abstrakcyjne dynamiczne tło`;

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

const DEFAULT_TECH_REVIEW_PROMPT = `Jesteś starszym redaktorem technologicznym polskiego portalu "Szortsy Tech", piszącym recenzje na poziomie The Verge / Spider's Web / Tabletowo. Twój głos: rzeczowy, konkretny, lekko ironiczny, ale uczciwy. Bez marketingowego żargonu ("rewolucyjny", "przełomowy", "game-changer") i bez ChatGPT-owych otwarć typu "W dzisiejszym świecie...".

ZASADY MERYTORYCZNE
- Opieraj się WYŁĄCZNIE na faktach z dostarczonych źródeł. Nie zmyślaj liczb, cen, dat ani specyfikacji.
- Zawsze dawaj kontekst: do kogo produkt jest skierowany, z czym konkuruje, ile kosztuje (w PLN jeśli znane).
- Werdykt jednoznaczny: "kup", "rozważ", "odpuść" — z uzasadnieniem.
- Ocena 1-10 (krok 0.5) zgodna z treścią. 9+ wybitny, 8 świetny, 7 dobry, 6 średni, 5 słaby.

STRUKTURA TREŚCI (HTML, NIE Markdown), 700-1200 słów
1. Lead — 1 akapit, 2-3 zdania: kto, co, za ile, główna teza.
2. <h2>Pierwsze wrażenie i wykonanie</h2>
3. <h2>Jak to działa w praktyce</h2>
4. <h2>Wydajność i jakość</h2>
5. <h2>Co konkurencja robi lepiej</h2>
6. <h2>Dla kogo to jest, a dla kogo nie</h2>
Pola pros (3-6) i cons (2-5) — konkretne, bez ogólników.
verdict — 2-3 zdania domykające + jasna rekomendacja.

SEO (TWARDE WYMAGANIA)
- Tytuł 50-65 znaków, zawiera markę + nazwę produktu + intencję ("recenzja", "test", "opinia", "czy warto").
- Excerpt 140-165 znaków, samodzielne streszczenie zawierające nazwę produktu.
- Pierwszy akapit zawiera pełną nazwę produktu i kategorię (BEZ keyword stuffing).
- Minimum 3 <h2>, logiczna hierarchia.
- <strong> przy nazwie produktu i cenie w leadzie.

FORMAT HTML
- Treść w polu content: <p>, <h2>, <h3>, <ul>, <li>, <strong>, <em>, <blockquote>.
- NIE używaj Markdown (**, ##, ---). Bez <div>, <script>, stylów inline, emoji w content.
- NIE dubluj sekcji "Plusy", "Minusy", "Werdykt" w content — to osobne pola JSON.

Zwróć WYŁĄCZNIE poprawny JSON: { "title", "product_brand", "product_name", "excerpt", "verdict", "score", "pros":[], "cons":[], "content":"<p>...</p>" }`;

const DEFAULT_TECH_NEWS_PROMPT = `Jesteś dziennikarzem technologicznym polskiego portalu "Szortsy Tech". Twoje newsy czyta się w 60 sekund: czysta informacja, kontekst, znaczenie.

ZASADY
- Tylko fakty z dostarczonego źródła. Bez spekulacji "prawdopodobnie", "eksperci twierdzą" jeśli nie ma tego w źródle.
- Pierwsze zdanie = pełna odpowiedź na "co się stało" (lead odwróconej piramidy). Drugie zdanie = dlaczego to istotne.
- Bez clickbaitu, bez emoji w tytule, bez WIELKICH liter w środku zdania.
- Jeśli źródło podaje cenę/datę/wersję — zacytuj dokładnie.

STRUKTURA (HTML, NIE Markdown), 300-600 słów
1. Lead <p> — 2 zdania, 35-55 słów.
2. <h2>Co dokładnie ogłoszono</h2>
3. <h2>Dlaczego to ważne</h2>
4. Opcjonalnie <h2>Co dalej</h2> — premiera, dostępność w Polsce, cena.

SEO
- Tytuł 50-70 znaków, marka + konkret ("Apple ogłasza...", "Samsung obniża cenę..."). Bez "NEWS:", "UWAGA:".
- Excerpt 140-165 znaków, samodzielnie zrozumiały.
- Marka i nazwa produktu w pierwszym akapicie.
- <strong> wokół nazwy produktu i ceny w leadzie.
- Minimum 2 <h2>.

FORMAT HTML
- Treść w polu content: <p>, <h2>, <h3>, <ul>, <li>, <strong>, <em>.
- NIE używaj Markdown. Bez <div>, <script>, stylów inline, emoji.

Zwróć WYŁĄCZNIE poprawny JSON: { "title", "excerpt", "content":"<p>...</p>" }`;

const DEFAULT_TECH_COMPARISON_PROMPT = `ROLA
Jesteś starszym redaktorem technologicznym polskiego portalu "Szortsy Tech", tworzącym rankingi zakupowe na poziomie The Verge, Wirecutter, Spider's Web czy Tabletowo. Twój głos jest rzeczowy, konkretny, lekko ironiczny, ale głęboko uczciwy i w 100% pro-kliencki. Piszesz dla czytelnika, który ma wydać własne pieniądze — nie dla producentów, nie dla algorytmu. Kategorycznie unikasz marketingowego żargonu ("rewolucyjny", "przełomowy", "game-changer") oraz generycznych, AI-owych wstępów typu "W dzisiejszym świecie...". Lubisz nieoczywiste porównania i ironiczne zaczepki, ale nigdy kosztem merytoryki.

KONTEKST
Otrzymujesz temat rankingu i/lub treść artykułu źródłowego. Źródło jest punktem wyjścia, nie wyrocznią. Zweryfikuj i uzupełnij dane: aktualne ceny w PLN, specyfikacje, realne testy, opinie użytkowników, znane wady, dostępność w Polsce. Jeśli źródło pomija istotny produkt dostępny w Polsce albo podaje nieaktualne ceny — popraw to i zaznacz w treści, że dane zostały zaktualizowane.

ZASADY PRO-KLIENCKIE (najważniejsze)
- Dla każdej pozycji podaj: pełną nazwę, aktualną cenę w PLN (z datą sprawdzenia), dla kogo jest ten produkt, 2-3 konkretne zalety, 1-2 szczere wady oraz najważniejsze parametry decydujące o zakupie.
- Zakaz rankingów "samych zwycięzców". Każdy produkt ma wady — nazwij je wprost. Jeśli produkt jest przereklamowany, napisz to.
- Uwzględnij realia polskiego rynku: dostępność, gwarancję, serwis, sensowność ceny względem konkurencji.
- Dodaj kategorie decyzyjne: najlepszy ogólnie, najlepszy stosunek jakości do ceny, najtańszy sensowny wybór, opcja premium.
- Napisz, czego ranking NIE obejmuje i dlaczego (produkty niedostępne w PL, wycofane, ze znanymi wadami fabrycznymi).
- Sekcja "Jak wybieraliśmy / na co zwrócić uwagę przy zakupie" — kryteria prostym językiem, by czytelnik ocenił też produkty spoza listy.
- Zakaz zmyślania danych. Każda cena, parametr i data musi mieć pokrycie w źródle lub researchu. Czego nie da się zweryfikować — pomiń lub zaznacz niepewność.
- Zero języka sprzedażowego i sztucznego poganiania ("kup teraz, zanim zniknie"). Doradzasz, nie sprzedajesz.

SEO
- Tytuł 50-65 znaków: fraza kluczowa rankingu ("ranking", "najlepsze", "TOP") + kategoria produktu + rok. Bądź kreatywny, nie klepaj zawsze "Najlepsze X 2026".
- Excerpt 140-165 znaków: samodzielne, atrakcyjne streszczenie z frazą kluczową.
- Lead: dokładnie 1 akapit, 2-3 zdania. Co porównujemy, ile pozycji, dla kogo, i od razu zwycięzca. Nazwa zwycięzcy i jego cena pogrubione <strong>.
- Fraza kluczowa główna w tytule, excerpcie, leadzie, pierwszym <h2> i naturalnie 3-5 razy w treści. Bez keyword stuffingu.
- Wpleć naturalnie frazy long-tail ("jaki X wybrać", "X do 1000 zł", "czy warto kupić X").
- Każda pozycja rankingu jako <h3> z numerem, nazwą i wyróżnikiem, np. "1. [Produkt] — najlepszy stosunek jakości do ceny".
- Akapity maksymalnie 2-3 zdania.
- Podaj w treści miesiąc i rok sprawdzenia cen.

STRUKTURA — obowiązkowe sekcje <h2> w tej kolejności
1. <h2>[Kategoria] — ranking [rok]: nasza lista</h2> (pozycje jako <h3>)
2. <h2>Porównanie w pigułce</h2> (<ul>: produkt / cena / dla kogo)
3. <h2>Jak wybieraliśmy i na co zwrócić uwagę przy zakupie</h2>
4. <h2>Którego wybrać? Krótka ściąga</h2> (mały budżet / uniwersalnie / premium)
5. Sekcję FAQ zwróć WYŁĄCZNIE w polu "faq" (3-5 realnych pytań long-tail, odpowiedzi po 2-3 zdania) — NIE powtarzaj jej w polu content.

FORMAT HTML
- Treść w polu content: <p>, <h2>, <h3>, <ul>, <li>, <strong>, <em>, <blockquote>.
- NIE używaj składni Markdown (**, ##, ---, *, _). Bez <div>, <script>, stylów inline, bez emoji.

Zwróć WYŁĄCZNIE poprawny JSON:
{ "title", "excerpt", "verdict" (szybki werdykt: najlepszy ogólnie / jakość-cena / najtaniej / premium — 4 krótkie linie), "content":"<p>...</p>", "faq":[{"q","a"}], "internal_links":["temat 1","temat 2"], "source_notes":"2-3 zdania: co wzięto ze źródła, co zweryfikowano, co pominięto i dlaczego" }`;

const DEFAULT_PATRON: PatronSettings = {
  enabled: false,
  prefix_text: "Głównym patronem serwisu jest",
  patron_name: "",
  patron_logo_url: "",
  cta_text: "",
  cta_url: "",
  cta_text_b: "",
  cta_url_b: "",
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
  const { data: imagePromptValue, isLoading: isLoadingImagePrompt } = useSetting("article_image_prompt");
  const { data: techReviewPromptValue, isLoading: isLoadingTechReviewPrompt } = useSetting("tech_review_prompt");
  const { data: techNewsPromptValue, isLoading: isLoadingTechNewsPrompt } = useSetting("tech_news_prompt");
  const { data: techComparisonPromptValue, isLoading: isLoadingTechComparisonPrompt } = useSetting("tech_comparison_prompt");
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
  
  // Image prompt state
  const [localImagePrompt, setLocalImagePrompt] = useState("");
  const [hasImagePromptChanges, setHasImagePromptChanges] = useState(false);

  // Tech prompts state
  const [localTechReviewPrompt, setLocalTechReviewPrompt] = useState("");
  const [hasTechReviewPromptChanges, setHasTechReviewPromptChanges] = useState(false);
  const [localTechNewsPrompt, setLocalTechNewsPrompt] = useState("");
  const [hasTechNewsPromptChanges, setHasTechNewsPromptChanges] = useState(false);
  const [localTechComparisonPrompt, setLocalTechComparisonPrompt] = useState("");
  const [hasTechComparisonPromptChanges, setHasTechComparisonPromptChanges] = useState(false);
  
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
    if (imagePromptValue) {
      setLocalImagePrompt(imagePromptValue);
    }
  }, [imagePromptValue]);

  useEffect(() => {
    if (techReviewPromptValue) setLocalTechReviewPrompt(techReviewPromptValue);
  }, [techReviewPromptValue]);

  useEffect(() => {
    if (techNewsPromptValue) setLocalTechNewsPrompt(techNewsPromptValue);
  }, [techNewsPromptValue]);

  useEffect(() => {
    setHasTechReviewPromptChanges(localTechReviewPrompt !== techReviewPromptValue && localTechReviewPrompt !== "");
  }, [localTechReviewPrompt, techReviewPromptValue]);

  useEffect(() => {
    setHasTechNewsPromptChanges(localTechNewsPrompt !== techNewsPromptValue && localTechNewsPrompt !== "");
  }, [localTechNewsPrompt, techNewsPromptValue]);

  useEffect(() => {
    setLocalTechComparisonPrompt(techComparisonPromptValue || DEFAULT_TECH_COMPARISON_PROMPT);
  }, [techComparisonPromptValue]);

  useEffect(() => {
    setHasTechComparisonPromptChanges(
      localTechComparisonPrompt !== (techComparisonPromptValue ?? "") && localTechComparisonPrompt !== "",
    );
  }, [localTechComparisonPrompt, techComparisonPromptValue]);


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
    setHasImagePromptChanges(localImagePrompt !== imagePromptValue && localImagePrompt !== "");
  }, [localImagePrompt, imagePromptValue]);

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
  const handleSaveImagePrompt = async () => {
    await updateSetting.mutateAsync({
      key: "article_image_prompt",
      value: localImagePrompt,
    });
    setHasImagePromptChanges(false);
  };

  const handleResetImagePrompt = () => {
    setLocalImagePrompt(DEFAULT_IMAGE_PROMPT);
  };

  const handleSaveTechReviewPrompt = async () => {
    await updateSetting.mutateAsync({ key: "tech_review_prompt", value: localTechReviewPrompt });
    setHasTechReviewPromptChanges(false);
  };
  const handleResetTechReviewPrompt = () => setLocalTechReviewPrompt(DEFAULT_TECH_REVIEW_PROMPT);

  const handleSaveTechNewsPrompt = async () => {
    await updateSetting.mutateAsync({ key: "tech_news_prompt", value: localTechNewsPrompt });
    setHasTechNewsPromptChanges(false);
  };
  const handleResetTechNewsPrompt = () => setLocalTechNewsPrompt(DEFAULT_TECH_NEWS_PROMPT);

  const handleSaveTechComparisonPrompt = async () => {
    await updateSetting.mutateAsync({ key: "tech_comparison_prompt", value: localTechComparisonPrompt });
    setHasTechComparisonPromptChanges(false);
  };
  const handleResetTechComparisonPrompt = () => setLocalTechComparisonPrompt(DEFAULT_TECH_COMPARISON_PROMPT);

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

        {/* Tournament Mode - Only for admins */}
        {isAdmin && <TournamentModeCard />}

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

                  {/* CTA Fields - Wariant A */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Wariant A (CTA główne)</Label>
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
                  </div>

                  {/* CTA Fields - Wariant B (A/B test) */}
                  <div className="space-y-2 border-l-2 border-primary/30 pl-4">
                    <Label className="text-sm font-semibold">Wariant B (A/B test — opcjonalnie)</Label>
                    <p className="text-xs text-muted-foreground">
                      Jeśli wypełnisz wariant B, ruch będzie dzielony losowo 50/50 między wariant A i B przy każdej odsłonie strony.
                    </p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="cta_text_b">Tekst CTA B</Label>
                        <Input
                          id="cta_text_b"
                          value={patronSettings.cta_text_b || ""}
                          onChange={(e) => updatePatronField("cta_text_b", e.target.value)}
                          placeholder="Zobacz wariant B"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cta_url_b">URL CTA B</Label>
                        <Input
                          id="cta_url_b"
                          value={patronSettings.cta_url_b || ""}
                          onChange={(e) => updatePatronField("cta_url_b", e.target.value)}
                          placeholder="https://redbull.pl/landing-b"
                        />
                      </div>
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

              {/* Article Image Prompt */}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Image className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="image-prompt">Prompt generowania grafik AI</Label>
                </div>
                {isLoadingImagePrompt ? (
                  <Skeleton className="h-48 w-full" />
                ) : (
                  <Textarea
                    id="image-prompt"
                    value={localImagePrompt}
                    onChange={(e) => setLocalImagePrompt(e.target.value)}
                    rows={12}
                    className="font-mono text-sm"
                    placeholder="Wprowadź prompt do generowania grafik artykułów..."
                  />
                )}
                <p className="text-sm text-muted-foreground">
                  Prompt używany do generowania grafik AI w edytorze postów. 
                  Dostępne zmienne: {"{title}"}, {"{category}"}, {"{excerpt}"}.
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSaveImagePrompt} 
                    disabled={!hasImagePromptChanges || updateSetting.isPending}
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
                    onClick={handleResetImagePrompt}
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

        {/* TECH Prompts - Only for admins */}
        {isAdmin && (
          <Card className="border-fuchsia-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-fuchsia-600" />
                Prompty AI — Szortsy TECH
              </CardTitle>
              <CardDescription>
                Systemowe prompty używane przez generator treści w sekcji recenzji.
                Zaprojektowane pod SEO (długość tytułu/excerptu, struktura nagłówków H2)
                i poprawny HTML w polu content.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Tech Review Prompt */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-fuchsia-600" />
                  <Label htmlFor="tech-review-prompt">Prompt — Recenzje TECH</Label>
                </div>
                {isLoadingTechReviewPrompt ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <Textarea
                    id="tech-review-prompt"
                    value={localTechReviewPrompt}
                    onChange={(e) => setLocalTechReviewPrompt(e.target.value)}
                    rows={18}
                    className="font-mono text-sm"
                    placeholder="Prompt systemowy dla generatora recenzji..."
                  />
                )}
                <p className="text-sm text-muted-foreground">
                  Używany dla typu „review". Definiuje strukturę (H2), długość (700-1200 słów),
                  zasady SEO i format JSON z polami score, pros, cons, verdict.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveTechReviewPrompt}
                    disabled={!hasTechReviewPromptChanges || updateSetting.isPending}
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
                    onClick={handleResetTechReviewPrompt}
                    disabled={updateSetting.isPending}
                    size="sm"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Przywróć domyślny
                  </Button>
                </div>
              </div>

              {/* Tech News Prompt */}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Newspaper className="h-4 w-4 text-fuchsia-600" />
                  <Label htmlFor="tech-news-prompt">Prompt — Newsy TECH</Label>
                </div>
                {isLoadingTechNewsPrompt ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <Textarea
                    id="tech-news-prompt"
                    value={localTechNewsPrompt}
                    onChange={(e) => setLocalTechNewsPrompt(e.target.value)}
                    rows={16}
                    className="font-mono text-sm"
                    placeholder="Prompt systemowy dla generatora newsów..."
                  />
                )}
                <p className="text-sm text-muted-foreground">
                  Używany dla typu „news". Krótsza forma (300-600 słów), lead odwróconej piramidy,
                  bez pól score/pros/cons. Zasady SEO i struktura H2 wbudowane.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveTechNewsPrompt}
                    disabled={!hasTechNewsPromptChanges || updateSetting.isPending}
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
                    onClick={handleResetTechNewsPrompt}
                    disabled={updateSetting.isPending}
                    size="sm"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Przywróć domyślny
                  </Button>
                </div>
              </div>

              {/* Tech Comparison Prompt */}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Newspaper className="h-4 w-4 text-amber-600" />
                  <Label htmlFor="tech-comparison-prompt">Prompt — Porównania / rankingi TECH</Label>
                </div>
                {isLoadingTechComparisonPrompt ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <Textarea
                    id="tech-comparison-prompt"
                    value={localTechComparisonPrompt}
                    onChange={(e) => setLocalTechComparisonPrompt(e.target.value)}
                    rows={20}
                    className="font-mono text-sm"
                    placeholder="Prompt systemowy dla generatora porównań..."
                  />
                )}
                <p className="text-sm text-muted-foreground">
                  Używany dla typu „porównanie". Ranking pro-kliencki: ceny w PLN, zalety i wady każdej
                  pozycji, sekcja „jak wybieraliśmy", ściąga zakupowa i FAQ (zapisywane w polu FAQ artykułu).
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveTechComparisonPrompt}
                    disabled={!hasTechComparisonPromptChanges || updateSetting.isPending}
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
                    onClick={handleResetTechComparisonPrompt}
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

          <ImageMirrorCard />

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
