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

const REVIEW_SYSTEM_PROMPT = `Jesteś doświadczonym recenzentem technologii dla polskiego portalu "Szortsy Tech". Piszesz uczciwe, konkretne i rzeczowe recenzje produktów (sprzęt, gadżety, aplikacje, gry).

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

const NEWS_SYSTEM_PROMPT = `Jesteś dziennikarzem technologicznym polskiego portalu "Szortsy Tech". Piszesz krótkie, rzeczowe newsy o świecie technologii (premiery, aktualizacje, branża, AI, gadżety, software).

Zawsze zwracaj WYŁĄCZNIE poprawny JSON o strukturze:
{
  "title": "Tytuł newsa (max 90 zn., konkretny, bez clickbaitu)",
  "excerpt": "1-2 zdania streszczenia (max 220 zn.) — esencja newsa",
  "content": "<p>HTML treści 400-800 słów. Używaj <h2>, <h3>, <p>, <ul>, <li>, <strong>. Struktura: Co się stało / Kontekst / Dlaczego to ważne / Co dalej. NIE używaj nagłówka 'Wprowadzenie'."
}

Reguły:
- Pisz po polsku, neutralnie i faktograficznie — bez marketingu, bez hype'u.
- Bez ocen, plusów, minusów, werdyktów — to news, nie recenzja.
- Nie wymyślaj liczb ani dat. Jeśli źródło ich nie podaje, pomiń.
- Jeśli dostaniesz źródłowy artykuł, opieraj się na faktach z niego; parafrazuj, nie cytuj dosłownie.
- Nie używaj emoji.
- NIE dodawaj pól score, pros, cons, verdict, product_brand, product_name — to news.`;

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
  return [...urls].filter((u) => {
    const lower = u.toLowerCase();
    if (lower.endsWith(".svg")) return false;
    if (lower.includes("avatar") || lower.includes("logo") || lower.includes("icon")) return false;
    if (lower.includes("pixel") || lower.includes("tracking")) return false;
    return true;
  }).slice(0, 12);
}

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function firecrawlScrape(url: string, key: string): Promise<{ text: string; images: string[] } | null> {
  try {
    const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        formats: ["markdown", "html"],
        onlyMainContent: true,
        waitFor: 2500,
        proxy: "stealth",
        location: { country: "PL", languages: ["pl"] },
      }),
    });
    if (!res.ok) {
      console.error("Firecrawl error", res.status, await res.text().catch(() => ""));
      return null;
    }
    const json = await res.json();
    // v2 returns fields at top level on `data`
    const md: string = json?.data?.markdown ?? json?.markdown ?? "";
    const html: string = json?.data?.html ?? json?.html ?? "";
    const images = extractImages(html, md, url);
    const text = (md || html.replace(/<[^>]+>/g, " ")).slice(0, 12000);
    return { text, images };
  } catch (e) {
    console.error("firecrawlScrape failed:", e);
    return null;
  }
}

async function directFetchScrape(url: string): Promise<{ text: string; images: string[] } | null> {
  try {
    // Pre-flight to collect bot-wall cookies (e.g. benchmark.pl STabid)
    const cookieJar: string[] = [];
    const collect = (res: Response) => {
      const sc = (res.headers as any).getSetCookie?.() ?? [];
      for (const c of sc) cookieJar.push(c.split(";")[0]);
    };
    const headers: Record<string, string> = {
      "User-Agent": BROWSER_UA,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "pl-PL,pl;q=0.9,en;q=0.8",
    };
    let res = await fetch(url, { headers, redirect: "follow" });
    collect(res);
    if (res.status === 204 || res.status === 403) {
      const h2 = { ...headers, Cookie: cookieJar.join("; ") };
      res = await fetch(url, { headers: h2, redirect: "follow" });
    }
    if (!res.ok) {
      console.error("directFetchScrape status", res.status);
      return null;
    }
    const html = await res.text();
    // Try <article> / <main> first
    const articleMatch = html.match(/<article[\s\S]*?<\/article>/i)?.[0]
      ?? html.match(/<main[\s\S]*?<\/main>/i)?.[0]
      ?? html;
    const text = articleMatch
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 12000);
    // Images: og:image first, then <img> from article
    const ogImg = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i)?.[1];
    const imgs = extractImages(articleMatch, "", url);
    const images = [ogImg, ...imgs].filter(Boolean) as string[];
    return { text, images: [...new Set(images)].slice(0, 12) };
  } catch (e) {
    console.error("directFetchScrape failed:", e);
    return null;
  }
}

async function scrapeSource(url: string): Promise<{ text: string; images: string[] } | null> {
  const key = Deno.env.get("FIRECRAWL_API_KEY");
  let result: { text: string; images: string[] } | null = null;
  if (key) result = await firecrawlScrape(url, key);
  console.log(`[scrape] firecrawl text length: ${result?.text?.length ?? 0}, images: ${result?.images?.length ?? 0}`);
  if (!result || (result.text?.length ?? 0) < 400) {
    const fallback = await directFetchScrape(url);
    console.log(`[scrape] direct fallback text length: ${fallback?.text?.length ?? 0}, images: ${fallback?.images?.length ?? 0}`);
    if (fallback && (fallback.text?.length ?? 0) > (result?.text?.length ?? 0)) {
      result = fallback;
    }
  }
  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = await authenticate(req);
    if (auth.error) return auth.error;

    const body = await req.json();
    const { product, topic, category, source_url } = body;
    const content_type: "review" | "news" = body.content_type === "news" ? "news" : "review";
    const subject = (topic ?? product ?? "").toString().trim();
    if (!subject && !source_url) {
      return new Response(JSON.stringify({ error: "Podaj temat/produkt lub 'source_url'" }), {
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
      if (!subject && (!scraped || (scraped.text?.length ?? 0) < 200)) {
        return new Response(JSON.stringify({
          error: "Nie udało się pobrać treści ze źródła (strona blokuje boty lub zwraca pustą treść). Wpisz temat ręcznie lub spróbuj inny URL.",
        }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const isNews = content_type === "news";
    const systemPrompt = isNews ? NEWS_SYSTEM_PROMPT : REVIEW_SYSTEM_PROMPT;
    const intro = isNews
      ? (subject ? `Napisz news technologiczny na temat: ${subject}.` : `Napisz news technologiczny na podstawie poniższego artykułu źródłowego.`)
      : (subject ? `Napisz recenzję: ${subject}.` : `Napisz recenzję na podstawie poniższego artykułu źródłowego.`);

    const userPrompt = [
      intro,
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
          { role: "system", content: systemPrompt },
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

    if (isNews) {
      // Strip review-specific fields if AI accidentally returned them
      parsed.score = null;
      parsed.pros = [];
      parsed.cons = [];
      parsed.verdict = null;
      parsed.product_brand = null;
      parsed.product_name = null;
    } else {
      parsed.pros = Array.isArray(parsed.pros) ? parsed.pros : [];
      parsed.cons = Array.isArray(parsed.cons) ? parsed.cons : [];
      if (typeof parsed.score === "string") parsed.score = parseFloat(parsed.score);
      if (typeof parsed.score === "number") parsed.score = Math.max(0, Math.min(10, parsed.score));
    }

    parsed.content_type = content_type;
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
