# Widget "Jakiej recenzji szukasz?" na Tech

Nowy widget na `/tech`, w którym użytkownicy zgłaszają i głosują na tematy recenzji, plus panel administracyjny do zarządzania listą i licznikami głosów.

## Jak to działa dla użytkownika

1. Pole tekstowe: "Jakiej recenzji szukasz?" + przycisk "Zgłoś".
2. Podczas pisania (od 3 znaków) sprawdzamy podobieństwo do istniejących pozycji:
   - podobieństwo > 70% → podpowiedź "Czy chodzi Ci o…" z listą 1-3 trafień i przyciskiem "Tak, zagłosuj" (dodaje głos istniejącej pozycji),
   - brak trafień → "Dodaj jako nowe" tworzy nową pozycję z 1 głosem.
3. Pod polem lista 4 pozycji z największą liczbą głosów: nazwa, licznik głosów i przycisk "Głosuj" (bez limitu na urządzenie — każde kliknięcie zwiększa licznik).
4. Nowe zgłoszenia są widoczne od razu; admin może je ukryć lub usunąć.
5. Toast potwierdzający ("Dzięki, zapisaliśmy Twój głos") + delikatna animacja licznika.

## Panel administracyjny

Nowa zakładka **Życzenia Tech** (`/admin/recki/zyczenia`) w menu admina:
- tabela wszystkich zgłoszeń: nazwa, głosy, status (widoczne/ukryte), data, liczba zgłoszeń użytkowników,
- edycja nazwy i ręczna zmiana liczby głosów (pole numeryczne oraz +/-),
- przełącznik widoczności, przypięcie pozycji (zawsze w Top 4), usuwanie,
- dodawanie własnych pozycji przez redakcję,
- sortowanie po głosach lub dacie.

## Szczegóły techniczne

- Nowa tabela `review_requests`: `id`, `title`, `normalized_title` (unikalny), `votes` (int), `is_visible` (bool, default true), `is_pinned` (bool), `created_at`, `updated_at`. GRANT: `SELECT, INSERT` dla `anon` i `authenticated` (publiczne zgłaszanie), `UPDATE/DELETE` tylko dla admin/editor przez `is_admin_or_editor(auth.uid())`, `ALL` dla `service_role`. RLS: publiczny SELECT tylko `is_visible = true`; admin/editor widzą wszystko.
- Głosowanie publiczne bez uprawnienia UPDATE: funkcja `security definer` `vote_review_request(_id uuid)` inkrementująca `votes` (`GRANT EXECUTE` dla `anon`, `authenticated`) — dzięki temu anon nie może modyfikować innych pól.
- Zgłaszanie: funkcja `security definer` `submit_review_request(_title text)` — normalizuje tytuł, przy istniejącym `normalized_title` dodaje głos, w przeciwnym razie wstawia nowy wiersz z `votes = 1`; zwraca id i informację czy to nowy wpis.
- Podobieństwo liczone po stronie klienta przez istniejące `titleSimilarity`/`normalizeTitle` z `src/lib/titleSimilarity.ts` (progi: >0.85 auto-scal w funkcji SQL po normalizacji, >0.7 podpowiedź w UI).
- Nowy hook `src/hooks/useReviewRequests.ts`: `useReviewRequests` (lista publiczna), `useSubmitReviewRequest`, `useVoteReviewRequest`, `useAdminReviewRequests`, `useUpdateReviewRequest`, `useDeleteReviewRequest` (React Query, wzorzec z `useFeedback`).
- Nowy komponent `src/components/recki/ReviewRequestsWidget.tsx`, wstawiony w `ReckiHome.tsx` pod sekcją hero/listą artykułów; styl zgodny z tokenami Tech (`recki-*`, brak hardkodowanych kolorów).
- Nowa strona `src/pages/admin/ReviewRequestsList.tsx` + trasa w `App.tsx` i wpis w `AdminLayout.tsx` (ikona `Lightbulb`).
- Kliknięcia zgodne z zasadami mobilnymi: `touch-manipulation`, hover tylko dla `@media (hover: hover)`, brak nawigacji na `touchend` z przewijania.
