
# Plan: Kompleksowa poprawa UX, spójności i SEO

## Zakres zmian

| Obszar | Problem | Rozwiązanie |
|--------|---------|-------------|
| Strona 404 | Angielski tekst, brak branding | Polski copy + Header + sugestie nawigacji |
| Footer | Rok 2024 hardcoded, brak na podstronach | Dynamiczny rok + wspólny komponent Footer |
| NewsOfTheDay | Zawsze link zewnętrzny | Logika jak w NewsCard (internal/external) |
| BlinkPage SEO | Hardcoded canonical URL | Dynamiczny URL bazujący na VITE_SITE_URL |
| Accessibility | Brak skip-link | Dodanie "Przejdź do treści" dla klawiatury |

---

## 1. Nowa strona 404

Przebudowa `NotFound.tsx`:
- Dodanie Header z logo i nawigacją
- Polski, przyjazny tekst ("Ups! Tej strony nie znaleźliśmy")
- Sugestie: link do strony głównej, archiwum, kategorii
- Spójny design z resztą serwisu

```
┌──────────────────────────────────────────┐
│ [Header z logo i nawigacją]              │
├──────────────────────────────────────────┤
│                                          │
│           🔍                             │
│     Ups! Strona nie istnieje             │
│     Może szukasz czegoś innego?          │
│                                          │
│   [Strona główna]  [Archiwum]  [Tagi]    │
│                                          │
├──────────────────────────────────────────┤
│ [Footer]                                 │
└──────────────────────────────────────────┘
```

## 2. Wspólny komponent Footer

Wydzielenie footera do `src/components/Footer.tsx`:
- Dynamiczny rok: `new Date().getFullYear()`
- Dodanie na wszystkie strony: CategoryPage, BlinkPage, AuthorsPage, AuthorProfile, TagPage, TagsListPage, Archive
- Zachowanie disclaimera prawnego

## 3. NewsOfTheDay - inteligentne linkowanie

Aktualizacja `NewsOfTheDay.tsx`:
- Sprawdzenie czy post ma `content` (wygenerowany przez AI)
- Jeśli tak → link do `/blink/${post.id}` (strona wewnętrzna)
- Jeśli nie → link do `source_url` (zewnętrzne źródło)
- Logika identyczna jak w `NewsCard.tsx`

## 4. BlinkPage - dynamiczny canonical

Zmiana w `BlinkPage.tsx`:
- Pobranie base URL z `window.location.origin` lub env variable
- Dynamiczne generowanie canonical URL
- Poprawne meta tagi dla SEO

## 5. Skip-link dla accessibility

Dodanie w `Header.tsx`:
- Ukryty link "Przejdź do treści" widoczny po Tab
- Target do `#main-content`
- Dodanie `id="main-content"` do głównych sekcji

---

## Szczegóły techniczne

### Pliki do utworzenia
- `src/components/Footer.tsx` - nowy wspólny komponent

### Pliki do edycji
- `src/pages/NotFound.tsx` - pełna przebudowa
- `src/pages/Index.tsx` - użycie Footer + id main
- `src/pages/CategoryPage.tsx` - dodanie Footer
- `src/pages/BlinkPage.tsx` - Footer + dynamiczny canonical
- `src/pages/AuthorsPage.tsx` - dodanie Footer
- `src/pages/AuthorProfile.tsx` - dodanie Footer
- `src/pages/TagPage.tsx` - dodanie Footer
- `src/pages/TagsListPage.tsx` - dodanie Footer
- `src/pages/Archive.tsx` - sprawdzenie Footer
- `src/components/NewsOfTheDay.tsx` - logika linkowania
- `src/components/Header.tsx` - skip-link

### Nowy komponent Footer
```tsx
export const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t border-border py-8">
      <div className="container text-center text-sm text-muted-foreground space-y-2">
        <p>Serwis agreguje nagłówki i odsyła do źródeł. Prawa do treści należą do wydawców.</p>
        <p>© {currentYear} Szortsy. Wszystkie prawa zastrzeżone.</p>
      </div>
    </footer>
  );
};
```

### Skip-link CSS (do index.css)
```css
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  padding: 8px 16px;
  z-index: 100;
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}

.skip-link:focus {
  top: 0;
}
```

## Kolejność implementacji

1. Utworzenie `Footer.tsx`
2. Dodanie skip-link do `Header.tsx` i CSS
3. Przebudowa `NotFound.tsx`
4. Aktualizacja `NewsOfTheDay.tsx`
5. Poprawka canonical w `BlinkPage.tsx`
6. Dodanie Footer do wszystkich stron

## Rezultat

- Spójna, polska strona 404 z pomocną nawigacją
- Footer na każdej stronie z dynamicznym rokiem
- Inteligentne linkowanie w "Wiadomość dnia"
- Poprawne SEO canonical URLs
- Lepsza dostępność dla użytkowników klawiatury
