
# Moduł: AI Podsumowanie Dnia Sportowego

## Cel
Stworzenie funkcji w panelu admina, która jednym kliknięciem generuje profesjonalny, długi artykuł SEO podsumowujący wszystkie newsy opublikowane danego dnia.

---

## Architektura rozwiązania

```text
┌─────────────────────────────────────────────────────────────────┐
│                    PANEL ADMINA (Dashboard)                      │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  📊 Statystyki dnia   │   🔄 Generuj podsumowanie dnia      │ │
│  └─────────────────────────────────────────────────────────────┘ │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              EDGE FUNCTION: generate-daily-summary               │
│  1. Pobierz wszystkie posty z wybranego dnia                    │
│  2. Pogrupuj po kategoriach                                     │
│  3. Wyślij do Lovable AI (Gemini Pro) z promptem SEO            │
│  4. Zwróć: title, excerpt, content (1500-2500 słów)            │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   NOWY POST (typ: summary)                       │
│  - Automatyczny tytuł: "Sportowe podsumowanie dnia - DD.MM.YYYY"│
│  - Długa treść SEO z odnośnikami do oryginalnych newsów         │
│  - Kategoria: "other" (lub nowa "podsumowania")                 │
│  - Tagi: dyscypliny + "podsumowanie dnia"                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Funkcjonalności

### 1. Przycisk w Dashboardzie
- Nowy przycisk "Generuj podsumowanie dnia" na głównym dashboardzie admina
- Możliwość wyboru daty (domyślnie: dzisiaj)
- Podgląd liczby dostępnych artykułów przed generowaniem
- Loading state podczas generowania

### 2. Edge Function `generate-daily-summary`
Nowa funkcja backendowa która:
- Pobiera wszystkie posty z wybranej daty z bazy
- Grupuje je wg kategorii sportowej
- Tworzy rozbudowany prompt dla AI z kontekstem SEO
- Generuje artykuł 1500-2500 słów w formacie HTML
- Opcjonalnie: dodaje wewnętrzne linki do oryginalnych artykułów

### 3. Konfigurowalny prompt (Ustawienia)
Nowy wpis w ustawieniach: `daily_summary_prompt`
- Edytowalny przez admina
- Domyślny prompt zoptymalizowany pod SEO
- Zasady stylistyczne, długość, struktura

### 4. Automatyczne tworzenie posta
Po wygenerowaniu:
- Otwiera PostEditor z wypełnionymi danymi
- Admin może przejrzeć, zedytować i opublikować
- Lub: automatycznie zapisuje jako "draft" do późniejszej edycji

---

## Struktura generowanego artykułu

```text
# [Tytuł SEO - np. "Piłka, F1 i MMA - Sportowe podsumowanie 29 stycznia 2026"]

## Wprowadzenie (1 akapit)
Krótkie powitanie i zapowiedź najważniejszych wydarzeń dnia.

## Piłka nożna (sekcja per kategoria)
Streszczenie 2-5 najważniejszych newsów z tej kategorii.
Wewnętrzne linki do oryginalnych artykułów.

## Formuła 1
...

## MMA
...

## Podsumowanie
Krótka refleksja, zapowiedź kolejnego dnia.

---
*Artykuł wygenerowany automatycznie na podstawie [X] newsów z dnia DD.MM.YYYY*
```

---

## Zmiany w plikach

| Plik | Zmiana |
|------|--------|
| `supabase/functions/generate-daily-summary/index.ts` | **NOWY** - edge function do generowania podsumowania |
| `src/hooks/useSettings.ts` | Dodanie `useGenerateDailySummary` mutation |
| `src/pages/admin/Dashboard.tsx` | Dodanie przycisku i logiki generowania |
| `src/pages/admin/Settings.tsx` | Sekcja konfiguracji promptu podsumowania |
| `supabase/config.toml` | Rejestracja nowej funkcji |

---

## Szczegóły techniczne

### Edge Function - główna logika

```typescript
// supabase/functions/generate-daily-summary/index.ts

// 1. Pobierz posty z wybranej daty
const { data: posts } = await supabase
  .from("posts")
  .select("id, title, excerpt, content, sport_category(name)")
  .gte("published_at", startOfDay)
  .lte("published_at", endOfDay);

// 2. Przygotuj kontekst dla AI
const postsContext = posts.map(p => ({
  title: p.title,
  excerpt: p.excerpt,
  category: p.sport_category?.name,
  id: p.id // do linków wewnętrznych
}));

// 3. Wywołaj Lovable AI z rozbudowanym promptem
const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
  body: JSON.stringify({
    model: "google/gemini-2.5-pro", // mocniejszy model dla długiej treści
    messages: [
      { role: "system", content: summaryPrompt },
      { role: "user", content: JSON.stringify(postsContext) }
    ]
  })
});

// 4. Zwróć wygenerowany artykuł
return { title, excerpt, content, suggested_tags };
```

### Domyślny prompt SEO

```text
Jesteś redaktorem sportowym Daily Sport Blink. Napisz profesjonalne podsumowanie dnia sportowego.

DANE WEJŚCIOWE:
Lista newsów opublikowanych dziś (JSON z: title, excerpt, category, id).

WYMAGANIA TREŚCI:
- 1500-2500 słów
- Podziel na sekcje wg kategorii sportowych (H2)
- Każda sekcja: 2-4 akapity streszczające newsy
- Dodaj kontekst, analizę i opinie eksperta
- Ton: profesjonalny, angażujący, dziennikarski
- Na końcu: krótkie podsumowanie i zapowiedź

SEO:
- Tytuł: max 60 znaków, zawiera datę i sport
- Meta description (excerpt): max 155 znaków
- Naturalne użycie słów kluczowych
- Wewnętrzne linki: /blink/{id} dla każdego wspomnianego newsa

FORMATOWANIE:
- HTML: <h2>, <p>, <strong>, <a href="/blink/ID">
- NIE używaj Markdown!
```

### Dashboard UI

```tsx
// W Dashboard.tsx
const [isGenerating, setIsGenerating] = useState(false);
const [selectedDate, setSelectedDate] = useState(new Date());
const generateSummary = useGenerateDailySummary();

const handleGenerate = async () => {
  setIsGenerating(true);
  const result = await generateSummary.mutateAsync(selectedDate);
  // Przekieruj do /admin/posts/new z wypełnionymi danymi
  navigate("/admin/posts/new", { 
    state: { 
      prefill: result,
      isSummary: true 
    }
  });
};
```

---

## Korzyści SEO

1. **Długa forma** - Google preferuje treści 1500+ słów
2. **Wewnętrzne linkowanie** - wzmacnia strukturę serwisu
3. **Regularna publikacja** - sygnał aktywności
4. **Słowa kluczowe** - naturalne pokrycie wielu fraz
5. **Unikalność** - każdy dzień = unikatowa treść

---

## Opcjonalne rozszerzenia (na przyszłość)

1. **Automatyczne planowanie** - CRON o 23:00 generuje draft
2. **Podsumowanie tygodniowe** - większy artykuł raz w tygodniu
3. **Statystyki w artykule** - ile newsów, najpopularniejsze kategorie
4. **Obrazek tytułowy** - kolaż z obrazków dnia (AI/Canvas)
5. **Newsletter** - wysyłka podsumowania do subskrybentów

---

## Estymowany czas wdrożenia

| Etap | Czas |
|------|------|
| Edge function | ~20 min |
| Hook + Dashboard UI | ~15 min |
| Ustawienia promptu | ~10 min |
| Testy i poprawki | ~15 min |
| **Razem** | ~1 godzina |
