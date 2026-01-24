

## Ulepszenie promptu dla spójnych ikon AI

### Problem
Obecne ikony generowane przez AI nie są spójne z ikonami Lucide - brakuje:
- Czystego przezroczystego tła (alpha channel)
- Jednolitego białego koloru (pure white #FFFFFF)
- Minimalistycznego stylu linii (stroke-based, nie fill-based)
- Odpowiedniej grubości linii (2px stroke width)

### Rozwiązanie

Przebudowa promptu z bardziej technicznymi, precyzyjnymi instrukcjami oraz dodanie negatywnych wskazówek (czego unikać).

### Zmiany w pliku

**`supabase/functions/generate-category-icon/index.ts`** - nowy prompt:

```typescript
const prompt = `Generate a simple icon for the sport/activity: "${categoryName}"

CRITICAL REQUIREMENTS - MUST FOLLOW EXACTLY:
1. TRANSPARENT BACKGROUND - The background MUST be completely transparent (alpha = 0). No colored background, no white background, no gray background. ONLY transparency.

2. WHITE COLOR ONLY - Use ONLY pure white color (#FFFFFF) for all lines and shapes. No other colors allowed.

3. LINE ART STYLE - Draw using thin strokes/outlines only (like SVG stroke), NOT filled shapes. Similar to Lucide icons or Feather icons.

4. STROKE WIDTH - Use consistent 2px stroke width throughout the icon.

5. SIMPLE GEOMETRY - Use basic geometric shapes: circles, lines, rectangles, arcs. Maximum 5-10 shapes total.

6. SIZE - Design for 64x64 pixel display. Keep the icon centered with small padding.

7. SINGLE OBJECT - Show only ONE recognizable symbol representing the sport. No text, no multiple objects, no decorative elements.

DO NOT:
- Add any background color
- Use gradients or shadows
- Use filled shapes (use outlines only)
- Add text or labels
- Use colors other than white
- Make complex detailed illustrations

EXAMPLES OF CORRECT STYLE:
- Football/Soccer: Simple circle outline
- Tennis: Circle with crossed lines
- Basketball: Circle with curved lines
- Boxing: Two rectangular glove outlines

OUTPUT: PNG image with transparent background and white stroke-based icon.`;
```

### Dlaczego te zmiany pomogą

| Aspekt | Stary prompt | Nowy prompt |
|--------|--------------|-------------|
| Przezroczystość | "transparent background" (ogólne) | "alpha = 0", "no white background, no gray" (precyzyjne) |
| Kolor | "Single white color" | "#FFFFFF", "pure white", "no other colors" |
| Styl | "line art style" | "strokes/outlines only", "NOT filled shapes", "2px stroke width" |
| Negatywne instrukcje | Brak | Sekcja "DO NOT" z konkretnymi zakazami |
| Przykłady | Brak | Konkretne przykłady dla sportów |

### Dodatkowe ulepszenia

1. **Walidacja w komponencie** - dodanie informacji dla użytkownika, że jeśli ikona nie wygląda dobrze, może spróbować ponownie.

2. **Podgląd na różnych tłach** - w `AIIconGenerator.tsx` dodanie podglądu ikony na kilku kolorach tła, żeby użytkownik widział jak będzie wyglądać:

```tsx
// Podgląd na różnych tłach
<div className="flex gap-2 justify-center">
  {["#22c55e", "#f97316", "#8b5cf6", "#ef4444"].map((color) => (
    <div
      key={color}
      className="h-10 w-10 rounded-lg flex items-center justify-center"
      style={{ backgroundColor: color }}
    >
      <img src={generatedIconUrl} alt="" className="h-6 w-6 object-contain" />
    </div>
  ))}
</div>
```

### Plan implementacji

| Krok | Plik | Zmiana |
|------|------|--------|
| 1 | `supabase/functions/generate-category-icon/index.ts` | Zastąpienie promptu nową wersją z precyzyjnymi instrukcjami |
| 2 | `src/components/admin/AIIconGenerator.tsx` | Dodanie podglądu ikony na różnych kolorach tła |
| 3 | Deploy | Wdrożenie edge function |

### Uwagi techniczne

- Model `google/gemini-2.5-flash-image-preview` lepiej reaguje na:
  - Kapitalizowane słowa kluczowe (CRITICAL, MUST, DO NOT)
  - Numerowane listy z konkretnymi wartościami
  - Negatywne instrukcje (czego unikać)
  - Konkretne przykłady
  
- Przezroczystość PNG jest obsługiwana przez model, ale wymaga bardzo wyraźnych instrukcji

