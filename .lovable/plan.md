

## Problem: Statyczne meta tagi w `index.html` vs dynamiczne z JS

### Diagnoza
Screenshot użytkownika to **View Source** (surowy HTML serwera). W SPA:
- `index.html` serwuje **stałe** meta tagi (og:url, og:title, og:description) — linie 21-27
- React hook `useSEOMeta` nadpisuje je **dopiero po załadowaniu JS**
- "View Source" zawsze pokazuje surowy HTML — canonical/og:url tam nie zmienią się dynamicznie
- Facebook/Twitter crawlery **nie wykonują JS** → zawsze widzą wartości z `index.html`
- Googlebot wykonuje JS, więc widzi poprawne wartości (ale z opóźnieniem)

### Co zrobić

**Opcja A — Minimalna (zalecana)**: Usunąć/wyczyścić statyczne meta tagi z `index.html`, zostawić dynamiczne z JS.
- Googlebot (wykonuje JS) → widzi poprawne canonical i og:url
- Social crawlery → widzą domyślne/puste wartości (mniej idealne, ale nie mylące)

Zmiany w `index.html`:
- Usunąć `og:url` (linia 24) — React i tak to ustawi dynamicznie
- Zostawić og:title/description jako fallback dla homepage

**Opcja B — Pełna (SSR/prerendering)**: Użyć usługi prerendering (np. prerender.io, Cloudflare Workers) żeby serwować crawlerom pełny HTML z poprawnymi meta tagami. To jedyne 100% rozwiązanie dla social media preview na podstronach SPA.

### Plan zmian (Opcja A)

| Plik | Zmiana |
|---|---|
| `index.html` | Usunąć `<meta property="og:url" content="https://szortsy.pl" />` (linia 24) |
| `index.html` | Usunąć `<meta property="og:type" content="website" />` (linia 23) — React ustawi dynamicznie |

To sprawi że "View Source" nie będzie pokazywać mylącego canonical/og:url. Googlebot (który wykonuje JS) zobaczy poprawne dynamiczne wartości.

### Ograniczenia
Bez SSR/prerendering, social media preview (Facebook, Twitter) dla podstron artykułów zawsze pokaże domyślny og:title/og:description z index.html zamiast tytułu artykułu. Jeśli social preview jest ważne — potrzebny jest prerendering.

