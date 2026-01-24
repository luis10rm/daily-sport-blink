

## Naprawa wyświetlania obrazka OG w panelu admina

### Problem

Podczas używania funkcji "Generuj AI":
1. Edge function poprawnie pobiera obrazek OG ze strony źródłowej
2. `PostEditor` poprawnie ustawia `image_url` w formularzu
3. **Ale** komponent `ImageSourceSection` nie reaguje na tę zmianę - przełącznik "Użyj własnej grafiki" pozostaje wyłączony
4. W rezultacie wyświetla się domyślna grafika kategorii zamiast pobranego obrazka

### Przyczyna techniczna

W pliku `src/components/admin/ImageSourceSection.tsx`:

```tsx
const [useCustomImage, setUseCustomImage] = useState(!!currentImageUrl);
```

Stan `useCustomImage` jest inicjalizowany **tylko raz** przy pierwszym renderowaniu. Gdy AI ustawia `image_url` przez `form.setValue()`, wartość w formularzu się zmienia, ale stan lokalny `useCustomImage` pozostaje `false`.

### Rozwiązanie

Dodać `useEffect` który synchronizuje stan `useCustomImage` z wartością `image_url` z formularza:

```text
src/components/admin/ImageSourceSection.tsx
+----------------------------------------------------+
|  useEffect(() => {                                 |
|    if (currentImageUrl && !useCustomImage) {       |
|      setUseCustomImage(true);                      |
|      // Automatycznie przełącz na zakładkę URL     |
|      if (currentImageUrl.startsWith("http")) {     |
|        setActiveTab("url");                        |
|      }                                             |
|    }                                               |
|  }, [currentImageUrl]);                            |
+----------------------------------------------------+
```

### Dodatkowe usprawnienie

Gdy AI wklei URL obrazka, automatycznie przełączyć na zakładkę "URL" aby użytkownik od razu widział podgląd pobranego obrazka OG.

### Zmiany w plikach

| Plik | Zmiana |
|------|--------|
| `src/components/admin/ImageSourceSection.tsx` | Dodanie `useEffect` synchronizującego `useCustomImage` z `image_url` + automatyczne przełączanie na zakładkę URL |

### Efekt po naprawie

1. Użytkownik wkleja URL źródła i klika "Generuj AI"
2. AI pobiera dane artykułu i obrazek OG
3. Przełącznik "Użyj własnej grafiki" **automatycznie się włącza**
4. Zakładka przełącza się na "URL"
5. Użytkownik widzi podgląd pobranego obrazka OG w sekcji obrazka

