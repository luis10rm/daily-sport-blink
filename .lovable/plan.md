Cel: dodać plik `vercel.json` do projektu, by równoległe deployowanie na Vercel obsługiwało SPA routing i serwerowe przekierowania 301.

Aktualny stan:
- Brak pliku `vercel.json`.
- Aplikacja używa `BrowserRouter` (`src/App.tsx`), więc Vercel musi fallbackować do `index.html` dla głębokich ścieżek.
- Przekierowania `/redakcja/* → /autor/*` są już obsługiwane klientem (`RedakcjaRedirect`, `Navigate`), ale Vercel może zrobić to szybciej i bardziej SEO-friendly jako 301.

Zamierzamy zbudować:
1. Plik `vercel.json` w głównym katalogu projektu z dokładną konfiguracją podaną przez użytkownika:
   - `rewrites`: catch-all `/.*` → `/index.html` (SPA fallback).
   - `redirects`:
     - `www.szortsy.pl` → `szortsy.pl` (permanent 301).
     - `/redakcja/:slug` → `/autor/:slug` (permanent 301).
     - `/redakcja` → `/autorzy` (permanent 301).

Kroki:
1. Utworzyć `vercel.json` z treścią przekazaną w wiadomości.
2. Zweryfikować poprawność JSON (np. `python -m json.tool`).
3. Nie modyfikować istniejących przekierowań klienta — pozostawiamy jako awaryjne/fallback.

Nie dotyczy:
- Zmian w Lovable hosting (`.lovable` nie używa `vercel.json`).
- Dodawania backendu, RLS, baz danych.
- Modyfikacji `src/App.tsx` — konfiguracja jest komplementarna.

Efekt końcowy: po deployu na Vercel wszystkie ścieżki SPA działają, a stare URL-e `/redakcja/*` oraz `www.szortsy.pl` zwracają 301 zgodnie z SEO-wymaganiami.