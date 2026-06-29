# Redesign paska patrona — Inline condensed

## Co się zmienia
Na mobile pasek patrona przestaje „rozwalać" CTA poza pasek. Layout staje się jednolinijkowy, z czytelnym podziałem na strefę informacji (lewa) i strefę akcji (prawa).

## Implementacja — `src/components/PatronBar.tsx`

Przebuduję wewnętrzną zawartość paska na układ `justify-between` zamiast `justify-center`:

**Strefa lewa** (`flex items-center gap-2 overflow-hidden`):
- Gwiazdka (3.5×3.5)
- Prefix `Patron serwisu` — `text-[10px] uppercase opacity-70`, ukryty gdy brak miejsca (`hidden xs:inline`)
- Nazwa patrona — `text-[12px] sm:text-sm font-bold truncate`
- Logo patrona (jeśli jest) — `h-4 sm:h-5`

**Strefa prawa** (`flex items-center gap-2 shrink-0`):
- Pigułka CTA — `text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap active:scale-95`
- Przycisk X (jeśli `dismissible`) — `w-4 h-4 opacity-40 hover:opacity-100`

## Szczegóły techniczne
- Wysokość paska: zostaje `h-10` na mobile, `sm:h-10` na desktopie (bez zmian, by nie ruszać sticky offsetu headera).
- Usuwam wrapper `container` z `justify-center` — był źródłem problemu: środkowanie + truncate + absolutnie pozycjonowany X powodowało nakładanie się.
- Zachowuję cały dotychczasowy behavior: A/B variant, sticky, dismiss do sessionStorage, `onTouchEnd` z `preventDefault`, `cursor-pointer` na całym pasku.
- Kolory CTA pigułki nadal pochodzą z `patron.text_color` / `patron.background_color` (admin może je zmieniać).
- Truncate działa na nazwie patrona — w skrajnym wypadku obetnie się `…`, ale CTA nigdy nie wypadnie.

## Pliki
- `src/components/PatronBar.tsx` — przebudowa JSX (jeden plik, ~30 linii zmian).

Brak zmian w bazie, hookach, innych komponentach.
