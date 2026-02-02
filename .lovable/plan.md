
# Implementacja Drag & Drop dla kategorii sportowych

## Problem
W panelu admina (`/admin/categories`) wyświetlana jest ikona "grip" sugerująca możliwość przeciągania, ale:
- Brak biblioteki do obsługi drag and drop
- Brak event handlerów do obsługi przeciągania
- Brak funkcji do aktualizacji kolejności w bazie danych

## Rozwiązanie

### Etap 1: Instalacja biblioteki
Dodam bibliotekę `@dnd-kit/core` i `@dnd-kit/sortable` - lekką, nowoczesną bibliotekę DnD zoptymalizowaną pod React:

```text
@dnd-kit/core - główna logika DnD
@dnd-kit/sortable - sortowanie list
@dnd-kit/utilities - helpery CSS
```

### Etap 2: Hook do aktualizacji kolejności
Dodam nową funkcję `useReorderSportCategories` w `useSportCategories.tsx`:
- Przyjmuje nową kolejność kategorii
- Aktualizuje `sort_order` dla każdej zmienionej kategorii
- Używa optymistycznych aktualizacji (instant feedback)

### Etap 3: Implementacja DnD w CategoriesList.tsx
- Owinięcie tabeli w `DndContext` i `SortableContext`
- Zamiana `TableRow` na komponent `SortableRow` z obsługą przeciągania
- Dodanie sensorów (pointer + keyboard dla dostępności)
- Handler `onDragEnd` aktualizujący kolejność

### Etap 4: Wizualny feedback
- Podświetlenie przeciąganego elementu
- Animacja "placeholder" w miejscu docelowym
- Zmiana kursora podczas przeciągania

---

## Zmiany w plikach

| Plik | Zmiana |
|------|--------|
| `package.json` | Dodanie `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` |
| `src/hooks/useSportCategories.tsx` | Nowa funkcja `useReorderSportCategories` |
| `src/pages/admin/CategoriesList.tsx` | Implementacja DnD z DndContext, SortableContext, SortableRow |

---

## Szczegóły techniczne

### Nowy hook: useReorderSportCategories
```text
mutationFn:
  1. Przyjmuje tablicę ID kategorii w nowej kolejności
  2. Mapuje każde ID na {id, sort_order: index}
  3. Wykonuje batch update w bazie
  4. Invaliduje query cache

Optymistyczne update:
  - Natychmiast aktualizuje lokalny stan
  - W razie błędu przywraca poprzednią kolejność
```

### Struktura komponentu SortableRow
```text
- useSortable(id) - hook z @dnd-kit/sortable
- attributes, listeners - do obsługi GripVertical
- transform, transition - dla animacji
- isDragging - do stylowania aktywnego elementu
```

### Sensory DnD
```text
- PointerSensor - obsługa myszy/dotyku
- KeyboardSensor - obsługa klawiatury (Tab + Space/Enter)
- activationConstraint: { distance: 5 } - zapobiega przypadkowemu przeciąganiu
```
