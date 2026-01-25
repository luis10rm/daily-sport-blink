
# Plan naprawy błędu "Autor nie znaleziony"

## Zdiagnozowany problem

Błąd wynika z wyścigów warunków w `AuthorEditor.tsx`. Gdy użytkownik przechodzi do `/admin/authors/new`:

1. `id` z `useParams()` = `"new"` (string)
2. `isCreating` = `id === "new"` = `true`
3. `useAuthorById("")` jest wywoływane z pustym stringiem
4. Query jest **wyłączone** (`enabled: false`), więc `isLoading = false` natychmiast
5. `author = undefined` (brak danych)
6. Warunek `!isCreating && !isLoading && !author` powinien być `false`...

**ALE** - sprawdzając hook `useAuthorById`, widzę że przy `enabled: false` React Query zwraca `isLoading: false` od razu. To oznacza, że warunek `!isCreating && !isLoading && !author` = `!true && !false && !undefined` = `false && true && true` = `false` - więc ten warunek **powinien działać**.

## Prawdopodobna przyczyna

Problem może być w **kolejności renderowania**. Podczas pierwszego renderowania:
- `id` może być jeszcze `undefined` zanim router zainicjalizuje parametry
- W tym momencie `isCreating = false`, `isLoading = false`, `author = undefined`
- Warunek `!false && !false && !undefined` = `true` - wyświetla "Autor nie znaleziony"

## Rozwiązanie

Zmiana logiki w `AuthorEditor.tsx`:

```typescript
// Linie 46-50 - poprawiona inicjalizacja
const { id } = useParams<{ id: string }>();
const navigate = useNavigate();
const isCreating = !id || id === "new";  // Dodane !id dla edge case
```

Oraz zmiana warunku wyświetlania błędu (linie 134-145):

```typescript
// Stary warunek:
if (!isCreating && !isLoading && !author) {

// Nowy, bezpieczniejszy warunek:
if (id && id !== "new" && !isLoading && !author) {
```

## Pliki do modyfikacji

| Plik | Zmiana |
|------|--------|
| `src/pages/admin/AuthorEditor.tsx` | Poprawka warunku `isCreating` i warunku "nie znaleziono" |

## Sekcja techniczna

### Zmiana 1: Lepsza definicja `isCreating`

```typescript
// Było:
const isCreating = id === "new";

// Będzie:
const isCreating = !id || id === "new";
```

### Zmiana 2: Bezpieczniejszy warunek błędu

```typescript
// Było (linia 134):
if (!isCreating && !isLoading && !author) {

// Będzie:
if (id && id !== "new" && !isLoading && !author) {
```

### Alternatywna zmiana 2b (jeśli pierwsza nie zadziała):

Dodanie explicite sprawdzenia czy hook zakończył ładowanie:

```typescript
const { data: author, isLoading, isFetched } = useAuthorById(isCreating ? "" : id || "");

// ...

if (!isCreating && isFetched && !author) {
  return <AdminLayout>Autor nie znaleziony</AdminLayout>;
}
```

To gwarantuje, że komunikat błędu pojawi się tylko gdy zapytanie zostało wykonane i nie znaleziono autora.
