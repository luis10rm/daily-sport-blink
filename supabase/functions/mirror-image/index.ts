import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { optimizeImageBytes } from "../_shared/optimizeImage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BUCKET = "post-images";
const MIRROR_PATH = "mirrored";
const MAX_WIDTH = 1200;
const MAX_BYTES = 15 * 1024 * 1024;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/** True for URLs that are already ours or local — nothing to mirror. */
const isOwnUrl = (url: string, supabaseUrl: string) =>
  url.startsWith("/") ||
  url.startsWith("data:") ||
  url.includes("/storage/v1/object/public/") ||
  url.includes("/storage/v1/render/image/public/") ||
  url.startsWith(supabaseUrl);

async function mirrorOne(
  admin: ReturnType<typeof createClient>,
  url: string
): Promise<{ url: string; mirrored: boolean; reason?: string }> {
  try {
    const res = await fetch(url, {
      headers: {
        // Some publishers block default fetch agents.
        "User-Agent":
          "Mozilla/5.0 (compatible; SzortsyBot/1.0; +https://szortsy.pl)",
        Accept: "image/avif,image/webp,image/png,image/jpeg,*/*",
      },
      redirect: "follow",
    });

    if (!res.ok) return { url, mirrored: false, reason: `HTTP ${res.status}` };

    const type = res.headers.get("content-type") || "";
    if (!type.startsWith("image/")) {
      return { url, mirrored: false, reason: `content-type ${type}` };
    }

    const buf = new Uint8Array(await res.arrayBuffer());
    if (!buf.length || buf.length > MAX_BYTES) {
      return { url, mirrored: false, reason: `size ${buf.length}` };
    }

    const optimized = await optimizeImageBytes(buf, {
      maxWidth: MAX_WIDTH,
      keepAlpha: false,
      quality: 80,
    });

    const path = `${MIRROR_PATH}/${crypto.randomUUID()}.${optimized.extension}`;
    const { error } = await admin.storage
      .from(BUCKET)
      .upload(path, optimized.bytes, {
        contentType: optimized.contentType,
        cacheControl: "31536000",
        upsert: false,
      });

    if (error) return { url, mirrored: false, reason: error.message };

    const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
    console.log(
      `[mirror-image] ${url} -> ${data.publicUrl} (${buf.length} -> ${optimized.bytes.length} B)`
    );
    return { url: data.publicUrl, mirrored: true };
  } catch (err) {
    return { url, mirrored: false, reason: String(err) };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const { data: roleCheck } = await supabase.rpc("is_admin_or_editor", {
      _user_id: user.id,
    });
    if (!roleCheck) return json({ error: "Forbidden" }, 403);

    const admin = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json().catch(() => ({}));

    // --- Backfill mode: rewrite external images on recent posts ---
    if (body?.mode === "backfill") {
      const days = Math.min(Number(body.days) || 30, 365);
      const limit = Math.min(Number(body.limit) || 50, 200);
      const since = new Date(Date.now() - days * 86400_000).toISOString();

      const { data: posts, error } = await admin
        .from("posts")
        .select("id, image_url")
        .gte("published_at", since)
        .not("image_url", "is", null)
        .order("published_at", { ascending: false })
        .limit(500);

      if (error) return json({ error: error.message }, 500);

      const targets = (posts || [])
        .filter((p: any) => p.image_url && !isOwnUrl(p.image_url, supabaseUrl))
        .slice(0, limit);

      const results: any[] = [];
      for (const post of targets) {
        const r = await mirrorOne(admin, post.image_url);
        if (r.mirrored) {
          await admin.from("posts").update({ image_url: r.url }).eq("id", post.id);
        }
        results.push({ id: post.id, ...r });
      }

      return json({
        scanned: posts?.length || 0,
        candidates: targets.length,
        mirrored: results.filter((r) => r.mirrored).length,
        results,
      });
    }

    // --- Single URL mode ---
    const url: string | undefined = body?.url;
    if (!url) return json({ error: "url is required" }, 400);
    if (isOwnUrl(url, supabaseUrl)) return json({ url, mirrored: false, reason: "own url" });

    const result = await mirrorOne(admin, url);
    return json(result);
  } catch (err) {
    console.error("[mirror-image] error:", err);
    return json({ error: String(err) }, 500);
  }
});
