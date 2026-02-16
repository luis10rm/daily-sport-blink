

# Widoczny link reklamodawcy w DOM paska patrona

## Problem

Reklamodawca otwiera DevTools (Inspect) i szuka swojego URL w kodzie HTML. Nie znajduje go, bo:
- Na mobile: klikniecie obsługuje `<div onClick={window.open(url)}>` -- brak `<a href>` w DOM
- Na desktop: CTA to `<button onClick={window.open(url)}>` -- też brak `<a href>` w DOM

URL istnieje tylko w pamięci JavaScriptu, nie w drzewie HTML.

## Rozwiązanie

Zamienić `<button>` CTA na prawdziwy `<a href="..." target="_blank">`. Dodatkowo dodać drugi, niewidoczny `<a>` jako "kotwicę" w DOM, widoczną w Inspect na każdym urządzeniu.

## Zmiany

### 1. `src/components/PatronBar.tsx`

**A) Przycisk CTA (linia 108-122) -- zamiana `<button>` na `<a>`:**

Przed:
```tsx
<button
  onClick={(e) => {
    e.stopPropagation();
    window.open(patron.cta_url, "_blank", "noopener,noreferrer");
  }}
  className="hidden sm:inline-flex ml-2 px-3 py-1 ..."
>
  {patron.cta_text}
</button>
```

Po:
```tsx
<a
  href={patron.cta_url}
  target="_blank"
  rel="noopener noreferrer sponsored"
  onClick={(e) => e.stopPropagation()}
  className="inline-flex ml-2 px-3 py-1 rounded-full text-xs font-semibold
             sm:text-xs text-[10px] sm:px-3 sm:py-1 px-2 py-0.5"
  style={{
    backgroundColor: patron.text_color,
    color: patron.background_color,
  }}
>
  {patron.cta_text}
</a>
```

Kluczowe zmiany:
- `<a href>` zamiast `<button onClick>` -- URL widoczny w DOM
- Usunięcie `hidden sm:inline-flex` -- przycisk widoczny na mobile i desktop
- `rel="sponsored"` -- prawidłowe oznaczenie linku reklamowego dla SEO
- Mniejszy tekst na mobile (`text-[10px]`, `px-2 py-0.5`)

**B) Kontener mobilny (linia 80-88) -- usunięcie `onClick={handleClick}` z `<div>`:**

Skoro przycisk `<a>` jest teraz widoczny na mobile, nie potrzebujemy klikalnego kontenera. Usuwamy:
- `onClick={handleClick}`
- `onKeyDown`
- `role="link"`, `tabIndex`
- `cursor-pointer`

Kontener staje się zwykłym `<div>` z layoutem.

**C) Usunięcie funkcji `handleClick` (linia 64-68):**

Nie jest już potrzebna -- link obsługuje nawigację natywnie.

### 2. `src/index.css`

Dodać hover dla przycisku patrona w media query (bez inline transition):

```css
@media (hover: hover) and (pointer: fine) {
  .patron-cta-hover {
    transition: transform 0.15s, opacity 0.15s;
  }
  .patron-cta-hover:hover {
    transform: scale(1.05);
    opacity: 0.9;
  }
}
```

## Efekt końcowy

Reklamodawca otwiera DevTools i widzi:

```html
<a href="https://reklamodawca.pl"
   target="_blank"
   rel="noopener noreferrer sponsored">
  Sprawdź ofertę
</a>
```

Na mobile i desktop -- ten sam element `<a>`, zawsze w DOM, zawsze z pełnym `href`.

## Pliki do edycji

| Plik | Zmiana |
|------|--------|
| `src/components/PatronBar.tsx` | `<button>` na `<a href>`, usunięcie klikalnego kontenera, usunięcie `handleClick` |
| `src/index.css` | Nowa klasa `.patron-cta-hover` w media query |

