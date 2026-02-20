

## Naprawa linków wewnętrznych w podsumowaniach dnia

### Problem

Edge function `generate-daily-summary` pobiera z bazy danych posty z polami `id`, `title`, `excerpt` i `category` -- ale **nie pobiera `slug`**. Prompt AI mówi "dodaj link w formacie `<a href="/blink/ID">`", więc AI podstawia UUID lub (częściej) wymyśla własny tekst przypominający slug. Tymczasem trasa `/blink/:slug` wymaga prawdziwego slugu z bazy.

Wynik: linki typu `/blink/podsumowanie-2002-srebro-polaka-na-zio-dramat-i-triumfy-7612f1bc` -- nie istnieją i zwracają 404.

### Rozwiązanie

Dwie zmiany w `supabase/functions/generate-daily-summary/index.ts`:

**1. Dodanie `slug` do zapytania SQL**

Zmiana selecta z:
```
id, title, excerpt, sport_category:category_id (name, slug)
```
na:
```
id, slug, title, excerpt, sport_category:category_id (name, slug)
```

**2. Przekazanie `slug` do kontekstu AI i aktualizacja promptu**

- W `postsContext` dodać pole `slug` obok `id`
- W `DEFAULT_SUMMARY_PROMPT` zmienić instrukcję linkowania z `<a href="/blink/ID">` na `<a href="/blink/SLUG">` i wyraźnie napisać, że AI ma użyć dokładnego slugu z danych wejściowych (bez modyfikacji)
- Analogicznie zaktualizować zapasowy fragment promptu (linia 207)

### Pliki do zmiany

- `supabase/functions/generate-daily-summary/index.ts` -- zapytanie, kontekst AI, prompt

