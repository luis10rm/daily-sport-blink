

## Automatyczne przypisywanie autora do postów

### Problem

Podczas tworzenia nowego posta pole `created_by` nie jest ustawiane, co powoduje że artykuły nie są przypisane do żadnego autora. W efekcie:
- Statystyki autorów pokazują 0 artykułów
- Na kartach newsów nie wyświetla się informacja o autorze

---

### Rozwiązanie

Automatyczne ustawienie `created_by` na ID aktualnie zalogowanego użytkownika podczas tworzenia nowego posta.

---

### Plan wdrożenia

| Krok | Plik | Opis |
|------|------|------|
| 1 | `src/pages/admin/PostEditor.tsx` | Import hooka `useAuth` |
| 2 | `src/pages/admin/PostEditor.tsx` | Pobranie `user` z kontekstu autoryzacji |
| 3 | `src/pages/admin/PostEditor.tsx` | Dodanie `created_by: user.id` do danych nowego posta |

---

### Szczegóły techniczne

#### Modyfikacja PostEditor.tsx

```tsx
// Import na górze pliku
import { useAuth } from "@/hooks/useAuth";

// W komponencie PostEditor
const PostEditor = () => {
  const { user } = useAuth(); // Pobranie zalogowanego użytkownika
  // ... reszta kodu

  const onSubmit = async (data: PostFormData) => {
    const postData = {
      // ... istniejące pola
      created_by: user?.id, // Automatyczne przypisanie autora
    };

    if (isEditing && id) {
      // Przy edycji NIE zmieniamy created_by (zachowujemy oryginalnego autora)
      await updatePost.mutateAsync({ id, ...postData });
    } else {
      await createPost.mutateAsync(postData);
    }
  };
};
```

---

### Logika biznesowa

| Scenariusz | Zachowanie |
|------------|-----------|
| Nowy post | `created_by` = ID zalogowanego użytkownika |
| Edycja posta | `created_by` pozostaje bez zmian (oryginalny autor) |
| Brak zalogowanego użytkownika | Post nie zostanie utworzony (admin panel wymaga logowania) |

---

### Efekt końcowy

Po wdrożeniu:
- Każdy nowy post będzie automatycznie przypisany do osoby, która go tworzy
- Statystyki autorów (`useAuthorStats`) będą poprawnie zliczać artykuły
- Na kartach newsów (`NewsCard`) pojawi się mini-karta autora
- Istniejące posty (z `created_by = NULL`) pozostaną bez zmian

