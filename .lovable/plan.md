
## Obejście blokowania AdBlock dla linków DoubleClick

### Diagnoza
AdBlockery (uBlock, AdBlock Plus, Brave Shields) skanują DOM i ukrywają elementy HTML zawierające linki do znanych domen reklamowych jak `doubleclick.net`. Nawet jeśli obrazek się ładuje, cały element `<a href="...doubleclick...">` jest ukrywany przez regułę CSS typu `display: none !important`.

### Rozwiązanie: onClick Handler zamiast href

Zamiast umieszczać URL trackera bezpośrednio w atrybucie `href`, użyjemy JavaScript `onClick` handler który otworzy link dopiero po kliknięciu. AdBlockery nie parsują kodu JavaScript, więc URL pozostanie niewidoczny dla filtrów.

### Architektura rozwiązania

```text
PRZED (blokowane):
<a href="https://ad.doubleclick.net/...">
  <img src="banner.jpg" />    ← AdBlock: "widzę doubleclick.net w href, ukrywam!"
</a>

PO (nieblokowane):
<div onClick={() => window.open(url, '_blank')}>
  <img src="banner.jpg" />    ← AdBlock nie widzi doubleclick.net w DOM
</div>
```

### Zmiany w plikach

**`src/components/SponsorBanner.tsx`**

1. Zamienić wszystkie `<a href={safeCtaUrl}>` na `<div>` z onClick:
   ```typescript
   const handleClick = () => {
     if (safeCtaUrl && safeCtaUrl !== "#") {
       window.open(safeCtaUrl, '_blank', 'noopener,noreferrer');
     }
   };
   ```

2. Dodać odpowiednie style i atrybuty dostępności:
   ```tsx
   <div
     onClick={handleClick}
     role="link"
     tabIndex={0}
     onKeyDown={(e) => e.key === 'Enter' && handleClick()}
     className="cursor-pointer block group"
   >
   ```

3. Zastosować to dla wszystkich miejsc gdzie używany jest link (5 miejsc w komponencie)

### Szczegóły techniczne

**Zmiany w `<a>` na `<div>` z onClick:**

| Element | Linia | Zmiana |
|---------|-------|--------|
| Główny wrapper obrazka | 72-149 | `<a href>` → `<div onClick>` |
| CTA button (image mode) | 154-162 | `<a href>` → `<button onClick>` |
| Desktop text slot | 182-207 | `<a href>` → `<div onClick>` |
| Mobile text slot | 210-235 | `<a href>` → `<div onClick>` |
| CTA button (text mode) | 240-248 | `<a href>` → `<button onClick>` |

**Zachowanie dostępności (accessibility):**
- `role="link"` - informuje screen readery że to link
- `tabIndex={0}` - umożliwia focus klawiszem Tab
- `onKeyDown` z Enter - obsługuje nawigację klawiaturą
- `cursor-pointer` - wizualny feedback

### Efekt końcowy
Banery z linkami DoubleClick będą wyświetlane poprawnie nawet przy włączonym AdBlockerze, ponieważ URL trackera nie będzie widoczny w strukturze HTML - zostanie użyty dopiero w momencie kliknięcia przez JavaScript.
