import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CONCURRENCY = 4;
const EARLY_ABORT_NO_DATE_STREAK = 10;

interface NewsSource {
  id: string;
  name: string;
  url: string;
  list_selector: string | null;
  feed_url?: string | null;
}

interface DiscoveredItem {
  url: string;
  title?: string;
  excerpt?: string;
  image?: string;
  publishedAt?: string;
  fromFeed: boolean;
}

// ===================== RSS / Atom =====================

function pick(re: RegExp, s: string): string | undefined {
  const m = s.match(re);
  return m ? m[1].trim() : undefined;
}
function stripCdata(s?: string): string | undefined {
  if (!s) return s;
  const m = s.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  return (m ? m[1] : s).trim();
}
function decodeEntities(s?: string): string | undefined {
  if (!s) return s;
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

async function fetchRssFeed(feedUrl: string): Promise<DiscoveredItem[]> {
  try {
    const res = await fetch(feedUrl, {
      headers: { "User-Agent": "SzortsyBot/1.0 (+https://szortsy.pl)" },
    });
    if (!res.ok) {
      console.error(`[rss] ${feedUrl} → HTTP ${res.status}`);
      return [];
    }
    const xml = await res.text();
    const items: DiscoveredItem[] = [];

    // RSS 2.0: <item>...</item>
    const itemBlocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) || [];
    for (const block of itemBlocks) {
      const link =
        stripCdata(pick(/<link>([\s\S]*?)<\/link>/i, block)) ||
        pick(/<link[^>]+href=["']([^"']+)["']/i, block);
      if (!link) continue;
      const title = decodeEntities(stripCdata(pick(/<title>([\s\S]*?)<\/title>/i, block)));
      const description = decodeEntities(
        stripCdata(pick(/<description>([\s\S]*?)<\/description>/i, block))
      );
      const pubDate =
        pick(/<pubDate>([\s\S]*?)<\/pubDate>/i, block) ||
        pick(/<dc:date>([\s\S]*?)<\/dc:date>/i, block);
      const image =
        pick(/<enclosure[^>]+url=["']([^"']+)["']/i, block) ||
        pick(/<media:content[^>]+url=["']([^"']+)["']/i, block) ||
        pick(/<media:thumbnail[^>]+url=["']([^"']+)["']/i, block);
      items.push({
        url: link,
        title,
        excerpt: description?.replace(/<[^>]+>/g, "").slice(0, 500),
        image,
        publishedAt: pubDate ? new Date(pubDate).toISOString() : undefined,
        fromFeed: true,
      });
    }

    // Atom: <entry>...</entry>
    if (items.length === 0) {
      const entryBlocks = xml.match(/<entry\b[\s\S]*?<\/entry>/gi) || [];
      for (const block of entryBlocks) {
        const link = pick(/<link[^>]+href=["']([^"']+)["']/i, block);
        if (!link) continue;
        const title = decodeEntities(stripCdata(pick(/<title[^>]*>([\s\S]*?)<\/title>/i, block)));
        const summary = decodeEntities(
          stripCdata(pick(/<summary[^>]*>([\s\S]*?)<\/summary>/i, block)) ||
            stripCdata(pick(/<content[^>]*>([\s\S]*?)<\/content>/i, block))
        );
        const pubDate =
          pick(/<published>([\s\S]*?)<\/published>/i, block) ||
          pick(/<updated>([\s\S]*?)<\/updated>/i, block);
        items.push({
          url: link,
          title,
          excerpt: summary?.replace(/<[^>]+>/g, "").slice(0, 500),
          publishedAt: pubDate ? new Date(pubDate).toISOString() : undefined,
          fromFeed: true,
        });
      }
    }

    console.log(`[rss] ${feedUrl} → ${items.length} items`);
    return items;
  } catch (e) {
    console.error(`[rss] error ${feedUrl}`, e);
    return [];
  }
}

// ===================== Firecrawl (fallback) =====================

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
    console.error(`Firecrawl map failed for ${url}: ${res.status}`);
    return [];
  }
  const data = await res.json();
  const rawLinks: unknown[] = data.links || data.data?.links || [];
  return rawLinks
    .map((l) =>
      typeof l === "string"
        ? l
        : l && typeof l === "object" && "url" in l && typeof (l as { url: unknown }).url === "string"
        ? (l as { url: string }).url
        : ""
    )
    .filter((u) => u.length > 0);
}

async function firecrawlScrapeHomepageLinks(url: string): Promise<string[]> {
  try {
    const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, formats: ["links", "rawHtml"], onlyMainContent: false }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const linksField: unknown = data.links || data.data?.links || [];
    const rawHtml: string = data.rawHtml || data.data?.rawHtml || "";
    const seen = new Set<string>();
    const ordered: string[] = [];
    if (rawHtml) {
      const hrefRe = /href=["']([^"']+)["']/gi;
      let m: RegExpExecArray | null;
      while ((m = hrefRe.exec(rawHtml)) !== null) {
        try {
          const abs = new URL(m[1], url).toString().split("#")[0];
          if (!seen.has(abs)) {
            seen.add(abs);
            ordered.push(abs);
          }
        } catch { /* skip */ }
      }
    }
    if (Array.isArray(linksField)) {
      for (const l of linksField) {
        const u = typeof l === "string" ? l : l && typeof l === "object" && "url" in l ? (l as { url: string }).url : "";
        if (u && !seen.has(u)) {
          seen.add(u);
          ordered.push(u);
        }
      }
    }
    return ordered;
  } catch {
    return [];
  }
}

// Zaostrzony filtr: musi wyglądać jak konkretny artykuł, nie strona kategorii / profil / tag.
const CATEGORY_BLACKLIST_RE = /\/(tag|tagi|kategoria|category|autor|author|szukaj|search|archiwum|archive|profil-|profil\/|turnieje|wyniki|rozgrywki|tabela|tabele|terminarz|skladka|skladki|kluby|druzyny|reprezentacja|liga-mistrzow|liga-europy|liga-konferencji|premier-league|la-liga|bundesliga|serie-a|ligue-1|ekstraklasa|1-liga|puchar-polski|euro|mundial|wimbledon|roland-garros|australian-open|atp-finals|wta-finals|akademia)(\/|$)/i;
const ARTICLE_ID_RE = /(,\w{2,6},\d{3,})|(-\d{4,}(\.html?)?$)|(\/\d{4}\/\d{2}\/\d{2}\/)/i;

function isLikelyArticleUrl(articleUrl: string, sourceUrl: string): boolean {
  try {
    const u = new URL(articleUrl);
    const src = new URL(sourceUrl);
    if (u.hostname !== src.hostname) return false;
    const path = u.pathname;
    if (path === "/" || path.length < 20) return false;
    if (/\.(jpg|jpeg|png|gif|webp|css|js|pdf|xml|rss|atom|ico|svg)(\?|$)/i.test(path)) return false;
    if (/sitemap/i.test(path)) return false;
    if (CATEGORY_BLACKLIST_RE.test(path)) return false;

    // Wymagaj wzorca ID artykułu LUB długiego sluga z myślnikami w ostatnim segmencie.
    const segments = path.split("/").filter(Boolean);
    if (segments.length < 2) return false;
    const last = segments[segments.length - 1];
    const hasArticleId = ARTICLE_ID_RE.test(path);
    const hasLongSlug = last.length >= 30 && (last.match(/-/g) || []).length >= 3;
    return hasArticleId || hasLongSlug;
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
      body: JSON.stringify({ url, formats: ["markdown", "rawHtml"], onlyMainContent: false }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data.metadata || data.data?.metadata || {};
    const markdown: string = data.markdown || data.data?.markdown || "";
    const rawHtml: string = data.rawHtml || data.data?.rawHtml || "";

    let publishedAt: string | undefined =
      meta.publishedTime ||
      meta.articlePublishedTime ||
      meta["article:published_time"] ||
      meta["og:article:published_time"] ||
      meta.datePublished ||
      meta.date ||
      meta.pubdate ||
      meta.publishdate;

    if (!publishedAt && rawHtml) {
      const ldMatches = rawHtml.match(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi) || [];
      for (const block of ldMatches) {
        const inner = block.replace(/<script[^>]*>|<\/script>/gi, "").trim();
        try {
          const parsed = JSON.parse(inner);
          const items = Array.isArray(parsed) ? parsed : [parsed];
          for (const it of items) {
            const dp = it?.datePublished || it?.dateCreated || it?.uploadDate;
            if (dp && typeof dp === "string") { publishedAt = dp; break; }
          }
          if (publishedAt) break;
        } catch { /* skip */ }
      }
      if (!publishedAt) {
        const m = rawHtml.match(/<meta[^>]+(?:property|name)=["'](?:article:published_time|datePublished|date|pubdate)["'][^>]+content=["']([^"']+)["']/i)
          || rawHtml.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:article:published_time|datePublished|date|pubdate)["']/i);
        if (m) publishedAt = m[1];
      }
      if (!publishedAt) {
        const m = rawHtml.match(/<time[^>]+datetime=["']([^"']+)["']/i);
        if (m) publishedAt = m[1];
      }
    }

    return {
      title: meta.title || meta.ogTitle,
      excerpt: (meta.description || meta.ogDescription || markdown.slice(0, 300))?.toString().slice(0, 500),
      image: meta.ogImage || meta.image,
      publishedAt,
    };
  } catch {
    return null;
  }
}

// ===================== AI scoring =====================

async function aiScore(
  title: string,
  excerpt: string,
  categories: { id: string; name: string }[],
): Promise<{ score: number; reasoning: string; categoryId: string | null; tags: string[] }> {
  if (!LOVABLE_API_KEY) return { score: 5, reasoning: "AI key missing", categoryId: null, tags: [] };
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
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Odpowiadasz tylko poprawnym JSON-em, bez bloków markdown." },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) return { score: 5, reasoning: "AI error", categoryId: null, tags: [] };
    const data = await res.json();
    const raw: string = data.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    return {
      score: Math.max(1, Math.min(10, Number(parsed.score) || 5)),
      reasoning: String(parsed.reasoning || ""),
      categoryId: parsed.category_id && parsed.category_id !== "null" ? parsed.category_id : null,
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5).map(String) : [],
    };
  } catch {
    return { score: 5, reasoning: "AI parse error", categoryId: null, tags: [] };
  }
}

// ===================== Helpers =====================

const normalizeTitle = (s: string): string =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
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

// ===================== Main handler =====================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Brak autoryzacji" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Nieprawidłowy token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;
    const { data: roleRows } = await userClient.from("user_roles").select("role").eq("user_id", userId);
    const userRoles = (roleRows ?? []).map((r: { role: string }) => r.role);
    if (!userRoles.some((r) => r === "admin" || r === "editor")) {
      return new Response(JSON.stringify({ error: "Brak uprawnień (admin/editor)" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.log(`[scan] auth ok user=${userId}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let sourceFilter: string | null = null;
    let maxPerSource = 5;
    let todayOnly = true;
    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body?.source_id && typeof body.source_id === "string") sourceFilter = body.source_id;
        if (typeof body?.max_per_source === "number" && body.max_per_source > 0)
          maxPerSource = Math.min(20, Math.floor(body.max_per_source));
        if (typeof body?.today_only === "boolean") todayOnly = body.today_only;
      } catch { /* no body */ }
    }
    console.log(`[scan] config maxPerSource=${maxPerSource} todayOnly=${todayOnly}`);

    const todayCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const futureCutoff = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const isFromToday = (publishedAt?: string): boolean => {
      if (!publishedAt) return false;
      const d = new Date(publishedAt);
      if (isNaN(d.getTime())) return false;
      return d >= todayCutoff && d <= futureCutoff;
    };

    let query = supabase.from("news_sources").select("id,name,url,list_selector,feed_url").eq("is_active", true);
    if (sourceFilter) query = query.eq("id", sourceFilter);
    const { data: sources, error: srcErr } = await query;
    if (srcErr) throw srcErr;

    if (!sources || sources.length === 0) {
      return new Response(JSON.stringify({ ok: true, message: "No active sources", scanned: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: categories } = await supabase
      .from("sport_categories").select("id,name").order("sort_order");
    const cats = categories || [];

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentPosts } = await supabase
      .from("posts").select("id,slug,title,source_url").gte("published_at", since).limit(500);
    const postUrlMap = new Map<string, { id: string; slug: string; title: string }>();
    for (const p of recentPosts || []) {
      if (p.source_url) {
        postUrlMap.set(normalizeUrl(p.source_url), {
          id: p.id as string, slug: p.slug as string, title: p.title as string,
        });
      }
    }
    const postTitleTokens = (recentPosts || []).map((p) => ({
      id: p.id as string,
      title: p.title as string,
      tokens: tokenSet(p.title as string),
    }));

    let totalNew = 0;
    let totalDup = 0;
    const perSource: Array<{
      source: string; new: number; duplicates: number; total_links: number;
      analyzed: number; skipped_old: number; skipped_no_date: number;
      firecrawl_calls: number; used_rss: boolean; efficiency_pct: number;
      early_abort?: string;
    }> = [];

    for (const source of sources as NewsSource[]) {
      console.log(`[scan] ${source.name} (${source.url})${source.feed_url ? " [RSS]" : ""}`);

      let firecrawlCalls = 0;
      let discovered: DiscoveredItem[] = [];
      let usedRss = false;

      // ===== Discovery: RSS if available =====
      if (source.feed_url) {
        discovered = await fetchRssFeed(source.feed_url);
        usedRss = discovered.length > 0;
      }

      // ===== Fallback: homepage scrape + map =====
      if (discovered.length === 0) {
        firecrawlCalls++;
        let links = await firecrawlScrapeHomepageLinks(source.url);
        let filtered = Array.from(new Set(links.filter((l) => isLikelyArticleUrl(l, source.url))));
        console.log(`[scan] ${source.name} homepage_links=${links.length} filtered=${filtered.length}`);
        if (filtered.length < 10) {
          firecrawlCalls++;
          const mapLinks = await firecrawlMap(source.url, 100);
          filtered = Array.from(new Set([...filtered, ...mapLinks.filter((l) => isLikelyArticleUrl(l, source.url))]));
        }
        discovered = filtered.slice(0, 30).map((u) => ({ url: u, fromFeed: false }));
      }

      // ===== Dedup vs existing suggestions =====
      const urls = discovered.map((d) => d.url);
      const { data: existing } = urls.length
        ? await supabase.from("news_suggestions").select("article_url").in("article_url", urls)
        : { data: [] as { article_url: string }[] };
      const existingSet = new Set((existing || []).map((r: { article_url: string }) => r.article_url));
      const fresh = discovered.filter((d) => !existingSet.has(d.url));
      console.log(`[scan] ${source.name} discovered=${discovered.length} fresh=${fresh.length} used_rss=${usedRss}`);

      let added = 0;
      let dups = 0;
      let skippedNotToday = 0;
      let skippedNoDate = 0;
      let analyzed = 0;
      let noDateStreak = 0;
      let earlyAbort: string | undefined;

      // ===== Process in parallel batches =====
      const processOne = async (item: DiscoveredItem): Promise<{
        kind: "added" | "dup" | "skipped_old" | "skipped_no_date" | "no_title";
        articleUrl: string;
        meta?: { title: string; excerpt?: string; image?: string; publishedAt?: string };
        ai?: { score: number; reasoning: string; categoryId: string | null; tags: string[] };
        dupReason?: string;
        matchedPostId?: string;
      }> => {
        let meta: { title?: string; excerpt?: string; image?: string; publishedAt?: string } | null = null;

        if (item.fromFeed && item.title) {
          meta = {
            title: item.title,
            excerpt: item.excerpt,
            image: item.image,
            publishedAt: item.publishedAt,
          };
          // Jeśli RSS nie dał daty, dociągnij meta z Firecrawl (rzadki przypadek).
          if (!meta.publishedAt || !meta.image) {
            firecrawlCalls++;
            const scraped = await firecrawlScrapeMeta(item.url);
            if (scraped) {
              meta.publishedAt = meta.publishedAt || scraped.publishedAt;
              meta.image = meta.image || scraped.image;
              meta.excerpt = meta.excerpt || scraped.excerpt;
            }
          }
        } else {
          firecrawlCalls++;
          meta = await firecrawlScrapeMeta(item.url);
        }

        if (!meta?.title) return { kind: "no_title", articleUrl: item.url };

        if (todayOnly) {
          if (!meta.publishedAt) return { kind: "skipped_no_date", articleUrl: item.url };
          if (!isFromToday(meta.publishedAt)) return { kind: "skipped_old", articleUrl: item.url };
        }

        let isDuplicate = false;
        let dupReason = "";
        let matchedPostId: string | undefined;
        const normUrl = normalizeUrl(item.url);
        const urlMatch = postUrlMap.get(normUrl);
        if (urlMatch) {
          isDuplicate = true;
          matchedPostId = urlMatch.id;
          dupReason = "Ten URL źródłowy ma już opublikowany post.";
        } else {
          const incomingTokens = tokenSet(meta.title);
          let bestSim = 0;
          let bestTitle = "";
          let bestId: string | undefined;
          for (const p of postTitleTokens) {
            const sim = jaccard(incomingTokens, p.tokens);
            if (sim > bestSim) { bestSim = sim; bestTitle = p.title; bestId = p.id; }
          }
          if (bestSim >= 0.6) {
            isDuplicate = true;
            matchedPostId = bestId;
            dupReason = `Bardzo podobny tytuł (${Math.round(bestSim * 100)}%) do: „${bestTitle}".`;
          }
        }

        let ai = { score: 5, reasoning: "", categoryId: null as string | null, tags: [] as string[] };
        if (!isDuplicate) ai = await aiScore(meta.title, meta.excerpt || "", cats);

        return {
          kind: isDuplicate ? "dup" : "added",
          articleUrl: item.url,
          meta: meta as { title: string; excerpt?: string; image?: string; publishedAt?: string },
          ai,
          dupReason: isDuplicate ? dupReason : undefined,
          matchedPostId,
        };
      };

      // Iteruj w paczkach po CONCURRENCY, ale szanuj limit added + early abort.
      outer: for (let i = 0; i < fresh.length; i += CONCURRENCY) {
        const batch = fresh.slice(i, i + CONCURRENCY);
        const results = await Promise.all(batch.map(processOne));

        for (const r of results) {
          analyzed++;
          if (r.kind === "no_title") continue;
          if (r.kind === "skipped_no_date") {
            console.log(`[scan] skip (no date): ${r.articleUrl}`);
            skippedNoDate++;
            noDateStreak++;
            if (noDateStreak >= EARLY_ABORT_NO_DATE_STREAK && added === 0) {
              earlyAbort = `bad_filter (${noDateStreak} no-date in a row)`;
              console.log(`[scan] ${source.name} EARLY ABORT: ${earlyAbort}`);
              break outer;
            }
            continue;
          }
          noDateStreak = 0;
          if (r.kind === "skipped_old") { skippedNotToday++; continue; }

          const { error: insErr } = await supabase.from("news_suggestions").insert({
            source_id: source.id,
            article_url: r.articleUrl,
            title: r.meta!.title,
            excerpt: r.meta!.excerpt,
            image_url: r.meta!.image,
            published_at: r.meta!.publishedAt,
            ai_score: r.kind === "dup" ? 0 : r.ai!.score,
            ai_reasoning: r.kind === "dup" ? r.dupReason : r.ai!.reasoning,
            suggested_category_id: r.ai!.categoryId,
            suggested_tags: r.ai!.tags,
            status: r.kind === "dup" ? "duplicate" : "pending",
            accepted_post_id: r.matchedPostId ?? null,
          });
          if (insErr) { console.error(`insert failed for ${r.articleUrl}`, insErr.message); continue; }
          if (r.kind === "dup") { dups++; totalDup++; } else { added++; totalNew++; }

          if (added >= maxPerSource) break outer;
        }
      }

      const efficiency = analyzed > 0 ? Math.round((added / analyzed) * 100) : 0;
      console.log(`[scan] ${source.name} done: analyzed=${analyzed} new=${added} dup=${dups} skipped_old=${skippedNotToday} skipped_no_date=${skippedNoDate} firecrawl_calls=${firecrawlCalls} efficiency=${efficiency}%`);

      await supabase.from("news_sources").update({ last_scanned_at: new Date().toISOString() }).eq("id", source.id);

      perSource.push({
        source: source.name,
        new: added,
        duplicates: dups,
        total_links: discovered.length,
        analyzed,
        skipped_old: skippedNotToday,
        skipped_no_date: skippedNoDate,
        firecrawl_calls: firecrawlCalls,
        used_rss: usedRss,
        efficiency_pct: efficiency,
        early_abort: earlyAbort,
      });
    }

    return new Response(
      JSON.stringify({ ok: true, scanned: sources.length, new_suggestions: totalNew, duplicates: totalDup, details: perSource }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("scan-news-sources fatal", msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
