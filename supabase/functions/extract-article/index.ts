import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============= SECURITY: Authentication & Authorization =============

async function authenticateRequest(
  req: Request,
  requiredRoles: string[] = ["admin", "editor"]
): Promise<{ user: any; error?: Response }> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.error("Missing or invalid authorization header");
    return {
      user: null,
      error: new Response(
        JSON.stringify({ error: "Brak autoryzacji" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      ),
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
      error: new Response(
        JSON.stringify({ error: "Nieprawidłowy token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      ),
    };
  }

  const userId = data.claims.sub;

  // Check user roles
  const { data: roles, error: rolesError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (rolesError) {
    console.error("Error fetching user roles:", rolesError.message);
    return {
      user: null,
      error: new Response(
        JSON.stringify({ error: "Błąd weryfikacji uprawnień" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      ),
    };
  }

  const userRoles = roles?.map((r) => r.role) || [];
  const hasAccess = userRoles.some((role) => requiredRoles.includes(role));

  if (!hasAccess) {
    console.error(`User ${userId} lacks required roles: ${requiredRoles.join(", ")}`);
    return {
      user: null,
      error: new Response(
        JSON.stringify({ error: "Brak wymaganych uprawnień (wymagana rola: admin lub editor)" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      ),
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
      /^10\./,                          // 10.0.0.0/8
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
      /^192\.168\./,                    // 192.168.0.0/16
      /^169\.254\./,                    // Link-local
      /^fe80:/i,                        // IPv6 link-local
      /^fd[0-9a-f]{2}:/i,               // IPv6 unique local
      /^fc[0-9a-f]{2}:/i,               // IPv6 unique local
    ];

    for (const pattern of privateIpPatterns) {
      if (pattern.test(hostname)) {
        return { valid: false, reason: "Prywatne zakresy IP są zablokowane" };
      }
    }

    // Block cloud metadata endpoints
    const blockedHostnames = [
      "metadata.google.internal",
      "metadata.google.com",
      "169.254.169.254",
      "instance-data",
    ];

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

function extractTextFromHtml(html: string): string {
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  text = text.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "");
  text = text.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "");
  text = text.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "");
  text = text.replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, "");

  const articleMatch = text.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch) {
    text = articleMatch[1];
  } else {
    const mainMatch = text.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    if (mainMatch) {
      text = mainMatch[1];
    }
  }

  text = text.replace(/<[^>]+>/g, " ");
  text = text.replace(/&nbsp;/g, " ");
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/\s+/g, " ").trim();

  return text.slice(0, 6000);
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
- Oddzielaj akapity pustą linią dla czytelności`;

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
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============= SECURITY: Validate URL (SSRF protection) =============
    const urlCheck = validateUrl(url);
    if (!urlCheck.valid) {
      console.error(`SSRF protection blocked URL: ${url} - Reason: ${urlCheck.reason}`);
      return new Response(
        JSON.stringify({ error: urlCheck.reason }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`User ${user.id} extracting article from URL: ${url}`);

    // Fetch the article HTML
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; DailySportBot/1.0)",
        "Accept": "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch URL:", response.status);
      return new Response(
        JSON.stringify({ error: `Failed to fetch URL: ${response.status}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const html = await response.text();
    const articleText = extractTextFromHtml(html);
    const ogImage = extractOgImage(html);

    console.log("Extracted text length:", articleText.length);
    console.log("Found OG image:", ogImage);

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

    const hasHtmlRules = contentPrompt.includes("<strong>") ||
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

    console.log("Using prompts from settings");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Step 1: Extract metadata (title, excerpt, category, tags)
    const metadataResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: extractionPrompt },
          { role: "user", content: `Przeanalizuj ten artykuł i wygeneruj dane:\n\n${articleText}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_article_data",
              description: "Ekstraktuj dane z artykułu sportowego",
              parameters: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    description: "Tytuł artykułu (max 80 znaków, po polsku)"
                  },
                  excerpt: {
                    type: "string",
                    description: "Krótki opis (max 200 znaków, zachęcający)"
                  },
                  category: {
                    type: "string",
                    enum: ["football", "basketball", "tennis", "f1", "mma", "other"],
                    description: "Kategoria sportowa"
                  },
                  tags: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 tagów (krótkie słowa kluczowe)"
                  },
                },
                required: ["title", "excerpt", "category", "tags"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_article_data" } },
      }),
    });

    if (!metadataResponse.ok) {
      if (metadataResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (metadataResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await metadataResponse.text();
      console.error("AI Gateway error (metadata):", metadataResponse.status, errorText);
      throw new Error(`AI Gateway error: ${metadataResponse.status}`);
    }

    const metadataData = await metadataResponse.json();
    const metadataToolCall = metadataData.choices?.[0]?.message?.tool_calls?.[0];
    if (!metadataToolCall || metadataToolCall.function.name !== "extract_article_data") {
      throw new Error("Invalid AI response format for metadata");
    }

    const extractedMetadata = JSON.parse(metadataToolCall.function.arguments);
    console.log("Extracted metadata:", extractedMetadata);

    // Step 2: Generate full article content
    const contentResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: contentPrompt },
          {
            role: "user",
            content: `Tytuł: ${extractedMetadata.title}\n\nOryginalny artykuł:\n${articleText}`
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_article_content",
              description: "Wygeneruj pełną treść artykułu sportowego",
              parameters: {
                type: "object",
                properties: {
                  content: {
                    type: "string",
                    description: "Pełna treść artykułu (300-500 słów, po polsku, podzielona na akapity)"
                  },
                },
                required: ["content"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_article_content" } },
      }),
    });

    let generatedContent = "";

    if (contentResponse.ok) {
      const contentData = await contentResponse.json();
      const contentToolCall = contentData.choices?.[0]?.message?.tool_calls?.[0];
      if (contentToolCall && contentToolCall.function.name === "generate_article_content") {
        const contentResult = JSON.parse(contentToolCall.function.arguments);
        generatedContent = contentResult.content || "";
        console.log("Generated content length:", generatedContent.length);

        if (generatedContent.includes("**")) {
          console.warn("AI used Markdown despite HTML instructions, converting...");
          generatedContent = generatedContent.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
          generatedContent = generatedContent.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
          generatedContent = generatedContent.replace(/(?<![a-zA-Z0-9])\*([^*]+)\*(?![a-zA-Z0-9])/g, '<em>$1</em>');
        }
      }
    } else {
      console.error("Content generation failed, continuing without content");
    }

    const result = {
      ...extractedMetadata,
      content: generatedContent,
      og_image: ogImage,
    };

    console.log("Extraction complete:", {
      ...result,
      content: result.content ? `${result.content.substring(0, 100)}...` : null,
    });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in extract-article:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
