# Naprawa zniekształconych miniatur (paski zamiast zdjęć)

## Co się dzieje

To nie jest problem układu galerii — to zepsute pliki obrazów zwracane przez warstwę transformacji zdjęć.

Sprawdziłem realne pliki z tego artykułu:

- Oryginał: `...79b58244....jpeg` → **2048 × 1536** (poprawne, poziome)
- To, co dostaje przeglądarka (`width=640&quality=70&resize=cover`) → **640 × 5712**

Czyli serwer zwraca obraz o skrajnie wydłużonej, błędnej proporcji. Przy `object-contain` w kafelku 4:3 taki obraz mieści się na wysokość i zostaje z niego wąski pionowy pasek — dokładnie to, co widać na zrzucie.

Przyczyna: nasz helper URL-i zawsze dokleja `resize=cover`, ale przekazuje tylko `width`, bez `height`. W tym trybie wysokość nie jest wyliczana z proporcji i wychodzi nonsensowna.

Zweryfikowane warianty:

```text
width=640&resize=cover    -> 640 x 5712   (błąd)
width=640                 -> 640 x 1536   (błąd)
width=640&resize=contain  -> 640 x 480    (poprawnie)
width=640&height=480&cover-> 640 x 480    (poprawnie)
```

Dotyczy to **wszystkich** zdjęć w serwisie serwowanych przez ten helper (kafelki sport/tech/pozytywne, okładki, galerie), nie tylko galerii podróży.

## Co zrobię

1. Zmienić domyślny tryb skalowania w helperze URL-i obrazów na `contain` (zachowuje proporcje, wylicza wysokość automatycznie).
2. Umożliwić świadome przycinanie: gdy komponent poda `resize: "cover"`, wymusić także `height` — bez wysokości `cover` nie będzie w ogóle dodawany.
3. Przejrzeć miejsca, które celowo chcą kadrowanie (okładki 16:9, avatary 1:1) i podać tam parę `width` + `height`, żeby nadal wypełniały kafelek.
4. Galeria w recenzjach miejsc: zostawić kafelki 4:3 z `object-contain`, ale przełączyć na jasne, neutralne tło i lekko zmniejszyć padding — po naprawie proporcji zdjęcia wypełnią kafelek sensownie.
5. Weryfikacja: pobrać kilka wygenerowanych wariantów i potwierdzić, że proporcje zgadzają się z oryginałem; następnie sprawdzić stronę recenzji w przeglądarce (screenshot galerii).

## Szczegóły techniczne

- `src/lib/imageUrl.ts`: `optimizeImageUrl` — domyślnie `resize: "contain"`, parametr `resize` dodawany tylko gdy ma sens; nowa opcja `height`; `buildSrcSet` przekazuje proporcjonalną wysokość, jeśli podano `aspect`.
- `src/components/OptimizedImage.tsx`: nowy opcjonalny prop `aspect` (np. `16/9`) → przekazywany do budowy URL-i dla kadrowanych kafelków.
- Miejsca do przeglądu: `ReckiReview.tsx` (galeria, okładka), `ReviewCard.tsx`, `NewsCard`, hero na stronach głównych, avatary autorów.
- Bez zmian w bazie danych i bez ponownego wgrywania zdjęć — problem jest wyłącznie w generowanych URL-ach.
