

# Przycisk Facebook widoczny na mobile

## Problem
Karta "Publikuj na Facebook" jest w panelu bocznym (prawa kolumna). Na mobile caly layout zamienia sie w jedna kolumne i karta Facebook laduje na samym dole strony -- trzeba dlugo scrollowac, zeby ja znalezc.

## Rozwiazanie
Dodamy przycisk "Wyslij na Facebook" rowniez w gornej czesci formularza (widoczny na mobile), tak zeby byl latwo dostepny bez scrollowania.

## Zmiany

### `src/pages/admin/PostEditor.tsx`

1. **Dodanie mobilnego przycisku FB** nad formularzem (obok przycisku "Zapisz" lub w sekcji "Generuj AI"), widocznego tylko na mobile (`lg:hidden`):
   - Dla istniejacych postow: przycisk "Wyslij na Facebook" otwierajacy dialog
   - Dla nowych postow: switch "Opublikuj przy zapisie"

2. Karta Facebook w sidebarze pozostanie bez zmian (widoczna na desktop).

Dzieki temu na mobile przycisk bedzie widoczny od razu po otwarciu edytora posta, a na desktop nic sie nie zmieni.

### Szczegoly implementacji
- Nowy blok z klasa `lg:hidden` umieszczony tuz pod sekcja "Generuj AI" (linia ~483)
- Zawiera ten sam przycisk i logike co karta w sidebarze
- Karta w sidebarze dostanie klase `hidden lg:block` aby uniknac duplikacji na desktop
