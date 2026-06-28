import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function authenticate(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: new Response(JSON.stringify({ error: "Brak autoryzacji" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }) };
  }
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data, error } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
  if (error || !data?.claims) {
    return { error: new Response(JSON.stringify({ error: "Nieprawidłowy token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }) };
  }
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.claims.sub);
  const hasAccess = (roles ?? []).some((r: any) => ["admin", "editor"].includes(r.role));
  if (!hasAccess) {
    return { error: new Response(JSON.stringify({ error: "Brak uprawnień" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }) };
  }
  return { ok: true };
}

const SYSTEM_PROMPT = `Jesteś doświadczonym recenzentem technologii dla polskiego portalu "Szortsy Recki". Piszesz uczciwe, konkretne i rzeczowe recenzje produktów (sprzęt, gadżety, aplikacje, gry).

Zawsze zwracaj WYŁĄCZNIE poprawny JSON o strukturze:
{
  "title": "Tytuł recenzji (max 80 zn., konkretny, z nazwą produktu)",
  "product_brand": "Marka",
  "product_name": "Nazwa produktu",
  "excerpt": "1-2 zdania wprowadzenia (max 200 zn.)",
  "verdict": "2-4 zdania werdyktu — komu polecasz, komu nie",
  "score": 7.5,
  "pros": ["3-6 konkretnych plusów"],
  "cons": ["2-5 konkretnych minusów"],
  "content": "<p>HTML treści recenzji 600-1200 słów. Używaj <h2>, <h3>, <p>, <ul>, <li>, <strong>. Sekcje: Wprowadzenie, Wykonanie, Wydajność, Codzienne użytkowanie, Cena. NIE dodawaj nagłówków 'Plusy', 'Minusy', 'Werdykt' — to osobne pola."
}

Reguły:
- Pisz po polsku, naturalnie, bez marketingowego bełkotu.
- Ocena 1-10 (krok 0.5). Skala: 9+ wybitny, 8 świetny, 7 dobry, 6 średni, 5 słaby.
- Bez halucynacji cen — pisz "około X zł" tylko jeśli to znany produkt.
- Nie używaj emoji w polu content.
- Jeśli dostaniesz źródłowy artykuł, opieraj recenzję na faktach z niego; nie cytuj dosłownie.`;

// Extract <img src="..."> + markdown ![](url) — return absolute URLs only
function extractImages(html: string, markdown: string, baseUrl?: string): string[] {
  const urls = new Set<string>();
  const push = (raw: string) => {
    try {
      const abs = baseUrl ? new URL(raw, baseUrl).toString() : raw;
      if (/^https?:\/\//i.test(abs)) urls.add(abs);
    } catch { /* ignore */ }
  };
  const imgRe = /<img[^>]+src=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = imgRe.exec(html))) push(m[1]);
  const mdRe = /!\[[^\]]*\]\(([^)\s]+)/g;
  while ((m = mdRe.exec(markdown))) push(m[1]);
  // filter junk: tiny icons, svgs, data URIs, tracking pixels
  return [...urls].filter((u) => {
    const lower = u.toLowerCase();
    if (lower.endsWith(".svg")) return false;
    if (lower.includes("avatar") || lower.includes("logo") || lower.includes("icon")) return false;
    if (lower.includes("pixel") || lower.includes("tracking")) return false;
    return true;
  }).slice(0, 12);
}

async function scrapeSource(url: string): Promise<{ text: string; images: string[] } | null> {
  const key = Deno.env.get("FIRECRAWL_API_KEY");
  if (!key) return null;
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url, formats: ["markdown", "html"], onlyMainContent: true }),
    });
    if (!res.ok) {
      console.error("Firecrawl error", res.status, await res.text().catch(() => ""));
      return null;
    }
    const json = await res.json();
    const md: string = json?.data?.markdown ?? "";
    const html: string = json?.data?.html ?? "";
    const images = extractImages(html, md, url);
    const text = (md || html.replace(/<[^>]+>/g, " ")).slice(0, 12000);
    return { text, images };
  } catch (e) {
    console.error("scrapeSource failed:", e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = await authenticate(req);
    if (auth.error) return auth.error;

    const { product, category, source_url } = await req.json();
    if ((!product || typeof product !== "string") && !source_url) {
      return new Response(JSON.stringify({ error: "Podaj 'product' lub 'source_url'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let scraped: { text: string; images: string[] } | null = null;
    if (source_url && typeof source_url === "string") {
      scraped = await scrapeSource(source_url);
    }

    const userPrompt = [
      product ? `Napisz recenzję: ${product}.` : `Napisz recenzję na podstawie poniższego artykułu źródłowego.`,
      category ? `Kategoria: ${category}.` : "",
      scraped?.text ? `\n\n--- Artykuł źródłowy ---\n${scraped.text}\n--- koniec ---` : "",
    ].filter(Boolean).join(" ");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResponse.ok) {
      const text = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, text);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limit zapytań AI — spróbuj za chwilę." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Brak środków na AI w workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error ${aiResponse.status}`);
    }

    const aiJson = await aiResponse.json();
    const raw = aiJson?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try {
      parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch (e) {
      console.error("Failed to parse AI JSON:", raw);
      throw new Error("AI zwróciło niepoprawny JSON");
    }

    parsed.pros = Array.isArray(parsed.pros) ? parsed.pros : [];
    parsed.cons = Array.isArray(parsed.cons) ? parsed.cons : [];
    if (typeof parsed.score === "string") parsed.score = parseFloat(parsed.score);
    if (typeof parsed.score === "number") parsed.score = Math.max(0, Math.min(10, parsed.score));

    // Attach scraped images as suggestions (frontend decides whether to use them)
    parsed.gallery_suggestions = scraped?.images ?? [];

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-review error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
