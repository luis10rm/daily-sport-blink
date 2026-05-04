import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_BATCH = 6;
const CONCURRENCY = 3;

type SuccessResult = {
  suggestion_id: string;
  post_id: string;
  slug: string;
  title: string;
};
type FailResult = { suggestion_id: string; error: string };

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ===== Auth =====
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Brak autoryzacji" }, 401);
    }

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

    const { data: roles } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const userRoles = roles?.map((r) => r.role) ?? [];
    if (!userRoles.some((r) => r === "admin" || r === "editor")) {
      return json({ error: "Brak uprawnień (admin/editor)" }, 403);
    }

    // ===== Input =====
    const body = await req.json().catch(() => ({}));
    const ids: unknown = body?.suggestion_ids;
    if (!Array.isArray(ids) || ids.length === 0) {
      return json({ error: "suggestion_ids musi być niepustą tablicą" }, 400);
    }
    if (ids.length > MAX_BATCH) {
      return json({ error: `Maksymalnie ${MAX_BATCH} propozycji na raz` }, 400);
    }
    const suggestionIds = ids.filter((x): x is string => typeof x === "string");

    const admin = createClient(SUPABASE_URL, SERVICE);

    const { data: suggestions, error: sugErr } = await admin
      .from("news_suggestions")
      .select("id, article_url, image_url, suggested_category_id, status")
      .in("id", suggestionIds);

    if (sugErr) return json({ error: sugErr.message }, 500);
    if (!suggestions?.length) return json({ error: "Nie znaleziono propozycji" }, 404);

    console.log(`[bulk-prepare] User ${userId} processing ${suggestions.length} suggestions`);

    // ===== Default category fallback =====
    const { data: defaultCat } = await admin
      .from("sport_categories")
      .select("id")
      .eq("is_default", true)
      .maybeSingle();
    const defaultCategoryId = defaultCat?.id ?? null;

    // ===== Process in concurrency-limited batches =====
    const successful: SuccessResult[] = [];
    const failed: FailResult[] = [];

    const processOne = async (sug: typeof suggestions[number]): Promise<void> => {
      try {
        // Call extract-article with the user's JWT
        const extractRes = await fetch(
          `${SUPABASE_URL}/functions/v1/extract-article`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: authHeader,
            },
            body: JSON.stringify({ url: sug.article_url }),
          }
        );

        const extractData = await extractRes.json();
        if (!extractRes.ok) {
          throw new Error(extractData?.error || `extract-article ${extractRes.status}`);
        }

        const {
          title,
          excerpt,
          content,
          category: categorySlug,
          tags,
          og_image,
        } = extractData;

        if (!title || !excerpt) {
          throw new Error("AI nie zwróciło tytułu/opisu");
        }

        // Resolve category: suggested → AI slug → default
        let categoryId: string | null = sug.suggested_category_id ?? null;
        if (!categoryId && categorySlug) {
          const { data: cat } = await admin
            .from("sport_categories")
            .select("id")
            .eq("slug", categorySlug)
            .maybeSingle();
          categoryId = cat?.id ?? null;
        }
        if (!categoryId) categoryId = defaultCategoryId;
        if (!categoryId) throw new Error("Brak kategorii (i brak domyślnej)");

        const imageUrl = sug.image_url || og_image || null;

        const insertPayload = {
          title: String(title).slice(0, 200),
          excerpt: String(excerpt).slice(0, 500),
          content: content || null,
          category_id: categoryId,
          image_url: imageUrl,
          source_url: sug.article_url,
          tags: Array.isArray(tags) ? tags.slice(0, 10) : [],
          published_at: new Date().toISOString(),
          created_by: userId,
        };

        const { data: newPost, error: insertErr } = await admin
          .from("posts")
          .insert(insertPayload)
          .select("id, slug, title")
          .single();

        if (insertErr) throw new Error(`Insert posta: ${insertErr.message}`);

        await admin
          .from("news_suggestions")
          .update({ status: "published", accepted_post_id: newPost.id })
          .eq("id", sug.id);

        // Fire-and-forget Google indexing
        if (newPost.slug) {
          fetch(`${SUPABASE_URL}/functions/v1/notify-google-index`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: authHeader,
            },
            body: JSON.stringify({
              url: `https://szortsy.pl/blink/${newPost.slug}`,
              type: "URL_UPDATED",
            }),
          }).catch((e) => console.warn("notify-google-index failed:", e));
        }

        successful.push({
          suggestion_id: sug.id,
          post_id: newPost.id,
          slug: newPost.slug,
          title: newPost.title,
        });
        console.log(`[bulk-prepare] ✓ ${sug.id} → ${newPost.slug}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        console.error(`[bulk-prepare] ✗ ${sug.id}: ${msg}`);
        failed.push({ suggestion_id: sug.id, error: msg });
      }
    };

    // Run with concurrency limit
    for (let i = 0; i < suggestions.length; i += CONCURRENCY) {
      const batch = suggestions.slice(i, i + CONCURRENCY);
      await Promise.all(batch.map(processOne));
    }

    return json({
      successful,
      failed,
      total: suggestions.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[bulk-prepare] fatal:", msg);
    return json({ error: msg }, 500);
  }
});

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
