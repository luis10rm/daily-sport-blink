# Tech: kategoria „Podróże” + plakietka „Na życzenie użytkowników”

## 1. Nowa kategoria Tech: Podróże

Dodaję do listy kategorii Tech nową pozycję:
- Nazwa: `Podróże`, slug: `podroze`
- Opis: recenzje hoteli, miejsc i destynacji, w których byliśmy
- Kolor spójny z paletą Tech, pozycja na końcu listy (edytowalna drag & drop w panelu)

Kategoria od razu działa wszędzie tam, gdzie działają obecne kategorie Tech: filtr na `/tech`, strona `/tech/kategoria/podroze`, wybór w edytorze, sitemapa. Ikonę można wygenerować/podmienić w panelu kategorii.

## 2. Graficzne wyróżnienie „Recenzja na Wasze życzenie”

Nowa plakietka pokazywana przy artykułach powstałych z głosów w ankiecie (widget „Jakiej recenzji szukasz?”).

Gdzie widoczna:
- Nagłówek artykułu `/tech/...` — wyróżniona plakietka obok kategorii (ikona głosu/serca, akcent emerald + delikatny gradient), z tooltipem wyjaśniającym, że temat wybrali czytelnicy
- Kafelki artykułów na `/tech` i w kategoriach — mniejsza wersja plakietki w narożniku miniatury
- Pod werdyktem w artykule — krótki pasek informacyjny: „Ten temat wybraliście w naszej ankiecie” z linkiem do widgetu ankiety na `/tech`

Jak się włącza:
- W edytorze Tech (Krok 3, obok „Skąd pochodzi treść?”) przełącznik „Recenzja na życzenie użytkowników”
- Opcjonalnie: wybór konkretnego zgłoszenia z listy ankiety (żeby móc pokazać liczbę głosów, np. „wybrane przez 42 osoby”); jeśli nie wybrane, plakietka pokazuje się bez liczby
- W panelu „Zgłoszenia recenzji” widać, które zgłoszenia zostały już zrealizowane

## Szczegóły techniczne

- Migracja: `INSERT` kategorii `podroze` do `review_categories` (z bezpiecznym `on conflict do nothing`).
- Migracja: dwa pola w `public.reviews` — `is_community_requested boolean not null default false` oraz `review_request_id uuid null references public.review_requests(id) on delete set null`; indeks po `review_request_id`. GRANT-y i RLS bez zmian (dziedziczą istniejącą politykę tabeli `reviews`).
- Regeneracja `src/integrations/supabase/types.ts`.
- Nowy komponent `src/components/recki/CommunityRequestBadge.tsx` (wzorowany na `ReviewBasisBadge.tsx`, rozmiary `sm`/`md`, tokeny semantyczne — bez hardkodowanych kolorów tam, gdzie to możliwe).
- `src/pages/ReckiReview.tsx`: plakietka w nagłówku + pasek pod werdyktem; `src/components/recki/ReviewCard.tsx`: wersja `sm` na miniaturze.
- `src/hooks/useReviews.tsx`: nowe pola w interfejsie `Review` i w `SELECT` (join na `review_requests(id, title, votes)`).
- `src/pages/admin/ReviewEditor.tsx`: switch + select zgłoszenia (dane z istniejącego hooka `useReviewRequests`).
- `src/pages/admin/ReviewRequestsList.tsx`: znacznik „zrealizowane” dla zgłoszeń powiązanych z opublikowaną recenzją.
