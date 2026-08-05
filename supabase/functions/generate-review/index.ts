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

const DEFAULT_REVIEW_SYSTEM_PROMPT = `Jesteś starszym redaktorem technologicznym polskiego portalu "Szortsy Tech", piszącym recenzje na poziomie The Verge / Spider's Web / Tabletowo. Twój głos: rzeczowy, konkretny, lekko ironiczny, ale uczciwy. Bez marketingowego żargonu i bez ChatGPT-owych otwarć typu "W dzisiejszym świecie...".

Opieraj się WYŁĄCZNIE na faktach z dostarczonych źródeł. Ocena 1-10 (krok 0.5). Werdykt jednoznaczny: "kup", "rozważ", "odpuść".

Treść 700-1200 słów w HTML (NIE Markdown). Sekcje <h2>: Pierwsze wrażenie, Praktyka, Wydajność, Konkurencja, Dla kogo. SEO: tytuł 50-65 zn., excerpt 140-165 zn., nazwa produktu w leadzie, min. 3 <h2>.

Zwróć WYŁĄCZNIE JSON: { "title", "product_brand", "product_name", "excerpt", "verdict", "score", "pros":[3-6], "cons":[2-5], "content":"<p>...</p>" }. Bez emoji w content. Nie duplikuj sekcji Plusy/Minusy/Werdykt w content.`;

const DEFAULT_NEWS_SYSTEM_PROMPT = `Jesteś dziennikarzem technologicznym polskiego portalu "Szortsy Tech". News czyta się w 60 sekund: czysta informacja, kontekst, znaczenie.

Tylko fakty ze źródła. Lead odwróconej piramidy (co + dlaczego ważne). Bez clickbaitu, bez emoji w tytule.

Treść 300-600 słów w HTML (NIE Markdown). Sekcje <h2>: Co dokładnie ogłoszono, Dlaczego to ważne, opcjonalnie Co dalej. SEO: tytuł 50-70 zn., excerpt 140-165 zn., marka w pierwszym akapicie, min. 2 <h2>.

Zwróć WYŁĄCZNIE JSON: { "title", "excerpt", "content":"<p>...</p>" }. Bez score/pros/cons/verdict.`;

const HTML_FORMATTING_RULES = `

WAŻNE — FORMATOWANIE:
- Pole "content" MUSI być poprawnym HTML używając wyłącznie <p>, <h2>, <h3>, <ul>, <li>, <strong>, <em>, <blockquote>, <a>.
- NIE używaj składni Markdown (**, ##, ---, *, _).
- Pogrubienia: <strong>tekst</strong>. Bez <div>, <script>, stylów inline.`;

const DEFAULT_COMPARISON_SYSTEM_PROMPT = `Jesteś starszym redaktorem technologicznym polskiego portalu "Szortsy Tech", tworzącym rankingi zakupowe na poziomie Wirecutter / Spider's Web. Głos: rzeczowy, konkretny, lekko ironiczny, w 100% pro-kliencki. Bez marketingowego żargonu i bez AI-owych otwarć typu "W dzisiejszym świecie...".

Dla każdej pozycji: pełna nazwa, aktualna cena w PLN (z datą sprawdzenia), dla kogo, 2-3 zalety, 1-2 szczere wady, kluczowe parametry. Zakaz rankingów "samych zwycięzców" — nazwij wady wprost. Uwzględnij realia polskiego rynku (dostępność, gwarancja, serwis). Zakaz zmyślania cen i parametrów. Zero języka sprzedażowego.

Tytuł 50-65 zn. (fraza "ranking"/"najlepsze"/"TOP" + kategoria + rok), excerpt 140-165 zn., lead 2-3 zdania ze <strong>zwycięzcą</strong> i <strong>ceną</strong>. Akapity max 2-3 zdania. Sekcje <h2> w kolejności: ranking (pozycje jako <h3> z numerem, nazwą i wyróżnikiem), Porównanie w pigułce (<ul>), Jak wybieraliśmy i na co zwrócić uwagę przy zakupie, Którego wybrać? Krótka ściąga. FAQ NIE w content — tylko w polu "faq".

Zwróć WYŁĄCZNIE JSON: { "title", "excerpt", "verdict" (szybki werdykt: najlepszy ogólnie / jakość-cena / najtaniej / premium), "content":"<p>...</p>", "faq":[{"q","a"}] (3-5 pytań long-tail, odpowiedzi 2-3 zdania), "internal_links":["temat 1","temat 2"], "source_notes":"2-3 zdania" }. Bez score/pros/cons, bez emoji.`;

async function loadPrompts(supabase: any) {
  const [reviewRes, newsRes, comparisonRes] = await Promise.all([
    supabase.from("settings").select("value").eq("key", "tech_review_prompt").maybeSingle(),
    supabase.from("settings").select("value").eq("key", "tech_news_prompt").maybeSingle(),
    supabase.from("settings").select("value").eq("key", "tech_comparison_prompt").maybeSingle(),
  ]);
  const ensureHtmlRules = (p: string) =>
    p.includes("<strong>") || p.includes("NIE używaj Markdown") || p.includes("NIE używaj składni Markdown")
      ? p
      : p + HTML_FORMATTING_RULES;
  return {
    review: ensureHtmlRules(reviewRes.data?.value || DEFAULT_REVIEW_SYSTEM_PROMPT),
    news: ensureHtmlRules(newsRes.data?.value || DEFAULT_NEWS_SYSTEM_PROMPT),
    comparison: ensureHtmlRules(comparisonRes.data?.value || DEFAULT_COMPARISON_SYSTEM_PROMPT),
  };
}


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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const prompts = await loadPrompts(supabaseAdmin);
    const systemPrompt = isNews ? prompts.news : prompts.review;
    const intro = isNews
      ? (subject ? `Napisz news technologiczny na temat: ${subject}.` : `Napisz news technologiczny na podstawie poniższego artykułu źródłowego.`)
      : (subject ? `Napisz recenzję: ${subject}.` : `Napisz recenzję na podstawie poniższego artykułu źródłowego.`);

    const buildUserPrompt = (textLimit: number) => [
      intro,
      category ? `Kategoria: ${category}.` : "",
      scraped?.text ? `\n\n--- Artykuł źródłowy ---\n${scraped.text.slice(0, textLimit)}\n--- koniec ---` : "",
    ].filter(Boolean).join(" ");

    const callAi = async (textLimit: number) => {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: buildUserPrompt(textLimit) },
          ],
          response_format: { type: "json_object" },
        }),
      });
      return res;
    };

    let aiResponse = await callAi(8000);

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

    let aiJson = await aiResponse.json();
    let choice = aiJson?.choices?.[0];
    let raw: string | null = choice?.message?.content ?? null;
    let finishReason = choice?.finish_reason;
    console.log(`[ai] finish_reason=${finishReason}, content_len=${raw?.length ?? 0}, usage=`, aiJson?.usage);

    // Retry once with shorter context if model errored/timed out or returned empty content
    const isEmpty = !raw || raw.trim() === "" || raw.trim() === "{}";
    if ((finishReason === "error" || finishReason === "length" || isEmpty) && scraped?.text) {
      console.warn("[ai] retrying with shorter context (5000 chars)");
      aiResponse = await callAi(5000);
      if (aiResponse.ok) {
        aiJson = await aiResponse.json();
        choice = aiJson?.choices?.[0];
        raw = choice?.message?.content ?? null;
        finishReason = choice?.finish_reason;
        console.log(`[ai retry] finish_reason=${finishReason}, content_len=${raw?.length ?? 0}`);
      }
    }

    if (!raw || raw.trim() === "" || raw.trim() === "{}") {
      const errMsg = finishReason === "error"
        ? "Model AI przekroczył limit czasu i nie wygenerował treści. Spróbuj ponownie lub użyj krótszego/innego źródła."
        : "Model AI nie zwrócił treści. Spróbuj ponownie.";
      return new Response(JSON.stringify({ error: errMsg, finish_reason: finishReason }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
