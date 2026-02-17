

# Fix: Zamiana Link na button z onClick na mobile CTA

## Zmiana

### Plik: `src/components/TodaysNewsBanner.tsx`

Zamiana `<Link>` na `<button>` w mobilnym CTA (linie 127-133), zgodnie z wzorcem z `NewsCard.tsx`:

```tsx
// PRZED:
<Link
  to={`/dzien/${todayStr}`}
  className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary py-3 text-sm font-bold text-primary-foreground touch-manipulation active:scale-[0.98] transition-transform"
>

// PO:
<button
  type="button"
  onTouchEnd={(e) => {
    e.stopPropagation();
    window.location.href = `/dzien/${todayStr}`;
  }}
  onClick={(e) => {
    e.stopPropagation();
    window.location.href = `/dzien/${todayStr}`;
  }}
  className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary py-3 text-sm font-bold text-primary-foreground touch-manipulation active:scale-[0.98] transition-transform"
>
```

Jeden plik, minimalna zmiana. Desktop CTA pozostaje jako `<Link>`.

