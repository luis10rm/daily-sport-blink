import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function authenticateAdmin(req: Request): Promise<{ userId: string } | Response> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Brak autoryzacji" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims) {
    return new Response(JSON.stringify({ error: "Nieprawidłowy token" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = data.claims.sub;
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const isAdmin = roles?.some((r) => r.role === "admin");

  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "Wymagana rola admin" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return { userId };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await authenticateAdmin(req);
    if (auth instanceof Response) return auth;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Brak konfiguracji API" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `Generate a professional, high-quality logo for a Polish sports news website called "Szortsy".

REQUIREMENTS:
1. A large, bold, dynamic letter "S" as the main icon element
2. The letter "S" should be in emerald green color (#10b981) with a modern, sporty feel
3. Below or next to the "S", place the text "Szortsy" in a clean, bold sans-serif font (like Montserrat or similar)
4. The text "Szortsy" should be in dark charcoal/black color (#1a1a2e)
5. White/clean background
6. Minimalist, professional style - no gradients, no 3D effects
7. The "S" should have a slight dynamic/speed feel (like a subtle curve or motion line)
8. Square format optimized for 512x512px
9. Sharp, crisp edges - NOT blurry
10. Modern tech/sports brand aesthetic

STYLE REFERENCE: Think of logos like ESPN, Bleacher Report, The Athletic - clean, bold, recognizable.

DO NOT:
- Add any sports equipment or balls
- Use gradients or shadows
- Make it look childish or cartoonish
- Add taglines or extra text
- Use more than 2 colors (emerald green + dark text)

OUTPUT: High quality PNG image, square format.`;

    console.log(`User ${auth.userId} generating logo`);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      console.error(`AI Gateway error: ${status}`);
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Zbyt wiele żądań. Spróbuj za chwilę." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Brak kredytów AI." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Błąd generowania logo" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      console.error("No image in AI response:", JSON.stringify(aiData).substring(0, 500));
      return new Response(JSON.stringify({ error: "AI nie wygenerowało obrazu. Spróbuj ponownie." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return base64 image directly for preview (don't save yet)
    console.log("Logo generated successfully");
    return new Response(
      JSON.stringify({ imageBase64: imageData }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Wystąpił nieoczekiwany błąd" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
