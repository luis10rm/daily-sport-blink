## Cel

Dodać w sekcji TECH oznaczenie, czy recenzja powstała na podstawie **researchu** (kompilacja źródeł) czy **własnych testów** (hands-on redakcji). Pole edytowalne w CMS + widoczna plakietka na stronie artykułu.

## Zakres zmian

### 1. Baza (`reviews`)
- Nowa kolumna `review_basis text` z CHECK (`research` | `hands_on`), `NULL` dozwolony (pokazujemy badge tylko gdy ustawione, dla starych artykułów).
- Domyślnie `research` dla nowych AI-generated, `hands_on` ustawiane ręcznie przez redakcję.
- Dotyczy tylko `content_type = 'review'` — dla newsów ignorowane.

### 2. CMS — `src/pages/admin/ReviewEditor.tsx`
- Widoczne tylko gdy `content_type === 'review'`.
- RadioGroup z 2 opcjami:
  - **Research** (ikona 📚 / `BookOpen`) — "Na podstawie publicznie dostępnych źródeł i specyfikacji"
  - **Własne testy** (ikona 🔬 / `FlaskConical`) — "Produkt testowany przez redakcję"
- Przy generowaniu AI domyślnie zaznacza się `research` (bo AI nie ma w ręku produktu).

### 3. Frontend — plakietka

**`src/components/recki/ReviewBasisBadge.tsx`** (nowy):
- `research`: szary outline badge, ikona BookOpen, tekst "Na podstawie researchu"
- `hands_on`: pełny magenta/zielony badge, ikona FlaskConical, tekst "Test redakcji"
- Tooltip z dłuższym wyjaśnieniem przy hover.

**`src/pages/ReckiReview.tsx`**:
- Plakietka pod tytułem, obok meta (autor / data / kategoria) — w jednej linii nad coverem lub pod nim.
- Druga, dyskretna instancja przy końcu artykułu nad werdyktem (kontekst dla czytelnika scrollującego do oceny).

**`src/components/recki/ReviewCard.tsx`** (opcjonalnie):
- Mini-ikona (sam ikon bez tekstu) na karcie hero w prawym dolnym rogu obrazu — żeby już z listingu było widać status. Pomijamy w wariantach `default`/`compact` żeby nie zaśmiecać.

### 4. Typy
- Po migracji wygenerują się typy Supabase. `useReviews` hook nie wymaga zmian (zwraca cały rekord).

## Nie zmieniamy

- Edge function `generate-review` — pole ustawia człowiek w CMS po wygenerowaniu szkicu (domyślnie `research`, łatwo zmienić).
- Tabela posts / sekcja Sport — to wyłącznie dla TECH.
- RLS / GRANTy — nowa kolumna dziedziczy istniejące polityki tabeli.

## Pliki

- migracja: `ALTER TABLE reviews ADD COLUMN review_basis text CHECK (review_basis IN ('research','hands_on'))`
- `src/pages/admin/ReviewEditor.tsx` — sekcja "Podstawa recenzji" w formularzu
- `src/components/recki/ReviewBasisBadge.tsx` — nowy komponent
- `src/pages/ReckiReview.tsx` — render plakietki (2 miejsca)
- `src/components/recki/ReviewCard.tsx` — mini-ikona w wariancie `hero` (opcjonalne, do potwierdzenia)
