// Search product images via SerpApi (Google Images engine)
// Returns: { images: Array<{ imageUrl, thumbnailUrl, sourceDomain, title, width, height }> }

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface SerpApiImage {
  position?: number;
  thumbnail?: string;
  original?: string;
  original_width?: number;
  original_height?: number;
  source?: string;
  title?: string;
  link?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("SERPAPI_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "SERPAPI_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const query = String(body?.query ?? "").trim();
    const num = Math.min(Math.max(Number(body?.num) || 20, 1), 50);

    if (!query || query.length < 2) {
      return new Response(
        JSON.stringify({ error: "Query must be at least 2 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.set("engine", "google_images");
    url.searchParams.set("q", query);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("num", String(num));
    url.searchParams.set("hl", "pl");
    url.searchParams.set("gl", "pl");
    url.searchParams.set("safe", "active");

    let res = await fetch(url.toString());
    // Retry once on transient failure
    if (!res.ok && res.status >= 500) {
      await new Promise((r) => setTimeout(r, 600));
      res = await fetch(url.toString());
    }

    if (res.status === 401) {
      return new Response(
        JSON.stringify({ error: "Nieprawidłowy klucz SerpApi" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (res.status === 402 || res.status === 429) {
      return new Response(
        JSON.stringify({ error: "Wyczerpano limit zapytań SerpApi" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!res.ok) {
      const text = await res.text();
      console.error("SerpApi error", res.status, text.slice(0, 300));
      return new Response(
        JSON.stringify({ error: "Błąd wyszukiwania obrazów" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await res.json();
    const results: SerpApiImage[] = Array.isArray(data?.images_results) ? data.images_results : [];

    const images = results
      .filter((r) => r.original || r.thumbnail)
      .map((r) => {
        let sourceDomain = "";
        try {
          sourceDomain = r.link ? new URL(r.link).hostname.replace(/^www\./, "") : (r.source ?? "");
        } catch {
          sourceDomain = r.source ?? "";
        }
        return {
          imageUrl: r.original ?? r.thumbnail ?? "",
          thumbnailUrl: r.thumbnail ?? r.original ?? "",
          sourceDomain,
          sourceUrl: r.link ?? "",
          title: r.title ?? "",
          width: r.original_width ?? null,
          height: r.original_height ?? null,
        };
      });

    return new Response(JSON.stringify({ images }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("search-product-images error", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message ?? "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
