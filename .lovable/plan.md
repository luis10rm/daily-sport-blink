

# Zamiana tagu GA4

## Problem
Na stronie jest stary tag `G-T27C4HS75K`, a powinien byc `G-F9QDLPXFGG`.

## Zmiany

### 1. `index.html`
Zamiana identyfikatora w dwoch miejscach:
- URL skryptu: `googletagmanager.com/gtag/js?id=G-F9QDLPXFGG`
- Konfiguracja: `gtag('config', 'G-F9QDLPXFGG', { send_page_view: false })`

### 2. Bez zmian w kodzie aplikacji
Hook `useAnalytics.ts` nie zawiera identyfikatora GA4 -- uzywa globalnej funkcji `gtag()`, wiec dziala niezaleznie od ID.

## Pliki do zmiany
1. `index.html` -- zamiana `G-T27C4HS75K` na `G-F9QDLPXFGG` (2 miejsca)
