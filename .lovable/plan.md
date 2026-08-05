# Optymalizacja panelu admina Tech

## 1. Jeden wybór typu wpisu (zamiast dwóch)

Dziś typ wybiera się dwa razy: raz jako „Tryb generowania" w karcie Generator AI (`aiMode`), drugi raz jako „Typ wpisu" w karcie Podstawowe (`content_type`). Da się je rozjechać — AI generuje news, a wpis zostaje recenzją.

Nowa kolejność w edytorze (`/admin/recki/new`):

```text
KROK 1  Typ wpisu:  [ Recenzja ]  [ News ]  [ Porównanie ]     <- jedyne miejsce wyboru
KROK 2  Generator AI (etykiety, pola i prompt zależne od typu)
KROK 3  Podstawowe / Treść / Media (sekcje zależne od typu)
```

- Typ wpisu przenosimy na samą górę jako karta „Krok 1" z trzema kafelkami (jak istniejący wybór „Skąd pochodzi treść?").
- Usuwamy przełącznik trybu z karty AI i selecta z karty Podstawowe — jedno źródło prawdy: `form.content_type`.
- Nagłówek strony i przycisk generowania dopasowują się do typu („Nowa recenzja" / „Nowy news" / „Nowe porównanie").
- Zmiana typu na już istniejącym wpisie: potwierdzenie, że część pól (ocena, plusy/minusy) zostanie ukryta.

## 2. Trzeci typ: Porównania (rankingi)

- Nowy typ `comparison` obok `review` i `news`.
- Pola: bez oceny 0–10 i bez plusów/minusów w formie recenzenckiej; zostaje tytuł, excerpt, treść HTML, galeria, kategoria, FAQ (już istnieje) oraz opcjonalny werdykt jako „Szybki werdykt".
- Lista wpisów Tech: plakietka „Porównanie" + szybkie filtry po typie (Wszystkie / Recenzje / Newsy / Porównania) — przy rosnącej liczbie wpisów to największa oszczędność czasu.
- Generator AI dla porównania: pole „Temat rankingu" + URL źródła, generacja na podstawie nowego promptu z ustawień.

## 3. Edytor promptu w Ustawieniach

- W Ustawieniach jest już sekcja promptów Tech (`tech_review_prompt`, `tech_news_prompt`). Dodajemy trzeci: `tech_comparison_prompt` z tym samym UI (textarea + Zapisz + Przywróć domyślny).
- Domyślną wartością jest przysłany prompt redaktorski (rola, zasady pro-klienckie, wymagania SEO, struktura sekcji `<h2>`/`<h3>`, FAQ, zakaz Markdown i JSON w treści).

Uwaga techniczna: pipeline generatora odbiera odpowiedź jako JSON i mapuje ją na pola CMS, więc prompt zachowuje całą część redakcyjną i SEO, natomiast „szablon odpowiedzi" (`=== TYTUŁ SEO ===` itd.) zamieniamy na te same pola w JSON: `title`, `excerpt`, `content` (czysty HTML), `verdict`, `faq`, `internal_links`, `source_notes`. Zakaz Markdown w treści zostaje. Efekt dla redakcji identyczny — pola wypełniają się od razu w formularzu, bez kopiowania z bloków tekstu.

## Zakres techniczny

- Migracja: rozszerzenie `reviews_content_type_check` o `'comparison'`; wstawienie `tech_comparison_prompt` do `settings`.
- `src/hooks/useReviews.tsx`: `content_type: "review" | "news" | "comparison"`.
- `src/pages/admin/ReviewEditor.tsx`: usunięcie stanu `aiMode`, karta wyboru typu na górze, warunkowe sekcje per typ, payload AI z `content_type` z formularza.
- `src/pages/admin/ReviewsList.tsx`: plakietka i filtry po typie.
- `src/pages/admin/Settings.tsx`: karta promptu porównań.
- `supabase/functions/generate-review/index.ts`: obsługa `content_type === "comparison"`, `DEFAULT_COMPARISON_SYSTEM_PROMPT`, ładowanie `tech_comparison_prompt`, parsowanie `verdict`/`faq`/`internal_links`.
- Frontend publiczny: strony Tech nie rozgałęziają się dziś po `content_type`, więc porównania renderują się jak artykuł — bez ryzyka regresji. FAQ i schema `FAQPage` działają bez zmian.
