## Cel
Generator AI w `/admin/recki/*` ma działać dwutrybowo: inaczej dla **Recenzji** (z oceną, plusami/minusami, werdyktem, marką/produktem), inaczej dla **Newsa technologicznego** (czysty artykuł bez oceny).

## Zmiany

### 1. Edge function `supabase/functions/generate-review/index.ts`
- Dodać przyjmowanie pola `content_type: "review" | "news"` w body.
- Rozdzielić system prompt na dwa warianty:
  - **REVIEW_SYSTEM_PROMPT** (obecny prompt — produkt, ocena 1–10, plusy/minusy, werdykt, sekcje: Wprowadzenie/Wykonanie/Wydajność/Codzienne użytkowanie/Cena).
  - **NEWS_SYSTEM_PROMPT** (nowy): krótszy JSON: `title`, `excerpt`, `content` (HTML 400–800 słów, sekcje: Co się stało / Kontekst / Dlaczego to ważne / Co dalej), bez pól `score`, `pros`, `cons`, `verdict`, `product_brand`, `product_name`. Styl: technologiczny news, neutralny, faktyczny, bez marketingu.
- W obu trybach nadal scrapować `source_url` przez Firecrawl i zwracać `gallery_suggestions`.
- Walidacja: dla `news` ignorować/zerować pola recenzyjne, dla `review` — bez zmian.

### 2. `src/pages/admin/ReviewEditor.tsx`
- W panelu Generatora AI:
  - Zmienić nagłówek dynamicznie: "Wygeneruj recenzję" / "Wygeneruj news" zależnie od `form.content_type`.
  - Zmienić placeholder pola pierwszego: dla `news` → "Temat newsa (np. Apple ogłasza iOS 19 z nowym AI)", label "Temat" zamiast "Produkt".
  - Zmienić opis pod przyciskiem zależnie od trybu.
- W wywołaniu `supabase.functions.invoke("generate-review", ...)`:
  - przekazać `content_type: form.content_type ?? "review"`.
  - klucz body przemianować na neutralne (np. `topic`) lub wysyłać oba (`product`, `topic`) — backend obsłuży.
- W `setForm` po odpowiedzi:
  - dla `news` nie nadpisywać `score/pros/cons/verdict/product_*` (zostawić puste).

### 3. UX
- Przełącznik typu wpisu (Recenzja/News) jest już w sekcji „Podstawowe". Generator AI czyta z `form.content_type`, więc kolejność: najpierw wybierz typ → potem generuj.
- Toast informacyjny: "Wygenerowano recenzję AI" / "Wygenerowano news AI".

## Co zostaje bez zmian
- Pobieranie obrazków z Firecrawl (działa identycznie w obu trybach).
- Logika scalania galerii i okładki.
- Schemat tabeli `reviews` (pole `content_type` już istnieje).
