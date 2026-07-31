export const config = { runtime: 'edge' };

const SITEMAP_URL = "https://izyknazjzdkfdxnekvos.supabase.co/functions/v1/sitemap";

export default async function handler(request) {
  try {
    const response = await fetch(SITEMAP_URL);

    if (!response.ok) {
      return new Response("Błąd pobierania sitemapy", { status: 502 });
    }

    const sitemap = await response.text();

    return new Response(sitemap, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response("Błąd serwera", { status: 500 });
  }
}
