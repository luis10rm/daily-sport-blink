## Problem

Pole „Podstawa recenzji" (research vs test redakcji) **istnieje** w `src/pages/admin/ReviewEditor.tsx` (linie 386–422), ale jest niewidoczne w dwóch sytuacjach:

1. Renderuje się tylko gdy `content_type === "review"` — dla typu „news" jest ukryte.
2. Nawet w trybie recenzji znajduje się głęboko w formularzu (po tytule, excerpt, product, brand, kategorii, werdykcie, ocenie) — łatwo je przegapić scrollując.

## Plan naprawy

W `src/pages/admin/ReviewEditor.tsx`:

1. **Przenieść blok „Podstawa recenzji"** wyżej — bezpośrednio pod wyborem `content_type` (Recenzja / News), aby było jednym z pierwszych pól decyzyjnych.
2. **Pokazać pole także dla typu „news"** — przyda się oznaczenie czy news bazuje na researchu czy własnym kontakcie z produktem. (Jeśli wolisz pozostawić tylko dla recenzji — powiedz, zostawię warunek.)
3. **Wzmocnić wizualnie**: dodać wyraźny nagłówek sekcji „Skąd pochodzi treść?" + krótki opis pomocniczy, lekkie tło `bg-muted/30` aby blok się wyróżniał.
4. **Wartość domyślna**: pozostawić `null` (czyli „brak plakietki") — bez automatycznego zaznaczania.

Brak zmian w bazie, hookach ani na froncie publicznym — `ReviewBasisBadge` już działa.

## Pytanie

Czy pole ma być widoczne **też dla typu „news"**, czy tylko dla recenzji (jak dziś, ale przeniesione wyżej)?