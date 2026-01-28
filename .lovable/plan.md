

# Plan: Poprawa formatowania tekstu na stronie BlinkPage

## Problem

Obecnie treść artykułu jest wyświetlana jako ciągły blok tekstu bez wyraźnych separacji między akapitami, co utrudnia czytanie.

## Rozwiązanie

### 1. Ulepszone dzielenie tekstu

Zmienię logikę parsowania treści, aby obsługiwać różne przypadki:
- Podwójne entery (`\n\n`)
- Pojedyncze entery (`\n`)
- Bardzo długie akapity (automatyczne dzielenie co ~500 znaków przy kropce)

### 2. Lepsze stylowanie akapitów

```text
OBECNIE:
┌─────────────────────────────────────────────────────────────┐
│ Młodzieżowy turniej „Live Adventure Future Stars" w        │
│ Zabrzu, zamiast radosnej sportowej rywalizacji, stał się   │
│ areną skandalu o podłożu politycznym. Dwa ukraińskie       │
│ kluby – LNZ Czerkasy oraz Ruch Lwów – wysunęły bardzo      │
│ poważne oskarżenia wobec młodych zawodników i sztabu       │
│ szkoleniowego Rakowa Częstochowa. Według relacji           │
│ przedstawicieli ukraińskich drużyn, podczas meczów...      │
│ Władze Rakowa Częstochowa kategorycznie zaprzeczają tym    │
│ doniesieniom, nazywając je szkalowaniem klubu i jego       │
│ wychowanków... (cały tekst bez przerw)                     │
└─────────────────────────────────────────────────────────────┘

PO ZMIANACH:
┌─────────────────────────────────────────────────────────────┐
│ Młodzieżowy turniej „Live Adventure Future Stars" w        │
│ Zabrzu, zamiast radosnej sportowej rywalizacji, stał się   │
│ areną skandalu o podłożu politycznym.                      │
│                                                             │
│ Dwa ukraińskie kluby – LNZ Czerkasy oraz Ruch Lwów –       │
│ wysunęły bardzo poważne oskarżenia wobec młodych           │
│ zawodników i sztabu szkoleniowego Rakowa Częstochowa.      │
│                                                             │
│ Według relacji przedstawicieli ukraińskich drużyn,         │
│ podczas meczów dochodziło do skandalicznych zaczepek       │
│ słownych. Ukraińcy twierdzą, że polscy gracze...           │
│                                                             │
│ Władze Rakowa Częstochowa kategorycznie zaprzeczają        │
│ tym doniesieniom, nazywając je szkalowaniem klubu          │
│ i jego wychowanków.                                         │
└─────────────────────────────────────────────────────────────┘
```

### 3. Zmiany w BlinkPage.tsx

Zmienię sekcję renderowania treści:

```tsx
{/* Content - ULEPSZONE FORMATOWANIE */}
<div className="prose prose-lg dark:prose-invert max-w-none mb-8">
  {post.content ? (
    post.content
      .split(/\n+/)  // Dziel przez dowolną liczbę enterów
      .filter(p => p.trim().length > 0)  // Usuń puste linie
      .map((paragraph, index) => (
        <p 
          key={index} 
          className="mb-4 leading-relaxed text-foreground/90"
        >
          {paragraph.trim()}
        </p>
      ))
  ) : (
    <p className="text-lg leading-relaxed">{post.excerpt}</p>
  )}
</div>
```

### 4. Dodatkowo: Drop cap (pierwsza litera)

Mogę też dodać elegancką dużą pierwszą literę w stylu gazetowym:

```tsx
{paragraphs.map((paragraph, index) => (
  <p 
    key={index} 
    className={cn(
      "mb-4 leading-relaxed text-foreground/90",
      index === 0 && "first-letter:text-5xl first-letter:font-bold first-letter:float-left first-letter:mr-2 first-letter:text-primary"
    )}
  >
    {paragraph.trim()}
  </p>
))}
```

### 5. Aktualizacja promptu AI

Dodam wskazówkę do `article_content_prompt`, aby AI generowała tekst z wyraźnymi akapitami oddzielonymi pustymi liniami.

## Zmiany w plikach

| Plik | Zmiana |
|------|--------|
| `src/pages/BlinkPage.tsx` | Ulepszone parsowanie i stylowanie akapitów + opcjonalny drop cap |
| `supabase/functions/extract-article/index.ts` | Instrukcja w prompcie o formatowaniu akapitów |

