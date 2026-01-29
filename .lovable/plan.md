
# Plan: Naprawa formatowania tekstu w edytorze i podglądzie

## Zidentyfikowany problem

Plugin `@tailwindcss/typography` jest zainstalowany w projekcie, ale **nie został dodany do konfiguracji Tailwind CSS**. Bez tego pluginu klasy `prose`, `prose-sm`, `prose-lg` nie mają żadnych stylów CSS.

```text
OBECNY STAN tailwind.config.ts:
┌─────────────────────────────────────────────────────────────┐
│ plugins: [require("tailwindcss-animate")]                   │
│                                                             │
│ ❌ Brak: @tailwindcss/typography                            │
└─────────────────────────────────────────────────────────────┘
```

## Rozwiązanie

Dodanie pluginu `@tailwindcss/typography` do konfiguracji Tailwind.

## Zmiana w pliku

### `tailwind.config.ts` (linia 103)

```typescript
// BYŁO:
plugins: [require("tailwindcss-animate")],

// BĘDZIE:
plugins: [
  require("tailwindcss-animate"),
  require("@tailwindcss/typography"),
],
```

## Efekt po naprawie

| Miejsce | Przed | Po |
|---------|-------|-----|
| Edytor WYSIWYG (admin) | Tekst bez formatowania | Pogrubienie, kursywa, nagłówki widoczne |
| Strona /blink/:id | Tekst bez stylów | Pełne formatowanie HTML z klasą `prose` |

## Uwaga techniczna

Po tej zmianie:
- Klasa `prose prose-sm` w edytorze będzie działać
- Klasa `prose prose-lg dark:prose-invert` na stronie /blink/ będzie działać
- Formatowanie (pogrubienie, kursywa, listy, cytaty, linki) będzie widoczne zarówno w edytorze, jak i na stronie publicznej
