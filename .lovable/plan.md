

# Plan: Naprawa ekstrakcji artykułów dla stron z ochroną anti-bot

## Problem
Strona fcbarca.com (i inne z ochroną anti-bot) zwraca błąd **403 Forbidden** ponieważ rozpoznaje nasz User-Agent jako bota.

## Rozwiązanie
Dodać **Firecrawl** jako alternatywny fallback gdy prosty `fetch` zawiedzie.

## Implementacja

| Element | Zmiana |
|---------|--------|
| Edge function `extract-article` | Dodanie fallbacku do Firecrawl przy błędzie 403/503 |
| Konektor Firecrawl | Wymagane podłączenie konektora |

---

## Szczegóły techniczne

### 1. Logika fallback w edge function

```text
+-----------------------+
|   fetch(url)          |
+-----------+-----------+
            |
     sukces? |
            v
  +----+----+----+
  | tak         | nie (403/503)
  v             v
  kontynuuj   +------------------+
              | Firecrawl.scrape |
              +---------+--------+
                        |
                        v
                  kontynuuj z HTML
```

### 2. Zmiany w kodzie

**Krok 1**: Ulepszyć User-Agent na bardziej realistyczny:
```typescript
headers: {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "pl,en-US;q=0.9,en;q=0.8",
}
```

**Krok 2**: Dodać fallback do Firecrawl:
```typescript
// Pierwsze pobieranie - standardowy fetch
let html: string;
const response = await fetch(url, { headers: browserHeaders });

if (!response.ok && [403, 503].includes(response.status)) {
  // Fallback do Firecrawl
  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (firecrawlKey) {
    console.log("Fallback to Firecrawl for anti-bot bypass");
    const fcResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["html"],
        onlyMainContent: false,
      }),
    });
    const fcData = await fcResponse.json();
    html = fcData.data?.html || "";
  } else {
    throw new Error("Strona blokuje boty (403). Skonfiguruj Firecrawl aby ominąć zabezpieczenia.");
  }
} else if (!response.ok) {
  throw new Error(`Failed to fetch URL: ${response.status}`);
} else {
  html = await response.text();
}
```

### 3. Wymagane kroki

1. **Podłączyć konektor Firecrawl** w ustawieniach projektu
2. **Zaktualizować edge function** z nową logiką fallback
3. **Przetestować** z problematycznym URL

### 4. Alternatywa bez Firecrawl

Jeśli nie chcesz używać Firecrawl, możemy tylko ulepszyć User-Agent - to pomoże z niektórymi stronami, ale nie ze wszystkimi.

## Bezpieczeństwo

- Firecrawl API key będzie przechowywany jako secret w Supabase
- Nie zmienia to istniejących zabezpieczeń SSRF
- Rate limiting pozostaje bez zmian

