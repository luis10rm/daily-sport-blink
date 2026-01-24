
## Generowanie ikon AI dla kategorii sportowych

### Cel
Dodanie trzeciego taba "🤖 Wygeneruj AI" w sekcji wyboru ikony w CategoryEditor, który pozwoli na automatyczne generowanie ikon w spójnym stylu na podstawie nazwy kategorii.

### Architektura rozwiązania

```text
┌─────────────────────────────────────────────────────────────────┐
│  CategoryEditor.tsx                                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Tabs: Ikona Lucide | Własna grafika | 🤖 Wygeneruj AI     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              ▼                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ AIIconGenerator (nowy komponent)                          │  │
│  │ ├── Automatyczny prompt z nazwy kategorii                 │  │
│  │ ├── Przycisk "Generuj ikonę"                             │  │
│  │ ├── Podgląd wygenerowanej ikony                          │  │
│  │ └── Przyciski "Użyj tej ikony" / "Generuj ponownie"      │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Edge Function: generate-category-icon                          │
│  ├── Przyjmuje: { categoryName: string }                        │
│  ├── Tworzy prompt w ustalonym stylu                           │
│  ├── Wywołuje Lovable AI (gemini-2.5-flash-image)              │
│  ├── Konwertuje base64 → upload do bucket                       │
│  └── Zwraca: { iconUrl: string }                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Storage: category-icons bucket (już istnieje)                  │
│  └── ai-generated/[slug]-[timestamp].png                        │
└─────────────────────────────────────────────────────────────────┘
```

### Nowe pliki do utworzenia

#### 1. Edge Function: `supabase/functions/generate-category-icon/index.ts`

Odpowiedzialności:
- Przyjmuje nazwę kategorii
- Generuje spójny prompt stylistyczny
- Wywołuje model `google/gemini-2.5-flash-image` przez Lovable AI Gateway
- Otrzymuje obraz w formacie base64
- Uploaduje do bucketu `category-icons` w folderze `ai-generated/`
- Zwraca publiczny URL ikony

Stały prompt stylistyczny:
```
"Create a minimalist sport icon representing [CATEGORY_NAME].
Requirements:
- Simple, clean line art style
- Single white color on transparent background  
- Geometric shapes, no gradients or shadows
- Suitable for 64x64px display
- Professional vector-like appearance
- Similar style to Lucide icons"
```

#### 2. Komponent: `src/components/admin/AIIconGenerator.tsx`

Interfejs:
```typescript
interface AIIconGeneratorProps {
  categoryName: string;        // Nazwa kategorii do wygenerowania ikony
  onIconGenerated: (url: string) => void;  // Callback z URL
  disabled?: boolean;
}
```

Stany komponentu:
- `isGenerating: boolean` - czy trwa generowanie
- `generatedIconUrl: string | null` - URL wygenerowanej ikony
- `error: string | null` - komunikat błędu

UI:
```text
┌─────────────────────────────────────────────────────┐
│  AI wygeneruje ikonę dla: "[nazwa kategorii]"      │
│                                                     │
│  [ 🎨 Generuj ikonę ]                              │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │         [Podgląd wygenerowanej ikony]       │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  [ Użyj tej ikony ]    [ Generuj ponownie ]        │
└─────────────────────────────────────────────────────┘
```

### Zmiany w istniejących plikach

#### `src/pages/admin/CategoryEditor.tsx`

1. Import nowego komponentu `AIIconGenerator`
2. Rozszerzenie stanu `iconSource` o wartość `"ai"`:
   ```typescript
   const [iconSource, setIconSource] = useState<"lucide" | "upload" | "ai">("lucide");
   ```
3. Dodanie trzeciego taba w `TabsList`:
   ```tsx
   <TabsList className="grid w-full grid-cols-3">
     <TabsTrigger value="lucide">Ikona Lucide</TabsTrigger>
     <TabsTrigger value="upload">Własna grafika</TabsTrigger>
     <TabsTrigger value="ai">🤖 Wygeneruj AI</TabsTrigger>
   </TabsList>
   ```
4. Dodanie `TabsContent` dla AI:
   ```tsx
   <TabsContent value="ai">
     <AIIconGenerator
       categoryName={form.watch("name")}
       onIconGenerated={(url) => {
         form.setValue("icon_url", url);
         form.setValue("icon_name", null);
         setIconSource("upload"); // Przełącz na upload po użyciu
       }}
       disabled={!form.watch("name")}
     />
   </TabsContent>
   ```

#### `supabase/config.toml`

Dodanie konfiguracji nowej funkcji:
```toml
[functions.generate-category-icon]
verify_jwt = false
```

### Przepływ użytkownika

1. Administrator tworzy/edytuje kategorię "Siatkówka"
2. Przechodzi do taba "🤖 Wygeneruj AI"
3. Widzi komunikat: "AI wygeneruje ikonę dla: Siatkówka"
4. Klika "Generuj ikonę"
5. Wyświetla się spinner z komunikatem "Generuję ikonę..."
6. Po chwili pojawia się podgląd wygenerowanej ikony
7. Administrator może:
   - Kliknąć "Użyj tej ikony" → ikona zostaje wybrana
   - Kliknąć "Generuj ponownie" → generuje nową wersję
8. Po wybraniu ikony, zakładka automatycznie przełącza się na "Własna grafika" z podglądem

### Obsługa błędów

| Błąd | Komunikat dla użytkownika |
|------|---------------------------|
| 429 Rate limit | "Zbyt wiele żądań. Spróbuj ponownie za chwilę." |
| 402 Brak kredytów | "Brak kredytów AI. Doładuj konto aby kontynuować." |
| Brak nazwy kategorii | Przycisk "Generuj" jest zablokowany |
| Błąd uploadu | "Nie udało się zapisać ikony. Spróbuj ponownie." |
| Timeout | "Generowanie trwa dłużej niż zwykle. Spróbuj ponownie." |

### Szczegóły techniczne

**Model AI**: `google/gemini-2.5-flash-image` (Nano banana)
- Generuje obrazy na podstawie promptu tekstowego
- Zwraca base64-encoded PNG
- Dostępny przez Lovable AI Gateway bez dodatkowego klucza API

**Format wyjściowy**:
- PNG z przezroczystym tłem
- Rozmiar: optymalizowany do 64x64px wyświetlania
- Lokalizacja: `category-icons/ai-generated/[slug]-[timestamp].png`

**Zależności**:
- Wykorzystuje istniejący bucket `category-icons`
- Wykorzystuje istniejący secret `LOVABLE_API_KEY`
- Nie wymaga dodatkowych konfiguracji
