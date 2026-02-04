

# Dodanie linku do fanpage'a Facebook w stopce

## Co zostanie zrobione

Dodam ikonę Facebook z linkiem do fanpage'a Szortsy w stopce strony. Będzie to elegancko wkomponowane w istniejący design.

## Wizualizacja

Stopka po zmianie będzie wyglądać tak:

```
─────────────────────────────────────────────────
Serwis agreguje nagłówki i odsyła do źródeł...
         
              [ikona FB]
     Obserwuj nas na Facebooku
         
© 2026 Szortsy. Wszystkie prawa zastrzeżone.
─────────────────────────────────────────────────
```

## Szczegóły techniczne

### Plik: `src/components/Footer.tsx`

1. Import ikony `Facebook` z biblioteki `lucide-react` (już zainstalowana w projekcie)
2. Dodanie sekcji z linkiem do fanpage'a między disclaimer a copyright:
   - Ikona Facebook w okręgu z kolorem primary
   - Tekst "Obserwuj nas na Facebooku"
   - Link zewnętrzny z atrybutami `target="_blank"` i `rel="noopener noreferrer"` (bezpieczeństwo)
   - Efekt hover dla interaktywności

### Styl
- Zachowany minimalistyczny design zgodny z resztą strony
- Ikona w kolorze szmaragdowym (primary) dla spójności z brandingiem
- Responsywny układ działający na wszystkich urządzeniach

