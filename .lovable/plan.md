
# Poprawka rozmiaru logo w headerze

Logo tekstowe ("Szortsy") nie jest widoczne -- prawdopodobnie plik PNG z bialym tekstem jest zbyt maly przy `h-5`, a filtr `invert` moze nie dzialac prawidlowo.

## Zmiany w `src/components/Header.tsx`

- Zwiekszyc rozmiar ikony logo: kontener z `h-9 w-9` na `h-10 w-10`, obrazek z `h-6 w-6` na `h-7 w-7`
- Zwiekszyc rozmiar napisu: z `h-5` na `h-7` lub `h-8`
- Upewnic sie, ze klasy `invert` / `dark:invert-0` sa poprawnie zastosowane (w light mode napis powinien byc ciemny, wiec `invert` jest potrzebne; w dark mode bialy oryginal jest ok, wiec `dark:invert-0` zdejmuje filtr)

Jedna zmiana w jednym pliku -- szybka poprawka rozmiaru.
