

# Podmiana logo w naglowku na wlasciwe pliki

## Co sie zmieni
Obecne logo w headerze to ikona Newspaper + tekst "Szortsy" renderowany jako HTML. Zastapimy to przeslanymi plikami graficznymi:
- **Logo.png** -- ikona/symbol "S" (bialy na przezroczystym tle)
- **Szortsy_napis.png** -- napis "SZORTSY" (bialy na przezroczystym tle)

Poniewaz oba pliki sa biale, beda dobrze widoczne w dark mode. W light mode potrzebuja ciemnego tla lub filtra CSS -- ikona zostanie umieszczona w kolorowym kontenerze (jak dotychczas), a napis dostanie filtr `dark:invert-0 invert` zeby byl widoczny na jasnym tle.

## Szczegoly techniczne

### Pliki do skopiowania
- `user-uploads://Logo.png` -> `src/assets/logo-icon.png`
- `user-uploads://Szortsy_napis.png` -> `src/assets/logo-text.png`

### `src/components/Header.tsx`
- Import obu obrazkow z `@/assets/`
- Zamiana ikony Newspaper na `<img src={logoIcon}>` w zielonym kontenerze
- Zamiana tekstu "Szortsy" na `<img src={logoText}>` z odpowiednimi klasami dla widocznosci w light/dark mode
- Podpis "O sporcie: krotko, codziennie" zostaje bez zmian

