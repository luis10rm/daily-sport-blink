Cel: Wyśrodkować treść w pasku patrona (PatronBar), tak by logo, nazwa i CTA były w linii środka, a przycisk zamykania nie psuł symetrii.

Zmiana:
- W `src/components/PatronBar.tsx` zamienić `justify-between` na `justify-center` we wewnętrznym kontenerze `innerContent`.
- Przycisk zamykania (X) przenieść na pozycję absolutną (`absolute right-2`), by nie wypychał treści.
- Dostosować padding wewnętrzny / szerokość, by centrowanie było faktycznie geometryczne bez efektu "lewa strona vs prawa strona".