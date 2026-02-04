import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Category to emoji mapping
const categoryEmojis: Record<string, string> = {
  football: "⚽",
  basketball: "🏀",
  tennis: "🎾",
  f1: "🏎️",
  mma: "🥊",
  other: "🏆",
};

// Category default images (full URLs for external services)
const categoryDefaultImages: Record<string, string> = {
  football: "https://daily-sport-blink.lovable.app/images/categories/football.webp",
  basketball: "https://daily-sport-blink.lovable.app/images/categories/basketball.webp",
  tennis: "https://daily-sport-blink.lovable.app/images/categories/tennis.webp",
  f1: "https://daily-sport-blink.lovable.app/images/categories/f1.webp",
  mma: "https://daily-sport-blink.lovable.app/images/categories/mma.webp",
  "daily-summary": "https://daily-sport-blink.lovable.app/images/categories/daily-summary.webp",
  "podsumowanie-dnia": "https://daily-sport-blink.lovable.app/images/categories/daily-summary.webp",
  other: "https://daily-sport-blink.lovable.app/images/categories/other.webp",
};

interface PublishRequest {
  post_id: string;
  platform?: "facebook" | "twitter" | "instagram";
  custom_caption?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("[publish-to-social] No authorization header");
      return new Response(
        JSON.stringify({ error: "Brak autoryzacji" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user has admin/editor role
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error("[publish-to-social] User verification failed:", userError);
      return new Response(
        JSON.stringify({ error: "Nieprawidłowy token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin or editor
    const { data: isAdminOrEditor } = await supabase.rpc("is_admin_or_editor", { _user_id: user.id });
    if (!isAdminOrEditor) {
      console.error("[publish-to-social] User is not admin or editor:", user.id);
      return new Response(
        JSON.stringify({ error: "Brak uprawnień" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { post_id, platform = "facebook", custom_caption }: PublishRequest = await req.json();
    console.log("[publish-to-social] Request:", { post_id, platform, hasCustomCaption: !!custom_caption });

    if (!post_id) {
      return new Response(
        JSON.stringify({ error: "Brak ID posta" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch post data with category and content
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select(`
        id,
        title,
        excerpt,
        slug,
        image_url,
        tags,
        category_id,
        content,
        sport_categories (
          name,
          slug,
          social_image_url
        )
      `)
      .eq("id", post_id)
      .single();

    if (postError || !post) {
      console.error("[publish-to-social] Post not found:", postError);
      return new Response(
        JSON.stringify({ error: "Nie znaleziono posta" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[publish-to-social] Post found:", { title: post.title, slug: post.slug, hasContent: !!post.content });

    // Fetch webhook URL from settings
    const { data: webhookSetting, error: webhookError } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "make_webhook_url")
      .single();

    if (webhookError || !webhookSetting?.value) {
      console.error("[publish-to-social] Webhook URL not configured:", webhookError);
      return new Response(
        JSON.stringify({ error: "Webhook Make nie jest skonfigurowany. Dodaj URL w Ustawieniach." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const webhookUrl = webhookSetting.value;
    console.log("[publish-to-social] Webhook URL configured");

    // Fetch custom prompt from settings
    const { data: promptSetting } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "facebook_post_prompt")
      .maybeSingle();

    const customPrompt = promptSetting?.value;
    console.log("[publish-to-social] Custom prompt:", customPrompt ? "loaded from DB" : "using default");

    // Generate caption (AI or custom)
    let caption = custom_caption;
    
    if (!caption) {
      // Generate AI caption
      const categorySlug = (post.sport_categories as any)?.slug || "other";
      const categoryName = (post.sport_categories as any)?.name || "Sport";
      const emoji = categoryEmojis[categorySlug] || "🏆";
      const postUrl = `https://szortsy.pl/blink/${post.slug}`;
      
      // Format tags as hashtags
      const hashtags = (post.tags || [])
        .slice(0, 3)
        .map((tag: string) => `#${tag.replace(/\s+/g, "")}`)
        .join(" ");

      // Try to generate caption with AI
      const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
      
      if (lovableApiKey) {
        try {
          console.log("[publish-to-social] Generating AI caption...");
          
          // Prepare content snippet (first 1000 chars for context)
          const contentSnippet = post.content 
            ? post.content.replace(/<[^>]*>/g, '').substring(0, 1000) 
            : '';
          
          // Use custom prompt from settings or default
          const systemPrompt = customPrompt || `Jesteś copywriterem sportowym Szortsy.pl. Tworzysz angażujące posty na Facebooka.

STRUKTURA:
1. HOOK - mocne otwarcie z emoji ${emoji}, zaskakujący fakt lub pytanie retoryczne
2. KONTEKST - 2-3 krótkie, dynamiczne zdania rozwijające temat, użyj 1-2 emoji w tekście
3. CTA - zakończ pytaniem zachęcającym do dyskusji w komentarzach

ZASADY:
- Max 250 znaków (link i hashtagi zostaną dodane automatycznie)
- Pisz krótko, dynamicznie, z energią
- Unikaj clickbaitu, ale buduj ciekawość
- NIE kopiuj tytułu artykułu dosłownie - przeformułuj
- Używaj dynamicznych czasowników i emocjonalnego języka
- Zakończ angażującym pytaniem typu "A Wy co sądzicie?", "Kto wygra?"`;

          const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${lovableApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                {
                  role: "system",
                  content: systemPrompt,
                },
                {
                  role: "user",
                  content: `Napisz post na Facebooka o tym artykule sportowym:

Tytuł: ${post.title}
Opis: ${post.excerpt}
Kategoria: ${categoryName}
Emoji kategorii: ${emoji}
${contentSnippet ? `\nTreść artykułu (fragment):\n${contentSnippet}` : ''}

Napisz TYLKO treść posta (bez linku, bez hashtagów - zostaną dodane automatycznie).`,
                },
              ],
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const aiCaption = aiData.choices?.[0]?.message?.content?.trim();
            
            if (aiCaption) {
              caption = `${aiCaption}\n\n👉 Czytaj więcej: ${postUrl}\n\n#szortsy ${hashtags}`;
              console.log("[publish-to-social] AI caption generated");
            }
          } else {
            console.error("[publish-to-social] AI response not ok:", aiResponse.status);
          }
        } catch (aiError) {
          console.error("[publish-to-social] AI caption generation failed:", aiError);
        }
      }
      
      // Fallback to template if AI failed
      if (!caption) {
        caption = `${emoji} ${post.title}\n\n${post.excerpt}\n\n👉 Czytaj więcej: ${postUrl}\n\n#szortsy ${hashtags}`;
        console.log("[publish-to-social] Using template caption");
      }
    }

    // Create social_posts record with pending status
    const { data: socialPost, error: socialPostError } = await supabase
      .from("social_posts")
      .insert({
        post_id: post.id,
        platform,
        status: "pending",
        caption,
        created_by: user.id,
      })
      .select()
      .single();

    if (socialPostError) {
      console.error("[publish-to-social] Failed to create social_posts record:", socialPostError);
      return new Response(
        JSON.stringify({ error: "Nie udało się zapisać rekordu publikacji" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[publish-to-social] Social post record created:", socialPost.id);

    // Prepare payload for Make webhook
    const categoryInfo = post.sport_categories as any;
    const categorySlugForImage = categoryInfo?.slug || "other";
    
    // Image priority: 1. post.image_url, 2. category.social_image_url, 3. static fallback
    let postImage = post.image_url;
    
    // Convert relative URLs to absolute (Facebook requires full URLs)
    if (postImage && postImage.startsWith("/")) {
      postImage = `https://daily-sport-blink.lovable.app${postImage}`;
    }
    
    if (!postImage && categoryInfo?.social_image_url) {
      postImage = categoryInfo.social_image_url;
    }
    if (!postImage) {
      postImage = categoryDefaultImages[categorySlugForImage] || categoryDefaultImages.other;
    }
    
    const payload = {
      post_id: post.id,
      post_title: post.title,
      post_excerpt: post.excerpt,
      post_url: `https://szortsy.pl/blink/${post.slug}`,
      post_image: postImage,
      caption,
      category: categoryInfo?.name || "Sport",
      category_slug: categoryInfo?.slug || "other",
      tags: post.tags || [],
      platform,
      social_post_id: socialPost.id,
    };

    console.log("[publish-to-social] Sending to Make webhook...");

    // Send to Make webhook
    let webhookResponse;
    let webhookSuccess = false;
    
    try {
      const makeResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      webhookResponse = {
        status: makeResponse.status,
        statusText: makeResponse.statusText,
        ok: makeResponse.ok,
      };

      if (makeResponse.ok) {
        webhookSuccess = true;
        try {
          const responseBody = await makeResponse.text();
          webhookResponse = { ...webhookResponse, body: responseBody };
        } catch {
          // Response body might be empty
        }
      }

      console.log("[publish-to-social] Make webhook response:", webhookResponse);
    } catch (webhookError) {
      console.error("[publish-to-social] Webhook call failed:", webhookError);
      webhookResponse = { error: String(webhookError) };
    }

    // Update social_posts record with result
    const newStatus = webhookSuccess ? "published" : "failed";
    await supabase
      .from("social_posts")
      .update({
        status: newStatus,
        webhook_response: webhookResponse,
        published_at: webhookSuccess ? new Date().toISOString() : null,
      })
      .eq("id", socialPost.id);

    console.log("[publish-to-social] Social post updated with status:", newStatus);

    if (!webhookSuccess) {
      return new Response(
        JSON.stringify({
          error: "Webhook Make zwrócił błąd",
          details: webhookResponse,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Post wysłany na ${platform}`,
        social_post_id: socialPost.id,
        caption,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[publish-to-social] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Nieznany błąd" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
