
## Naprawa wyświetlania kategorii postów na stronie publicznej

### Problem

Post w panelu admina ma ustawioną kategorię "Piłka nożna", ale na stronie publicznej wyświetla się jako "other". 

**Przyczyna:** System używa dwóch pól kategorii:
- `category` - stare pole enum (wartość: "other" - domyślna)
- `category_id` - nowe pole UUID połączone z tabelą `sport_categories` (poprawna wartość: "Piłka nożna")

`PostEditor` zapisuje tylko `category_id`, a stare pole `category` pozostaje z domyślną wartością.

### Plan naprawy

#### 1. Aktualizacja PostEditor - synchronizacja pól

Podczas zapisywania posta, dodać synchronizację pola `category` na podstawie wybranej kategorii z `sport_categories`:

```text
PostEditor.tsx: onSubmit()
+--------------------------------------------------+
| const selectedCategory = sportCategories?.find( |
|   c => c.id === data.category_id                 |
| );                                               |
|                                                  |
| const postData = {                               |
|   ...                                            |
|   category_id: data.category_id,                 |
|   category: selectedCategory?.slug || "other",  |  ← NOWE
|   ...                                            |
| };                                               |
+--------------------------------------------------+
```

#### 2. Aktualizacja getCategoryImage - priorytet dla sport_category

Zaktualizować funkcję `getCategoryImage()` aby akceptowała również dane z `sport_category`:

```text
categoryImages.ts:
+--------------------------------------------------+
| export const getCategoryImage = (                |
|   category: SportCategory,                       |
|   customImageUrl?: string | null,                |
|   sportCategorySlug?: string                     |  ← NOWE
| ): string => {                                   |
|   if (customImageUrl) return customImageUrl;     |
|                                                  |
|   // Priorytet dla dynamicznej kategorii         |
|   const slug = sportCategorySlug || category;    |
|   return categoryDefaultImages[slug] ||          |
|          categoryDefaultImages.other;            |
| };                                               |
+--------------------------------------------------+
```

#### 3. Aktualizacja NewsCard - przekazanie nowego sluga

```text
NewsCard.tsx:
+--------------------------------------------------+
| <img                                             |
|   src={getCategoryImage(                         |
|     category,                                    |
|     imageUrl,                                    |
|     sportCategory?.slug                          |  ← NOWE
|   )}                                             |
| />                                               |
+--------------------------------------------------+
```

#### 4. Aktualizacja NewsOfTheDay - analogiczna zmiana

Ta sama zmiana dla komponentu `NewsOfTheDay`.

#### 5. Jednorazowa migracja istniejących danych

Uruchomić SQL do zsynchronizowania starych postów:

```sql
UPDATE posts p
SET category = sc.slug
FROM sport_categories sc
WHERE p.category_id = sc.id
  AND p.category_id IS NOT NULL;
```

### Zmiany w plikach

| Plik | Zmiana |
|------|--------|
| `src/pages/admin/PostEditor.tsx` | Synchronizacja pola `category` podczas zapisu |
| `src/config/categoryImages.ts` | Rozszerzenie `getCategoryImage()` o parametr `sportCategorySlug` |
| `src/components/NewsCard.tsx` | Przekazanie `sportCategory?.slug` do `getCategoryImage()` |
| `src/components/NewsOfTheDay.tsx` | Analogiczna zmiana jak w NewsCard |
| Migracja SQL | Jednorazowa aktualizacja istniejących postów |

### Efekt po naprawie

- Nowe posty będą miały zsynchronizowane oba pola kategorii
- Istniejące posty zostaną naprawione przez migrację
- Obrazki kategorii będą poprawnie dopasowane do dynamicznych kategorii
- System będzie kompatybilny wstecz ze starym polem `category`
