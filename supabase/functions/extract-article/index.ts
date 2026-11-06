import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============= SECURITY: Authentication & Authorization =============

async function authenticateRequest(
  req: Request,
  requiredRoles: string[] = ["admin", "editor"],
): Promise<{ user: any; error?: Response }> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.error("Missing or invalid authorization header");
    return {
      user: null,
      error: new Response(JSON.stringify({ error: "Brak autoryzacji" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data, error: authError } = await supabase.auth.getClaims(token);

  if (authError || !data?.claims) {
    console.error("Invalid JWT token:", authError?.message);
    return {
      user: null,
      error: new Response(JSON.stringify({ error: "Nieprawidłowy token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }

  const userId = data.claims.sub;

  // Check user roles
  const { data: roles, error: rolesError } = await supabase.from("user_roles").select("role").eq("user_id", userId);

  if (rolesError) {
    console.error("Error fetching user roles:", rolesError.message);
    return {
      user: null,
      error: new Response(JSON.stringify({ error: "Błąd weryfikacji uprawnień" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }

  const userRoles = roles?.map((r) => r.role) || [];
  const hasAccess = userRoles.some((role) => requiredRoles.includes(role));

  if (!hasAccess) {
    console.error(`User ${userId} lacks required roles: ${requiredRoles.join(", ")}`);
    return {
      user: null,
      error: new Response(JSON.stringify({ error: "Brak wymaganych uprawnień (wymagana rola: admin lub editor)" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }

  console.log(`User ${userId} authenticated with roles: ${userRoles.join(", ")}`);
  return { user: { id: userId, roles: userRoles } };
}

// ============= SECURITY: SSRF Protection =============

function validateUrl(urlString: string): { valid: boolean; reason?: string } {
  try {
    const url = new URL(urlString);

    // Only allow HTTP and HTTPS
    if (!["http:", "https:"].includes(url.protocol)) {
      return { valid: false, reason: "Dozwolone tylko protokoły HTTP i HTTPS" };
    }

    const hostname = url.hostname.toLowerCase();

    // Block localhost and loopback
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "0.0.0.0") {
      return { valid: false, reason: "Adresy lokalne są zablokowane" };
    }

    // Block private IP ranges
    const privateIpPatterns = [
      /^10\./, // 10.0.0.0/8
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
      /^192\.168\./, // 192.168.0.0/16
      /^169\.254\./, // Link-local
      /^fe80:/i, // IPv6 link-local
      /^fd[0-9a-f]{2}:/i, // IPv6 unique local
      /^fc[0-9a-f]{2}:/i, // IPv6 unique local
    ];

    for (const pattern of privateIpPatterns) {
      if (pattern.test(hostname)) {
        return { valid: false, reason: "Prywatne zakresy IP są zablokowane" };
      }
    }

    // Block cloud metadata endpoints
    const blockedHostnames = ["metadata.google.internal", "metadata.google.com", "169.254.169.254", "instance-data"];

    for (const blocked of blockedHostnames) {
      if (hostname === blocked || hostname.endsWith("." + blocked)) {
        return { valid: false, reason: "Adresy metadanych chmury są zablokowane" };
      }
    }

    // Block internal/local domains
    if (hostname.endsWith(".internal") || hostname.endsWith(".local") || hostname.endsWith(".localhost")) {
      return { valid: false, reason: "Domeny wewnętrzne są zablokowane" };
    }

    return { valid: true };
  } catch {
    return { valid: false, reason: "Nieprawidłowy format URL" };
  }
}

// ============= Article Processing Functions =============

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, "&");
}

function toPlainText(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

// Many news sites publish the full article text as JSON-LD (NewsArticle.articleBody).
// It is the cleanest source available: no menus, galleries, "czytaj też" boxes or ads.
function extractJsonLdArticleBody(html: string): string | null {
  const blocks = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || [];
  let best = "";
  const visit = (node: unknown): void => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    const obj = node as Record<string, unknown>;
    if (typeof obj.articleBody === "string" && obj.articleBody.length > best.length) {
      best = obj.articleBody;
    }
    if (obj["@graph"]) visit(obj["@graph"]);
  };
  for (const block of blocks) {
    const json = block
      .replace(/^<script[^>]*>/i, "")
      .replace(/<\/script>$/i, "")
      .trim();
    try {
      visit(JSON.parse(json));
    } catch {
      // malformed JSON-LD on the source page - ignore
    }
  }
  const text = toPlainText(best);
  return text.length >= 300 ? text.slice(0, 8000) : null;
}

const NOISE_TAGS = [
  "script",
  "style",
  "noscript",
  "nav",
  "footer",
  "header",
  "aside",
  "form",
  "figure",
  "figcaption",
  "iframe",
  "svg",
  "button",
  "select",
];

const NOISE_PARAGRAPH_RE =
  /^(czytaj (też|także|również|więcej)|zobacz (też|także|również)|przeczytaj (też|także|również)|polecamy|reklama|zdjęcie:|fot\.|źródło:)/i;

function extractTextFromHtml(html: string): string {
  // 1) Structured data, if the source provides it.
  const fromJsonLd = extractJsonLdArticleBody(html);
  if (fromJsonLd) return fromJsonLd;

  // 2) Remove page chrome and media blocks.
  let text = html;
  for (const tag of NOISE_TAGS) {
    text = text.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi"), " ");
  }

  // 3) Pick the main container: the longest <article>, otherwise <main>, otherwise the page.
  const articles = [...text.matchAll(/<article\b[^>]*>([\s\S]*?)<\/article>/gi)].map((m) => m[1]);
  articles.sort((a, b) => b.length - a.length);
  const container = articles[0] ?? text.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? text;

  // 4) Keep real paragraphs and subheadings only. This skips teaser lists,
  //    "read also" boxes, captions and other headlines mixed into the page.
  const blocks = [...container.matchAll(/<(p|h2|h3)\b[^>]*>([\s\S]*?)<\/\1>/gi)]
    .map((m) => ({ tag: m[1].toLowerCase(), text: toPlainText(m[2]) }))
    .filter(({ tag, text }) => (tag === "p" ? text.length >= 40 : text.length >= 10))
    .filter(({ text }) => !NOISE_PARAGRAPH_RE.test(text))
    .map(({ text }) => text);

  const fromParagraphs = blocks.join("\n\n");
  if (fromParagraphs.length >= 300) return fromParagraphs.slice(0, 8000);

  // 5) Fallback: previous behaviour (all text from the container).
  return toPlainText(container).slice(0, 6000);
}

function extractOgImage(html: string): string | null {
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  if (ogImageMatch) {
    return ogImageMatch[1];
  }

  const altMatch = html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
  if (altMatch) {
    return altMatch[1];
  }

  return null;
}

// Default prompts
const DEFAULT_EXTRACTION_PROMPT = `Jesteś asystentem redakcji sportowej Daily Sport Blink. Na podstawie podanego artykułu wygeneruj dane do publikacji.

ZASADY:
1. Tytuł: max 80 znaków, chwytliwy, po polsku, bez clickbaitu
2. Excerpt: max 200 znaków, zachęcający do kliknięcia, streszczający główną myśl
3. Kategoria: wybierz JEDNĄ z: football, basketball, tennis, f1, mma, other
4. Tagi: 3-5 krótkich słów kluczowych (bez #), po polsku

Odpowiedz w formacie JSON zgodnym ze schematem.`;

const DEFAULT_CONTENT_PROMPT = `Na podstawie oryginalnego artykułu napisz unikatową, skróconą wersję newsa sportowego w języku polskim.

ZASADY TREŚCI:
- 300-500 słów
- Prosty, angażujący język
- Wszystkie kluczowe fakty z oryginału
- Dynamiczny, dziennikarski ton
- 3-5 akapitów (każdy 2-4 zdania)
- Bez powtarzania tytułu na początku

FORMATOWANIE (OBOWIĄZKOWE):
- Używaj TYLKO tagów HTML, NIE składni Markdown!
- <strong>tekst</strong> dla pogrubienia (NIE ** **)
- <em>tekst</em> dla kursywy (NIE * *)
- Każdy akapit otocz tagiem <p>...</p>
- Oddzielaj akapity pustą linią dla czytelności

LINKOWANIE WEWNĘTRZNE (SEO - OBOWIĄZKOWE, RYGORYSTYCZNE):
- Jeśli otrzymasz listę powiązanych artykułów, MOŻESZ dodać sekcję "Przeczytaj również" na końcu (1-2 linki).
- Format sekcji: <p><strong>Przeczytaj również:</strong></p> a następnie <ul> z linkami <li>.
- Format linku: <a href="/blink/SLUG">TEKST</a>

ABSOLUTNIE KRYTYCZNE - bez wyjątków:
1. SLUG i TEKST MUSZĄ pochodzić z TEJ SAMEJ pozycji listy "POWIĄZANE ARTYKUŁY". Każdy wiersz listy ma format: - "TYTUŁ" → /blink/SLUG.
2. TEKST kotwicy MUSI być dosłownym tytułem (lub jego skróconą wersją zawierającą min. 3 kluczowe słowa z tytułu). NIE WOLNO wymyślać własnych tytułów, parafrazować ani łączyć tematów.
3. NIE WOLNO mieszać: tekst z jednej linii listy + slug z innej. To bug krytyczny.
4. Jeśli żaden powiązany artykuł NIE pasuje tematycznie do tego newsa → CAŁKOWICIE pomiń sekcję "Przeczytaj również". Lepiej brak linku niż zły link.
5. Linkuj wyłącznie do artykułów, które rzeczywiście rozwijają temat (np. ten sam zawodnik, drużyna, turniej, wydarzenie).`;

/**
 * Validates AI-generated <a href="/blink/SLUG">TEXT</a> links against the allow-list
 * of related posts. Strips any link whose slug is unknown OR whose anchor text
 * doesn't share at least one meaningful word (>=4 chars) with the target post title.
 * Also removes leftover empty <ul></ul> and orphan "Przeczytaj również" headers.
 */
function validateInternalLinks(content: string, relatedPosts: Array<{ title: string; slug: string }>): string {
  const allowed = new Map(relatedPosts.map((p) => [p.slug, p.title]));
  let stripped = 0;

  let result = content.replace(
    /<a\s+[^>]*href="\/blink\/([^"]+)"[^>]*>([\s\S]*?)<\/a>/g,
    (_full, slug: string, inner: string) => {
      const targetTitle = allowed.get(slug);
      if (!targetTitle) {
        stripped++;
        console.warn(`[link-validator] Unknown slug "/blink/${slug}" - stripping link.`);
        return inner;
      }
      const plainAnchor = inner.replace(/<[^>]+>/g, "").toLowerCase();
      const titleLower = targetTitle.toLowerCase();
      // Letters only (>=4 chars). Excludes pure-number tokens like "2026" which
      // would otherwise cause false matches across many sports articles.
      const words = plainAnchor.match(/[\p{L}]{4,}/gu) || [];
      const matches = words.filter((w) => titleLower.includes(w)).length;
      if (matches < 1) {
        stripped++;
        console.warn(
          `[link-validator] Anchor "${plainAnchor.slice(0, 60)}" doesn't match target title "${targetTitle.slice(0, 60)}" - stripping link.`,
        );
        return inner;
      }
      return _full;
    },
  );

  if (stripped > 0) {
    result = result.replace(/<ul>\s*(<li>\s*<\/li>\s*)*<\/ul>/g, "");
    result = result.replace(/<p>\s*<strong>\s*Przeczytaj również:?\s*<\/strong>\s*<\/p>\s*(?!<ul)/gi, "");
    console.log(`[link-validator] Stripped ${stripped} bad internal link(s).`);
  }

  return result;
}

// ============= Output cleanup =============

const normalizeForCompare = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

const LEADING_SEO_TITLE_RE =
  /^(\s*(?:<p\b[^>]*>\s*)?)\[[^\]\r\n]{2,60}\]\s*[^<\r\n]*?\|\s*Szortsy(?:\.pl)?[ \t]*/i;

const stripLeadingSeoTitle = (content: string): string =>
  content
    .replace(LEADING_SEO_TITLE_RE, "$1")
    .replace(/^(\s*<p\b[^>]*>)\s*<\/p>/i, "")
    .replace(/^(?:[ \t]*\r?\n)+/, "");

// Removes artefacts the model sometimes adds to the article body: a repeated
// title, an <h1>, a leading social/SEO title, hashtag lines or a code fence.
function cleanGeneratedContent(content: string, title: string): string {
  let out = content.trim();
  out = out.replace(/^```(?:html)?\s*/i, "").replace(/\s*```$/, "");
  out = out.replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi, "");
  out = stripLeadingSeoTitle(out);

  const normalizedTitle = normalizeForCompare(title || "");
  let removed = 0;
  out = out.replace(/<p\b[^>]*>([\s\S]*?)<\/p>/gi, (full: string, inner: string) => {
    const text = toPlainText(inner);
    const drop =
      !text ||
      (text.match(/(^|\s)#\p{L}[\p{L}\p{N}_]+/gu) || []).length >= 2 ||
      (normalizedTitle !== "" && normalizeForCompare(text) === normalizedTitle);
    if (drop && text) removed++;
    return drop ? "" : full;
  });
  if (removed > 0) console.log(`[cleanup] Removed ${removed} artefact paragraph(s) from generated content.`);

  return out.replace(/\n{3,}/g, "\n\n").trim();
}

function cleanMetaText(value: unknown): string {
  return String(value ?? "")
    .replace(/^\s*\[[^\]]{2,40}\]\s*/, "")
    .replace(/\s*[|–-]\s*Szortsy(\.pl)?\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

const ALLOWED_CATEGORIES = ["football", "basketball", "tennis", "f1", "mma", "other"];

// Appended to the prompt from settings so that an edited prompt can never
// break the JSON parsing below.
const METADATA_OUTPUT_RULES = `

FORMAT ODPOWIEDZI (OBOWIĄZKOWY):
Zwróć TYLKO JSON, bez żadnego dodatkowego tekstu, bez bloku kodu i bez markdown:
{"title": "...", "excerpt": "...", "category": "...", "tags": ["...", "..."]}
- category: dokładnie jedna z wartości: ${ALLOWED_CATEGORIES.join(", ")}
- tags: tablica 3-5 elementów`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ============= SECURITY: Authenticate user =============
    const { user, error: authError } = await authenticateRequest(req, ["admin", "editor"]);
    if (authError) return authError;

    const { url } = await req.json();

    if (!url) {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ============= SECURITY: Validate URL (SSRF protection) =============
    const urlCheck = validateUrl(url);
    if (!urlCheck.valid) {
      console.error(`SSRF protection blocked URL: ${url} - Reason: ${urlCheck.reason}`);
      return new Response(JSON.stringify({ error: urlCheck.reason }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`User ${user.id} extracting article from URL: ${url}`);

    // Browser-like headers to avoid bot detection
    const browserHeaders = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "pl,en-US;q=0.9,en;q=0.8",
    };

    // Fetch the article HTML
    let html: string;
    const response = await fetch(url, { headers: browserHeaders });

    if (!response.ok && [403, 503].includes(response.status)) {
      // Fallback to Firecrawl for anti-bot protected sites
      const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
      if (firecrawlKey) {
        console.log(`Fallback to Firecrawl for anti-bot bypass (status: ${response.status})`);
        const fcResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${firecrawlKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url,
            formats: ["html"],
            onlyMainContent: false,
          }),
        });

        if (!fcResponse.ok) {
          const fcError = await fcResponse.text();
          console.error("Firecrawl API error:", fcResponse.status, fcError);
          return new Response(JSON.stringify({ error: `Firecrawl error: ${fcResponse.status}` }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const fcData = await fcResponse.json();
        html = fcData.data?.html || "";

        if (!html) {
          console.error("Firecrawl returned empty HTML");
          return new Response(JSON.stringify({ error: "Firecrawl nie zwrócił treści strony" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        console.log("Successfully fetched via Firecrawl, HTML length:", html.length);
      } else {
        console.error("Site blocked request (403/503) and Firecrawl not configured");
        return new Response(
          JSON.stringify({ error: "Strona blokuje boty (403). Skonfiguruj Firecrawl aby ominąć zabezpieczenia." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    } else if (!response.ok) {
      console.error("Failed to fetch URL:", response.status);
      return new Response(JSON.stringify({ error: `Failed to fetch URL: ${response.status}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      html = await response.text();
    }
    let articleText = extractTextFromHtml(html);
    const ogImage = extractOgImage(html);

    // Track extraction metadata for quality warnings
    const originalTextLength = articleText.length;
    let usedFirecrawl = false;

    console.log("Extracted text length:", articleText.length);
    console.log("Found OG image:", ogImage);

    // Fallback to Firecrawl when extracted text is too short (JS-rendered pages)
    const MIN_TEXT_LENGTH = 100;
    if (articleText.length < MIN_TEXT_LENGTH) {
      const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
      if (firecrawlKey) {
        console.log(`Text too short (${articleText.length} chars), falling back to Firecrawl for JS rendering`);

        const fcResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${firecrawlKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url,
            formats: ["html"],
            onlyMainContent: true,
          }),
        });

        if (fcResponse.ok) {
          const fcData = await fcResponse.json();
          const firecrawlHtml = fcData.data?.html || "";

          if (firecrawlHtml) {
            articleText = extractTextFromHtml(firecrawlHtml);
            usedFirecrawl = true;
            console.log("Firecrawl rendered text length:", articleText.length);
          } else {
            console.warn("Firecrawl returned empty HTML, continuing with original");
          }
        } else {
          const fcError = await fcResponse.text();
          console.warn("Firecrawl fallback failed:", fcResponse.status, fcError);
        }
      } else {
        console.warn(`Text too short (${articleText.length} chars) but Firecrawl not configured`);
      }
    }

    // Block AI generation if text is too short (would cause hallucinations)
    const ABSOLUTE_MIN_TEXT = 200;
    if (articleText.length < ABSOLUTE_MIN_TEXT) {
      console.error(`Text too short for AI generation: ${articleText.length} chars (minimum: ${ABSOLUTE_MIN_TEXT})`);
      return new Response(
        JSON.stringify({
          error: `Strona zwróciła tylko ${articleText.length} znaków - za mało do wygenerowania artykułu. Spróbuj wkleić treść ręcznie.`,
          extraction_failed: true,
          text_length: articleText.length,
          used_firecrawl: usedFirecrawl,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Get prompts from database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const [extractionPromptResult, contentPromptResult] = await Promise.all([
      supabase.from("settings").select("value").eq("key", "article_extraction_prompt").single(),
      supabase.from("settings").select("value").eq("key", "article_content_prompt").single(),
    ]);

    const extractionPrompt = extractionPromptResult.data?.value || DEFAULT_EXTRACTION_PROMPT;

    let contentPrompt = contentPromptResult.data?.value || DEFAULT_CONTENT_PROMPT;

    const hasHtmlRules =
      contentPrompt.includes("<strong>") ||
      contentPrompt.includes("NIE używaj Markdown") ||
      contentPrompt.includes("NIE składni Markdown") ||
      contentPrompt.includes("TYLKO tagów HTML");

    if (!hasHtmlRules) {
      const htmlFormattingRules = `

FORMATOWANIE (OBOWIĄZKOWE):
- Używaj TYLKO tagów HTML, NIE składni Markdown!
- <strong>tekst</strong> dla pogrubienia (NIE ** **)
- <em>tekst</em> dla kursywy (NIE * *)
- Każdy akapit otocz tagiem <p>...</p>`;

      contentPrompt = contentPrompt + htmlFormattingRules;
      console.log("Appended HTML formatting rules to content prompt");
    }

    // Applies to custom admin prompts too: metadata belongs in metadata, never in the body.
    contentPrompt += `

PIERWSZY AKAPIT (OBOWIĄZKOWE):
- Rozpocznij od merytorycznego leadu artykułu.
- NIE dodawaj tytułu SEO, nazwy kategorii w nawiasach kwadratowych ani podpisu serwisu.
- NIE używaj formatu "[Kategoria] Tytuł | Szortsy.pl" ani żadnego jego wariantu.`;

    console.log("Using prompts from settings");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Helper: call AI with automatic fallback (Gemini → GPT-mini on 500) and timeout
    const AI_TIMEOUT_MS = 50000; // 50s timeout per AI call
    const callAI = async (messages: Array<{ role: string; content: string }>, label: string) => {
      const primaryModel = "google/gemini-3-flash-preview";
      const fallbackModel = "openai/gpt-5-mini";

      const tryModel = async (model: string, signal: AbortSignal) => {
        return fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ model, messages }),
          signal,
        });
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

      try {
        console.log(`[${label}] Calling AI with model ${primaryModel}...`);
        let response = await tryModel(primaryModel, controller.signal);

        if (response.status === 500 || response.status === 503) {
          console.warn(`[${label}] Primary model returned ${response.status}, falling back to ${fallbackModel}`);
          response = await tryModel(fallbackModel, controller.signal);
        }

        console.log(`[${label}] AI responded with status ${response.status}`);
        return response;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          throw new Error(`AI nie odpowiedziało w czasie (${label} timeout ${AI_TIMEOUT_MS / 1000}s)`);
        }
        throw err;
      } finally {
        clearTimeout(timeoutId);
      }
    };

    // Step 1: Extract metadata (title, excerpt, category, tags)
    // Uses the prompt from Admin -> Settings (previously it was loaded but ignored).
    const metadataResponse = await callAI(
      [
        {
          role: "system",
          content: extractionPrompt + METADATA_OUTPUT_RULES,
        },
        { role: "user", content: `Przeanalizuj ten artykuł:\n\n${articleText}` },
      ],
      "metadata",
    );

    if (!metadataResponse.ok) {
      if (metadataResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (metadataResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await metadataResponse.text();
      console.error("AI Gateway error (metadata):", metadataResponse.status, errorText);
      throw new Error(`AI Gateway error: ${metadataResponse.status}`);
    }

    const metadataData = await metadataResponse.json();
    const metadataContent = metadataData.choices?.[0]?.message?.content;
    if (!metadataContent) {
      throw new Error("Invalid AI response format for metadata");
    }

    // Strip markdown code blocks if present
    const cleanedMetadata = metadataContent
      .replace(/```(?:json)?\n?/g, "")
      .replace(/```/g, "")
      .trim();
    const extractedMetadata = JSON.parse(cleanedMetadata);
    extractedMetadata.title = cleanMetaText(extractedMetadata.title);
    extractedMetadata.excerpt = cleanMetaText(extractedMetadata.excerpt);
    extractedMetadata.category = ALLOWED_CATEGORIES.includes(String(extractedMetadata.category))
      ? extractedMetadata.category
      : "other";
    extractedMetadata.tags = Array.isArray(extractedMetadata.tags)
      ? [...new Set(extractedMetadata.tags.map((t: unknown) => cleanMetaText(t)).filter(Boolean))].slice(0, 5)
      : [];
    console.log("Extracted metadata:", extractedMetadata);

    // Step 1.5: Fetch related posts for internal linking.
    // First posts sharing tags with this article (same player/team/competition),
    // then the newest posts from the same category to fill the list.
    let relatedContext = "";
    let relatedPosts: Array<{ title: string; slug: string }> = [];
    try {
      const tagList: string[] = extractedMetadata.tags;
      const tagLower = tagList.map((t) => t.toLowerCase());
      let byTags: Array<{ title: string; slug: string }> = [];

      if (tagList.length > 0) {
        const { data: tagged } = await supabase
          .from("posts")
          .select("title, slug, tags")
          .eq("is_hidden", false)
          .overlaps("tags", tagList)
          .order("published_at", { ascending: false })
          .limit(30);

        const taggedRows = (tagged || []) as Array<{ title: string; slug: string; tags: string[] | null }>;
        byTags = taggedRows
          .map((p) => ({
            title: p.title,
            slug: p.slug,
            shared: (p.tags || []).filter((t) => tagLower.includes(String(t).toLowerCase())).length,
          }))
          .sort((a, b) => b.shared - a.shared)
          .slice(0, 8)
          .map(({ title, slug }) => ({ title, slug }));
      }

      let byCategory: Array<{ title: string; slug: string }> = [];
      const { data: categoryData } = await supabase
        .from("sport_categories")
        .select("id")
        .eq("slug", extractedMetadata.category)
        .maybeSingle();

      if (categoryData?.id) {
        const { data: fetched } = await supabase
          .from("posts")
          .select("title, slug")
          .eq("category_id", categoryData.id)
          .eq("is_hidden", false)
          .order("published_at", { ascending: false })
          .limit(10);
        byCategory = (fetched || []) as Array<{ title: string; slug: string }>;
      }

      const seen = new Set<string>();
      relatedPosts = [...byTags, ...byCategory]
        .filter((p) => p?.slug && p?.title && !seen.has(p.slug) && seen.add(p.slug))
        .slice(0, 10);

      if (relatedPosts.length > 0) {
        relatedContext = relatedPosts.map((p) => `- "${p.title}" → /blink/${p.slug}`).join("\n");
        console.log(`Found ${relatedPosts.length} related posts (${byTags.length} by tags) for internal linking`);
      }
    } catch (relatedError) {
      console.warn("Failed to fetch related posts for internal linking:", relatedError);
      // Continue without related posts - not critical
    }

    // Step 2: Generate full article content
    const contentResponse = await callAI(
      [
        {
          role: "system",
          content: contentPrompt,
        },
        {
          role: "user",
          content: `Tytuł: ${extractedMetadata.title}

${
  relatedContext
    ? `POWIĄZANE ARTYKUŁY NA STRONIE (do linkowania wewnętrznego - wybierz 1-2 najbardziej pasujące):
${relatedContext}`
    : "Brak powiązanych artykułów do linkowania."
}

Oryginalny artykuł:
${articleText}`,
        },
      ],
      "content",
    );

    let generatedContent = "";

    if (contentResponse.ok) {
      const contentData = await contentResponse.json();
      generatedContent = contentData.choices?.[0]?.message?.content || "";
      console.log("Generated content length:", generatedContent.length);

      if (generatedContent.includes("**")) {
        console.warn("AI used Markdown despite HTML instructions, converting...");
        generatedContent = generatedContent.replace(/\*\*\*([^*]+)\*\*\*/g, "<strong><em>$1</em></strong>");
        generatedContent = generatedContent.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
        generatedContent = generatedContent.replace(/(?<![a-zA-Z0-9])\*([^*]+)\*(?![a-zA-Z0-9])/g, "<em>$1</em>");
      }
    } else {
      const errText = await contentResponse.text();
      console.error("Content generation failed:", contentResponse.status, errText);
    }

    // Step 2.5: Validate internal /blink/ links to prevent AI hallucinating wrong slug<->anchor pairs
    if (generatedContent && generatedContent.includes('href="/blink/')) {
      generatedContent = validateInternalLinks(generatedContent, relatedPosts);
    }

    if (generatedContent) {
      generatedContent = cleanGeneratedContent(generatedContent, extractedMetadata.title);
    }

    // Add extraction quality metadata for frontend warnings
    const QUALITY_WARNING_THRESHOLD = 500;

    const result = {
      ...extractedMetadata,
      content: generatedContent,
      og_image: ogImage,
      extraction_info: {
        original_text_length: originalTextLength,
        final_text_length: articleText.length,
        used_firecrawl: usedFirecrawl,
        quality_warning: articleText.length < QUALITY_WARNING_THRESHOLD,
      },
    };

    console.log("Extraction complete:", {
      ...result,
      content: result.content ? `${result.content.substring(0, 100)}...` : null,
      extraction_info: result.extraction_info,
    });

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in extract-article:", errorMessage, error instanceof Error ? error.stack : "");
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
