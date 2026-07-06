import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SITE_URL = "https://szortsy.pl";
const MAX_RESOLVE_HOPS = 5;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // ===== Auth =====
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

    // ===== Input =====
    const body = await req.json().catch(() => ({}));
    const canonicalId: string | undefined = body?.canonical_id;
    const duplicateIds: string[] = Array.isArray(body?.duplicate_ids) ? body.duplicate_ids : [];
    const googleCanonicalUrl: string | undefined = body?.google_canonical_url;

    if (!canonicalId || typeof canonicalId !== "string") {
      return json({ error: "canonical_id jest wymagany" }, 400);
    }
    if (duplicateIds.length === 0) return json({ error: "duplicate_ids musi być niepustą tablicą" }, 400);
    if (duplicateIds.includes(canonicalId)) {
      return json({ error: "canonical_id nie może być w duplicate_ids" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE);

    // Fetch canonical + duplicates
    const allIds = [canonicalId, ...duplicateIds];
    const { data: postsRaw, error: postsErr } = await admin
      .from("posts")
      .select("id, slug, is_hidden")
      .in("id", allIds);
    if (postsErr) return json({ error: postsErr.message }, 500);

    const posts = (postsRaw ?? []) as Array<{ id: string; slug: string; is_hidden: boolean }>;
    if (posts.length !== allIds.length) return json({ error: "Nie znaleziono wszystkich postów" }, 404);

    const canonicalPost = posts.find((p) => p.id === canonicalId)!;
    if (canonicalPost.is_hidden) {
      return json({ error: "Wybrany kanoniczny jest ukryty. Wybierz aktywny post." }, 409);
    }

    // ===== Krok A: resolve canonical do FINAL target (płaskość wychodząca) =====
    let effectiveCanonicalSlug = canonicalPost.slug;
    let canonicalWasRedirected = false;
    let hops = 0;

    while (hops < MAX_RESOLVE_HOPS) {
      const { data: existing, error: exErr } = await admin
        .from("post_redirects")
        .select("to_slug")
        .eq("from_slug", effectiveCanonicalSlug)
        .maybeSingle();
      if (exErr) return json({ error: `resolve: ${exErr.message}` }, 500);
      if (!existing?.to_slug || existing.to_slug === effectiveCanonicalSlug) break;
      canonicalWasRedirected = true;
      effectiveCanonicalSlug = existing.to_slug;
      hops++;
    }
    if (hops >= MAX_RESOLVE_HOPS) {
      return json(
        { error: "Wykryto zbyt długi łańcuch redirectów dla wybranego kanonicznego." },
        409,
      );
    }

    // Resolve effective canonical POST by slug
    const { data: effCanonical, error: ecErr } = await admin
      .from("posts")
      .select("id, slug, is_hidden")
      .eq("slug", effectiveCanonicalSlug)
      .maybeSingle();
    if (ecErr) return json({ error: `effective: ${ecErr.message}` }, 500);
    if (!effCanonical || effCanonical.is_hidden) {
      return json(
        {
          error:
            "Finalny kanoniczny nie istnieje lub jest ukryty. Popraw wcześniejszy redirect zanim scalisz tę grupę.",
        },
        409,
      );
    }

    const effectiveCanonicalId = effCanonical.id;
    const effectiveSlug = effCanonical.slug;
    let effectiveUrl = `${SITE_URL}/blink/${effectiveSlug}`;

    // Optional: validate google_canonical_url matches the effective slug
    if (googleCanonicalUrl && typeof googleCanonicalUrl === "string") {
      try {
        const u = new URL(googleCanonicalUrl);
        const m = u.pathname.match(/^\/blink\/([^/?#]+)/);
        const gSlug = m?.[1];
        if (!gSlug) {
          return json({ error: "google_canonical_url nie wygląda jak /blink/{slug}" }, 400);
        }
        // Slug must belong to some post in the merge set (canonical or duplicates or effective)
        const legitSlugs = new Set(posts.map((p) => p.slug).concat(effectiveSlug));
        if (!legitSlugs.has(gSlug)) {
          return json(
            { error: "google_canonical_url wskazuje na slug spoza tej grupy." },
            400,
          );
        }
        effectiveUrl = googleCanonicalUrl;
      } catch {
        return json({ error: "google_canonical_url jest nieprawidłowym URL-em" }, 400);
      }
    }

    // Guard: none of the duplicates may be the effective canonical
    const duplicatePosts = posts.filter((p) => duplicateIds.includes(p.id));
    if (duplicatePosts.some((d) => d.id === effectiveCanonicalId)) {
      return json(
        { error: "Duplikat pokrywa się z finalnym kanonicznym. Usuń go z listy duplikatów." },
        409,
      );
    }
    const duplicateSlugs = duplicatePosts.map((d) => d.slug);

    // ===== Krok B: re-point wcześniejszych redirectów wskazujących na duplikaty =====
    const { data: rechainedRows, error: rcErr } = await admin
      .from("post_redirects")
      .update({
        to_slug: effectiveSlug,
        to_url: effectiveUrl,
        reason: "rechained",
      })
      .in("to_slug", duplicateSlugs)
      .neq("from_slug", effectiveSlug)
      .select("from_slug");
    if (rcErr) return json({ error: `rechain: ${rcErr.message}` }, 500);
    const rechainedCount = rechainedRows?.length ?? 0;

    // ===== Krok C: merge =====
    const { error: hideErr } = await admin
      .from("posts")
      .update({
        is_hidden: true,
        redirect_to_post_id: effectiveCanonicalId,
        updated_at: new Date().toISOString(),
      })
      .in("id", duplicateIds);
    if (hideErr) return json({ error: `hide: ${hideErr.message}` }, 500);

    const rowsToUpsert = duplicatePosts
      .filter((d) => d.slug !== effectiveSlug)
      .map((d) => ({
        from_slug: d.slug,
        to_slug: effectiveSlug,
        from_url: `${SITE_URL}/blink/${d.slug}`,
        to_url: effectiveUrl,
        reason: "duplicate",
        created_by: userId,
      }));

    let insertedCount = 0;
    if (rowsToUpsert.length > 0) {
      const { data: upserted, error: upErr } = await admin
        .from("post_redirects")
        .upsert(rowsToUpsert, { onConflict: "from_slug" })
        .select("from_slug");
      if (upErr) return json({ error: `upsert: ${upErr.message}` }, 500);
      insertedCount = upserted?.length ?? 0;
    }

    // ===== Krok D: invariant check (best-effort, only warn) =====
    try {
      const { data: allRedirects } = await admin
        .from("post_redirects")
        .select("from_slug, to_slug");
      if (allRedirects) {
        const bySlug = new Map(allRedirects.map((r: { from_slug: string; to_slug: string }) => [r.from_slug, r.to_slug]));
        const chains: string[] = [];
        for (const r of allRedirects) {
          if (bySlug.has(r.to_slug)) chains.push(`${r.from_slug} → ${r.to_slug} → ${bySlug.get(r.to_slug)}`);
        }
        if (chains.length > 0) {
          console.warn("[merge-duplicates] chain invariant violated:", chains.slice(0, 20));
        }
      }
    } catch (e) {
      console.warn("[merge-duplicates] invariant check failed:", e);
    }

    // ===== Krok E: notify Google (best-effort) =====
    const notify = async (url: string, type: "URL_UPDATED" | "URL_DELETED") => {
      try {
        const r = await fetch(`${SUPABASE_URL}/functions/v1/notify-google-index`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify({ url, type }),
        });
        await r.text();
      } catch (e) {
        console.warn("notify-google-index failed:", e);
      }
    };
    notify(effectiveUrl, "URL_UPDATED");
    for (const d of duplicatePosts) {
      notify(`${SITE_URL}/blink/${d.slug}`, "URL_DELETED");
    }

    return json({
      effective_canonical_id: effectiveCanonicalId,
      effective_canonical_slug: effectiveSlug,
      effective_canonical_url: effectiveUrl,
      canonical_was_redirected: canonicalWasRedirected,
      redirected: insertedCount,
      rechained_count: rechainedCount,
      hidden_duplicates: duplicateIds.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[merge-duplicates] fatal:", msg);
    return json({ error: msg }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
