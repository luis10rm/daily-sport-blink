import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = "https://daily-sport-blink.lovable.app";

serve(async (req) => {
  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    // Fetch all published posts
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select("slug, updated_at, published_at")
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false })
      .limit(1000);

    if (postsError) {
      console.error("Error fetching posts:", postsError);
    }

    // Fetch all categories
    const { data: categories, error: catError } = await supabase
      .from("sport_categories")
      .select("slug, updated_at");

    if (catError) {
      console.error("Error fetching categories:", catError);
    }

    // Fetch all tags with posts
    const { data: tags, error: tagsError } = await supabase
      .from("tags")
      .select("slug, updated_at")
      .gt("post_count", 0)
      .limit(500);

    if (tagsError) {
      console.error("Error fetching tags:", tagsError);
    }

    // Fetch public authors
    const { data: authors, error: authorsError } = await supabase
      .from("authors")
      .select("slug, updated_at")
      .eq("is_public", true);

    if (authorsError) {
      console.error("Error fetching authors:", authorsError);
    }

    // Build XML sitemap
    const today = new Date().toISOString().split("T")[0];
    
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
    <loc>${SITE_URL}/archiwum</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${SITE_URL}/autorzy</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${SITE_URL}/tagi</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
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
    <loc>${SITE_URL}/redakcja/${author.slug}</loc>
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

    // Add posts (articles) - with Google News extension for recent posts
    if (posts?.length) {
      xml += `\n  <!-- Articles -->\n`;
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

    xml += `</urlset>`;

    console.log(`Generated sitemap with ${posts?.length || 0} posts, ${categories?.length || 0} categories, ${tags?.length || 0} tags, ${authors?.length || 0} authors`);

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
