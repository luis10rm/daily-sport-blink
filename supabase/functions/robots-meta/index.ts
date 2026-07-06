// Public endpoint used by the Cloudflare Worker to decide whether to inject
// `<meta name="robots" content="noindex, follow">` into the HTML response.
//
// GET /functions/v1/robots-meta?path=/tag/example
// → { "robots": "noindex, follow" }  or  { "robots": null }
//
// The Worker calls this with a short timeout and caches the result briefly.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const NOINDEX = "noindex, follow";
const TAG_MIN_POSTS = 4;

// Static paths that must always be noindex,follow.
function alwaysNoindex(pathname: string): boolean {
  if (pathname === "/archiwum") return true;
  if (pathname === "/pozytywne/archiwum") return true;
  if (pathname === "/tagi") return true;
  if (pathname === "/kategoria/wspo-praca-reklamowa") return true;
  if (pathname.startsWith("/dzien/")) return true;
  if (pathname.startsWith("/podsumowanie/")) return true;
  return false;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      // Short edge/browser cache — decisions are cheap but change with edits.
      "Cache-Control": "public, max-age=60, s-maxage=60",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const rawPath = url.searchParams.get("path") || "/";
    // Normalize: strip trailing slash (except root), lowercase.
    let path = rawPath.trim();
    if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);

    if (alwaysNoindex(path)) {
      return json({ robots: NOINDEX });
    }

    // Tag pages: check force_index + real published post count.
    const tagMatch = path.match(/^\/tag\/([^\/]+)$/);
    if (tagMatch) {
      const slug = decodeURIComponent(tagMatch[1]);

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
      );

      const { data: tagRows, error: tagErr } = await supabase
        .from("tags")
        .select("name, force_index")
        .eq("slug", slug)
        .limit(5);

      if (tagErr) {
        console.error("tags lookup error", tagErr);
        return json({ robots: null });
      }
      if (!tagRows || tagRows.length === 0) {
        // Unknown tag → noindex (nothing worth indexing anyway)
        return json({ robots: NOINDEX });
      }

      const forceIndex = tagRows.some((r) => (r as { force_index?: boolean }).force_index);
      if (forceIndex) return json({ robots: null });

      // Count real published, non-hidden posts carrying this tag name.
      // We match by tag name (posts.tags is text[]) across all tag rows.
      const names = Array.from(new Set(tagRows.map((r) => (r as { name: string }).name)));
      const { count, error: countErr } = await supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .overlaps("tags", names)
        .eq("is_hidden", false)
        .lte("published_at", new Date().toISOString());

      if (countErr) {
        console.error("posts count error", countErr);
        return json({ robots: null });
      }

      return json({
        robots: (count ?? 0) < TAG_MIN_POSTS ? NOINDEX : null,
      });
    }

    return json({ robots: null });
  } catch (e) {
    console.error("robots-meta error", e);
    return json({ robots: null }, 200);
  }
});
