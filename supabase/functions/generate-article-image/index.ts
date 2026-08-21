import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { optimizeImageBytes } from "../_shared/optimizeImage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin/editor role
    const { data: roleCheck } = await supabase.rpc("is_admin_or_editor", { _user_id: user.id });
    if (!roleCheck) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { title, excerpt, category } = await req.json();

    if (!title) {
      return new Response(JSON.stringify({ error: "Tytuł artykułu jest wymagany" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[generate-article-image] Generating image for:", { title, category });

    // Fetch custom prompt from settings
    const { data: promptSetting } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "article_image_prompt")
      .single();

    let prompt = promptSetting?.value || "Create a professional sports image for an article. Dynamic, cinematic, no text or logos.";

    // Replace placeholders with actual values
    prompt = prompt
      .replace("{title}", title || "")
      .replace("{category}", category || "sport")
      .replace("{excerpt}", excerpt || "");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[generate-article-image] Calling AI gateway...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("[generate-article-image] AI error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Zbyt wiele zapytań AI. Spróbuj ponownie za chwilę." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Brak kredytów AI. Doładuj konto." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Błąd generowania obrazu AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const imageBase64 = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageBase64) {
      console.error("[generate-article-image] No image in AI response");
      return new Response(JSON.stringify({ error: "AI nie zwróciło obrazu" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[generate-article-image] Image received, uploading to storage...");

    // Convert base64 to Uint8Array
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Upload to storage using service role client for storage access
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Downscale + re-encode so we don't store multi-MB PNGs
    const optimized = await optimizeImageBytes(bytes, { maxWidth: 1600, quality: 82 });
    console.log(
      `[generate-article-image] optimized ${bytes.length} -> ${optimized.bytes.length} bytes (${optimized.contentType})`
    );

    const fileName = `ai-${Date.now()}-${Math.random().toString(36).substring(7)}.${optimized.extension}`;
    const { error: uploadError } = await serviceClient.storage
      .from("post-images")
      .upload(fileName, optimized.bytes, { contentType: optimized.contentType });

    if (uploadError) {
      console.error("[generate-article-image] Upload error:", uploadError);
      return new Response(JSON.stringify({ error: "Błąd uploadu obrazu" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: urlData } = serviceClient.storage
      .from("post-images")
      .getPublicUrl(fileName);

    console.log("[generate-article-image] Success:", urlData.publicUrl);

    return new Response(JSON.stringify({ image_url: urlData.publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[generate-article-image] Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
