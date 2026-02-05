
# Naprawa Drag & Drop kategorii

## Problem
Niezgodność wersji bibliotek `@dnd-kit`:
- `@dnd-kit/sortable`: `^10.0.0` (nowa architektura)
- `@dnd-kit/core`: `^6.3.1` (stara architektura)

Wersja 10.x `@dnd-kit/sortable` wymaga nowego pakietu `@dnd-kit/react` i ma całkowicie inne API. Obecny kod używa starego API, które nie działa z wersją 10.x.

## Rozwiązanie (rekomendowane)

**Downgrade `@dnd-kit/sortable` do wersji 9.x** - kompatybilnej z `@dnd-kit/core` 6.x.

To najprostsza opcja, ponieważ kod jest już napisany pod stare API.

## Zmiany

### 1. Aktualizacja `package.json`

Zmiana wersji:
```json
"@dnd-kit/sortable": "^9.0.0"
```

zamiast:
```json
"@dnd-kit/sortable": "^10.0.0"
```

### 2. Bez zmian w kodzie

Obecny kod w `CategoriesList.tsx` jest poprawny dla wersji 9.x:
- `DndContext`, `useSortable`, `SortableContext` - wszystko zgodne
- `CSS.Transform.toString()` - działa
- `verticalListSortingStrategy` - działa

## Efekt

Po zmianie wersji drag & drop będzie działać prawidłowo - przeciąganie wierszy w tabeli kategorii będzie możliwe.

## Alternatywa (większy nakład pracy)

Migracja do nowego API `@dnd-kit/react` + `@dnd-kit/helpers`:
- Wymiana wszystkich importów
- Przepisanie komponentów na nowe hooki
- Znacznie więcej zmian w kodzie

Nie rekomenduję tej opcji, chyba że potrzebujesz konkretnych funkcji z wersji 10.x.
