# Problem

W `RichTextEditor.tsx` (używany w PostEditor i ReviewEditor) TipTap nie ma niestandardowej obsługi wklejania. Gdy wklejasz **surowy HTML jako tekst** (np. `<h2>Ray-Ban Display</h2><p>...</p>` skopiowane ze źródła / edytora kodu), przeglądarka wysyła to jako `text/plain`, więc TipTap traktuje znaczniki jak dosłowny tekst i wyświetla `<h2>` zamiast go sparsować. Dodatkowo StarterKit nie ma rozszerzeń dla `<table>`, `<figure>`, `<img>` itp., więc nawet gdy HTML zostanie rozpoznany, część tagów jest wycinana.

# Rozwiązanie

Dwie uzupełniające się zmiany w `src/components/admin/RichTextEditor.tsx`:

## 1. Automatyczne rozpoznawanie HTML w wklejce tekstowej

Dodać handler `editorProps.handlePaste`:
- Jeśli `clipboardData` zawiera `text/html` → domyślne zachowanie TipTap.
- Jeśli zawiera tylko `text/plain`, ale treść wygląda jak HTML (regex `/<[a-z][\s\S]*>/i`), wywołać `editor.commands.insertContent(text, { parseOptions: { preserveWhitespace: false } })` — TipTap sparsuje string jako HTML.
- W przeciwnym razie zwrócić `false` (domyślne wklejenie tekstu).

## 2. Ręczny przycisk „Wklej HTML"

Nowy przycisk w toolbarze (ikona `Code`) otwierający `Dialog` z `Textarea`:
- Użytkownik wkleja/edytuje HTML.
- Po zatwierdzeniu: `editor.chain().focus().insertContent(html).run()`.
- Zapewnia fallback, gdy autodetekcja zawiedzie i pozwala świadomie wkleić fragment (np. tabelę z Google Docs).

## 3. Rozszerzenie dozwolonych tagów (opcjonalnie, w tej samej iteracji)

- Dodać rozszerzenia `@tiptap/extension-image` i `@tiptap/extension-table` (+ `TableRow`, `TableCell`, `TableHeader`), by zachować obrazki i tabele wklejane z HTML. Bez tego insertContent po cichu je wyrzuca.
- Zaktualizować sanitizer w `src/pages/BlinkPage.tsx` (`ALLOWED_TAGS`) o `img`, `figure`, `figcaption`, `table`, `thead`, `tbody`, `tr`, `td`, `th` — obecnie są usuwane przy renderowaniu.

# Pliki do zmiany

- `src/components/admin/RichTextEditor.tsx` — handlePaste, przycisk „Wklej HTML", dialog, ewentualne rozszerzenia.
- `src/pages/BlinkPage.tsx` — rozszerzenie whitelisty w `sanitizeHtml`.
- `package.json` — `@tiptap/extension-image`, `@tiptap/extension-table*` (jeśli akceptujesz punkt 3).

# Pytanie

Czy dorzucamy punkt 3 (obrazy + tabele w edytorze i sanitizerze), czy na razie tylko autodetekcja + przycisk „Wklej HTML"?
