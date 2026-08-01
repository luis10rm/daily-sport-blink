Problem: Strona `/start` (onboarding landing page) nie jest podpięta do routera. Komponent `src/pages/StartPage.tsx` istnieje, ale `App.tsx` go nie importuje i nie ma route `/start`, więc użytkownik trafia na `NotFound`.

Rozwiązanie:
1. Import `StartPage` w `src/App.tsx` (obok innych stron).
2. Dodanie `<Route path="/start" element={<StartPage />} />` w `Routes` w `App.tsx`, przed catch-all `*`.
3. Weryfikacja w podglądzie: otwarcie `/start`, sprawdzenie czy strona się renderuje, przycisk "Sprawdzam" prowadzi do `/`, a przycisk X zamyka do `/`.

Zakres: tylko frontend/routing. Żadna zmiana w backendzie, SEO, ani treści samej strony startowej nie jest potrzebna.