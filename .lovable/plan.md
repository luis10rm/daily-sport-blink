## Cel
1. Generator AI w `/admin/recki/*` ma mieć **własny przełącznik trybu** (Recenzja / News) bezpośrednio w panelu AI — wybór dokonywany w momencie generowania, niezależnie od selektora "Typ wpisu" w sekcji Podstawowe.
2. Naprawić layout strony głównej `/tech` (`ReckiHome.tsx`) — przy małej liczbie wpisów pod heroem powstaje duża pusta przestrzeń (zrzut: ciemny prostokąt pod kartą "iOS 27 beta 2").

## Zmiany

### 1. `src/pages/admin/ReviewEditor.tsx` — toggle w generatorze AI
- Dodać lokalny stan `aiMode: "review" | "news"`, inicjowany z `form.content_type ?? "review"`.
- W sekcji "Generator AI" dodać `ToggleGroup` (lub para `Button`/Tabs) z dwiema opcjami: **Recenzja** / **News** — widoczny nad polem "Produkt / Temat".
- Label, placeholder, opis pod przyciskiem i tekst przycisku ("Wygeneruj recenzję" / "Wygeneruj news") czytają z `aiMode`, nie z `form.content_type`.
- Funkcja `generateAI` wysyła do edge function `content_type: aiMode` (zamiast `form.content_type`).
- Po sukcesie: jeśli `aiMode !== form.content_type`, automatycznie ustawić `set("content_type", aiMode)` żeby sekcje formularza (Marka/Produkt/Ocena/Plusy/Minusy) zgadzały się z wygenerowaną treścią.
- Usunąć z opisu zdanie "Najpierw wybierz typ wpisu poniżej..." — nie jest już prawdziwe.
- Selektor "Typ wpisu" w sekcji Podstawowe zostaje (dla ręcznej edycji wpisów bez AI).

### 2. `src/pages/ReckiHome.tsx` — layout strony głównej
Obecnie sekcja hero używa `grid grid-cols-1 lg:grid-cols-2` z heroem po lewej i kolumną 3 kart po prawej. Gdy karty po prawej są wyższe niż hero, pod heroem powstaje puste tło — dokładnie to widać na zrzucie.

Poprawki:
- Dodać `items-stretch` do sekcji `grid` oraz `h-full` do hero `ReviewCard` (warianty hero powinny rozciągać się na pełną wysokość rzędu).
- Sprawdzić `ReviewCard` (wariant `hero`) i upewnić się, że root karty ma `h-full flex flex-col` oraz że obrazek nie wymusza stałego `aspect-ratio` blokującego rozciąganie. Jeśli ma `aspect-[16/10]`, zmienić na `flex-1 min-h-[280px]` w wariancie hero.
- Fallback dla małej liczby wpisów: gdy `reviews.length <= 4` (czyli `rest` jest puste), całą siatkę spłaszczyć — renderować jednorzędowy `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4` bez wyróżnionego hero, żeby uniknąć asymetrii.
  - Logika: jeśli `reviews.length < 4` → render prostej siatki kart (bez wariantu `hero`). Jeśli `>= 4` → obecny układ hero + secondary + rest.

## Co zostaje bez zmian
- Edge function `generate-review` (już przyjmuje `content_type` w body).
- Schemat tabeli `reviews`, hooki, reszta UI Tech.
- Selektor typu w sekcji "Podstawowe" zostaje jako manualny override.
