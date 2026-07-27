import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = "https://szortsy.pl";

serve(async (req) => {
  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    const nowIso = new Date().toISOString();

    // Sport channel posts → /blink/{slug}
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select("slug, title, updated_at, published_at")
      .lte("published_at", nowIso)
      .eq("is_hidden", false)
      .eq("channel", "sport")
      .order("published_at", { ascending: false })
      .limit(1000);

    if (postsError) {
      console.error("Error fetching posts:", postsError);
    }

    // Positive channel posts → /pozytywne/{category_slug}/{slug}
    const { data: positivePosts, error: positivePostsError } = await supabase
      .from("posts")
      .select("slug, updated_at, published_at, positive_category:positive_categories!posts_positive_category_id_fkey(slug)")
      .lte("published_at", nowIso)
      .eq("is_hidden", false)
      .eq("channel", "positive")
      .order("published_at", { ascending: false })
      .limit(1000);

    if (positivePostsError) {
      console.error("Error fetching positive posts:", positivePostsError);
    }

    // Tech reviews → /tech/{category_slug}/{slug}
    const { data: reviews, error: reviewsError } = await supabase
      .from("reviews")
      .select("slug, updated_at, published_at, category:review_categories!reviews_category_id_fkey(slug)")
      .eq("status", "published")
      .lte("published_at", nowIso)
      .order("published_at", { ascending: false })
      .limit(1000);

    if (reviewsError) {
      console.error("Error fetching reviews:", reviewsError);
    }

    // Sport categories (exclude sponsored — noindex)
    const { data: categories, error: catError } = await supabase
      .from("sport_categories")
      .select("slug, updated_at")
      .neq("slug", "wspo-praca-reklamowa");

    if (catError) {
      console.error("Error fetching categories:", catError);
    }

    // Positive categories
    const { data: positiveCategories, error: posCatError } = await supabase
      .from("positive_categories")
      .select("slug, updated_at")
      .eq("is_active", true);

    if (posCatError) {
      console.error("Error fetching positive categories:", posCatError);
    }

    // Tech review categories
    const { data: reviewCategories, error: revCatError } = await supabase
      .from("review_categories")
      .select("slug, updated_at");

    if (revCatError) {
      console.error("Error fetching review categories:", revCatError);
    }

    // Tags with force_index OR post_count >= 4
    const { data: tags, error: tagsError } = await supabase
      .from("tags")
      .select("slug, updated_at, post_count, force_index")
      .or("force_index.eq.true,post_count.gte.4")
      .limit(500);

    if (tagsError) {
      console.error("Error fetching tags:", tagsError);
    }

    // Public authors
    const { data: authors, error: authorsError } = await supabase
      .from("authors")
      .select("slug, updated_at")
      .eq("is_public", true);

    if (authorsError) {
      console.error("Error fetching authors:", authorsError);
    }

    // Build XML sitemap
    const today = new Date().toISOString().split("T")[0];

    const escapeXml = (s: string) =>
      s.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  <!-- Static pages -->
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/autorzy</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${SITE_URL}/tech</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${SITE_URL}/pozytywne</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${SITE_URL}/mistrzostwa-swiata-2026</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${SITE_URL}/archiwum</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${SITE_URL}/tagi</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${SITE_URL}/pozytywne/archiwum</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
  </url>
`;

    // Add categories
    if (categories?.length) {
      xml += `\n  <!-- Categories -->\n`;
      for (const cat of categories) {
        const lastmod = cat.updated_at?.split("T")[0] || today;
        xml += `  <url>
    <loc>${SITE_URL}/kategoria/${cat.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>\n`;
      }
    }

    // Add authors
    if (authors?.length) {
      xml += `\n  <!-- Authors -->\n`;
      for (const author of authors) {
        const lastmod = author.updated_at?.split("T")[0] || today;
        xml += `  <url>
    <loc>${SITE_URL}/autor/${author.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>\n`;
      }
    }

    // Add tags
    if (tags?.length) {
      xml += `\n  <!-- Tags -->\n`;
      for (const tag of tags) {
        const lastmod = tag.updated_at?.split("T")[0] || today;
        xml += `  <url>
    <loc>${SITE_URL}/tag/${tag.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>\n`;
      }
    }

    // Sport-channel posts → /blink/{slug}
    if (posts?.length) {
      xml += `\n  <!-- Articles (sport) -->\n`;
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      for (const post of posts) {
        const lastmod = (post.updated_at || post.published_at)?.split("T")[0] || today;
        const publishedDate = new Date(post.published_at);
        const isRecent = publishedDate > twoDaysAgo;

        xml += `  <url>
    <loc>${SITE_URL}/blink/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${isRecent ? 'hourly' : 'weekly'}</changefreq>
    <priority>${isRecent ? '0.9' : '0.6'}</priority>
  </url>\n`;
      }
    }

    // Positive-channel posts → /pozytywne/{category}/{slug}
    if (positivePosts?.length) {
      xml += `\n  <!-- Articles (positive) -->\n`;
      for (const post of positivePosts as Array<{ slug: string; updated_at?: string; published_at: string; positive_category?: { slug?: string } | null }>) {
        const catSlug = post.positive_category?.slug;
        if (!catSlug) continue;
        const lastmod = (post.updated_at || post.published_at)?.split("T")[0] || today;
        xml += `  <url>
    <loc>${SITE_URL}/pozytywne/${catSlug}/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
      }
    }

    // Positive categories
    if (positiveCategories?.length) {
      xml += `\n  <!-- Positive categories -->\n`;
      for (const cat of positiveCategories as Array<{ slug: string; updated_at?: string }>) {
        const lastmod = cat.updated_at?.split("T")[0] || today;
        xml += `  <url>
    <loc>${SITE_URL}/pozytywne/kategoria/${cat.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>\n`;
      }
    }

    // Tech review categories
    if (reviewCategories?.length) {
      xml += `\n  <!-- Tech categories -->\n`;
      for (const cat of reviewCategories as Array<{ slug: string; updated_at?: string }>) {
        const lastmod = cat.updated_at?.split("T")[0] || today;
        xml += `  <url>
    <loc>${SITE_URL}/tech/kategoria/${cat.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>\n`;
      }
    }

    // Tech reviews → /tech/{category_slug}/{review_slug}
    if (reviews?.length) {
      xml += `\n  <!-- Tech reviews -->\n`;
      for (const rev of reviews as Array<{ slug: string; updated_at?: string; published_at: string; category?: { slug?: string } | null }>) {
        const catSlug = rev.category?.slug;
        if (!catSlug) continue;
        const lastmod = (rev.updated_at || rev.published_at)?.split("T")[0] || today;
        xml += `  <url>
    <loc>${SITE_URL}/tech/${catSlug}/${rev.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
      }
    }

    xml += `</urlset>`;

    console.log(`Generated sitemap: ${posts?.length || 0} sport posts, ${positivePosts?.length || 0} positive posts, ${reviews?.length || 0} reviews, ${categories?.length || 0} sport cats, ${positiveCategories?.length || 0} positive cats, ${reviewCategories?.length || 0} tech cats, ${tags?.length || 0} tags, ${authors?.length || 0} authors`);

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
      {
        status: 500,
        headers: { "Content-Type": "application/xml" },
      }
    );
  }
});
