import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface NewsSource {
  id: string;
  name: string;
  url: string;
  list_selector: string | null;
}

async function firecrawlMap(url: string, limit = 100): Promise<string[]> {
  const res = await fetch("https://api.firecrawl.dev/v2/map", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url, limit, includeSubdomains: false }),
  });
  if (!res.ok) {
    const txt = await res.text();
    console.error(`Firecrawl map failed for ${url}: ${res.status} ${txt}`);
    return [];
  }
  const data = await res.json();
  const rawLinks: unknown[] = data.links || data.data?.links || [];
  // Firecrawl v2 returns objects { url, title, description }; older versions returned strings
  const links: string[] = rawLinks
    .map((l) => {
      if (typeof l === "string") return l;
      if (l && typeof l === "object" && "url" in l && typeof (l as { url: unknown }).url === "string") {
        return (l as { url: string }).url;
      }
      return "";
    })
    .filter((u) => u.length > 0);
  console.log(`[firecrawlMap] ${url} → raw=${rawLinks.length}, urls=${links.length}`);
  return links;
}

function isLikelyArticleUrl(articleUrl: string, sourceUrl: string): boolean {
  try {
    const u = new URL(articleUrl);
    const src = new URL(sourceUrl);
    if (u.hostname !== src.hostname) return false;
    const path = u.pathname;
    if (path === "/" || path.length < 15) return false;
    // skip sitemaps, feeds, assets (anywhere, e.g. /sitemap-articles-2017.xml)
    if (/\.(jpg|jpeg|png|gif|webp|css|js|pdf|xml|rss|atom|ico|svg)(\?|$)/i.test(path)) return false;
    if (/sitemap/i.test(path)) return false;
    if (/\/(tag|tagi|kategoria|category|autor|author|szukaj|search|archiwum|archive)\//i.test(path)) return false;
    return /[a-z0-9-]{8,}/i.test(path);
  } catch {
    return false;
  }
}

async function firecrawlScrapeMeta(url: string): Promise<{
  title?: string;
  excerpt?: string;
  image?: string;
  publishedAt?: string;
} | null> {
  try {
    const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data.metadata || data.data?.metadata || {};
    const markdown: string = data.markdown || data.data?.markdown || "";
    return {
      title: meta.title || meta.ogTitle,
      excerpt: (meta.description || meta.ogDescription || markdown.slice(0, 300))?.toString().slice(0, 500),
      image: meta.ogImage || meta.image,
      publishedAt: meta.publishedTime || meta.articlePublishedTime,
    };
  } catch (e) {
    console.error(`scrape meta error for ${url}`, e);
    return null;
  }
}

async function aiScore(
  title: string,
  excerpt: string,
  categories: { id: string; name: string }[],
): Promise<{ score: number; reasoning: string; categoryId: string | null; tags: string[] }> {
  if (!LOVABLE_API_KEY) {
    return { score: 5, reasoning: "AI key missing", categoryId: null, tags: [] };
  }
  const catList = categories.map((c) => `${c.id}: ${c.name}`).join("\n");
  const prompt = `Oceniasz atrakcyjność polskiego newsa sportowego dla portalu „Szortsy" (krótkie, ciekawe newsy).

TYTUŁ: ${title}
LEAD: ${excerpt}

DOSTĘPNE KATEGORIE:
${catList}

Zwróć WYŁĄCZNIE JSON:
{
  "score": <1-10, gdzie 10 = gorący temat dnia, must-publish>,
  "reasoning": "<1 zdanie po polsku>",
  "category_id": "<id z listy lub null>",
  "tags": ["tag1","tag2","tag3"]
}`;

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Odpowiadasz tylko poprawnym JSON-em, bez bloków markdown." },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error("AI score failed", res.status, txt);
      return { score: 5, reasoning: "AI error", categoryId: null, tags: [] };
    }
    const data = await res.json();
    const raw: string = data.choices?.[0]?.message?.content ?? "{}";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      score: Math.max(1, Math.min(10, Number(parsed.score) || 5)),
      reasoning: String(parsed.reasoning || ""),
      categoryId: parsed.category_id && parsed.category_id !== "null" ? parsed.category_id : null,
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5).map(String) : [],
    };
  } catch (e) {
    console.error("AI score parse error", e);
    return { score: 5, reasoning: "AI parse error", categoryId: null, tags: [] };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let sourceFilter: string | null = null;
    let maxPerSource = 5; // ile propozycji max na źródło (po filtrze "dzisiaj")
    let todayOnly = true; // KRYTYCZNE: domyślnie tylko z dzisiaj
    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body?.source_id && typeof body.source_id === "string") {
          sourceFilter = body.source_id;
        }
        if (typeof body?.max_per_source === "number" && body.max_per_source > 0) {
          maxPerSource = Math.min(20, Math.floor(body.max_per_source));
        }
        if (typeof body?.today_only === "boolean") {
          todayOnly = body.today_only;
        }
      } catch {
        // no body, scan all
      }
    }
    console.log(`[scan] config: maxPerSource=${maxPerSource}, todayOnly=${todayOnly}`);

    // Granica "dzisiaj" — od północy czasu warszawskiego (UTC+1/+2). Bezpiecznie: ostatnie 24h.
    const todayCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const isFromToday = (publishedAt?: string): boolean => {
      if (!publishedAt) return false;
      const d = new Date(publishedAt);
      if (isNaN(d.getTime())) return false;
      return d >= todayCutoff;
    };

    let query = supabase.from("news_sources").select("id,name,url,list_selector").eq("is_active", true);
    if (sourceFilter) query = query.eq("id", sourceFilter);
    const { data: sources, error: srcErr } = await query;
    if (srcErr) throw srcErr;

    if (!sources || sources.length === 0) {
      return new Response(JSON.stringify({ ok: true, message: "No active sources", scanned: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: categories } = await supabase
      .from("sport_categories")
      .select("id,name")
      .order("sort_order");
    const cats = categories || [];

    let totalNew = 0;
    let totalDup = 0;
    const perSource: Array<{ source: string; new: number; duplicates: number; total_links: number }> = [];

    // Helpers for title-based duplicate detection
    const normalizeTitle = (s: string): string =>
      s
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    const tokenSet = (s: string): Set<string> =>
      new Set(normalizeTitle(s).split(" ").filter((w) => w.length >= 4));
    const jaccard = (a: Set<string>, b: Set<string>): number => {
      if (a.size === 0 || b.size === 0) return 0;
      let inter = 0;
      for (const t of a) if (b.has(t)) inter++;
      return inter / (a.size + b.size - inter);
    };
    const normalizeUrl = (u: string): string => {
      try {
        const url = new URL(u);
        return (url.hostname + url.pathname).replace(/\/+$/, "").toLowerCase();
      } catch {
        return u.toLowerCase();
      }
    };

    // Preload recent published posts for title similarity (last 30 days)
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentPosts } = await supabase
      .from("posts")
      .select("title,source_url")
      .gte("published_at", since)
      .limit(500);
    const postUrlSet = new Set((recentPosts || []).map((p) => normalizeUrl(p.source_url || "")));
    const postTitleTokens = (recentPosts || []).map((p) => ({
      title: p.title as string,
      tokens: tokenSet(p.title as string),
    }));

    for (const source of sources as NewsSource[]) {
      console.log(`[scan] ${source.name} (${source.url})`);
      const links = await firecrawlMap(source.url, 100);
      const filtered = Array.from(new Set(links.filter((l) => isLikelyArticleUrl(l, source.url))));
      const candidates = filtered.slice(0, 15);
      console.log(`[scan] ${source.name} links=${links.length} filtered=${filtered.length} candidates=${candidates.length}`);

      // dedup against existing suggestions
      const { data: existing } = candidates.length
        ? await supabase.from("news_suggestions").select("article_url").in("article_url", candidates)
        : { data: [] as { article_url: string }[] };
      const existingSet = new Set((existing || []).map((r: { article_url: string }) => r.article_url));
      const fresh = candidates.filter((u) => !existingSet.has(u));
      console.log(`[scan] ${source.name} fresh=${fresh.length} (already_in_suggestions=${candidates.length - fresh.length})`);

      let added = 0;
      let dups = 0;
      for (const articleUrl of fresh.slice(0, 8)) {
        const meta = await firecrawlScrapeMeta(articleUrl);
        if (!meta?.title) continue;

        // Duplicate check vs already-published posts
        let isDuplicate = false;
        let dupReason = "";
        const normUrl = normalizeUrl(articleUrl);
        if (postUrlSet.has(normUrl)) {
          isDuplicate = true;
          dupReason = "Ten URL źródłowy ma już opublikowany post.";
        } else {
          const incomingTokens = tokenSet(meta.title);
          let bestSim = 0;
          let bestTitle = "";
          for (const p of postTitleTokens) {
            const sim = jaccard(incomingTokens, p.tokens);
            if (sim > bestSim) {
              bestSim = sim;
              bestTitle = p.title;
            }
          }
          if (bestSim >= 0.6) {
            isDuplicate = true;
            dupReason = `Bardzo podobny tytuł (${Math.round(bestSim * 100)}%) do: „${bestTitle}".`;
          }
        }

        let ai = { score: 5, reasoning: "", categoryId: null as string | null, tags: [] as string[] };
        if (!isDuplicate) {
          ai = await aiScore(meta.title, meta.excerpt || "", cats);
        }

        const { error: insErr } = await supabase.from("news_suggestions").insert({
          source_id: source.id,
          article_url: articleUrl,
          title: meta.title,
          excerpt: meta.excerpt,
          image_url: meta.image,
          published_at: meta.publishedAt,
          ai_score: isDuplicate ? 0 : ai.score,
          ai_reasoning: isDuplicate ? dupReason : ai.reasoning,
          suggested_category_id: ai.categoryId,
          suggested_tags: ai.tags,
          status: isDuplicate ? "duplicate" : "pending",
        });
        if (insErr) {
          console.error(`insert failed for ${articleUrl}`, insErr.message);
          continue;
        }
        if (isDuplicate) {
          dups++;
          totalDup++;
        } else {
          added++;
          totalNew++;
        }
      }

      await supabase
        .from("news_sources")
        .update({ last_scanned_at: new Date().toISOString() })
        .eq("id", source.id);

      perSource.push({ source: source.name, new: added, duplicates: dups, total_links: candidates.length });
    }

    return new Response(
      JSON.stringify({ ok: true, scanned: sources.length, new_suggestions: totalNew, duplicates: totalDup, details: perSource }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("scan-news-sources fatal", msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
