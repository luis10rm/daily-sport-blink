
# Naprawa podwojnego klikania na iOS - prawdziwa przyczyna

## Analiza problemu

Dotychczasowe zmiany (media query `pointer: fine`, `touch-action: manipulation`) byly poprawne, ale **nie wystarczajace**. Prawdziwy winowajca to klasa CSS `transition-all` zastosowana na elementach karty i przyciskow CTA.

### Mechanizm problemu na iOS

iOS WebKit (Chrome na iPhonie rowniez uzywa WebKit) stosuje logike "sticky hover":

1. Gdy element ma `transition-all`, przegladarka wie, ze ten element moze animowac WSZYSTKIE wlasciwosci (w tym `transform`, `box-shadow`)
2. Nawet jesli efekt `:hover` jest ukryty za media query `(pointer: fine)`, iOS i tak parsuje te reguly i "wie", ze element ma potencjalne stany hover
3. Pierwsze tapniecie aktywuje stan hover (przeglądarka czeka, czy uzytkownik chce zobaczyc efekt hover)
4. Dopiero drugie tapniecie wykonuje nawigację

### Dowody w kodzie

**Plik `src/index.css` linia 125-127:**
```css
.card-hover {
  transition-all duration-300 ease-out;  /* <-- ZAWSZE aktywne, nawet na mobile */
}
```
Ten `transition-all` jest na elemencie `<article>`, ktory opakowuje przycisk "Przeczytaj wiecej".

**Plik `src/components/NewsCard.tsx` linia 167:**
```tsx
className="... transition-all ..."  /* <-- na przycisku Link/a */
```

**Plik `src/components/NewsOfTheDay.tsx` linia 94:**
```tsx
className="... transition-all ..."  /* <-- na przycisku Link/a */
```

`transition-all` na przyciskach CTA to drugi problem - iOS widzi element z tranzycja i potencjalnym hoverem i wchodzi w tryb podwojnego tapa.

## Plan naprawy

### 1. Klasa `.card-hover` - przeniesc tranzycje do media query

Zamiast stosowac `transition-all` na wszystkich urzadzeniach, tranzycja bedzie aktywna TYLKO na desktopie (pointer: fine):

```css
/* Bez tranzycji domyslnie */
.card-hover {
  /* puste - brak transition */
}

/* Tranzycje TYLKO na desktopie */
@media (hover: hover) and (pointer: fine) {
  .card-hover {
    transition: all 0.3s ease-out;
  }
  .card-hover:hover {
    transform: translateY(-4px);
    box-shadow: ...;
  }
}
```

### 2. Przyciski CTA w NewsCard.tsx

Zamienic `transition-all` na `transition-colors` - ta wlasciwosc NIE powoduje podwojnego tapa na iOS, bo nie obejmuje `transform` ani `box-shadow`:

```tsx
// Bylo:
className="... transition-all ..."

// Bedzie:
className="... transition-colors ..."
```

### 3. Przyciski CTA w NewsOfTheDay.tsx

Taka sama zmiana jak w NewsCard - `transition-all` na `transition-colors`.

### 4. Inne komponenty z inline `hover:` (bonus)

Komponenty `AuthorProfileCard.tsx`, `SponsorBanner.tsx`, `StoriesCircle.tsx`, `DynamicStoriesCircle.tsx` rowniez uzywaja inline Tailwind `hover:` klas (np. `hover:shadow-lg`, `hover:-translate-y-1`, `group-hover:scale-105`). Te moga powodowac ten sam problem. Opakowalem je w `@media (pointer: fine)` przez niestandardowe klasy CSS, lub usune inline hovers i zastapie klasami z media query.

## Podsumowanie zmian

| Plik | Zmiana |
|------|--------|
| `src/index.css` | Przeniesienie `transition` z `.card-hover` do bloku `@media (pointer: fine)` |
| `src/components/NewsCard.tsx` | `transition-all` -> `transition-colors` na przyciskach CTA |
| `src/components/NewsOfTheDay.tsx` | `transition-all` -> `transition-colors` na przyciskach CTA |
| `src/components/AuthorProfileCard.tsx` | Przeniesienie inline `hover:` do klas CSS w media query |
| `src/components/SponsorBanner.tsx` | Przeniesienie inline `hover:` do klas CSS w media query |
| `src/components/StoriesCircle.tsx` | Przeniesienie `group-hover:scale-105` do media query |
| `src/components/DynamicStoriesCircle.tsx` | Przeniesienie `group-hover:scale-105` do media query |

Ta zmiana calkowicie eliminuje przyczyne podwojnego klikania, poniewaz iOS nie bedzie mial zadnych tranzycji ani hoverow do "przechwycenia" na urzadzeniach dotykowych.
