

## Naprawa promptu podsumowania dnia w bazie danych

### Problem

Prompt podsumowania dnia został zmieniony w kodzie (DEFAULT_SUMMARY_PROMPT), ale w bazie danych w tabeli `settings` (klucz `daily_summary_prompt`) jest zapisany niestandardowy prompt, ktory nadpisuje domyslny. Ten zapisany prompt wciaz zawiera stare instrukcje:
- `<a href="/blink/ID">` zamiast `<a href="/blink/SLUG">`
- Brak informacji o polu `slug` w danych wejsciowych
- Format danych: `(title, excerpt, category, id)` zamiast `(title, excerpt, category, id, slug)`

Kod edge function priorytetowo uzywa promptu z bazy (linia ~195), wiec zmiany w DEFAULT_SUMMARY_PROMPT sa ignorowane.

### Rozwiazanie

**1. Aktualizacja promptu w bazie danych**

Wykonanie UPDATE na tabeli `settings`, zmieniajac w zapisanym prompcie:
- `(title, excerpt, category, id)` na `(title, excerpt, category, id, slug)`
- `<a href="/blink/ID">tekst linku</a>` na `<a href="/blink/SLUG">tekst linku</a>` (w sekcji SEO)
- `<a href="/blink/ID">` na `<a href="/blink/SLUG">` (w sekcji FORMATOWANIE)
- Dodanie instrukcji: "Dla kazdego wspomnianego newsa uzyj DOKLADNEGO slugu z danych wejsciowych (pole 'slug'). NIGDY nie wymyslaj wlasnych slugow."

**2. Poprawka fallbacku w edge function**

W `supabase/functions/generate-daily-summary/index.ts` (ok. linia 207) -- fragment ktory dopisuje instrukcje formatowania do custom promptu, jesli ich brakuje -- tez zawiera stare `<a href="/blink/SLUG">`. Ten fragment juz zostal poprawiony w ostatniej edycji, wiec wymaga tylko weryfikacji.

### Pliki do zmiany

- Tabela `settings` w bazie danych -- aktualizacja wartosci klucza `daily_summary_prompt`
- Weryfikacja `supabase/functions/generate-daily-summary/index.ts` (fallback prompt)

