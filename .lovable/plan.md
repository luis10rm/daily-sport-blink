

## Naprawa białej strony na `/admin/wallpapers` i `/admin/wallpapers/new`

### Zidentyfikowany problem

W pliku `src/pages/admin/WallpaperEditor.tsx` (linie 239-255) znajduje się komponent `Select` z elementem:

```tsx
<SelectItem value="">Brak</SelectItem>
```

**Problem:** Radix UI Select nie pozwala na puste wartości (`value=""`). To powoduje cichy błąd renderowania, przez co cały komponent nie renderuje się poprawnie - stąd biała strona.

### Rozwiązanie

Zmienić pustą wartość na specjalny identyfikator, np. `"none"` lub `"__none__"`, a następnie odpowiednio obsłużyć tę wartość przy zapisie formularza.

### Zmiany w pliku `src/pages/admin/WallpaperEditor.tsx`

**1. Zmiana wartości SelectItem (linia 247):**

```tsx
// Przed:
<SelectItem value="">Brak</SelectItem>

// Po:
<SelectItem value="__none__">Brak</SelectItem>
```

**2. Zmiana obsługi zmiany wartości (linia 241):**

```tsx
// Przed:
onValueChange={(val) => setFormData({ ...formData, linked_banner_id: val })}

// Po:
onValueChange={(val) => setFormData({ 
  ...formData, 
  linked_banner_id: val === "__none__" ? "" : val 
})}
```

**3. Zmiana wartości w Select (linia 240):**

```tsx
// Przed:
value={formData.linked_banner_id}

// Po:
value={formData.linked_banner_id || "__none__"}
```

### Weryfikacja

Po naprawie:
1. Strona `/admin/wallpapers` powinna wyświetlać listę kampanii (lub pustą tabelę)
2. Strona `/admin/wallpapers/new` powinna wyświetlać formularz tworzenia nowego wallpapera
3. Dropdown "Powiązany baner" powinien działać poprawnie z opcją "Brak"

### Dodatkowe sprawdzenie

Warto również upewnić się, że użytkownik posiada rolę `admin` (nie tylko `editor`), ponieważ routing wymaga `requireAdmin={true}`. Jeśli nie jesteś adminem, zostaniesz przekierowany do `/admin`.

