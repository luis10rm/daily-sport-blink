import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ---------- Polish-aware title normalization + Dice-bigram similarity ----------
const POLISH_MAP: Record<string, string> = {
  ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z",
};

function normalizeTitle(input: string): string {
  const lowered = (input || "").toLowerCase().trim();
  let out = "";
  for (const ch of lowered) out += POLISH_MAP[ch] ?? ch;
  return out.replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeSlugKey(slug: string): string {
  // Strip trailing "-<hex hash>" (6-10 chars), lowercase, strip diacritics-safe chars
  const lowered = (slug || "").toLowerCase();
  const stripped = lowered.replace(/-[0-9a-f]{6,10}$/, "");
  let out = "";
  for (const ch of stripped) out += POLISH_MAP[ch] ?? ch;
  return out.replace(/[^a-z0-9-]/g, "");
}

function bigrams(s: string): Map<string, number> {
  const map = new Map<string, number>();
  const clean = s.replace(/\s+/g, "");
  for (let i = 0; i < clean.length - 1; i++) {
    const b = clean.slice(i, i + 2);
    map.set(b, (map.get(b) ?? 0) + 1);
  }
  return map;
}

function titleSimilarity(a: string, b: string): number {
  const na = normalizeTitle(a);
  const nb = normalizeTitle(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  const A = bigrams(na);
  const B = bigrams(nb);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const [g, cA] of A) {
    const cB = B.get(g);
    if (cB) inter += Math.min(cA, cB);
  }
  const tA = Array.from(A.values()).reduce((s, n) => s + n, 0);
  const tB = Array.from(B.values()).reduce((s, n) => s + n, 0);
  return (2 * inter) / (tA + tB);
}

// ---------- Handler ----------
interface PostRow {
  id: string;
  slug: string;
  title: string;
  published_at: string;
  updated_at: string;
  image_url: string | null;
  content: string | null;
  is_news_of_day: boolean;
  channel: string | null;
  category_id: string | null;
  author_id: string | null;
}

interface GroupPost {
  id: string;
  slug: string;
  title: string;
  published_at: string;
  updated_at: string;
  image_url: string | null;
  content_length: number;
  is_news_of_day: boolean;
  channel: string;
  category_id: string | null;
  author_id: string | null;
}

interface Group {
  normalized_key: string;
  posts: GroupPost[];
  suggested_canonical_id: string;
  tie_breaker_hints: {
    oldest_id: string;
    longest_content_id: string;
    newest_updated_id: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Brak autoryzacji" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) return json({ error: "Nieprawidłowy token" }, 401);
    const userId = claimsData.claims.sub as string;

    const { data: roles } = await userClient.from("user_roles").select("role").eq("user_id", userId);
    const userRoles = roles?.map((r) => r.role) ?? [];
    if (!userRoles.some((r) => r === "admin" || r === "editor")) {
      return json({ error: "Brak uprawnień (admin/editor)" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const days = Math.max(1, Math.min(365, Number(body?.days ?? 30)));
    const minSimilarity = Math.max(0.5, Math.min(0.99, Number(body?.min_similarity ?? 0.85)));
    const channelFilter: "sport" | "positive" | "all" =
      body?.channel === "sport" || body?.channel === "positive" ? body.channel : "all";

    const admin = createClient(SUPABASE_URL, SERVICE);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    let query = admin
      .from("posts")
      .select(
        "id, slug, title, published_at, updated_at, image_url, content, is_news_of_day, channel, category_id, author_id",
      )
      .eq("is_hidden", false)
      .is("redirect_to_post_id", null)
      .gte("published_at", since)
      .order("published_at", { ascending: false })
      .limit(5000);

    if (channelFilter !== "all") query = query.eq("channel", channelFilter);

    const { data: posts, error } = await query;
    if (error) return json({ error: error.message }, 500);
    const rows = (posts ?? []) as PostRow[];

    // Group by normalized slug key
    const buckets = new Map<string, PostRow[]>();
    for (const p of rows) {
      const key = normalizeSlugKey(p.slug);
      if (!key) continue;
      const arr = buckets.get(key) ?? [];
      arr.push(p);
      buckets.set(key, arr);
    }

    const WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
    const groups: Group[] = [];

    for (const [key, bucket] of buckets) {
      if (bucket.length < 2) continue;

      // Transitive clustering within the bucket: same normalized_key + similarity >= threshold + within 7 days
      const n = bucket.length;
      const parent = Array.from({ length: n }, (_, i) => i);
      const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
      const union = (a: number, b: number) => {
        const ra = find(a), rb = find(b);
        if (ra !== rb) parent[ra] = rb;
      };

      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const dt = Math.abs(
            new Date(bucket[i].published_at).getTime() - new Date(bucket[j].published_at).getTime(),
          );
          if (dt > WINDOW_MS) continue;
          const sim = titleSimilarity(bucket[i].title, bucket[j].title);
          if (sim >= minSimilarity) union(i, j);
        }
      }

      const clusters = new Map<number, PostRow[]>();
      for (let i = 0; i < n; i++) {
        const r = find(i);
        const arr = clusters.get(r) ?? [];
        arr.push(bucket[i]);
        clusters.set(r, arr);
      }

      for (const cluster of clusters.values()) {
        if (cluster.length < 2) continue;
        const gposts: GroupPost[] = cluster.map((p) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          published_at: p.published_at,
          updated_at: p.updated_at,
          image_url: p.image_url,
          content_length: p.content?.length ?? 0,
          is_news_of_day: !!p.is_news_of_day,
          channel: p.channel ?? "sport",
          category_id: p.category_id,
          author_id: p.author_id,
        }));

        const newestUpdated = [...gposts].sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
        )[0];
        const oldest = [...gposts].sort(
          (a, b) => new Date(a.published_at).getTime() - new Date(b.published_at).getTime(),
        )[0];
        const longest = [...gposts].sort((a, b) => b.content_length - a.content_length)[0];

        groups.push({
          normalized_key: key,
          posts: gposts.sort(
            (a, b) => new Date(a.published_at).getTime() - new Date(b.published_at).getTime(),
          ),
          suggested_canonical_id: newestUpdated.id,
          tie_breaker_hints: {
            oldest_id: oldest.id,
            longest_content_id: longest.id,
            newest_updated_id: newestUpdated.id,
          },
        });
      }
    }

    // Sort: biggest groups first, then most recent
    groups.sort((a, b) => {
      if (b.posts.length !== a.posts.length) return b.posts.length - a.posts.length;
      const bmax = Math.max(...b.posts.map((p) => new Date(p.published_at).getTime()));
      const amax = Math.max(...a.posts.map((p) => new Date(p.published_at).getTime()));
      return bmax - amax;
    });

    return json({ groups, params: { days, min_similarity: minSimilarity, channel: channelFilter } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[scan-duplicates] fatal:", msg);
    return json({ error: msg }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
