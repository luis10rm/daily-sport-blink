import { supabase } from "@/integrations/supabase/client";

/**
 * Zwraca docelowy adres dla starego (scalonego) sluga artykułu albo null.
 * Tabelę `post_redirects` wypełnia narzędzie „Duplikaty" w panelu admina.
 */
export async function resolvePostRedirect(slug: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("post_redirects")
    .select("to_slug, to_url")
    .eq("from_slug", slug)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as { to_slug?: string | null; to_url?: string | null };
  if (row.to_url) {
    // Zapisane bezwzględne adresy sprowadzamy do ścieżki — redirect ma zostać
    // w obrębie serwisu, także w podglądzie i na domenach testowych.
    try {
      const parsed = new URL(row.to_url, "https://szortsy.pl");
      return `${parsed.pathname}${parsed.search}`;
    } catch {
      return row.to_url.startsWith("/") ? row.to_url : `/${row.to_url}`;
    }
  }
  return row.to_slug ? `/blink/${row.to_slug}` : null;
}
