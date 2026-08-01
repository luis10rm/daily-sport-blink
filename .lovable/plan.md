## Cel

Redaktor Tech może dodać do artykułu listę pytań i odpowiedzi (FAQ). FAQ wyświetla się jako wyróżniona sekcja pod treścią artykułu i jest zoptymalizowane pod SEO (FAQPage JSON-LD).

## Baza danych

Migracja: dodanie kolumny `faq jsonb not null default '[]'` do `public.reviews`.
Format: `[{ "q": "pytanie", "a": "odpowiedź" }]`. Bez zmian w RLS/grantach (kolumna w istniejącej tabeli).

## Admin (`/admin/recki` → edytor)

W `src/pages/admin/ReviewEditor.tsx` nowa karta "FAQ (pytania i odpowiedzi)" pod sekcją Plusy/Minusy:
- lista pozycji, każda z polem pytania (input) i odpowiedzi (textarea),
- przyciski "Dodaj pytanie", usuwanie i zmiana kolejności (góra/dół),
- puste pary są odfiltrowywane przy zapisie,
- limit sugerowany 8 pozycji (miękki, z licznikiem).

`src/hooks/useReviews.tsx`: dodanie `faq` do typu `Review` oraz do zapisu/aktualizacji.

## Layout artykułu (`/tech/:kategoria/:slug`)

Nowy komponent `src/components/recki/ReviewFaq.tsx`, wstawiony w `ReckiReview.tsx` pod treścią i galerią (przed banerem inline / źródłem):
- wyróżniony blok w stylistyce Tech (fuchsia): nagłówek `<h2>` "Najczęstsze pytania" z ikoną,
- pozycje jako accordion (shadcn `Accordion`), pierwsze pytanie otwarte, semantyczny markup,
- pytania widoczne w DOM od razu (odpowiedzi w accordionie renderowane, nie usuwane) — dla crawlerów,
- sekcja renderuje się tylko gdy FAQ ma min. 1 pełną parę.

## SEO

W `ReckiReview.tsx` dodanie `FAQPage` JSON-LD (`@context`, `mainEntity` z `Question`/`Answer`) obok istniejących meta, tylko gdy FAQ istnieje.

## Szczegóły techniczne

- Odpowiedzi traktowane jako tekst (escapowany), bez HTML — brak nowego wektora XSS.
- Zakres: migracja + `useReviews.tsx`, `ReviewEditor.tsx`, `ReckiReview.tsx`, nowy `ReviewFaq.tsx`. Bez zmian w kanale sportowym i pozytywnym.
- Weryfikacja: zapis FAQ w edytorze, render sekcji na stronie artykułu i obecność JSON-LD (Playwright + tsc).
