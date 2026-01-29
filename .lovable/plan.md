
# Plan: Edytor tekstu z formatowaniem (WYSIWYG)

## Obecny stan

Edytor treści to zwykłe pole tekstowe (`<Textarea>`), które nie obsługuje żadnego formatowania. Treść jest zapisywana jako plain text i renderowana bezpośrednio na stronie.

## Proponowane rozwiązanie

Dodanie edytora WYSIWYG (What You See Is What You Get) z paskiem narzędzi do formatowania.

### Opcje techniczne

| Biblioteka | Zalety | Wady |
|------------|--------|------|
| **Tiptap** (rekomendowany) | Lekki, rozszerzalny, React-native, Tailwind-friendly | Wymaga konfiguracji |
| **React Quill** | Prosty w użyciu, gotowy toolbar | Cięższy, mniej customizacji |
| **Lexical** (Facebook) | Bardzo wydajny | Stroma krzywa uczenia |

**Moja rekomendacja: Tiptap** - najlepsze dopasowanie do stosu technologicznego projektu (React + Tailwind).

### Co będzie dostępne w edytorze?

```text
┌─────────────────────────────────────────────────────────────┐
│ [B] [I] [U] [S] │ [H2] [H3] │ [•] [1.] │ [Link] [Cytat]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Tutaj piszesz treść artykułu z **pogrubieniem**,           │
│ *kursywą* i innymi formatami...                             │
│                                                             │
│ > Cytat z wypowiedzi trenera                                │
│                                                             │
│ • Lista punktowana                                          │
│ • Drugi punkt                                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Obsługiwane formaty

| Format | Skrót | Tag HTML |
|--------|-------|----------|
| Pogrubienie | Ctrl+B | `<strong>` |
| Kursywa | Ctrl+I | `<em>` |
| Podkreślenie | Ctrl+U | `<u>` |
| Przekreślenie | - | `<s>` |
| Nagłówek H2 | - | `<h2>` |
| Nagłówek H3 | - | `<h3>` |
| Lista punktowana | - | `<ul><li>` |
| Lista numerowana | - | `<ol><li>` |
| Cytat | - | `<blockquote>` |
| Link | Ctrl+K | `<a href="...">` |

---

## Zmiany techniczne

### 1. Nowa zależność

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-underline
```

### 2. Nowy komponent: RichTextEditor

```text
src/components/admin/RichTextEditor.tsx
```

Komponent z:
- Paskiem narzędzi (toolbar)
- Edytorem WYSIWYG
- Eksportem do HTML

### 3. Aktualizacja PostEditor

Zamiana:
```tsx
// BYŁO
<Textarea
  placeholder="Pełna treść artykułu..."
  rows={10}
  {...field}
/>

// BĘDZIE
<RichTextEditor
  content={field.value}
  onChange={field.onChange}
/>
```

### 4. Aktualizacja BlinkPage

Zmiana renderowania treści:
```tsx
// BYŁO - plain text split
{post.content.split(/\n+/).map((p, i) => <p key={i}>{p}</p>)}

// BĘDZIE - HTML rendering
<div 
  className="prose prose-lg dark:prose-invert"
  dangerouslySetInnerHTML={{ __html: post.content }}
/>
```

### 5. Kompatybilność wsteczna

Wykrywanie formatu treści:
- Jeśli treść zawiera tagi HTML → renderuj jako HTML
- Jeśli plain text → zachowaj obecne dzielenie na akapity

```tsx
const isHtml = (content: string) => /<[^>]+>/.test(content);

{isHtml(post.content) ? (
  <div dangerouslySetInnerHTML={{ __html: post.content }} />
) : (
  // Obecna logika z split
)}
```

---

## Wygląd edytora (mockup)

```text
┌─────────────────────────────────────────────────────────────┐
│ Pełna treść artykułu                                        │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [B] [I] [U] [~S~] │ [H2] [H3] │ [•] [1.] │ [🔗] [❝]    │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │                                                         │ │
│ │ Młodzieżowy turniej „Live Adventure Future Stars" w    │ │
│ │ Zabrzu stał się areną **skandalu politycznego**.       │ │
│ │                                                         │ │
│ │ Dwa ukraińskie kluby wysunęły *poważne oskarżenia*     │ │
│ │ wobec młodych zawodników Rakowa Częstochowa:           │ │
│ │                                                         │ │
│ │ • Zaczepki słowne podczas meczów                       │ │
│ │ • Skandowanie haseł politycznych                        │ │
│ │                                                         │ │
│ │ > "To absolutnie niedopuszczalne zachowanie"           │ │
│ │ > — rzecznik LNZ Czerkasy                              │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│ Ta treść będzie wyświetlana na dedykowanej stronie...       │
└─────────────────────────────────────────────────────────────┘
```

---

## Pliki do zmiany/utworzenia

| Plik | Operacja | Opis |
|------|----------|------|
| `package.json` | MODYFIKACJA | Dodanie zależności Tiptap |
| `src/components/admin/RichTextEditor.tsx` | NOWY | Komponent edytora WYSIWYG |
| `src/pages/admin/PostEditor.tsx` | MODYFIKACJA | Użycie RichTextEditor zamiast Textarea |
| `src/pages/BlinkPage.tsx` | MODYFIKACJA | Obsługa renderowania HTML z zachowaniem kompatybilności wstecznej |

---

## Korzyści

| Aspekt | Przed | Po |
|--------|-------|-----|
| Formatowanie | Brak | Pogrubienie, kursywa, listy, cytaty, linki |
| Doświadczenie redaktora | Tekst plain | Edytor wizualny WYSIWYG |
| Wygląd artykułów | Monotonne akapity | Bogato sformatowana treść |
| SEO | Tylko `<p>` | Nagłówki `<h2>`, `<h3>`, semantyczny HTML |
