## Cel
Powiększyć 3 kafelki w prawej kolumnie hero na stronie `/tech`, żeby były bardziej wizualne i wypełniały wysokość karty hero.

## Zmiany

### 1. Nowy wariant `mini` w `src/components/recki/ReviewCard.tsx`
Dodaję trzeci wariant obok `hero`, `default`, `compact`:

- Layout pionowy: miniatura 16:9 na górze + treść pod spodem
- Miniatura z `object-cover`, fallback gradient jak w innych wariantach
- `ScoreBadge size="sm"` w prawym górnym rogu miniatury
- Kategoria (mały uppercase w kolorze `fuchsia-600`)
- Tytuł: `text-sm font-semibold`, `line-clamp-2`
- Bez excerpt (za mało miejsca), bez osobnego CTA — cała karta klikalna przez `<a>` opakowanie
- Karta: `flex flex-col`, `rounded-lg`, hover shadow
- `h-full` żeby wypełniała slot flexbox

### 2. `src/pages/ReckiHome.tsx` — układ prawej kolumny
Zmiana w `<aside>` (linie 105–109):

```tsx
<aside className="lg:col-span-1 grid grid-cols-1 gap-3">
  {secondary.map((r) => (
    <ReviewCard key={r.id} review={r} variant="mini" />
  ))}
</aside>
```

Karta hero ma naturalną wysokość (obraz 16:9 + treść). Trzy mini-karty w kolumnie `gap-3` zsumowane ~ dopasują się wizualnie — nie wymuszam sztywnego `h-full` na aside, żeby uniknąć rozjazdu proporcji zdjęć.

Na mobile (`<lg`): mini-karty renderują się jedna pod drugą tak samo jak wcześniej compact — czytelniej niż mikro-miniatura 64px.

## Bez zmian
- Wariant `compact` zostaje (używany gdzieś indziej, np. w sidebarze recenzji).
- Wariant `default` w dolnej siatce "Wszystko z Tech" bez zmian.
- Brak zmian w danych, hookach, backendzie.

## Pliki
- `src/components/recki/ReviewCard.tsx` — dodać wariant `mini`
- `src/pages/ReckiHome.tsx` — zmienić `variant="compact"` → `variant="mini"` w aside
