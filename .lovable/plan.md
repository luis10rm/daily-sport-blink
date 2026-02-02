
# Naprawa brakującego meta tagu robots

## Problem

Tag `<meta name="robots" content="index, follow">` nie pojawia się na stronach artykułów z dwóch powodów:

1. **Brak statycznego tagu w `index.html`** - hook `useSEOMeta` musi go tworzyć od zera
2. **Błąd w funkcji `setMeta`** - niepoprawne parsowanie selektora CSS powoduje złe tworzenie atrybutu

## Zmiany do wykonania

### Plik 1: `index.html`

Dodanie statycznego tagu robots zaraz po `<meta name="author">`:

```html
<meta name="robots" content="index, follow" />
```

### Plik 2: `src/hooks/useSEOMeta.ts`

Przepisanie funkcji `setMeta` z jawnym określeniem typu atrybutu zamiast parsowania selektora:

**Przed:**
```typescript
const setMeta = (selector: string, content: string, attr = "content") => {
  let meta = document.querySelector(selector) as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement("meta");
    const [type, value] = selector.replace(/[\[\]"]/g, "").split("=");
    if (type.includes("property")) {
      meta.setAttribute("property", value);
    } else {
      meta.setAttribute("name", value);
    }
    document.head.appendChild(meta);
  }
  meta.setAttribute(attr, content);
};

// Użycie:
setMeta('meta[name="robots"]', robots);
```

**Po:**
```typescript
const setMeta = (type: 'name' | 'property', name: string, content: string) => {
  const selector = `meta[${type}="${name}"]`;
  let meta = document.querySelector(selector) as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(type, name);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);
};

// Użycie:
setMeta('name', 'robots', robots);
setMeta('property', 'og:title', fullTitle);
```

## Aktualizacja wszystkich wywołań setMeta

Zmiana składni we wszystkich miejscach:

| Stara składnia | Nowa składnia |
|----------------|---------------|
| `setMeta('meta[name="description"]', description)` | `setMeta('name', 'description', description)` |
| `setMeta('meta[name="robots"]', robots)` | `setMeta('name', 'robots', robots)` |
| `setMeta('meta[property="og:title"]', fullTitle)` | `setMeta('property', 'og:title', fullTitle)` |
| `setMeta('meta[property="og:description"]', description)` | `setMeta('property', 'og:description', description)` |
| ... i pozostałe tagi OG, Twitter, article | ... analogicznie |

## Podsumowanie zmian

| Plik | Zmiana |
|------|--------|
| `index.html` | Dodanie `<meta name="robots" content="index, follow" />` po linii 18 |
| `src/hooks/useSEOMeta.ts` | Przepisanie funkcji `setMeta` (linie 68-81) i aktualizacja wszystkich jej wywołań (linie 101-145) |

## Rezultat

Po wdrożeniu tag `<meta name="robots" content="index, follow">` będzie:
- Obecny statycznie w HTML (dla crawlerów bez JS)
- Dynamicznie aktualizowany przez hook (np. `noindex` dla stron admina)
