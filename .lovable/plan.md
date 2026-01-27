
# Plan: Wdrożenie Google Indexing API

## Cel

Automatyczne powiadamianie Google o nowych i zaktualizowanych artykułach, co przyspiesza ich indeksowanie. Dla serwisu newsowego jak Szortsy, gdzie świeżość treści jest kluczowa, to znacząca przewaga SEO.

## Jak to działa?

```text
┌─────────────────┐       ┌────────────────────┐       ┌─────────────────┐
│ Admin dodaje    │──────▶│ Edge function      │──────▶│ Google Indexing │
│ nowy post       │       │ notify-google-index│       │ API             │
└─────────────────┘       └────────────────────┘       └─────────────────┘
                                    │
                                    ▼
                          ┌────────────────────┐
                          │ Google natychmiast │
                          │ indeksuje stronę   │
                          └────────────────────┘
```

Zamiast czekać aż Googlebot sam odkryje nową stronę (godziny/dni), API informuje go w ciągu sekund.

## Wymagania wstępne (jednorazowa konfiguracja)

Przed wdrożeniem potrzebne będzie:

1. **Konto Google Cloud Platform** z włączonym Indexing API
2. **Service Account** z uprawnieniami do Indexing API
3. **Weryfikacja własności strony** w Google Search Console
4. **Klucz JSON Service Account** jako secret w Lovable Cloud

### Instrukcja konfiguracji (dla użytkownika):

1. Wejdź na [Google Cloud Console](https://console.cloud.google.com)
2. Utwórz nowy projekt lub wybierz istniejący
3. Włącz "Indexing API" w Library
4. Utwórz Service Account (IAM → Service Accounts → Create)
5. Pobierz klucz JSON (Actions → Manage Keys → Add Key → JSON)
6. W [Search Console](https://search.console.google.com) dodaj email Service Account jako właściciela witryny
7. Wklej zawartość pliku JSON jako secret `GOOGLE_SERVICE_ACCOUNT_JSON` w Lovable Cloud

## Zmiany techniczne

### 1. Nowa Edge Function: `notify-google-index`

Funkcja odpowiedzialna za:
- Generowanie JWT tokenu z klucza Service Account
- Wysyłanie powiadomień do Google Indexing API
- Obsługę typów: `URL_UPDATED` (nowy/zmieniony) i `URL_DELETED` (usunięty)

```typescript
// supabase/functions/notify-google-index/index.ts

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate JWT for Google API authentication
async function generateGoogleJWT(serviceAccount: any): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/indexing"
  };

  // Sign JWT with private key
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(serviceAccount.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signedJWT = await signJWT(header, payload, key);
  
  // Exchange JWT for access token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${signedJWT}`
  });

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

// Notify Google about URL update
async function notifyGoogle(url: string, type: "URL_UPDATED" | "URL_DELETED", accessToken: string) {
  const response = await fetch(
    "https://indexing.googleapis.com/v3/urlNotifications:publish",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url, type })
    }
  );
  return response.json();
}
```

### 2. Modyfikacja `usePosts.tsx`

Wywołanie edge function po zapisaniu posta:

```typescript
// W useCreatePost i useUpdatePost
onSuccess: async (post) => {
  queryClient.invalidateQueries({ queryKey: ["posts"] });
  
  // Notify Google about new/updated URL
  const postUrl = `https://daily-sport-blink.lovable.app/tag/${generateSlug(post.tags?.[0] || "")}`;
  await supabase.functions.invoke("notify-google-index", {
    body: { 
      urls: [
        `https://daily-sport-blink.lovable.app/`, // Homepage
        // Add tag pages for each tag
        ...post.tags?.map(tag => 
          `https://daily-sport-blink.lovable.app/tag/${generateSlug(tag)}`
        ) || []
      ],
      type: "URL_UPDATED"
    }
  });
  
  toast({ title: "Sukces!", description: "Post opublikowany i zgłoszony do Google" });
};
```

### 3. Limity API

Google Indexing API ma limity:
- **200 URL-i dziennie** (domyślnie)
- Można zwiększyć przez formularz Google

Będziemy wysyłać tylko:
- Stronę główną (przy każdym nowym poście)
- Strony tagów powiązanych z postem
- Nie wysyłamy pojedynczych postów (Szortsy nie ma dedykowanych stron dla artykułów)

### 4. Integracja z edytorem postów

W `PostEditor.tsx` - wyświetlenie statusu:

```typescript
// Po zapisaniu posta
{googleIndexingStatus === "success" && (
  <div className="flex items-center gap-2 text-green-600 text-sm">
    <CheckCircle className="h-4 w-4" />
    Zgłoszono do Google Indexing
  </div>
)}
```

---

## Pliki do utworzenia/modyfikacji

| Plik | Akcja |
|------|-------|
| `supabase/functions/notify-google-index/index.ts` | **Nowy** - Edge function |
| `supabase/config.toml` | Dodanie konfiguracji funkcji |
| `src/hooks/usePosts.tsx` | Wywołanie API po create/update |
| `src/pages/admin/PostEditor.tsx` | Status powiadomienia (opcjonalnie) |

---

## Kolejność wdrożenia

1. **Secret** - Poproszę o dodanie klucza Service Account jako `GOOGLE_SERVICE_ACCOUNT_JSON`
2. **Edge function** - Utworzę `notify-google-index` z pełną logiką JWT i API
3. **Integracja** - Zmodyfikuję hooki do wywoływania funkcji
4. **Testy** - Sprawdzę czy powiadomienia docierają do Google

---

## Korzyści

| Aspekt | Przed | Po |
|--------|-------|-----|
| Czas indeksowania | Godziny/dni | Minuty |
| Wymagana akcja | Czekanie na crawl | Automatyczne |
| Świeżość w Google | Opóźniona | Natychmiastowa |

---

## Uwagi

1. **Wymagana weryfikacja własności** - Service Account musi być właścicielem w Search Console
2. **Limit 200 URL/dzień** - wystarczający dla serwisu newsowego
3. **Nie gwarantuje indeksacji** - Google może odrzucić URL jeśli nie spełnia wymagań jakościowych
4. **Działa tylko dla zweryfikowanych domen** - musi być `daily-sport-blink.lovable.app` lub własna domena
