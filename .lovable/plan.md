
## Szybkie tworzenie kategorii z poziomu PostEditor

### Cel
Dodanie przycisku "+" obok selecta kategorii, który otwiera uproszczony modal do szybkiego tworzenia nowej kategorii bez opuszczania edytora posta.

### Komponenty do utworzenia

#### 1. QuickCategoryDialog - nowy komponent
Uproszczony dialog do szybkiego tworzenia kategorii zawierający:
- Pole "Nazwa kategorii" (generuje automatycznie slug)
- Wybór ikony z predefiniowanej listy (6-8 najpopularniejszych)
- Pole koloru tła (z domyślną wartością)
- Przyciski "Anuluj" i "Utwórz"

```text
src/components/admin/QuickCategoryDialog.tsx
+----------------------------------------------------+
|  Dialog                                            |
|  ├── DialogTrigger (przycisk "+")                  |
|  └── DialogContent                                 |
|      ├── DialogHeader: "Szybkie tworzenie..."      |
|      ├── Input: Nazwa kategorii                    |
|      ├── Grid: 6-8 ikon do wyboru                  |
|      ├── Input: Kolor tła (HSL)                    |
|      └── DialogFooter: Anuluj | Utwórz             |
+----------------------------------------------------+
```

### Zmiany w PostEditor

Modyfikacja sekcji kategorii - dodanie przycisku "+" obok SelectTrigger:

```text
Przed:
┌─────────────────────────────────────┐
│ Kategoria                           │
│ ┌─────────────────────────────────┐ │
│ │ Wybierz kategorię           ▼  │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘

Po:
┌─────────────────────────────────────┐
│ Kategoria                           │
│ ┌─────────────────────────────┐┌──┐ │
│ │ Wybierz kategorię        ▼  ││+ │ │
│ └─────────────────────────────┘└──┘ │
└─────────────────────────────────────┘
```

### Przepływ użytkownika

1. Użytkownik tworzy post i potrzebuje nowej kategorii
2. Klika "+" obok selecta kategorii
3. W modalu wpisuje nazwę (np. "Siatkówka")
4. Slug generuje się automatycznie: "siatkowka"
5. Wybiera ikonę z listy (opcjonalnie)
6. Klika "Utwórz"
7. Kategoria zostaje utworzona i automatycznie wybrana w formularzu posta
8. Użytkownik kontynuuje tworzenie posta

### Zmiany w plikach

| Plik | Zmiana |
|------|--------|
| `src/components/admin/QuickCategoryDialog.tsx` | **NOWY** - Komponent dialogu |
| `src/pages/admin/PostEditor.tsx` | Import QuickCategoryDialog, dodanie przycisku "+" i obsługa callback |

### Szczegóły techniczne

**QuickCategoryDialog** będzie:
- Używać istniejącego hooka `useCreateSportCategory` do tworzenia
- Przyjmować prop `onCategoryCreated(categoryId: string)` do callbacku
- Automatycznie zamykać się po utworzeniu
- Invalidować query `sport-categories` (już obsługiwane przez hook)

**PostEditor** otrzyma:
- Callback `handleCategoryCreated` który ustawi `category_id` w formularzu
- Layout flex dla sekcji kategorii (Select + przycisk "+")
