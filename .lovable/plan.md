

# Naprawa klikania na mobile - podejście z bannera

## Problem

Baner reklamowy działa od razu, bo jego CTA to `<button>` z `onClick` + `window.open()`. Karty newsów używają `<Link to="...">` (React Router) i `<a href="...">`, które iOS WebKit traktuje inaczej - przechwytuje pierwsze tapnięcie.

## Rozwiązanie

Zamienić `<Link>` i `<a>` na `<button>` z programową nawigacją - dokładnie tak jak w bannerze.

## Zmiany

### 1. `src/components/NewsCard.tsx`

Zamiana CTA "Przeczytaj więcej":

**Dla postów z contentem (linia 163-174):**
```tsx
// Było: <Link to={blinkUrl}>
// Będzie:
<button
  onClick={() => window.location.href = blinkUrl}
  type="button"
  className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors bg-primary/10 text-primary cta-hover"
>
  Przeczytaj więcej
</button>
```

**Dla postów z linkiem zewnętrznym (linia 175-190):**
```tsx
// Było: <a href={sourceUrl} target="_blank">
// Będzie:
<button
  onClick={() => window.open(sourceUrl, '_blank', 'noopener,noreferrer')}
  type="button"
  className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors bg-primary/10 text-primary cta-hover"
>
  Przeczytaj więcej
  <ExternalLink className="h-4 w-4" />
</button>
```

### 2. `src/components/NewsOfTheDay.tsx`

Taka sama zamiana - `<Link>` i `<a>` na `<button>` z `onClick`.

**Dla contentu (linia 94-100):**
```tsx
<button
  onClick={() => window.location.href = `/blink/${post.slug}`}
  type="button"
  className="mt-auto inline-flex w-fit items-center justify-center gap-2 rounded-lg bg-news-of-day px-6 py-3 text-base font-semibold text-news-of-day-foreground shadow-md transition-colors cta-notd-hover"
>
  Przeczytaj więcej
</button>
```

**Dla linku zewnętrznego (linia 101-111):**
```tsx
<button
  onClick={() => window.open(post.source_url, '_blank', 'noopener,noreferrer')}
  type="button"
  className="..."
>
  Przeczytaj więcej
  <ExternalLink className="h-5 w-5" />
</button>
```

## Dlaczego to zadziała

Baner działa na iOS po jednym tapnięciu, bo `<button onClick>` nie podlega logice "sticky hover" przeglądarki WebKit. Przeglądarka nie przechwytuje pierwszego tapnięcia na przycisku z handlerem JS - wykonuje go natychmiast. Dokładnie ten sam mechanizm zastosujemy na przyciskach newsów.

## Pliki do edycji

| Plik | Zmiana |
|------|--------|
| `src/components/NewsCard.tsx` | `<Link>` i `<a>` na `<button onClick>` |
| `src/components/NewsOfTheDay.tsx` | `<Link>` i `<a>` na `<button onClick>` |

