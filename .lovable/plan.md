# Diagnoza

Przetestowałem URL i logi:

- `curl` bez User-Agenta → **HTTP 204, 0 bajtów** (benchmark.pl ma bot-wall ustawiający cookie `STabid` przy pierwszej wizycie i odrzuca requesty bez UA / bez JS).
- `curl` z UA Chrome → HTTP 200, 157 KB, pełna treść.
- Ostatni log AI Gateway dla `generate-review` (07:21:03): trwał **130 s** i zwrócił tylko **495 tokenów** outputu — to symptom „AI nic nie ma o czym pisać", bo Firecrawl prawdopodobnie dostał pustą/blokerską stronę.
- W `supabase/functions/generate-review/index.ts` funkcja `scrapeSource` wywołuje Firecrawl bez `proxy: "stealth"` i bez fallbacku. Gdy Firecrawl zwróci pustkę albo interstitial, edge function i tak woła AI z pustym `text`, więc Gemini generuje stub lub się gubi i nie zwraca poprawnego JSON-a → frontend pokazuje brak rezultatu.

# Plan naprawy

## 1. `supabase/functions/generate-review/index.ts`

- W `scrapeSource` użyć Firecrawl v2 z opcją `proxy: "stealth"` (omija bot-walle typu benchmark.pl) i `waitFor: 2500`.
- Po Firecrawl: jeżeli `text.length < 400`, wykonać **fallback** — bezpośredni `fetch` z realistycznym User-Agentem (`Mozilla/5.0 ... Chrome/120`), `Accept-Language: pl-PL`, wyciągnąć tekst z `<article>`/`<main>` (regex strip tagów, limit 12 000 zn.), a obrazy z `<meta property="og:image">` + pierwszych `<img>` w treści.
- Dodać `console.log` z długością scrapowanego tekstu i liczbą obrazów (do edge function logs — łatwa diagnoza w przyszłości).
- Jeżeli po obu próbach `text.length < 200` **przerwać przed wywołaniem AI** i zwrócić `502` z komunikatem `"Nie udało się pobrać treści ze źródła (bot-wall)."` zamiast palić 130 s i kredyty.

## 2. `src/pages/admin/ReviewEditor.tsx`

- Wyświetlić toast z komunikatem zwróconym przez edge function (`error`) zamiast generycznego „Nie udało się wygenerować".

## 3. Walidacja

Po wdrożeniu — ponowny test tego samego URL benchmark.pl przez panel; sprawdzić w logach że `scraped text length` > 1000 i że AI dostaje pełny artykuł.

# Szczegóły techniczne (Firecrawl v2)

Body `POST /v2/scrape`:
```json
{
  "url": "...",
  "formats": ["markdown", "html"],
  "onlyMainContent": true,
  "waitFor": 2500,
  "proxy": "stealth",
  "location": { "country": "PL", "languages": ["pl"] }
}
```

Fallback fetch headers:
```text
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36
Accept: text/html,application/xhtml+xml
Accept-Language: pl-PL,pl;q=0.9,en;q=0.8
```

Bez zmian w bazie danych, bez zmian w innych funkcjach.
