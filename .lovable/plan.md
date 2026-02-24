

## Instalacja Meta Pixel

### Zmiana

Dodanie kodu Meta Pixel do `index.html` w sekcji `<head>`, tuż po skrypcie Google Analytics. Pixel ID: `1440716734345408`.

Dodatkowo tag `<noscript>` z fallback image trafi na początek `<body>`.

### Szczegóły techniczne

**Plik: `index.html`**
- W `<head>` po bloku Google Analytics: wstawienie skryptu `fbevents.js` z `fbq('init', '1440716734345408')` i `fbq('track', 'PageView')`
- Na początku `<body>`: wstawienie tagu `<noscript>` z 1x1 tracking pixel image

Pixel będzie śledzić PageView na każdej stronie automatycznie. Nie wymaga żadnych zmian w kodzie React — działa globalnie z poziomu HTML.

