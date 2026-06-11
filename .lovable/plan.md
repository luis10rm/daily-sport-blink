## Co naprawiamy

Na iPhonie po publikacji zmian nie widzisz ich od razu — ani w Chrome (karta web), ani w Safari dodanym na ekran główny (PWA). Działa tylko Chrome PWA. To klasyczny problem **starego app shella w service workerze**: Safari (i WKWebView) bardzo agresywnie trzyma starą wersję, a obecna konfiguracja PWA czeka, aż wszystkie karty się zamkną — co na telefonie praktycznie nigdy się nie dzieje.

Efekt: nawet nowy switch "Tryb mundialowy" w adminie nie pojawia się na Twoim iPhonie, bo telefon serwuje stary HTML/JS sprzed publikacji.

## Co zrobimy

1. **Wymusimy natychmiastowe przejęcie nowej wersji** zaraz po jej wykryciu — bez czekania, aż użytkownik zamknie wszystkie karty/aplikację.
2. **HTML zawsze z sieci** (z krótkim fallbackiem do cache, jeśli offline), żeby świeży kod nigdy nie był blokowany przez stary cache.
3. **Auto-reload karty**, gdy nowa wersja faktycznie przejmie kontrolę — użytkownik nie musi nic robić.
4. **„Kill switch" `?sw=off`** + wrapper rejestracji, który nie odpala SW w Lovable preview/iframe (zgodnie z naszą skill PWA), żeby przy najgorszym wypadku każdy mógł szybko odblokować swoją instancję jednym linkiem.
5. **Jednorazowe „samoczyszczenie" obecnych zainstalowanych instancji** — przy pierwszym wejściu po wdrożeniu stary worker usuwa swoje cache i się przeładuje, więc Twój iPhone i innych użytkowników po prostu „obudzi się" na nowej wersji.

Zmiany dotyczą tylko opakowania PWA — żadnej logiki biznesowej, danych ani UI nie ruszamy. Po wdrożeniu i jednym otwarciu strony (lub aplikacji z ekranu głównego) iPhone Safari i Chrome web powinny już dostawać zmiany w ciągu sekund.

## Co użytkownik zobaczy

- Telefon po publikacji w ciągu chwili sam podmieni stronę na nową wersję (bez „odśwież").
- Wersja zainstalowana na ekranie głównym (Safari PWA) dogoni tak samo szybko po pierwszym jej otwarciu po wdrożeniu — bez ręcznego odinstalowywania.
- Jeśli ktokolwiek kiedyś znów utknie, wystarczy otworzyć `https://szortsy.pl/?sw=off` raz — to wyczyści jego service workera.

## Szczegóły techniczne

`vite.config.ts` — w `VitePWA`:
- `workbox.skipWaiting: true`, `workbox.clientsClaim: true` (parowane razem; bez tego nowy SW śpi w `waiting` na iOS tygodniami).
- `workbox.cleanupOutdatedCaches: true`.
- `workbox.navigateFallbackDenylist` zostaje; dodatkowo `runtimeCaching` dla nawigacji HTML: `NetworkFirst` z `networkTimeoutSeconds: 3` (nigdy CacheFirst dla HTML).
- `injectRegister: null` — rejestracja tylko z naszego wrappera.
- `devOptions.enabled: false`.

Nowy wrapper `src/pwa/registerSW.ts` (jedyny rejestrator), używany w `main.tsx`:
- Odmawia rejestracji w dev, w iframe, na hostach `id-preview--*`, `preview--*`, `*.lovableproject.com`, `*.lovableproject-dev.com`, `*.beta.lovable.dev`, oraz gdy URL ma `?sw=off`.
- W każdym „odmownym" przypadku robi `getRegistrations()` → `unregister()` dla `/sw.js`.
- Używa `virtual:pwa-register` z `{ immediate: true, onRegisteredSW, onNeedRefresh: () => updateSW(true) }`.
- Nasłuchuje `navigator.serviceWorker.addEventListener('controllerchange', () => location.reload())` — to wymusza odświeżenie karty dokładnie wtedy, gdy nowy SW przejmie kontrolę (kluczowe dla iOS, bo prompt mode tam bywa niemy).

`main.tsx` — jedno wywołanie `registerSW()` po `createRoot(...).render(...)`.

`src/main.tsx` typings — dodać `/// <reference types="vite-plugin-pwa/client" />` w `src/vite-env.d.ts`.

Po wdrożeniu nic nie usuwamy ręcznie — `skipWaiting + clientsClaim + controllerchange reload` plus `cleanupOutdatedCaches` zrobią migrację dla wszystkich obecnie zainstalowanych klientów przy ich najbliższym otwarciu.

## Czego nie robimy

- Nie zmieniamy logiki `tournament_mode` ani hooka `useTournamentMode` — on jest już dobrze podpięty pod realtime i odświeżanie. Problem nie był w danych, tylko w tym, że telefon dostawał stary JS.
- Nie dotykamy danych w bazie, RLS-ów, edge functions.
- Nie zmieniamy manifestu (`start_url`, `id`, `scope`, `display`) — iOS cache'uje to przy instalacji i nieostrożna zmiana zmusiłaby ludzi do reinstalacji aplikacji z ekranu głównego.
