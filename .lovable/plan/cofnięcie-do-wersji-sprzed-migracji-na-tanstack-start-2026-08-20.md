# Cofnięcie do wersji sprzed migracji na TanStack Start

Cofnięcie wykonujesz Ty — ja nie odtwarzam starej wersji kodem, bo Lovable ma do tego wbudowany mechanizm, który przywraca dokładny stan repo (framework, package.json, konfiguracja builda, pipeline publikacji).

## Jak to zrobić

1. Otwórz **History** na górze czatu (lub przycisk revert pod wiadomością w czacie).
2. Wybierz wersję **sprzed wiadomości "Idziemy zgodnie z Twoja rekomendacja"** — to jest commit, od którego zaczęła się migracja na TanStack Start.
3. Zatwierdź przywrócenie. Wszystko po tym punkcie zostanie zarchiwizowane, ale zostanie widoczne w czacie i da się przywrócić pojedynczymi przyciskami revert.
4. Opublikuj projekt ponownie, żeby produkcja wróciła na stary pipeline.
5. Sprawdź, czy narzędzie partnera znów działa na pasku sponsorskim.

## Co znika po cofnięciu

Praca wykonana po migracji przestaje istnieć w aktywnej wersji:

- SSR + metadane SEO dla `/blink/*`, `/tech/*`, `/pozytywne/*`, `/kategoria/*`, `/autor/*`, `/autorzy`
- Schematy JSON-LD: NewsArticle, Review, CollectionPage, ProfilePage, BreadcrumbList, SportsEvent
- Tytuły/meta pod CTR (`seoTitle`), noindex dla cienkich tagów
- Przekierowania 301 dla scalonych duplikatów po stronie serwera
- Wymuszanie obrazów ≥1200px w CMS + kolumny `image_width`/`image_height` w interfejsie
- Drabinka pucharowa MŚ 2026, FAQ w Tech, poprawki double-tapa na mobile

Baza danych (tabele, migracje, treści) **nie jest cofana** — zostaje w obecnym stanie. Kod sprzed migracji nie korzysta z nowszych kolumn, więc będą po prostu ignorowane.

## Po cofnięciu — opcje

- Jeśli chcesz, mogę po cofnięciu odtworzyć na starym stacku te elementy, które nie zależą od SSR: drabinkę MŚ, FAQ Tech, wymuszanie obrazów 1200px, tytuły pod CTR i noindex dla cienkich tagów.
- Nie da się odtworzyć na starym stacku samego SSR — tam metadane i treść renderują się dopiero w przeglądarce, więc wracamy do stanu, w którym Google widziało pusty szkielet strony.

## Szczegóły techniczne

Migracja podmieniła: React Router → TanStack Router (`src/routes/*` + `routeTree.gen.ts`), `main.tsx`/`App.tsx`/`index.html` → `__root.tsx` + `src/server.ts`, Tailwind 3 → 4 (`src/styles.css`), oraz pipeline publikacji na TanStack. Revert z historii cofa to wszystko razem, w tym `.lovable/project.json`, dzięki czemu publikacja automatycznie wraca na poprzedni pipeline.
