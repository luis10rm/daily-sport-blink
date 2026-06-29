## Problem

Generowanie recenzji z URL-a (np. tabletowo.pl/recenzja-vivo-x300-ultra) nie udaje się, bo `google/gemini-2.5-pro` na długim artykule (≈4k tokenów wejścia) przepala 127 s na wewnętrzny „reasoning" i Gateway zamyka połączenie z błędem `504 Upstream idle timeout exceeded` (`finish_reason: "error"`, `message.content: null`).

Edge function tego nie wykrywa — fallback `?? "{}"` powoduje, że parser zwraca pusty obiekt i frontend dostaje „udaną" odpowiedź bez treści.

## Zmiany w `supabase/functions/generate-review/index.ts`

1. **Zmiana modelu** z `google/gemini-2.5-pro` na `google/gemini-2.5-flash` — znacznie szybszy, bez „thinking budget", w pełni wystarczający do generowania 700-1200 słów recenzji według naszego promptu (i tańszy). Pro zostawiamy tylko jako ewentualny opt-in w przyszłości.

2. **Twarda walidacja odpowiedzi AI** zaraz po `aiResponse.json()`:
   - sprawdzić `choices[0].finish_reason` — jeśli `"error"` / `"length"` lub `message.content` jest `null`/pustym stringiem, zwrócić 502 z czytelnym komunikatem („Model AI nie zdążył wygenerować treści — spróbuj ponownie lub skróć źródło").
   - logować `finish_reason`, `usage`, długość `content` do diagnozy w przyszłości.

3. **Ograniczenie kontekstu** dla bardzo długich źródeł: skrócić `scraped.text` z 12 000 do 8 000 znaków przy wywołaniu modelu (sama funkcja scrape zostaje bez zmian), żeby zmniejszyć ryzyko timeoutu.

4. **Retry-once** przy `finish_reason === "error"` z timeoutem upstream: ponowić jedno wywołanie z krótszym promptem (te 8k → 5k znaków), zanim zwrócimy 502.

## Co NIE jest zmieniane

- Frontend (`ReviewEditor`) — komunikat błędu już teraz pokazuje `error` z funkcji.
- Prompty w `settings` — działają poprawnie, model je wczytał.
- Firecrawl/scrape — zadziałał, artykuł został pobrany.

## Weryfikacja

Po wdrożeniu: ponowne uruchomienie generowania z tym samym URL-em powinno zakończyć się w 15-30 s pełnym JSON-em recenzji. Jeśli mimo to model padnie, użytkownik zobaczy konkretny komunikat zamiast cichej pustki.
