W sekcji Tech / recki powiększamy przyciski CTA w komponencie `ReviewCard.tsx` we wszystkich trzech wariantach (hero, default, compact), aby były bardziej widoczne i łatwiejsze w obsłudze na urządzeniach mobilnych.

Zmiany:
- **Wariant hero**: zwiększenie paddingu z `px-4 py-2` na `px-5 py-2.5` oraz rozmiaru tekstu ze `text-sm` na `text-base`.
- **Wariant default**: zwiększenie paddingu z `px-3 py-1.5` na `px-4 py-2.5` oraz rozmiaru tekstu ze `text-xs` na `text-sm`.
- **Wariant compact**: powiększenie tekstu linku "Czytaj" z `text-[12px]` na `text-sm` i zwiększenie odstępu (`mt-1` -> `mt-2`).

Dotknięty plik: `src/components/recki/ReviewCard.tsx`.

## Szczegóły techniczne
- Wykorzystamy istniejący hook `useNavLink` oraz klasę `cursor-pointer` – bez zmian w logice nawigacji.
- Style pozostają w palecie fioletowej/magentowej sekcji TECH (`fuchsia-600`, `fuchsia-700`).
- Brak zmian w strukturze HTML ani w logice danych – wyłącznie modyfikacja klas Tailwind.