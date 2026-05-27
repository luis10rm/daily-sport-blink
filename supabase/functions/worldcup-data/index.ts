// Edge function: fetches FIFA World Cup 2026 data from Football-Data.org
// with DB caching to respect 10 req/min free-tier limit.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const COMPETITION = "WC"; // FIFA World Cup competition code on football-data.org
const API_BASE = "https://api.football-data.org/v4";

// TTL per resource (seconds)
const TTL: Record<string, number> = {
  matches: 60,        // refresh quickly when live
  standings: 300,     // 5 min
  scorers: 300,       // 5 min
  teams: 3600,        // 1 hour
};

type Resource = "matches" | "standings" | "scorers" | "teams";
const VALID_RESOURCES: Resource[] = ["matches", "standings", "scorers", "teams"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Accept both GET ?resource= and POST { resource }
    let resource: string | null = null;
    if (req.method === "GET") {
      const url = new URL(req.url);
      resource = url.searchParams.get("resource");
    } else {
      try {
        const body = await req.json();
        resource = body?.resource ?? null;
      } catch {
        resource = null;
      }
    }

    if (!resource || !VALID_RESOURCES.includes(resource as Resource)) {
      return new Response(
        JSON.stringify({ error: "Invalid or missing 'resource'. Use one of: " + VALID_RESOURCES.join(", ") }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const FOOTBALL_API_KEY = Deno.env.get("FOOTBALL_DATA_API_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Server not configured (supabase env)" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!FOOTBALL_API_KEY) {
      return new Response(JSON.stringify({ error: "FOOTBALL_DATA_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const cacheKey = `wc:${resource}`;

    // 1) Try cache
    const { data: cached } = await supabase
      .from("worldcup_cache")
      .select("data, expires_at, fetched_at")
      .eq("cache_key", cacheKey)
      .maybeSingle();

    const now = new Date();
    if (cached && new Date(cached.expires_at) > now) {
      return new Response(
        JSON.stringify({ source: "cache", fetched_at: cached.fetched_at, data: cached.data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "HIT" } },
      );
    }

    // 2) Fetch from upstream
    const path = `/competitions/${COMPETITION}/${resource}`;
    const upstreamRes = await fetch(`${API_BASE}${path}`, {
      headers: { "X-Auth-Token": FOOTBALL_API_KEY },
    });

    if (!upstreamRes.ok) {
      const text = await upstreamRes.text();
      console.error("[worldcup-data] upstream error", upstreamRes.status, text);
      // If upstream fails, return stale cache when available
      if (cached) {
        return new Response(
          JSON.stringify({ source: "stale-cache", fetched_at: cached.fetched_at, data: cached.data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "STALE" } },
        );
      }
      return new Response(
        JSON.stringify({ error: `Upstream ${upstreamRes.status}`, details: text.slice(0, 300) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await upstreamRes.json();
    const ttl = TTL[resource as Resource] ?? 300;
    const expiresAt = new Date(now.getTime() + ttl * 1000).toISOString();

    // 3) Upsert cache
    const { error: upsertErr } = await supabase
      .from("worldcup_cache")
      .upsert({
        cache_key: cacheKey,
        data,
        fetched_at: now.toISOString(),
        expires_at: expiresAt,
      }, { onConflict: "cache_key" });

    if (upsertErr) console.error("[worldcup-data] cache upsert error", upsertErr);

    return new Response(
      JSON.stringify({ source: "upstream", fetched_at: now.toISOString(), data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "MISS" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[worldcup-data] unhandled error", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
